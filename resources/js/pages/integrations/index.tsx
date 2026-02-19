import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    Check,
    Copy,
    ExternalLink,
    Key,
    Loader2,
    Plug,
    Sheet,
    Trash2,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { IntegrationRecord } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Integrations', href: '/integrations' },
];

type Props = {
    integrations: IntegrationRecord[];
};

export default function IntegrationsIndex({ integrations }: Props) {
    const [connecting, setConnecting] = useState(false);

    const handleConnect = () => {
        setConnecting(true);
        window.location.href = '/integrations/google-sheets/connect';
    };

    const handleDisconnect = (id: string) => {
        if (!confirm('Disconnect this integration?')) return;
        router.delete(`/integrations/${id}`, { preserveScroll: true });
    };

    const googleSheets = integrations.find((i) => i.type === 'google_sheets');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Integrations" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Connect external services to import contacts directly.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Card className="relative h-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                            <Sheet className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <CardTitle className="text-base">Google Sheets</CardTitle>
                                    </div>
                                    {googleSheets && (
                                        <Badge
                                            variant="secondary"
                                            className={
                                                googleSheets.is_active && !googleSheets.token_expired
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }
                                        >
                                            {googleSheets.token_expired ? 'Expired' : googleSheets.is_active ? 'Connected' : 'Inactive'}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Import contacts directly from your Google Sheets spreadsheets.
                                </p>

                                {googleSheets ? (
                                    <div className="space-y-3">
                                        {googleSheets.token_expired && (
                                            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-400">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                Token expired. Reconnect to continue using Google Sheets.
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            {googleSheets.token_expired ? (
                                                <Button
                                                    size="sm"
                                                    onClick={handleConnect}
                                                    disabled={connecting}
                                                >
                                                    {connecting ? (
                                                        <>
                                                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                            Reconnecting...
                                                        </>
                                                    ) : (
                                                        'Reconnect'
                                                    )}
                                                </Button>
                                            ) : (
                                                <Link href={`/integrations/${googleSheets.id}/sheets`}>
                                                    <Button size="sm" variant="outline" className="gap-1.5">
                                                        <ExternalLink className="h-3 w-3" />
                                                        Browse Sheets
                                                    </Button>
                                                </Link>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDisconnect(googleSheets.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-neutral-400">
                                            Connected {new Date(googleSheets.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleConnect}
                                        disabled={connecting}
                                        className="w-full"
                                    >
                                        {connecting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <Plug className="mr-2 h-4 w-4" />
                                                Connect Google Sheets
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        <Card className="h-full">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                            <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <CardTitle className="text-base">Zapier</CardTitle>
                                    </div>
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    >
                                        Available
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    Automate VCF generation with 7,000+ apps via Zapier using your API key.
                                </p>
                                <div className="space-y-3">
                                    <div className="rounded-lg border bg-muted/50 p-3">
                                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Setup steps:</p>
                                        <ol className="mt-2 space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                                            <li className="flex items-start gap-2">
                                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">1</span>
                                                <span>Create an API key in <Link href="/api-keys" className="text-blue-600 underline dark:text-blue-400">API Keys</Link></span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">2</span>
                                                <span>In Zapier, use &quot;Webhooks by Zapier&quot; as the trigger/action</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[10px] font-bold text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">3</span>
                                                <span>Add your API key as a Bearer token header</span>
                                            </li>
                                        </ol>
                                    </div>
                                    <ZapierEndpoints />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </AppLayout>
    );
}

function ZapierEndpoints() {
    const [copied, setCopied] = useState<string | null>(null);

    const endpoints = [
        { method: 'GET', path: '/api/me', desc: 'Test auth' },
        { method: 'POST', path: '/api/actions/convert', desc: 'Convert contacts to VCF' },
        { method: 'GET', path: '/api/triggers/import-completed', desc: 'Poll completed imports' },
        { method: 'GET', path: '/api/imports', desc: 'List imports' },
        { method: 'POST', path: '/api/hooks', desc: 'Subscribe to events' },
    ];

    const handleCopy = (path: string) => {
        navigator.clipboard.writeText(window.location.origin + path);
        setCopied(path);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="space-y-1.5">
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">API Endpoints:</p>
            {endpoints.map((ep) => (
                <button
                    key={ep.path}
                    onClick={() => handleCopy(ep.path)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition-colors hover:bg-muted"
                >
                    <span className={`w-10 shrink-0 font-mono font-bold ${ep.method === 'POST' ? 'text-blue-600' : 'text-green-600'}`}>
                        {ep.method}
                    </span>
                    <span className="flex-1 truncate font-mono text-neutral-600 dark:text-neutral-400">{ep.path}</span>
                    {copied === ep.path ? (
                        <Check className="h-3 w-3 shrink-0 text-green-500" />
                    ) : (
                        <Copy className="h-3 w-3 shrink-0 text-neutral-400" />
                    )}
                </button>
            ))}
        </div>
    );
}
