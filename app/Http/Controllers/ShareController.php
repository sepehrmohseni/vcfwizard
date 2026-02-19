<?php

namespace App\Http\Controllers;

use App\Models\Export;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ShareController extends Controller
{
    public function createShareLink(Request $request): JsonResponse
    {
        $request->validate([
            'export_ulid' => ['required', 'string', 'exists:exports,id'],
            'expires_in_days' => ['sometimes', 'integer', 'min:1', 'max:30'],
        ]);

        $export = Export::findOrFail($request->input('export_ulid'));

        if ($export->user_id !== $request->user()->id) {
            abort(403);
        }

        $export->update([
            'public_token' => Str::random(64),
            'is_public' => true,
            'expires_at' => now()->addDays($request->input('expires_in_days', 7)),
        ]);

        return response()->json([
            'share_url' => url('/download/'.$export->public_token),
            'expires_at' => $export->expires_at,
        ]);
    }
}
