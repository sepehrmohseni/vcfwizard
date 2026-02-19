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
            'contacts_this_month' => $user->contacts_processed_this_month,
            'total_exports' => Export::where('user_id', $user->id)->count(),
        ];

        return Inertia::render('dashboard', [
            'recentImports' => $recentImports,
            'stats' => $stats,
        ]);
    }
}
