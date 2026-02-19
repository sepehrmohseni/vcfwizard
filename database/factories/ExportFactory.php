<?php

namespace Database\Factories;

use App\Models\Export;
use App\Models\Import;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ExportFactory extends Factory
{
    protected $model = Export::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'import_id' => Import::factory(),
            'filename' => 'contacts-'.now()->format('Y-m-d').'.vcf',
            'file_path' => 'exports/'.fake()->uuid().'.vcf',
            'format' => 'vcf',
            'contact_count' => fake()->numberBetween(1, 1000),
            'download_count' => 0,
            'expires_at' => now()->addDays(7),
            'is_public' => false,
        ];
    }

    public function withPublicToken(): static
    {
        return $this->state(fn () => [
            'public_token' => Str::random(64),
            'is_public' => true,
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'expires_at' => now()->subDay(),
        ]);
    }
}
