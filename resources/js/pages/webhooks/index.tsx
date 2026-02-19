import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertCircle,
    ChevronDown,
    ChevronRight,
    Copy,
    Loader2,
    Plus,
    RefreshCw,
    Trash2,
    Webhook,
} from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { getCsrfHeaders } from '@/lib/csrf';
import type { BreadcrumbItem } from '@/types';
import type { WebhookRecord, WebhookDeliveryRecord } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Webhooks', href: '/webhooks' },
];

const EVENTS = [
    { value: 'import.completed', label: 'Import Completed' },
    { value: 'import.failed', label: 'Import Failed' },
    { value: 'export.ready', label: 'Export Ready' },
];

type Props = {
    webhooks: WebhookRecord[];
};

export default function WebhooksIndex({ webhooks }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [events, setEvents] = useState<string[]>([]);
    const [creating, setCreating] = useState(false);
    const [newSecret, setNewSecret] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [deliveries, setDeliveries] = useState<Record<string, WebhookDeliveryRecord[]>>({});
    const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const toggleEvent = (event: string) => {
        setEvents((prev) =>
            prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
        );
    };

    const handleCreate = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            setFormError(null);
            const res = await fetch('/webhooks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({ name, url, events }),
            });

            if (res.ok) {
                const data = await res.json();
                setNewSecret(data.secret);
                setName('');
                setUrl('');
                setEvents([]);
                setShowForm(false);
                router.reload({ only: ['webhooks'] });
            } else {
                const data = await res.json().catch(() => null);
                setFormError(data?.message || 'Failed to create webhook. Please check your input.');
            }
        } catch {
            setFormError('Network error. Please try again.');
        } finally {
            setCreating(false);
        }
    }, [name, url, events]);

    const handleDelete = (id: string) => {
        if (!confirm('Delete this webhook?')) return;
        router.delete(`/webhooks/${id}`, { preserveScroll: true });
    };

    const handleRegenerateSecret = async (id: string) => {
        const res = await fetch(`/webhooks/${id}/regenerate-secret`, {
            method: 'POST',
            headers: { ...getCsrfHeaders() },
        });
        if (res.ok) {
            const data = await res.json();
            setNewSecret(data.secret);
        }
    };

    const loadDeliveries = async (id: string) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        setLoadingDeliveries(id);
        try {
            const res = await fetch(`/webhooks/${id}/deliveries`, {
                headers: { Accept: 'application/json', ...getCsrfHeaders() },
            });
            if (res.ok) {
                const data = await res.json();
                setDeliveries((prev) => ({ ...prev, [id]: data.deliveries }));
            }
        } finally {
            setLoadingDeliveries(null);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Webhooks" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Get notified when events happen in your account.
                        </p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Webhook
                    </Button>
                </div>

                {newSecret && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    Webhook Secret
                                </p>
                                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                    Copy this secret now. It won't be shown again.
                                </p>
                                <code className="mt-2 block break-all rounded bg-blue-100 px-2 py-1 font-mono text-xs text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                                    {newSecret}
                                </code>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(newSecret)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 text-xs"
                            onClick={() => setNewSecret(null)}
                        >
                            Dismiss
                        </Button>
                    </motion.div>
                )}

                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">New Webhook</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="webhook-name">Name</Label>
                                                <Input
                                                    id="webhook-name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="My webhook"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="webhook-url">URL</Label>
                                                <Input
                                                    id="webhook-url"
                                                    type="url"
                                                    value={url}
                                                    onChange={(e) => setUrl(e.target.value)}
                                                    placeholder="https://example.com/webhook"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Events</Label>
                                            <div className="flex flex-wrap gap-4">
                                                {EVENTS.map((ev) => (
                                                    <label key={ev.value} className="flex items-center gap-2 text-sm">
                                                        <Checkbox
                                                            checked={events.includes(ev.value)}
                                                            onCheckedChange={() => toggleEvent(ev.value)}
                                                        />
                                                        {ev.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="submit" disabled={creating || events.length === 0}>
                                                {creating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create Webhook'
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setShowForm(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                        {formError && (
                                            <p className="text-sm text-destructive">{formError}</p>
                                        )}
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {webhooks.length === 0 && !showForm ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Webhook className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
                            <h3 className="mt-4 text-lg font-medium">No webhooks</h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                Create a webhook to get notified of import and export events.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {webhooks.map((wh) => (
                            <motion.div
                                key={wh.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => loadDeliveries(wh.id)}
                                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                                                >
                                                    {expandedId === wh.id ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </button>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium">{wh.name}</p>
                                                        <Badge
                                                            variant="secondary"
                                                            className={
                                                                wh.is_active
                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }
                                                        >
                                                            {wh.is_active ? 'Active' : 'Disabled'}
                                                        </Badge>
                                                        {wh.failure_count > 0 && (
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                <AlertCircle className="mr-1 h-3 w-3" />
                                                                {wh.failure_count} failures
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="mt-0.5 text-xs text-neutral-400 break-all">
                                                        {wh.url}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                        {wh.events.map((ev) => (
                                                            <Badge key={ev} variant="outline" className="text-[10px]">
                                                                {ev}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    title="Regenerate secret"
                                                    onClick={() => handleRegenerateSecret(wh.id)}
                                                >
                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(wh.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {expandedId === wh.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-4 border-t pt-4 dark:border-neutral-800"
                                                >
                                                    {loadingDeliveries === wh.id ? (
                                                        <div className="flex justify-center py-4">
                                                            <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                                                        </div>
                                                    ) : (deliveries[wh.id] ?? []).length === 0 ? (
                                                        <p className="py-4 text-center text-sm text-neutral-400">
                                                            No deliveries yet.
                                                        </p>
                                                    ) : (
                                                        <ul className="space-y-2">
                                                            {(deliveries[wh.id] ?? []).slice(0, 10).map((d) => (
                                                                <li
                                                                    key={d.id}
                                                                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs dark:bg-neutral-900"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={
                                                                                d.status === 'delivered'
                                                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                            }
                                                                        >
                                                                            {d.response_code ?? '—'}
                                                                        </Badge>
                                                                        <span className="font-medium">{d.event}</span>
                                                                    </div>
                                                                    <span className="text-neutral-400">
                                                                        {d.delivered_at
                                                                            ? new Date(d.delivered_at).toLocaleString()
                                                                            : new Date(d.created_at).toLocaleString()}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
