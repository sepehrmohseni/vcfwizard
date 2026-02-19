<?php

namespace App\Jobs;

use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DispatchWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 5;

    public int $timeout = 30;

    public array $backoff = [10, 30, 60, 300, 900];

    public function __construct(
        public Webhook $webhook,
        public string $event,
        public array $payload,
    ) {}

    public function handle(): void
    {
        $timestamp = now()->timestamp;
        $body = json_encode($this->payload);
        $signature = hash_hmac('sha256', "{$timestamp}.{$body}", $this->webhook->secret);

        $delivery = WebhookDelivery::create([
            'webhook_id' => $this->webhook->id,
            'event' => $this->event,
            'payload' => $this->payload,
            'attempt' => $this->attempts(),
            'status' => 'pending',
        ]);

        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'X-Webhook-Signature' => $signature,
                    'X-Webhook-Timestamp' => (string) $timestamp,
                    'X-Webhook-Event' => $this->event,
                    'Content-Type' => 'application/json',
                ])
                ->withBody($body, 'application/json')
                ->post($this->webhook->url);

            $delivery->update([
                'response_code' => $response->status(),
                'response_body' => substr($response->body(), 0, 1000),
                'status' => $response->successful() ? 'delivered' : 'failed',
                'delivered_at' => $response->successful() ? now() : null,
            ]);

            if ($response->successful()) {
                $this->webhook->recordSuccess();
            } else {
                $this->webhook->recordFailure();
                $this->release($this->backoff[$this->attempts() - 1] ?? 900);
            }
        } catch (\Throwable $e) {
            Log::warning('Webhook delivery failed', [
                'webhook_id' => $this->webhook->id,
                'event' => $this->event,
                'error' => $e->getMessage(),
            ]);

            $delivery->update([
                'status' => 'failed',
                'response_body' => $e->getMessage(),
            ]);

            $this->webhook->recordFailure();

            throw $e;
        }
    }
}
