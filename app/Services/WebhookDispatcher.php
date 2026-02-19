<?php

namespace App\Services;

use App\Jobs\DispatchWebhookJob;
use App\Models\User;
use App\Models\Webhook;

class WebhookDispatcher
{
    public function dispatch(User $user, string $event, array $payload): void
    {
        $webhooks = Webhook::where('user_id', $user->id)
            ->where('is_active', true)
            ->get();

        foreach ($webhooks as $webhook) {
            if ($webhook->hasEvent($event)) {
                DispatchWebhookJob::dispatch($webhook, $event, $payload);
            }
        }
    }
}
