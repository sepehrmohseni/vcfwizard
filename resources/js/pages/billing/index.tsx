import { Head, Link, router, usePage } from '@inertiajs/react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { motion } from 'framer-motion';
import { Check, CreditCard, Download, Loader2, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { getCsrfHeaders } from '@/lib/csrf';
import type { BreadcrumbItem } from '@/types';
import type { SubscriptionInfo, AiUsage } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Billing', href: '/billing' },
];

type InvoiceItem = {
    id: string;
    date: string;
    total: string;
    status: string;
    url: string | null;
    pdf: string | null;
};

type Props = {
    subscribed: boolean;
    subscription: SubscriptionInfo;
    onTrial: boolean;
    onGracePeriod: boolean;
    aiUsage: AiUsage;
    intent: { client_secret: string } | null;
};

const stripeCache: Record<string, Promise<Stripe | null>> = {};

function getStripe(key: string): Promise<Stripe | null> {
    if (!stripeCache[key]) {
        stripeCache[key] = loadStripe(key);
    }
    return stripeCache[key];
}

function SubscribeForm({ clientSecret }: { clientSecret: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);
        setError(null);

        const { setupIntent, error: stripeError } = await stripe.confirmSetup({
            elements,
            redirect: 'if_required',
            confirmParams: {
                return_url: window.location.href,
            },
        });

        if (stripeError) {
            setError(stripeError.message ?? 'Payment setup failed.');
            setLoading(false);
            return;
        }

        if (setupIntent?.payment_method) {
            router.post('/billing/subscribe', {
                payment_method: setupIntent.payment_method as string,
            }, {
                preserveScroll: true,
            });
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <Button
                type="submit"
                disabled={!stripe || loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscribe — $10 / 6 months
                    </>
                )}
            </Button>
        </form>
    );
}

export default function BillingIndex({
    subscribed,
    subscription,
    onTrial,
    onGracePeriod,
    aiUsage,
    intent,
}: Props) {
    const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const { props } = usePage();
    const flash = props as Record<string, unknown>;
    const successMessage = flash.success as string | undefined;
    const errorMessage = flash.error as string | undefined;
    const stripeKey = (flash.stripeKey as string) || '';
    const stripePromise = useMemo(() => getStripe(stripeKey), [stripeKey]);

    const usagePercent = aiUsage.limit > 0 ? Math.min((aiUsage.used / aiUsage.limit) * 100, 100) : 0;

    const loadInvoices = useCallback(async () => {
        setLoadingInvoices(true);
        try {
            const res = await fetch('/billing/invoices', {
                headers: { Accept: 'application/json', ...getCsrfHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.invoices);
            }
        } finally {
            setLoadingInvoices(false);
        }
    }, []);

    useEffect(() => {
        if (subscribed) {
            loadInvoices();
        }
    }, [subscribed, loadInvoices]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Billing" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
                    <Link href="/pricing">
                        <Button variant="outline" size="sm">
                            View Plans
                        </Button>
                    </Link>
                </div>

                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/50 dark:text-green-400"
                    >
                        {successMessage}
                    </motion.div>
                )}

                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                    >
                        {errorMessage}
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">Subscription</CardTitle>
                                {subscribed && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        Pro
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscribed ? (
                                <>
                                    <div className="space-y-1">
                                        <p className="text-sm text-neutral-500">Status</p>
                                        <p className="font-medium capitalize">
                                            {onTrial ? 'Trial' : onGracePeriod ? 'Cancelling' : subscription?.stripe_status ?? 'Active'}
                                        </p>
                                    </div>
                                    {onGracePeriod && subscription?.ends_at && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-neutral-500">Access until</p>
                                            <p className="font-medium">
                                                {new Date(subscription.ends_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        {onGracePeriod ? (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => router.post('/billing/resume', {}, { preserveScroll: true })}
                                            >
                                                Resume Subscription
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.post('/billing/cancel', {}, { preserveScroll: true })}
                                            >
                                                Cancel Subscription
                                            </Button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        Get unlimited contacts, AI mapping, integrations, and more.
                                    </p>
                                    {intent?.client_secret ? (
                                        <Elements
                                            stripe={stripePromise}
                                            options={{
                                                clientSecret: intent.client_secret,
                                                appearance: {
                                                    theme: 'stripe',
                                                    variables: {
                                                        borderRadius: '8px',
                                                    },
                                                },
                                            }}
                                        >
                                            <SubscribeForm clientSecret={intent.client_secret} />
                                        </Elements>
                                    ) : (
                                        <Button
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                            onClick={() => router.reload({ only: ['intent'] })}
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Load Payment Form
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {subscribed && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">AI Usage</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-500">Rows processed</span>
                                        <span className="font-medium">
                                            {aiUsage.used.toLocaleString()} / {aiUsage.limit.toLocaleString()}
                                        </span>
                                    </div>
                                    <Progress value={usagePercent} className="h-2" />
                                </div>
                                {aiUsage.resetsAt && (
                                    <p className="text-xs text-neutral-400">
                                        Resets {new Date(aiUsage.resetsAt).toLocaleDateString()}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {subscribed && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Invoices</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loadingInvoices ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                                </div>
                            ) : invoices.length === 0 ? (
                                <p className="py-8 text-center text-sm text-neutral-500">
                                    No invoices yet.
                                </p>
                            ) : (
                                <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {invoices.map((inv) => (
                                        <li key={inv.id} className="flex items-center justify-between py-3">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {new Date(inv.date).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-neutral-500 capitalize">{inv.status}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium">{inv.total}</span>
                                                {inv.pdf && (
                                                    <a
                                                        href={inv.pdf}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                )}

                {!subscribed && (
                    <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/10">
                        <CardContent className="flex items-start gap-4 p-6">
                            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                            <div>
                                <h3 className="font-semibold">What you get with Pro</h3>
                                <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-neutral-600 sm:grid-cols-2 dark:text-neutral-400">
                                    {[
                                        'Unlimited contacts per file',
                                        'AI-powered column mapping',
                                        'Google Sheets integration',
                                        'Webhooks & API access',
                                        'TXT, JSON & PDF formats',
                                        'Priority processing queue',
                                    ].map((item) => (
                                        <li key={item} className="flex items-center gap-2">
                                            <Check className="h-3.5 w-3.5 text-blue-600" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
