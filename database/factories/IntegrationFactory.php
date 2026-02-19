<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Integration>
 */
class IntegrationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'google_sheets',
            'name' => 'Google Sheets',
            'access_token' => encrypt('test_access_token'),
            'refresh_token' => encrypt('test_refresh_token'),
            'token_expires_at' => now()->addHour(),
            'is_active' => true,
        ];
    }
}
