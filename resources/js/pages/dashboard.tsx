import { Head, Link } from '@inertiajs/react';
import { PlusCircle, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { ImportRecord, DashboardStats } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

type Props = {
    recentImports: ImportRecord[];
    stats: DashboardStats;
    subscribed: boolean;
};

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function statusColor(status: string): string {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        case 'processing':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        case 'failed':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        default:
            return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-400';
    }
}

export default function Dashboard({ recentImports, stats, subscribed }: Props) {
    const aiUsagePercent = stats.ai_rows_limit > 0
        ? Math.min((stats.ai_rows_used / stats.ai_rows_limit) * 100, 100)
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                    <Link href="/import">
                        <Button className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            New Import
                        </Button>
                    </Link>
                </div>

                {!subscribed && (
                    <Card className="border-blue-500/20 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <Sparkles className="h-5 w-5 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium">Upgrade to Pro</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Unlock AI mapping, unlimited contacts, integrations & more — $10/6mo
                                    </p>
                                </div>
                            </div>
                            <Link href="/billing">
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                    Upgrade
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                Total Imports
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {stats.total_imports}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                Total Contacts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {(stats.total_contacts ?? 0).toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                AI Rows Used
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {subscribed ? (
                                <div className="space-y-2">
                                    <p className="text-3xl font-bold">
                                        {stats.ai_rows_used.toLocaleString()}
                                    </p>
                                    <Progress value={aiUsagePercent} className="h-1.5" />
                                    <p className="text-xs text-neutral-400">
                                        of {stats.ai_rows_limit.toLocaleString()}
                                    </p>
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-400">Pro only</p>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-500">
                                Total Exports
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {stats.total_exports}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Imports</CardTitle>
                            <Link
                                href="/history"
                                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                            >
                                View all
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recentImports.length === 0 ? (
                            <div className="py-12 text-center text-neutral-500">
                                <p className="text-lg font-medium">
                                    No imports yet
                                </p>
                                <p className="mt-1 text-sm">
                                    Go to the{' '}
                                    <Link
                                        href="/import"
                                        className="text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        import page
                                    </Link>{' '}
                                    to convert your first file.
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>File</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Rows</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">
                                            Download
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentImports.map((imp) => (
                                        <TableRow key={imp.id}>
                                            <TableCell className="max-w-[200px] truncate font-medium">
                                                {imp.original_filename}
                                            </TableCell>
                                            <TableCell className="uppercase">
                                                {imp.file_type}
                                            </TableCell>
                                            <TableCell>
                                                {imp.row_count.toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {formatBytes(imp.file_size)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={statusColor(
                                                        imp.status,
                                                    )}
                                                >
                                                    {imp.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(
                                                    imp.created_at,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {imp.export ? (
                                                    <a
                                                        href={`/wizard/download/${imp.export.id}`}
                                                        className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                    >
                                                        Download
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-neutral-400">
                                                        —
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
