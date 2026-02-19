<?php

namespace Tests\Feature;

use App\Models\Import;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class HistoryPreviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_preview(): void
    {
        $import = Import::factory()->create();

        $this->getJson("/history/{$import->id}/preview")
            ->assertUnauthorized();
    }

    public function test_users_cannot_preview_other_users_imports(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $import = Import::factory()->for($owner)->create();

        $this->actingAs($other)
            ->getJson("/history/{$import->id}/preview")
            ->assertForbidden();
    }

    public function test_returns404_when_file_no_longer_exists(): void
    {
        $user = User::factory()->create();
        $import = Import::factory()
            ->for($user)
            ->create(['file_path' => 'imports/nonexistent.csv']);

        Storage::disk('local')->assertMissing('imports/nonexistent.csv');

        $this->actingAs($user)
            ->getJson("/history/{$import->id}/preview")
            ->assertNotFound()
            ->assertJson(['error' => 'Source file no longer available.']);
    }

    public function test_returns_preview_data_for_own_import(): void
    {
        $user = User::factory()->create();

        $csvContent = "Name,Email,Phone\nJohn Doe,john@example.com,555-1234\nJane Smith,jane@example.com,555-5678\n";
        Storage::disk('local')->put('imports/test-preview.csv', $csvContent);

        $import = Import::factory()
            ->for($user)
            ->create([
                'file_path' => 'imports/test-preview.csv',
                'file_type' => 'csv',
                'mapped_fields' => ['Name' => 'full_name', 'Email' => 'email'],
            ]);

        $response = $this->actingAs($user)
            ->getJson("/history/{$import->id}/preview")
            ->assertOk()
            ->assertJsonStructure([
                'headers',
                'rows',
                'total_rows',
                'mapping',
            ]);

        $data = $response->json();
        $this->assertEquals(['Name', 'Email', 'Phone'], $data['headers']);
        $this->assertCount(2, $data['rows']);
        $this->assertEquals(2, $data['total_rows']);
        $this->assertEquals(['Name' => 'full_name', 'Email' => 'email'], $data['mapping']);

        Storage::disk('local')->delete('imports/test-preview.csv');
    }
}
