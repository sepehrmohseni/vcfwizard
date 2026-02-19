<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isPro = $user->isPro();

        return Inertia::render('billing/index', [
            'subscribed' => $isPro,
            'subscription' => $user->subscription('pro')?->only([
                'stripe_status',
                'ends_at',
                'trial_ends_at',
            ]),
            'onTrial' => $user->subscription('pro')?->onTrial() ?? false,
            'onGracePeriod' => $user->subscription('pro')?->onGracePeriod() ?? false,
            'aiUsage' => [
                'used' => $user->ai_rows_used,
                'limit' => $user->ai_rows_limit,
                'resetsAt' => $user->ai_usage_reset_at?->toISOString(),
            ],
            'intent' => Inertia::lazy(fn () => $isPro ? null : $user->createSetupIntent()),
        ]);
    }

    public function subscribe(Request $request): RedirectResponse
    {
        $request->validate([
            'payment_method' => ['required', 'string'],
        ]);

        $user = $request->user();

        if ($user->subscribed('pro')) {
            return redirect()->route('billing.index')
                ->with('error', 'You already have an active subscription.');
        }

        $user->newSubscription('pro', config('services.stripe.price_id'))
            ->create($request->input('payment_method'));

        $user->update([
            'ai_rows_used' => 0,
            'ai_usage_reset_at' => now()->addMonth(),
        ]);

        return redirect()->route('billing.index')
            ->with('success', 'Welcome to VCFWizard Pro!');
    }

    public function cancel(Request $request): RedirectResponse
    {
        $subscription = $request->user()->subscription('pro');

        if (! $subscription || $subscription->canceled()) {
            return redirect()->route('billing.index');
        }

        $subscription->cancel();

        return redirect()->route('billing.index')
            ->with('success', 'Subscription cancelled. You can use Pro features until the end of your billing period.');
    }

    public function resume(Request $request): RedirectResponse
    {
        $subscription = $request->user()->subscription('pro');

        if (! $subscription || ! $subscription->onGracePeriod()) {
            return redirect()->route('billing.index');
        }

        $subscription->resume();

        return redirect()->route('billing.index')
            ->with('success', 'Subscription resumed!');
    }

    public function invoices(Request $request): JsonResponse
    {
        $invoices = $request->user()->invoices()->map(fn ($invoice) => [
            'id' => $invoice->id,
            'date' => $invoice->date()->toISOString(),
            'total' => $invoice->total(),
            'status' => $invoice->status,
            'url' => $invoice->hostedInvoiceUrl,
            'pdf' => $invoice->invoicePdf,
        ]);

        return response()->json(['invoices' => $invoices]);
    }

    public function downloadInvoice(Request $request, string $invoiceId)
    {
        return $request->user()->downloadInvoice($invoiceId, [
            'vendor' => 'VCFWizard',
            'product' => 'VCFWizard Pro Subscription',
        ]);
    }
}
