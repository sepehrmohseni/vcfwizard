<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_billing(): void
    {
        $this->get(route('billing.index'))->assertRedirect(route('login'));
    }

    public function test_authenticated_user_can_view_billing(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('billing.index'))->assertOk();
    }

    public function test_billing_page_shows_subscribe_form_for_free_users(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('billing.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('billing/index')
            ->where('subscribed', false)
        );
    }

    public function test_billing_page_shows_subscription_for_pro_users(): void
    {
        $user = User::factory()->create([
            'stripe_id' => 'cus_test_billing',
        ]);

        $user->subscriptions()->create([
            'type' => 'pro',
            'stripe_id' => 'sub_test_billing',
            'stripe_status' => 'active',
            'stripe_price' => 'price_test',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('billing.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('billing/index')
            ->where('subscribed', true)
        );
    }

    public function test_already_subscribed_user_cannot_subscribe_again(): void
    {
        $user = User::factory()->create([
            'stripe_id' => 'cus_test_dup',
        ]);

        $user->subscriptions()->create([
            'type' => 'pro',
            'stripe_id' => 'sub_test_dup',
            'stripe_status' => 'active',
            'stripe_price' => 'price_test',
        ]);

        $this->actingAs($user);

        $response = $this->post(route('billing.subscribe'), [
            'payment_method' => 'pm_test',
        ]);

        $response->assertRedirect(route('billing.index'));
        $response->assertSessionHas('error');
    }

    public function test_cancel_without_subscription_redirects(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->post(route('billing.cancel'));

        $response->assertRedirect(route('billing.index'));
    }
}
