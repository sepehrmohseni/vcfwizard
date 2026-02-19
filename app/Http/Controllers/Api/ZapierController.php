<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Import;
use App\Models\Webhook;
use App\Services\VcfGenerator;
use App\Services\WebhookDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ZapierController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'plan' => $user->isPro() ? 'pro' : 'free',
        ]);
    }

    public function triggerImportCompleted(Request $request): JsonResponse
    {
        $imports = Import::where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->with('export')
            ->latest('processed_at')
            ->limit(25)
            ->get()
            ->map(fn (Import $import) => [
                'id' => $import->id,
                'filename' => $import->original_filename,
                'file_type' => $import->file_type,
                'row_count' => $import->row_count,
                'duplicates_found' => $import->duplicates_found,
                'processed_at' => $import->processed_at?->toISOString(),
                'created_at' => $import->created_at->toISOString(),
                'export' => $import->export ? [
                    'id' => $import->export->id,
                    'filename' => $import->export->filename,
                    'format' => $import->export->format,
                    'contact_count' => $import->export->contact_count,
                    'download_url' => url("/wizard/download/{$import->export->id}"),
                ] : null,
            ]);

        return response()->json($imports);
    }

    public function triggerImportFailed(Request $request): JsonResponse
    {
        $imports = Import::where('user_id', $request->user()->id)
            ->where('status', 'failed')
            ->latest()
            ->limit(25)
            ->get()
            ->map(fn (Import $import) => [
                'id' => $import->id,
                'filename' => $import->original_filename,
                'file_type' => $import->file_type,
                'row_count' => $import->row_count,
                'error_message' => $import->error_message,
                'created_at' => $import->created_at->toISOString(),
            ]);

        return response()->json($imports);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $request->validate([
            'target_url' => ['required', 'url', 'max:500'],
            'event' => ['required', 'string', 'in:import.completed,import.failed,export.ready'],
        ]);

        $webhook = $request->user()->webhooks()->create([
            'name' => 'Zapier — '.$request->input('event'),
            'url' => $request->input('target_url'),
            'secret' => Str::random(64),
            'events' => [$request->input('event')],
            'is_active' => true,
        ]);

        return response()->json(['id' => $webhook->id], 201);
    }

    public function unsubscribe(Request $request, Webhook $webhook): JsonResponse
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }

        $webhook->delete();

        return response()->json(null, 204);
    }

    public function convert(Request $request): JsonResponse
    {
        $request->validate([
            'contacts' => ['required', 'array', 'min:1'],
            'contacts.*.name' => ['nullable', 'string'],
            'contacts.*.first_name' => ['nullable', 'string'],
            'contacts.*.last_name' => ['nullable', 'string'],
            'contacts.*.email' => ['nullable', 'string'],
            'contacts.*.phone' => ['nullable', 'string'],
            'contacts.*.company' => ['nullable', 'string'],
            'contacts.*.title' => ['nullable', 'string'],
            'contacts.*.street' => ['nullable', 'string'],
            'contacts.*.city' => ['nullable', 'string'],
            'contacts.*.state' => ['nullable', 'string'],
            'contacts.*.zip' => ['nullable', 'string'],
            'contacts.*.country' => ['nullable', 'string'],
            'contacts.*.website' => ['nullable', 'string'],
            'contacts.*.note' => ['nullable', 'string'],
            'format' => ['sometimes', 'in:single,zip'],
        ]);

        $contacts = $request->input('contacts');
        $format = $request->input('format', 'single');

        $fieldKeys = ['full_name', 'first_name', 'last_name', 'middle_name', 'prefix', 'suffix', 'email', 'email_work', 'email_home', 'phone', 'phone_mobile', 'phone_home', 'phone_work', 'phone_fax', 'company', 'title', 'department', 'street', 'city', 'state', 'zip', 'country', 'birthday', 'website', 'note', 'nickname'];

        $rows = [];
        $headers = [];
        foreach ($contacts as $contact) {
            $row = [];
            foreach ($contact as $key => $value) {
                if ($value !== null && $value !== '') {
                    $row[$key] = $value;
                    if (! in_array($key, $headers)) {
                        $headers[] = $key;
                    }
                }
            }
            $rows[] = $row;
        }

        $mapping = [];
        foreach ($headers as $header) {
            if ($header === 'name') {
                $mapping[$header] = 'full_name';
            } elseif (in_array($header, $fieldKeys)) {
                $mapping[$header] = $header;
            } else {
                $mapping[$header] = 'note';
            }
        }

        $import = Import::create([
            'user_id' => $request->user()->id,
            'original_filename' => 'zapier-import-'.now()->format('Y-m-d-His').'.json',
            'file_path' => 'imports/zapier-'.Str::random(20).'.json',
            'file_type' => 'json',
            'file_size' => strlen(json_encode($contacts)),
            'row_count' => count($rows),
            'column_headers' => $headers,
            'mapped_fields' => $mapping,
            'status' => 'pending',
            'source' => 'zapier',
            'is_priority' => $request->user()->isPro(),
        ]);

        Storage::disk('local')->put($import->file_path, json_encode($contacts, JSON_PRETTY_PRINT));

        $vcfGenerator = new VcfGenerator;

        if ($format === 'zip') {
            $files = $vcfGenerator->generateIndividual($rows, $mapping);
            $zipFilename = 'contacts-'.now()->format('Y-m-d').'-'.count($rows).'.zip';
            $zipPath = 'exports/'.$import->id.'/'.$zipFilename;

            $tempZip = tempnam(sys_get_temp_dir(), 'vcfwizard');
            $zip = new \ZipArchive;
            $zip->open($tempZip, \ZipArchive::CREATE);
            foreach ($files as $filename => $content) {
                $zip->addFromString($filename, $content);
            }
            $zip->close();

            Storage::disk('local')->put($zipPath, file_get_contents($tempZip));
            unlink($tempZip);

            $export = $import->export()->create([
                'user_id' => $import->user_id,
                'filename' => $zipFilename,
                'file_path' => $zipPath,
                'format' => 'zip',
                'contact_count' => count($rows),
            ]);
        } else {
            $vcfContent = $vcfGenerator->generateSingle($rows, $mapping);
            $exportFilename = 'contacts-'.now()->format('Y-m-d').'-'.count($rows).'.vcf';
            $exportPath = 'exports/'.$import->id.'/'.$exportFilename;

            Storage::disk('local')->put($exportPath, $vcfContent);

            $export = $import->export()->create([
                'user_id' => $import->user_id,
                'filename' => $exportFilename,
                'file_path' => $exportPath,
                'format' => 'vcf',
                'contact_count' => count($rows),
            ]);
        }

        $import->markAsCompleted();

        app(WebhookDispatcher::class)->dispatch($request->user(), 'import.completed', [
            'import_id' => $import->id,
            'export_id' => $export->id,
            'filename' => $export->filename,
            'contact_count' => $export->contact_count,
            'download_url' => url("/wizard/download/{$export->id}"),
            'source' => 'zapier',
        ]);

        return response()->json([
            'import_id' => $import->id,
            'export_id' => $export->id,
            'filename' => $export->filename,
            'contact_count' => $export->contact_count,
            'download_url' => url("/wizard/download/{$export->id}"),
        ], 201);
    }

    public function listImports(Request $request): JsonResponse
    {
        $imports = Import::where('user_id', $request->user()->id)
            ->with('export')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Import $import) => [
                'id' => $import->id,
                'filename' => $import->original_filename,
                'file_type' => $import->file_type,
                'row_count' => $import->row_count,
                'status' => $import->status,
                'duplicates_found' => $import->duplicates_found,
                'source' => $import->source,
                'created_at' => $import->created_at->toISOString(),
                'export' => $import->export ? [
                    'id' => $import->export->id,
                    'filename' => $import->export->filename,
                    'download_url' => url("/wizard/download/{$import->export->id}"),
                ] : null,
            ]);

        return response()->json($imports);
    }
}
