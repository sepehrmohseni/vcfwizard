<?php

namespace Tests\Feature;

use App\Models\Import;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ZapierApiTest extends TestCase
{
    use RefreshDatabase;

    private function createProUserWithApiKey(): array
    {
        $user = User::factory()->create([
            'stripe_id' => 'cus_'.Str::random(14),
        ]);

        $user->subscriptions()->create([
            'type' => 'pro',
            'stripe_id' => 'sub_'.Str::random(14),
            'stripe_status' => 'active',
            'stripe_price' => 'price_test',
        ]);

        $plainKey = 'vcfw_'.Str::random(48);
        $user->apiKeys()->create([
            'name' => 'Test Key',
            'key' => hash('sha256', $plainKey),
            'key_prefix' => substr($plainKey, 0, 8),
            'expires_at' => now()->addYear(),
        ]);

        return [$user, $plainKey];
    }

    public function test_api_requires_bearer_token(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertUnauthorized();
    }

    public function test_invalid_api_key_is_rejected(): void
    {
        $response = $this->getJson('/api/me', [
            'Authorization' => 'Bearer vcfw_invalid_key',
        ]);

        $response->assertUnauthorized();
    }

    public function test_auth_test_endpoint(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        $response = $this->getJson('/api/me', [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertOk()
            ->assertJson([
                'id' => $user->id,
                'email' => $user->email,
                'plan' => 'pro',
            ]);
    }

    public function test_trigger_import_completed_returns_recent_imports(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        Import::factory()->for($user)->completed()->count(3)->create();

        $response = $this->getJson('/api/triggers/import-completed', [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_trigger_import_failed_returns_failed_imports(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        Import::factory()->for($user)->failed()->count(2)->create();

        $response = $this->getJson('/api/triggers/import-failed', [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertOk();
        $this->assertCount(2, $response->json());
    }

    public function test_subscribe_creates_webhook(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        $response = $this->postJson('/api/hooks', [
            'target_url' => 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
            'event' => 'import.completed',
        ], [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertCreated()
            ->assertJsonStructure(['id']);

        $this->assertDatabaseHas('webhooks', [
            'user_id' => $user->id,
            'url' => 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
        ]);
    }

    public function test_unsubscribe_deletes_webhook(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        $webhook = $user->webhooks()->create([
            'name' => 'Zapier — import.completed',
            'url' => 'https://hooks.zapier.com/test',
            'secret' => Str::random(64),
            'events' => ['import.completed'],
        ]);

        $response = $this->deleteJson("/api/hooks/{$webhook->id}", [], [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertNoContent();
        $this->assertDatabaseMissing('webhooks', ['id' => $webhook->id]);
    }

    public function test_convert_action_creates_vcf(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        $response = $this->postJson('/api/actions/convert', [
            'contacts' => [
                ['name' => 'John Doe', 'email' => 'john@test.com', 'phone' => '+1234567890'],
                ['name' => 'Jane Smith', 'email' => 'jane@test.com', 'phone' => '+0987654321'],
            ],
        ], [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'import_id',
                'export_id',
                'filename',
                'contact_count',
                'download_url',
            ]);

        $this->assertEquals(2, $response->json('contact_count'));

        $this->assertDatabaseHas('imports', [
            'user_id' => $user->id,
            'source' => 'zapier',
            'status' => 'completed',
        ]);
    }

    public function test_convert_action_validates_contacts(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        $response = $this->postJson('/api/actions/convert', [
            'contacts' => [],
        ], [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertUnprocessable();
    }

    public function test_list_imports_returns_user_imports(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        Import::factory()->for($user)->count(5)->create();

        $response = $this->getJson('/api/imports', [
            'Authorization' => "Bearer {$key}",
        ]);

        $response->assertOk();
        $this->assertCount(5, $response->json());
    }

    public function test_expired_api_key_is_rejected(): void
    {
        $user = User::factory()->create();
        $plainKey = 'vcfw_'.Str::random(48);

        $user->apiKeys()->create([
            'name' => 'Expired Key',
            'key' => hash('sha256', $plainKey),
            'key_prefix' => substr($plainKey, 0, 8),
            'expires_at' => now()->subDay(),
        ]);

        $response = $this->getJson('/api/me', [
            'Authorization' => "Bearer {$plainKey}",
        ]);

        $response->assertUnauthorized()
            ->assertJson(['error' => 'API key has expired.']);
    }

    public function test_api_key_usage_is_tracked(): void
    {
        [$user, $key] = $this->createProUserWithApiKey();

        $this->getJson('/api/me', ['Authorization' => "Bearer {$key}"]);
        $this->getJson('/api/me', ['Authorization' => "Bearer {$key}"]);

        $apiKey = $user->apiKeys()->first();
        $this->assertEquals(2, $apiKey->usage_count);
        $this->assertNotNull($apiKey->last_used_at);
    }
}
