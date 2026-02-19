<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ApiKeyController extends Controller
{
    public function index(Request $request): Response
    {
        $apiKeys = ApiKey::where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn (ApiKey $key) => [
                'id' => $key->id,
                'name' => $key->name,
                'key_prefix' => $key->key_prefix,
                'usage_count' => $key->usage_count,
                'last_used_at' => $key->last_used_at?->toISOString(),
                'expires_at' => $key->expires_at?->toISOString(),
                'created_at' => $key->created_at->toISOString(),
            ]);

        return Inertia::render('api-keys/index', [
            'apiKeys' => $apiKeys,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
        ]);

        $plainKey = 'vcfw_'.Str::random(48);

        $apiKey = $request->user()->apiKeys()->create([
            'name' => $request->input('name'),
            'key' => hash('sha256', $plainKey),
            'key_prefix' => substr($plainKey, 0, 8),
            'expires_at' => now()->addYear(),
        ]);

        return response()->json([
            'api_key' => [
                'id' => $apiKey->id,
                'name' => $apiKey->name,
                'key_prefix' => $apiKey->key_prefix,
                'expires_at' => $apiKey->expires_at->toISOString(),
            ],
            'plain_key' => $plainKey,
        ], 201);
    }

    public function destroy(Request $request, ApiKey $apiKey): JsonResponse
    {
        if ($apiKey->user_id !== $request->user()->id) {
            abort(403);
        }

        $apiKey->delete();

        return response()->json(['message' => 'API key revoked.']);
    }
}
