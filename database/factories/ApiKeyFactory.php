<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ApiKey>
 */
class ApiKeyFactory extends Factory
{
    public function definition(): array
    {
        $key = 'vcfw_'.Str::random(48);

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(2, true),
            'key' => hash('sha256', $key),
            'key_prefix' => substr($key, 0, 8),
            'usage_count' => 0,
            'expires_at' => now()->addYear(),
        ];
    }
}
