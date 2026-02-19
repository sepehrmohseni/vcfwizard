<?php

namespace App\Jobs;

use App\Models\Export;
use App\Models\Import;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class CleanupGuestFilesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $expiredExports = Export::whereNull('user_id')
            ->where('expires_at', '<', now())
            ->get();

        foreach ($expiredExports as $export) {
            Storage::disk('local')->delete($export->file_path);
            $export->forceDelete();
        }

        $expiredImports = Import::whereNull('user_id')
            ->where('created_at', '<', now()->subMinutes(5))
            ->get();

        foreach ($expiredImports as $import) {
            Storage::disk('local')->delete($import->file_path);
            Storage::disk('local')->deleteDirectory('exports/'.$import->id);
            $import->contacts()->delete();
            $import->forceDelete();
        }
    }
}
