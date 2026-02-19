<?php

namespace Database\Factories;

use App\Models\Import;
use App\Models\ImportContact;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImportContactFactory extends Factory
{
    protected $model = ImportContact::class;

    public function definition(): array
    {
        return [
            'import_id' => Import::factory(),
            'raw_row' => [
                'Name' => fake()->name(),
                'Email' => fake()->safeEmail(),
                'Phone' => fake()->phoneNumber(),
            ],
            'normalized_data' => null,
            'is_duplicate' => false,
        ];
    }

    public function duplicate(): static
    {
        return $this->state(fn () => ['is_duplicate' => true]);
    }
}
