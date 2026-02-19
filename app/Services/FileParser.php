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
            'txt' => $this->parseTxt($file),
            'json' => $this->parseJson($file),
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
            'txt' => $this->parseTxtFromPath($path),
            'json' => $this->parseJsonFromPath($path),
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

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseTxt(UploadedFile $file): array
    {
        return $this->parseTxtFromPath($file->getRealPath());
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseTxtFromPath(string $path): array
    {
        $content = file_get_contents($path);
        if ($content === false) {
            throw new \RuntimeException('Failed to read TXT file.');
        }

        $lines = preg_split('/\R/', $content);
        $lines = array_filter($lines, fn ($l) => trim($l) !== '');

        if (empty($lines)) {
            throw new \RuntimeException('TXT file is empty.');
        }

        $firstLine = reset($lines);
        $delimiter = $this->detectDelimiter($firstLine);

        $headers = array_map(
            fn ($h) => $this->sanitizeHeader($h),
            str_getcsv($firstLine, $delimiter)
        );

        $rows = [];
        $isFirst = true;
        foreach ($lines as $line) {
            if ($isFirst) {
                $isFirst = false;

                continue;
            }
            $parsed = str_getcsv($line, $delimiter);
            if (count($parsed) === count($headers)) {
                $rows[] = array_combine($headers, $parsed);
            }
        }

        return [
            'headers' => $headers,
            'rows' => $rows,
            'total_rows' => count($rows),
        ];
    }

    private function detectDelimiter(string $line): string
    {
        $delimiters = ["\t" => 0, '|' => 0, ';' => 0, ',' => 0];

        foreach (array_keys($delimiters) as $d) {
            $delimiters[$d] = substr_count($line, $d);
        }

        return array_keys($delimiters, max($delimiters))[0];
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseJson(UploadedFile $file): array
    {
        return $this->parseJsonFromPath($file->getRealPath());
    }

    /**
     * @return array{headers: array<string>, rows: array<array<string, string>>, total_rows: int}
     */
    private function parseJsonFromPath(string $path): array
    {
        $content = file_get_contents($path);
        if ($content === false) {
            throw new \RuntimeException('Failed to read JSON file.');
        }

        $data = json_decode($content, true);

        if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
            $lines = preg_split('/\R/', trim($content));
            $data = [];
            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '') {
                    continue;
                }
                $decoded = json_decode($line, true);
                if (is_array($decoded)) {
                    $data[] = $decoded;
                }
            }
        }

        if (! is_array($data) || empty($data)) {
            throw new \RuntimeException('JSON file contains no valid data.');
        }

        if (isset($data[0]) && is_array($data[0])) {
            $records = $data;
        } else {
            $records = [$data];
        }

        $headers = array_map(
            fn ($h) => $this->sanitizeHeader((string) $h),
            array_keys($records[0])
        );

        $rows = array_map(fn ($record) => array_combine(
            $headers,
            array_map('strval', array_values(array_pad(
                array_intersect_key($record, array_flip(array_keys($records[0]))),
                count($headers),
                ''
            )))
        ), $records);

        return [
            'headers' => $headers,
            'rows' => $rows,
            'total_rows' => count($rows),
        ];
    }

    public static function isPremiumFormat(string $extension): bool
    {
        return in_array(strtolower($extension), ['txt', 'json']);
    }
}
