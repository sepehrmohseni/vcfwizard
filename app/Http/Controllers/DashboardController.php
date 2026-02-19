<?php

namespace App\Http\Controllers;

use App\Models\Export;
use App\Models\Import;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $recentImports = Import::where('user_id', $user->id)
            ->with('export')
            ->latest()
            ->limit(10)
            ->get();

        $stats = [
            'total_imports' => Import::where('user_id', $user->id)->count(),
            'total_contacts' => Import::where('user_id', $user->id)->sum('row_count'),
            'total_exports' => Export::where('user_id', $user->id)->count(),
            'ai_rows_used' => $user->ai_rows_used,
            'ai_rows_limit' => $user->ai_rows_limit,
        ];

        return Inertia::render('dashboard', [
            'recentImports' => $recentImports,
            'stats' => $stats,
            'subscribed' => $user->isPro(),
        ]);
    }
}
