<?php

namespace App\Http\Controllers;

use App\Models\Integration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class IntegrationController extends Controller
{
    public function index(Request $request): Response
    {
        $integrations = Integration::where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return Inertia::render('integrations/index', [
            'integrations' => $integrations->map(fn (Integration $i) => [
                'id' => $i->id,
                'type' => $i->type,
                'name' => $i->name,
                'is_active' => $i->is_active,
                'token_expired' => $i->isTokenExpired(),
                'metadata' => $i->metadata,
                'created_at' => $i->created_at->toISOString(),
            ]),
        ]);
    }

    public function connectGoogleSheets(Request $request): RedirectResponse
    {
        $params = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => route('integrations.google-sheets.callback'),
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/spreadsheets.readonly',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => csrf_token(),
        ]);

        return redirect("https://accounts.google.com/o/oauth2/v2/auth?{$params}");
    }

    public function googleSheetsCallback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            return redirect()->route('integrations.index')
                ->with('error', 'Google Sheets authorization was denied.');
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'code' => $request->input('code'),
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => route('integrations.google-sheets.callback'),
            'grant_type' => 'authorization_code',
        ]);

        if ($response->failed()) {
            return redirect()->route('integrations.index')
                ->with('error', 'Failed to connect Google Sheets.');
        }

        $data = $response->json();

        $request->user()->integrations()->updateOrCreate(
            ['type' => 'google_sheets'],
            [
                'name' => 'Google Sheets',
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'token_expires_at' => now()->addSeconds($data['expires_in']),
                'is_active' => true,
            ]
        );

        return redirect()->route('integrations.index')
            ->with('success', 'Google Sheets connected successfully!');
    }

    public function listSheets(Request $request, Integration $integration): JsonResponse
    {
        if ($integration->user_id !== $request->user()->id || ! $integration->isGoogleSheets()) {
            abort(403);
        }

        $this->refreshGoogleTokenIfNeeded($integration);

        $response = Http::withToken($integration->access_token)
            ->get('https://www.googleapis.com/drive/v3/files', [
                'q' => "mimeType='application/vnd.google-apps.spreadsheet'",
                'fields' => 'files(id,name,modifiedTime)',
                'orderBy' => 'modifiedTime desc',
                'pageSize' => 50,
            ]);

        if ($response->failed()) {
            return response()->json(['error' => 'Failed to fetch spreadsheets.'], 502);
        }

        return response()->json(['sheets' => $response->json('files', [])]);
    }

    public function readSheet(Request $request, Integration $integration): JsonResponse
    {
        $request->validate([
            'spreadsheet_id' => ['required', 'string'],
            'range' => ['required', 'string'],
        ]);

        if ($integration->user_id !== $request->user()->id || ! $integration->isGoogleSheets()) {
            abort(403);
        }

        $this->refreshGoogleTokenIfNeeded($integration);

        $spreadsheetId = $request->input('spreadsheet_id');
        $range = $request->input('range');

        $response = Http::withToken($integration->access_token)
            ->get("https://sheets.googleapis.com/v4/spreadsheets/{$spreadsheetId}/values/{$range}");

        if ($response->failed()) {
            return response()->json(['error' => 'Failed to read spreadsheet.'], 502);
        }

        $values = $response->json('values', []);
        if (empty($values)) {
            return response()->json(['error' => 'No data found in the specified range.'], 422);
        }

        $headers = array_shift($values);
        $rows = array_map(fn ($row) => array_combine(
            $headers,
            array_pad($row, count($headers), '')
        ), $values);

        return response()->json([
            'headers' => $headers,
            'rows' => array_slice($rows, 0, 10),
            'total_rows' => count($rows),
        ]);
    }

    public function disconnect(Request $request, Integration $integration): JsonResponse
    {
        if ($integration->user_id !== $request->user()->id) {
            abort(403);
        }

        $integration->delete();

        return response()->json(['message' => 'Integration disconnected.']);
    }

    private function refreshGoogleTokenIfNeeded(Integration $integration): void
    {
        if (! $integration->isTokenExpired() || ! $integration->refresh_token) {
            return;
        }

        $response = Http::post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $integration->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if ($response->successful()) {
            $data = $response->json();
            $integration->update([
                'access_token' => $data['access_token'],
                'token_expires_at' => now()->addSeconds($data['expires_in']),
            ]);
        }
    }
}
