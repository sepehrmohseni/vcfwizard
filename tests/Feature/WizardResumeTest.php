<?php

namespace Tests\Feature;

use App\Models\Import;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class WizardResumeTest extends TestCase
{
    use RefreshDatabase;

    private function createUserWithPendingImport(): array
    {
        $user = User::factory()->create();

        Storage::disk('local')->put('imports/test-resume.csv', "Name,Email,Phone\nJohn,john@test.com,+1234567890\nJane,jane@test.com,+0987654321\n");

        $import = Import::factory()->for($user)->create([
            'original_filename' => 'test-resume.csv',
            'file_path' => 'imports/test-resume.csv',
            'file_type' => 'csv',
            'column_headers' => ['Name', 'Email', 'Phone'],
            'mapped_fields' => null,
            'status' => 'pending',
            'row_count' => 2,
        ]);

        return [$user, $import];
    }

    public function test_user_can_resume_pending_import(): void
    {
        [$user, $import] = $this->createUserWithPendingImport();

        $response = $this->actingAs($user)
            ->getJson('/wizard/resume?import_ulid='.$import->id);

        $response->assertOk()
            ->assertJsonStructure([
                'import_ulid',
                'headers',
                'preview_rows',
                'total_rows',
                'step',
            ])
            ->assertJson([
                'import_ulid' => $import->id,
                'step' => 'mapping',
                'headers' => ['Name', 'Email', 'Phone'],
                'total_rows' => 2,
            ]);
    }

    public function test_resume_with_mapped_fields_returns_preview_step(): void
    {
        [$user, $import] = $this->createUserWithPendingImport();

        $import->update([
            'mapped_fields' => ['Name' => 'full_name', 'Email' => 'email', 'Phone' => 'phone'],
            'duplicates_found' => 0,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/wizard/resume?import_ulid='.$import->id);

        $response->assertOk()
            ->assertJson([
                'step' => 'preview',
                'mapping' => ['Name' => 'full_name', 'Email' => 'email', 'Phone' => 'phone'],
                'duplicates_found' => 0,
            ]);
    }

    public function test_resume_returns_ai_suggestions_if_present(): void
    {
        [$user, $import] = $this->createUserWithPendingImport();

        $suggestions = [
            ['column_name' => 'Name', 'field_type' => 'full_name', 'confidence' => 95, 'reasoning' => 'test'],
        ];
        $import->update(['ai_suggestions' => $suggestions]);

        $response = $this->actingAs($user)
            ->getJson('/wizard/resume?import_ulid='.$import->id);

        $response->assertOk()
            ->assertJsonFragment(['column_name' => 'Name']);
    }

    public function test_cannot_resume_completed_import(): void
    {
        [$user, $import] = $this->createUserWithPendingImport();

        $import->update(['status' => 'completed', 'processed_at' => now()]);

        $response = $this->actingAs($user)
            ->getJson('/wizard/resume?import_ulid='.$import->id);

        $response->assertUnprocessable();
    }

    public function test_cannot_resume_other_users_import(): void
    {
        [$user, $import] = $this->createUserWithPendingImport();
        $otherUser = User::factory()->create();

        $response = $this->actingAs($otherUser)
            ->getJson('/wizard/resume?import_ulid='.$import->id);

        $response->assertForbidden();
    }

    public function test_resume_fails_if_file_missing(): void
    {
        [$user, $import] = $this->createUserWithPendingImport();

        Storage::disk('local')->delete('imports/test-resume.csv');

        $response = $this->actingAs($user)
            ->getJson('/wizard/resume?import_ulid='.$import->id);

        $response->assertNotFound();
    }

    protected function tearDown(): void
    {
        Storage::disk('local')->delete('imports/test-resume.csv');
        parent::tearDown();
    }
}
