<?php

namespace App\DTOs;

readonly class ImportData
{
    /**
     * @param  array<string>  $headers
     * @param  array<array<string, string>>  $rows
     */
    public function __construct(
        public string $originalFilename,
        public string $filePath,
        public string $fileType,
        public int $fileSize,
        public array $headers,
        public array $rows,
        public int $totalRows,
        public ?int $userId = null,
    ) {}
}
