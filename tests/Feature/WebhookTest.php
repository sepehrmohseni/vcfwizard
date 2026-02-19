<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Webhook;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class WebhookTest extends TestCase
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

    public function test_pro_user_can_view_webhooks(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $this->get(route('webhooks.index'))->assertOk();
    }

    public function test_pro_user_can_create_webhook(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $response = $this->postJson(route('webhooks.store'), [
            'name' => 'Test Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['import.completed'],
        ]);

        $response->assertCreated();
        $response->assertJsonStructure(['webhook', 'secret']);

        $this->assertDatabaseHas('webhooks', [
            'user_id' => $user->id,
            'name' => 'Test Webhook',
            'url' => 'https://example.com/webhook',
        ]);
    }

    public function test_webhook_requires_valid_events(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $response = $this->postJson(route('webhooks.store'), [
            'name' => 'Test Webhook',
            'url' => 'https://example.com/webhook',
            'events' => ['invalid.event'],
        ]);

        $response->assertUnprocessable();
    }

    public function test_webhook_requires_url(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $response = $this->postJson(route('webhooks.store'), [
            'name' => 'Test Webhook',
            'events' => ['import.completed'],
        ]);

        $response->assertUnprocessable();
    }

    public function test_pro_user_can_delete_own_webhook(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $webhook = Webhook::factory()->create(['user_id' => $user->id]);

        $this->deleteJson(route('webhooks.destroy', $webhook))->assertOk();

        $this->assertDatabaseMissing('webhooks', ['id' => $webhook->id]);
    }

    public function test_user_cannot_delete_other_users_webhook(): void
    {
        $user = $this->createProUser();
        $otherUser = $this->createProUser();
        $this->actingAs($user);

        $webhook = Webhook::factory()->create(['user_id' => $otherUser->id]);

        $this->deleteJson(route('webhooks.destroy', $webhook))->assertForbidden();
    }

    public function test_webhook_records_failure(): void
    {
        $webhook = Webhook::factory()->create(['failure_count' => 9]);

        $webhook->recordFailure();

        $this->assertEquals(10, $webhook->fresh()->failure_count);
        $this->assertFalse($webhook->fresh()->is_active);
    }

    public function test_webhook_records_success_resets_failures(): void
    {
        $webhook = Webhook::factory()->create(['failure_count' => 5]);

        $webhook->recordSuccess();

        $this->assertEquals(0, $webhook->fresh()->failure_count);
    }

    public function test_pro_user_can_regenerate_webhook_secret(): void
    {
        $user = $this->createProUser();
        $this->actingAs($user);

        $webhook = Webhook::factory()->create([
            'user_id' => $user->id,
            'secret' => 'old_secret',
        ]);

        $response = $this->postJson(route('webhooks.regenerate-secret', $webhook));

        $response->assertOk();
        $response->assertJsonStructure(['secret']);
        $this->assertNotEquals('old_secret', $webhook->fresh()->secret);
    }
}
