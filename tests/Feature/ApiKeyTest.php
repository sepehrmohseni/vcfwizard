<?php

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ApiKeyTest extends TestCase
{
    use RefreshDatabase;

    private function createProUser(): User
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

        return $user;
    }

    public function test_pro_user_can_view_api_keys(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $this->get(route('api-keys.index'))->assertOk();
    }

    public function test_pro_user_can_create_api_key(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $response = $this->postJson(route('api-keys.store'), [
            'name' => 'Test Key',
        ]);

        $response->assertCreated();
        $response->assertJsonStructure(['api_key', 'plain_key']);

        $plainKey = $response->json('plain_key');
        $this->assertStringStartsWith('vcfw_', $plainKey);

        $this->assertDatabaseHas('api_keys', [
            'user_id' => $user->id,
            'name' => 'Test Key',
        ]);
    }

    public function test_api_key_requires_name(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $this->postJson(route('api-keys.store'), [])
            ->assertUnprocessable();
    }

    public function test_pro_user_can_delete_own_api_key(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $apiKey = ApiKey::factory()->create(['user_id' => $user->id]);

        $this->deleteJson(route('api-keys.destroy', $apiKey))->assertOk();

        $this->assertDatabaseMissing('api_keys', ['id' => $apiKey->id]);
    }

    public function test_user_cannot_delete_other_users_api_key(): void
    {
        $user = $this->createProUser();
        $otherUser = $this->createProUser();
        $this->actingAs($user);

        $apiKey = ApiKey::factory()->create(['user_id' => $otherUser->id]);

        $this->deleteJson(route('api-keys.destroy', $apiKey))->assertForbidden();
    }

    public function test_api_key_records_usage(): void
    {
        $apiKey = ApiKey::factory()->create(['usage_count' => 0]);

        $apiKey->recordUsage();

        $this->assertEquals(1, $apiKey->fresh()->usage_count);
        $this->assertNotNull($apiKey->fresh()->last_used_at);
    }

    public function test_expired_api_key_is_detected(): void
    {
        $apiKey = ApiKey::factory()->create([
            'expires_at' => now()->subDay(),
        ]);

        $this->assertTrue($apiKey->isExpired());
    }

    public function test_active_api_key_is_not_expired(): void
    {
        $apiKey = ApiKey::factory()->create([
            'expires_at' => now()->addYear(),
        ]);

        $this->assertFalse($apiKey->isExpired());
    }
}
