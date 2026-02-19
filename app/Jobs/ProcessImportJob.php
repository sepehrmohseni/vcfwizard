<?php

namespace App\Jobs;

use App\Models\Import;
use App\Models\ImportContact;
use App\Services\DuplicateDetector;
use App\Services\FileParser;
use App\Services\PhoneNormalizer;
use App\Services\VcfGenerator;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $timeout = 600;

    public function __construct(
        public Import $import,
    ) {}

    public function handle(
        FileParser $parser,
        VcfGenerator $vcfGenerator,
        DuplicateDetector $duplicateDetector,
        PhoneNormalizer $phoneNormalizer,
    ): void {
        try {
            $this->import->markAsProcessing();

            $fullPath = Storage::disk('local')->path($this->import->file_path);
            $parsed = $parser->parseFromPath($fullPath);
            $mapping = $this->import->mapped_fields ?? [];

            if (empty($mapping)) {
                $this->import->markAsFailed('No field mapping provided.');

                return;
            }

            $duplicateResult = $duplicateDetector->detect($parsed['rows']);
            $this->import->update([
                'duplicates_found' => count($duplicateResult['duplicates']),
                'duplicate_details' => $duplicateResult['groups'],
            ]);

            if ($this->import->user_id !== null) {
                $this->storeContacts($parsed['rows'], $mapping, $vcfGenerator);
            }

            $vcfContent = $vcfGenerator->generateSingle($parsed['rows'], $mapping);
            $exportFilename = 'contacts-'.now()->format('Y-m-d').'-'.count($parsed['rows']).'.vcf';
            $exportPath = 'exports/'.$this->import->id.'/'.$exportFilename;

            Storage::disk('local')->put($exportPath, $vcfContent);

            $this->import->export()->create([
                'user_id' => $this->import->user_id,
                'filename' => $exportFilename,
                'file_path' => $exportPath,
                'format' => 'vcf',
                'contact_count' => count($parsed['rows']),
                'expires_at' => $this->import->user_id ? null : now()->addMinutes(5),
            ]);

            $this->import->markAsCompleted();
        } catch (\Throwable $e) {
            Log::error('Import processing failed', [
                'import_id' => $this->import->id,
                'error' => $e->getMessage(),
            ]);
            $this->import->markAsFailed($e->getMessage());

            throw $e;
        }
    }

    /**
     * @param  array<array<string, string>>  $rows
     * @param  array<string, string>  $mapping
     */
    private function storeContacts(array $rows, array $mapping, VcfGenerator $vcfGenerator): void
    {
        $contacts = [];

        foreach ($rows as $row) {
            $contacts[] = [
                'id' => (string) \Illuminate\Support\Str::ulid(),
                'import_id' => $this->import->id,
                'raw_row' => json_encode($row),
                'normalized_data' => json_encode($this->normalizeRow($row, $mapping)),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($contacts, 500) as $chunk) {
            ImportContact::insert($chunk);
        }
    }

    /**
     * @param  array<string, string>  $row
     * @param  array<string, string>  $mapping
     * @return array<string, string>
     */
    private function normalizeRow(array $row, array $mapping): array
    {
        $normalized = [];
        $phoneNormalizer = new PhoneNormalizer;

        foreach ($mapping as $columnName => $fieldType) {
            if ($fieldType === 'skip' || ! isset($row[$columnName])) {
                continue;
            }

            $value = trim($row[$columnName]);

            if (str_starts_with($fieldType, 'phone') && ! empty($value)) {
                $value = $phoneNormalizer->normalize($value);
            }

            if (str_starts_with($fieldType, 'email') && ! empty($value)) {
                $value = strtolower($value);
            }

            $normalized[$fieldType] = $value;
        }

        return $normalized;
    }
}
