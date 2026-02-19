<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Excel;
use Maatwebsite\Excel\Facades\Excel as ExcelFacade;

class FileParser
{
    private const MAX_PREVIEW_ROWS = 10;

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    public function parse(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'csv' => $this->parseCsv($file),
            'xlsx', 'xls' => $this->parseExcel($file),
            default => throw new \InvalidArgumentException("Unsupported file type: {$extension}"),
        };
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    public function parseFromPath(string $path): array
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        return match ($extension) {
            'csv' => $this->parseCsvFromPath($path),
            'xlsx', 'xls' => $this->parseExcelFromPath($path),
            default => throw new \InvalidArgumentException("Unsupported file type: {$extension}"),
        };
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseCsv(UploadedFile $file): array
    {
        return $this->parseCsvFromPath($file->getRealPath());
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseCsvFromPath(string $path): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            throw new \RuntimeException('Failed to open CSV file.');
        }

        $headers = fgetcsv($handle);
        if ($headers === false) {
            fclose($handle);
            throw new \RuntimeException('Failed to read CSV headers.');
        }

        $headers = array_map(fn ($h) => $this->sanitizeHeader($h), $headers);
        $rows = [];
        $totalRows = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $totalRows++;
            if (count($row) === count($headers)) {
                $rows[] = array_combine($headers, $row);
            }
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows' => $rows,
            'total_rows' => $totalRows,
        ];
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseExcel(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $readerType = $extension === 'xls' ? Excel::XLS : Excel::XLSX;

        return $this->parseExcelFromPath($file->getRealPath(), $readerType);
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseExcelFromPath(string $path, ?string $readerType = null): array
    {
        if ($readerType === null) {
            $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));
            $readerType = $extension === 'xls' ? Excel::XLS : Excel::XLSX;
        }

        $data = ExcelFacade::toArray(null, $path, null, $readerType);

        if (empty($data) || empty($data[0])) {
            throw new \RuntimeException('Excel file is empty.');
        }

        $sheet = $data[0];
        $headers = array_map(fn ($h) => $this->sanitizeHeader((string) $h), $sheet[0]);
        $rows = [];

        for ($i = 1; $i < count($sheet); $i++) {
            if (count($sheet[$i]) === count($headers)) {
                $row = array_combine($headers, array_map('strval', $sheet[$i]));
                $rows[] = $row;
            }
        }

        return [
            'headers' => $headers,
            'rows' => $rows,
            'total_rows' => count($rows),
        ];
    }

    /**
     * @param  array<array<string, string>>  $rows
     * @return array<array<string, string>>
     */
    public function getPreviewRows(array $rows, int $limit = self::MAX_PREVIEW_ROWS): array
    {
        return array_slice($rows, 0, $limit);
    }

    private function sanitizeHeader(string $header): string
    {
        $header = trim($header);
        $header = preg_replace('/[^\w\s\-.]/', '', $header);
        $header = preg_replace('/\s+/', ' ', $header);

        return Str::limit($header, 50, '');
    }
}
