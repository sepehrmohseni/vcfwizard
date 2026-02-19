<?php

namespace Tests\Feature;

use App\Models\Export;
use App\Models\Import;
use App\Models\MappingTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GuestImportClaimingTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_claims_guest_imports_and_exports(): void
    {
        $user = User::factory()->create();

        $import = Import::factory()->guest()->create();
        $export = Export::factory()->create([
            'user_id' => null,
            'import_id' => $import->id,
        ]);

        $this->withSession(['guest_imports' => [$import->id]])
            ->post(route('login.store'), [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $this->assertEquals($user->id, $import->fresh()->user_id);
        $this->assertEquals($user->id, $export->fresh()->user_id);
    }

    public function test_login_creates_mapping_template_from_claimed_import(): void
    {
        $user = User::factory()->create();

        $import = Import::factory()->guest()->create([
            'mapped_fields' => ['Name' => 'full_name', 'Email' => 'email'],
            'original_filename' => 'contacts.csv',
        ]);

        $this->withSession(['guest_imports' => [$import->id]])
            ->post(route('login.store'), [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $this->assertDatabaseHas('mapping_templates', [
            'user_id' => $user->id,
            'name' => 'contacts',
            'mapping' => json_encode(['Name' => 'full_name', 'Email' => 'email']),
        ]);
    }

    public function test_login_does_not_create_template_when_mapped_fields_empty(): void
    {
        $user = User::factory()->create();

        $import = Import::factory()->guest()->create([
            'mapped_fields' => null,
        ]);

        $this->withSession(['guest_imports' => [$import->id]])
            ->post(route('login.store'), [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $this->assertDatabaseCount('mapping_templates', 0);
    }

    public function test_login_does_not_create_duplicate_templates(): void
    {
        $user = User::factory()->create();
        $mapping = ['Name' => 'full_name', 'Email' => 'email'];

        MappingTemplate::factory()->create([
            'user_id' => $user->id,
            'mapping' => $mapping,
        ]);

        $import = Import::factory()->guest()->create([
            'mapped_fields' => $mapping,
            'original_filename' => 'dupe.csv',
        ]);

        $this->withSession(['guest_imports' => [$import->id]])
            ->post(route('login.store'), [
                'email' => $user->email,
                'password' => 'password',
            ]);

        $this->assertDatabaseCount('mapping_templates', 1);
    }

    public function test_does_nothing_with_no_guest_imports_in_session(): void
    {
        $user = User::factory()->create();

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertDatabaseCount('imports', 0);
        $this->assertDatabaseCount('mapping_templates', 0);
    }
}
