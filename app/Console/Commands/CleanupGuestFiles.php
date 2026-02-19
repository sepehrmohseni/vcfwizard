<?php

namespace App\Console\Commands;

use App\Jobs\CleanupGuestFilesJob;
use Illuminate\Console\Command;

class CleanupGuestFiles extends Command
{
    protected $signature = 'vcfwizard:cleanup';

    protected $description = 'Clean up expired guest files and temporary imports';

    public function handle(): int
    {
        CleanupGuestFilesJob::dispatch();

        $this->info('Guest file cleanup job dispatched.');

        return self::SUCCESS;
    }
}
