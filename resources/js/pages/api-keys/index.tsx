import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Copy,
    Key,
    Loader2,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState, useCallback, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { getCsrfHeaders } from '@/lib/csrf';
import type { BreadcrumbItem } from '@/types';
import type { ApiKeyRecord } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'API Keys', href: '/api-keys' },
];

type Props = {
    apiKeys: ApiKeyRecord[];
};

export default function ApiKeysIndex({ apiKeys }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [creating, setCreating] = useState(false);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const handleCreate = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            setFormError(null);
            const res = await fetch('/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({ name }),
            });

            if (res.ok) {
                const data = await res.json();
                setNewKey(data.plain_key);
                setName('');
                setShowForm(false);
                router.reload({ only: ['apiKeys'] });
            } else {
                const data = await res.json().catch(() => null);
                setFormError(data?.message || 'Failed to create API key. Please check your input.');
            }
        } catch {
            setFormError('Network error. Please try again.');
        } finally {
            setCreating(false);
        }
    }, [name]);

    const handleDelete = (id: string) => {
        if (!confirm('Revoke this API key? This action cannot be undone.')) return;
        router.delete(`/api-keys/${id}`, { preserveScroll: true });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Keys" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">API Keys</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Manage API keys for programmatic access to VCFWizard.
                        </p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Key
                    </Button>
                </div>

                {newKey && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                                    API Key Created
                                </p>
                                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                    Copy this key now. It won't be shown again.
                                </p>
                                <code className="mt-2 block break-all rounded bg-green-100 px-2 py-1 font-mono text-xs text-green-900 dark:bg-green-900 dark:text-green-100">
                                    {newKey}
                                </code>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(newKey)}
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="mt-2 text-xs"
                            onClick={() => setNewKey(null)}
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
                                    <CardTitle className="text-lg">New API Key</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleCreate} className="space-y-3">
                                        <div className="flex items-end gap-3">
                                            <div className="flex-1 space-y-2">
                                                <Label htmlFor="key-name">Name</Label>
                                                <Input
                                                    id="key-name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="e.g. Production, CI/CD"
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" disabled={creating}>
                                                {creating ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </>
                                                ) : (
                                                    'Create'
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

                {apiKeys.length === 0 && !showForm ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Key className="h-12 w-12 text-neutral-300 dark:text-neutral-700" />
                            <h3 className="mt-4 text-lg font-medium">No API keys</h3>
                            <p className="mt-1 text-sm text-neutral-500">
                                Create an API key to access VCFWizard programmatically.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {apiKeys.map((key) => (
                            <motion.div
                                key={key.id}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card>
                                    <CardContent className="flex items-center justify-between p-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Key className="h-4 w-4 text-neutral-400" />
                                                <p className="text-sm font-medium">{key.name}</p>
                                                {key.expires_at && new Date(key.expires_at) < new Date() && (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        Expired
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-neutral-400">
                                                <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono dark:bg-neutral-800">
                                                    {key.key_prefix}...
                                                </code>
                                                <span>{key.usage_count.toLocaleString()} requests</span>
                                                {key.last_used_at && (
                                                    <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                                                )}
                                                {key.expires_at && (
                                                    <span>Expires {new Date(key.expires_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(key.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                <Card className="border-neutral-200/50 bg-neutral-50/50 dark:border-neutral-800/50 dark:bg-neutral-900/30">
                    <CardContent className="p-4">
                        <h3 className="text-sm font-medium">Usage</h3>
                        <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            Include your API key in the <code className="rounded bg-neutral-200/50 px-1 dark:bg-neutral-800">Authorization</code> header
                            as a Bearer token: <code className="rounded bg-neutral-200/50 px-1 dark:bg-neutral-800">Bearer vcfw_...</code>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
