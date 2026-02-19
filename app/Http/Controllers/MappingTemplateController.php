<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMappingTemplateRequest;
use App\Models\MappingTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MappingTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $templates = MappingTemplate::where(function ($query) use ($request) {
            $query->where('user_id', $request->user()->id)
                ->orWhere('is_public', true);
        })
            ->latest()
            ->paginate(20);

        return Inertia::render('templates', [
            'templates' => $templates,
        ]);
    }

    public function store(StoreMappingTemplateRequest $request): JsonResponse
    {
        $template = $request->user()->mappingTemplates()->create([
            'name' => $request->input('name'),
            'mapping' => $request->input('mapping'),
            'is_public' => $request->boolean('is_public', false),
        ]);

        return response()->json([
            'template' => $template,
        ], 201);
    }

    public function destroy(Request $request, MappingTemplate $mappingTemplate): JsonResponse
    {
        if ($mappingTemplate->user_id !== $request->user()->id) {
            abort(403);
        }

        $mappingTemplate->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    public function userTemplates(Request $request): JsonResponse
    {
        $templates = MappingTemplate::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['templates' => $templates]);
    }
}
