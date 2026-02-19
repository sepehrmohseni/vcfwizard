<?php

namespace App\Http\Controllers;

use App\Models\Import;
use App\Services\FileParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HistoryController extends Controller
{
    public function index(Request $request): Response
    {
        $imports = Import::where('user_id', $request->user()->id)
            ->with('export')
            ->latest()
            ->paginate(20);

        return Inertia::render('history', [
            'imports' => $imports,
        ]);
    }

    public function preview(Request $request, Import $import): JsonResponse
    {
        if ($import->user_id !== $request->user()->id) {
            abort(403);
        }

        if (! Storage::disk('local')->exists($import->file_path)) {
            return response()->json([
                'error' => 'Source file no longer available.',
            ], 404);
        }

        $parser = new FileParser;
        $fullPath = Storage::disk('local')->path($import->file_path);
        $parsed = $parser->parseFromPath($fullPath);

        return response()->json([
            'headers' => $parsed['headers'],
            'rows' => $parser->getPreviewRows($parsed['rows'], 50),
            'total_rows' => $parsed['total_rows'],
            'mapping' => $import->mapped_fields,
        ]);
    }
}
