<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscribed
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isPro()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'This feature requires a VCFWizard Pro subscription.',
                    'upgrade_url' => route('billing.index'),
                ], 403);
            }

            return redirect()->route('billing.index')
                ->with('error', 'This feature requires a VCFWizard Pro subscription.');
        }

        return $next($request);
    }
}
