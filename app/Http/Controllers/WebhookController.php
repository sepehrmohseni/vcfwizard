<?php

namespace App\Http\Controllers;

use App\Models\Webhook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WebhookController extends Controller
{
    public function index(Request $request): Response
    {
        $webhooks = Webhook::where('user_id', $request->user()->id)
            ->withCount('deliveries')
            ->latest()
            ->get();

        return Inertia::render('webhooks/index', [
            'webhooks' => $webhooks,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'url' => ['required', 'url', 'max:500'],
            'events' => ['required', 'array', 'min:1'],
            'events.*' => ['string', 'in:import.completed,import.failed,export.ready'],
        ]);

        $webhook = $request->user()->webhooks()->create([
            'name' => $request->input('name'),
            'url' => $request->input('url'),
            'secret' => Str::random(64),
            'events' => $request->input('events'),
        ]);

        return response()->json([
            'webhook' => $webhook->only(['id', 'name', 'url', 'events', 'is_active']),
            'secret' => $webhook->secret,
        ], 201);
    }

    public function update(Request $request, Webhook $webhook): JsonResponse
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'url' => ['sometimes', 'url', 'max:500'],
            'events' => ['sometimes', 'array', 'min:1'],
            'events.*' => ['string', 'in:import.completed,import.failed,export.ready'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $webhook->update($request->only(['name', 'url', 'events', 'is_active']));

        return response()->json(['webhook' => $webhook->fresh()]);
    }

    public function destroy(Request $request, Webhook $webhook): JsonResponse
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }

        $webhook->delete();

        return response()->json(['message' => 'Webhook deleted.']);
    }

    public function deliveries(Request $request, Webhook $webhook): JsonResponse
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }

        $deliveries = $webhook->deliveries()
            ->latest()
            ->limit(50)
            ->get();

        return response()->json(['deliveries' => $deliveries]);
    }

    public function regenerateSecret(Request $request, Webhook $webhook): JsonResponse
    {
        if ($webhook->user_id !== $request->user()->id) {
            abort(403);
        }

        $webhook->update([
            'secret' => Str::random(64),
            'failure_count' => 0,
        ]);

        return response()->json(['secret' => $webhook->secret]);
    }
}
