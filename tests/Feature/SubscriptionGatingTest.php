<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionGatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_integrations(): void
    {
        $this->get(route('integrations.index'))->assertRedirect(route('login'));
    }

    public function test_guests_cannot_access_webhooks(): void
    {
        $this->get(route('webhooks.index'))->assertRedirect(route('login'));
    }

    public function test_guests_cannot_access_api_keys(): void
    {
        $this->get(route('api-keys.index'))->assertRedirect(route('login'));
    }

    public function test_free_users_cannot_access_integrations(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('integrations.index'))->assertRedirect(route('billing.index'));
    }

    public function test_free_users_cannot_access_webhooks(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('webhooks.index'))->assertRedirect(route('billing.index'));
    }

    public function test_free_users_cannot_access_api_keys(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('api-keys.index'))->assertRedirect(route('billing.index'));
    }

    public function test_free_users_can_access_billing(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('billing.index'))->assertOk();
    }

    public function test_free_users_can_access_pricing(): void
    {
        $this->get(route('pricing'))->assertOk();
    }

    public function test_ai_mapping_requires_authentication(): void
    {
        $this->postJson(route('wizard.ai-mapping'), [
            'import_ulid' => 'test',
        ])->assertUnauthorized();
    }

    public function test_user_is_pro_returns_false_without_subscription(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->isPro());
        $this->assertTrue($user->isFreePlan());
    }

    public function test_free_user_contact_limit_is_2000(): void
    {
        $user = User::factory()->create();

        $this->assertEquals(2000, $user->contact_limit);
    }

    public function test_free_user_ai_rows_limit_is_0(): void
    {
        $user = User::factory()->create();

        $this->assertEquals(0, $user->ai_rows_limit);
    }

    public function test_free_user_cannot_use_ai(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->canUseAi());
    }

    public function test_ensure_subscribed_middleware_blocks_free_users_json(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->getJson(route('integrations.index'))
            ->assertStatus(403);
    }
}
