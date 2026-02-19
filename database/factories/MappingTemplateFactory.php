<?php

namespace Database\Factories;

use App\Models\MappingTemplate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MappingTemplateFactory extends Factory
{
    protected $model = MappingTemplate::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true).' Template',
            'mapping' => [
                'Name' => 'full_name',
                'Email' => 'email',
                'Phone' => 'phone',
            ],
            'is_public' => false,
        ];
    }

    public function public(): static
    {
        return $this->state(fn () => ['is_public' => true]);
    }
}
