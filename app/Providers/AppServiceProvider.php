<?php

namespace App\Providers;

use App\Models\Import;
use App\Models\MappingTemplate;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureGuestImportClaiming();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    protected function configureGuestImportClaiming(): void
    {
        $claimImports = function (Login|Registered $event): void {
            $session = request()->session();
            $guestImports = $session->pull('guest_imports', []);

            if (empty($guestImports)) {
                return;
            }

            $imports = Import::whereIn('id', $guestImports)
                ->whereNull('user_id')
                ->get();

            foreach ($imports as $import) {
                $import->update(['user_id' => $event->user->id]);

                $import->export()
                    ->whereNull('user_id')
                    ->update(['user_id' => $event->user->id]);

                if (! empty($import->mapped_fields)) {
                    $exists = MappingTemplate::where('user_id', $event->user->id)
                        ->where('mapping', json_encode($import->mapped_fields))
                        ->exists();

                    if (! $exists) {
                        MappingTemplate::create([
                            'user_id' => $event->user->id,
                            'name' => pathinfo($import->original_filename, PATHINFO_FILENAME),
                            'mapping' => $import->mapped_fields,
                        ]);
                    }
                }
            }
        };

        Event::listen(Login::class, $claimImports);
        Event::listen(Registered::class, $claimImports);
    }
}
