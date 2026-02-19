<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearer = $request->bearerToken();

        if (! $bearer) {
            return response()->json(['error' => 'API key required.'], 401);
        }

        $apiKey = ApiKey::where('key', hash('sha256', $bearer))->first();

        if (! $apiKey) {
            return response()->json(['error' => 'Invalid API key.'], 401);
        }

        if ($apiKey->isExpired()) {
            return response()->json(['error' => 'API key has expired.'], 401);
        }

        $apiKey->recordUsage();

        $request->setUserResolver(fn () => $apiKey->user);

        return $next($request);
    }
}
