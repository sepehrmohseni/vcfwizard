<?php

namespace Database\Factories;

use App\Models\Import;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ImportFactory extends Factory
{
    protected $model = Import::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'original_filename' => fake()->word().'.csv',
            'file_path' => 'imports/'.fake()->uuid().'.csv',
            'file_type' => fake()->randomElement(['csv', 'xlsx']),
            'file_size' => fake()->numberBetween(1024, 1048576),
            'row_count' => fake()->numberBetween(1, 5000),
            'column_headers' => ['Name', 'Email', 'Phone'],
            'mapped_fields' => null,
            'status' => 'pending',
        ];
    }

    public function guest(): static
    {
        return $this->state(fn () => ['user_id' => null]);
    }

    public function processing(): static
    {
        return $this->state(fn () => ['status' => 'processing']);
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'status' => 'completed',
            'processed_at' => now(),
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'status' => 'failed',
            'error_message' => 'Processing failed due to invalid data.',
        ]);
    }
}
