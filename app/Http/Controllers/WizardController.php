<?php

namespace App\Http\Controllers;

use App\Http\Requests\ApplyMappingRequest;
use App\Http\Requests\GenerateVcfRequest;
use App\Http\Requests\UploadContactsRequest;
use App\Jobs\ProcessImportJob;
use App\Models\Import;
use App\Services\ContactMappingAgent;
use App\Services\DuplicateDetector;
use App\Services\FileParser;
use App\Services\VcfGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class WizardController extends Controller
{
    public function upload(UploadContactsRequest $request, FileParser $parser): JsonResponse
    {
        $file = $request->file('file');
        $path = $file->store('imports', 'local');

        $parsed = $parser->parse($file);

        $import = Import::create([
            'user_id' => $request->user()?->id,
            'original_filename' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getClientOriginalExtension(),
            'file_size' => $file->getSize(),
            'row_count' => $parsed['total_rows'],
            'column_headers' => $parsed['headers'],
            'status' => 'pending',
        ]);

        if (! $request->user()) {
            $guestImports = $request->session()->get('guest_imports', []);
            $guestImports[] = $import->id;
            $request->session()->put('guest_imports', $guestImports);
        }

        return response()->json([
            'import_ulid' => $import->id,
            'headers' => $parsed['headers'],
            'preview_rows' => $parser->getPreviewRows($parsed['rows']),
            'total_rows' => $parsed['total_rows'],
        ]);
    }

    public function aiMapping(Request $request, ContactMappingAgent $agent): JsonResponse
    {
        $request->validate([
            'import_ulid' => ['required', 'string', 'exists:imports,id'],
        ]);

        $import = Import::findOrFail($request->input('import_ulid'));
        $parser = new FileParser;
        $fullPath = Storage::disk('local')->path($import->file_path);
        $parsed = $parser->parseFromPath($fullPath);
        $previewRows = $parser->getPreviewRows($parsed['rows']);

        $result = $agent->analyze($parsed['headers'], $previewRows);

        $import->update(['ai_suggestions' => $result['mappings']]);

        return response()->json([
            'suggestions' => $result['mappings'],
        ]);
    }

    public function applyMapping(ApplyMappingRequest $request): JsonResponse
    {
        $import = Import::findOrFail($request->input('import_ulid'));

        $import->update([
            'mapped_fields' => $request->input('mapping'),
        ]);

        $parser = new FileParser;
        $fullPath = Storage::disk('local')->path($import->file_path);
        $parsed = $parser->parseFromPath($fullPath);

        $detector = new DuplicateDetector;
        $duplicates = $detector->detect($parsed['rows']);

        $import->update([
            'duplicates_found' => count($duplicates['duplicates']),
            'duplicate_details' => $duplicates['groups'],
        ]);

        return response()->json([
            'duplicates_found' => count($duplicates['duplicates']),
            'duplicate_groups' => $duplicates['groups'],
            'total_rows' => $parsed['total_rows'],
        ]);
    }

    public function generate(GenerateVcfRequest $request): JsonResponse
    {
        $import = Import::findOrFail($request->input('import_ulid'));
        $mapping = $import->mapped_fields;

        if (empty($mapping)) {
            return response()->json(['error' => 'No mapping configured.'], 422);
        }

        $parser = new FileParser;
        $fullPath = Storage::disk('local')->path($import->file_path);
        $parsed = $parser->parseFromPath($fullPath);

        if ($parsed['total_rows'] > 500) {
            ProcessImportJob::dispatch($import);

            return response()->json([
                'status' => 'queued',
                'message' => 'Your file is being processed. This may take a moment.',
                'import_ulid' => $import->id,
            ]);
        }

        $vcfGenerator = new VcfGenerator;
        $format = $request->input('format', 'single');

        if ($format === 'zip') {
            $files = $vcfGenerator->generateIndividual($parsed['rows'], $mapping);
            $zipFilename = 'contacts-'.now()->format('Y-m-d').'-'.count($parsed['rows']).'.zip';
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
                'contact_count' => count($parsed['rows']),
                'expires_at' => $import->user_id ? null : now()->addMinutes(5),
            ]);
        } else {
            $vcfContent = $vcfGenerator->generateSingle($parsed['rows'], $mapping);
            $exportFilename = 'contacts-'.now()->format('Y-m-d').'-'.count($parsed['rows']).'.vcf';
            $exportPath = 'exports/'.$import->id.'/'.$exportFilename;

            Storage::disk('local')->put($exportPath, $vcfContent);

            $export = $import->export()->create([
                'user_id' => $import->user_id,
                'filename' => $exportFilename,
                'file_path' => $exportPath,
                'format' => 'vcf',
                'contact_count' => count($parsed['rows']),
                'expires_at' => $import->user_id ? null : now()->addMinutes(5),
            ]);
        }

        $import->markAsCompleted();

        if ($request->boolean('save_template') && $import->user_id) {
            $import->user->mappingTemplates()->create([
                'name' => $request->input('template_name', 'Template '.now()->format('M d, Y')),
                'mapping' => $mapping,
            ]);
        }

        return response()->json([
            'status' => 'completed',
            'export_ulid' => $export->id,
            'filename' => $export->filename,
            'contact_count' => $export->contact_count,
        ]);
    }

    public function status(Request $request): JsonResponse
    {
        $request->validate([
            'import_ulid' => ['required', 'string', 'exists:imports,id'],
        ]);

        $import = Import::findOrFail($request->input('import_ulid'));

        $response = [
            'status' => $import->status,
            'row_count' => $import->row_count,
        ];

        if ($import->isCompleted()) {
            $export = $import->export;
            if ($export) {
                $response['export_ulid'] = $export->id;
                $response['filename'] = $export->filename;
                $response['contact_count'] = $export->contact_count;
            }
        }

        if ($import->isFailed()) {
            $response['error'] = $import->error_message;
        }

        return response()->json($response);
    }

    public function download(string $exportUlid): StreamedResponse
    {
        $export = \App\Models\Export::findOrFail($exportUlid);

        if ($export->isExpired()) {
            abort(410, 'This download link has expired.');
        }

        $export->incrementDownloads();

        $contentType = $export->format === 'zip' ? 'application/zip' : 'text/vcard';

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->download(
            $export->file_path,
            $export->filename,
            ['Content-Type' => $contentType]
        );
    }

    public function publicDownload(string $token): StreamedResponse
    {
        $export = \App\Models\Export::where('public_token', $token)
            ->where('is_public', true)
            ->firstOrFail();

        if ($export->isExpired()) {
            abort(410, 'This download link has expired.');
        }

        $export->incrementDownloads();

        $contentType = $export->format === 'zip' ? 'application/zip' : 'text/vcard';

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('local');

        return $disk->download(
            $export->file_path,
            $export->filename,
            ['Content-Type' => $contentType]
        );
    }
}
