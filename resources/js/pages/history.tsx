import { Head, Link } from '@inertiajs/react';
import { Eye, Loader2, PlusCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { ImportRecord } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'History', href: '/history' },
];

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
};

type PreviewData = {
    headers: string[];
    rows: Record<string, string>[];
    total_rows: number;
    mapping: Record<string, string> | null;
};

type Props = {
    imports: PaginatedData<ImportRecord>;
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

export default function History({ imports }: Props) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [previewImport, setPreviewImport] = useState<ImportRecord | null>(
        null,
    );
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const handlePreview = useCallback(async (imp: ImportRecord) => {
        setPreviewImport(imp);
        setPreviewOpen(true);
        setPreviewLoading(true);
        setPreviewError(null);
        setPreviewData(null);

        try {
            const res = await fetch(`/history/${imp.id}/preview`, {
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(
                    data?.error || 'Failed to load preview.',
                );
            }
            const data: PreviewData = await res.json();
            setPreviewData(data);
        } catch (e) {
            setPreviewError(
                e instanceof Error ? e.message : 'Failed to load preview.',
            );
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import History" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold tracking-tight">
                        Import History
                    </h1>
                    <Link href="/import">
                        <Button className="gap-2">
                            <PlusCircle className="h-4 w-4" />
                            New Import
                        </Button>
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Import History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {imports.data.length === 0 ? (
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
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>File</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Rows</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Duplicates</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">
                                                Actions
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {imports.data.map((imp) => (
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
                                                    {imp.duplicates_found > 0
                                                        ? imp.duplicates_found
                                                        : '—'}
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
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 gap-1.5"
                                                            onClick={() =>
                                                                handlePreview(
                                                                    imp,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            View
                                                        </Button>
                                                        {imp.export ? (
                                                            <a
                                                                href={`/wizard/download/${imp.export.id}`}
                                                            >
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-8"
                                                                >
                                                                    Download
                                                                </Button>
                                                            </a>
                                                        ) : null}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {imports.last_page > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-sm text-neutral-500">
                                            Page {imports.current_page} of{' '}
                                            {imports.last_page} ({imports.total}{' '}
                                            total)
                                        </p>
                                        <div className="flex gap-2">
                                            {imports.prev_page_url && (
                                                <Link
                                                    href={imports.prev_page_url}
                                                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                                >
                                                    Previous
                                                </Link>
                                            )}
                                            {imports.next_page_url && (
                                                <Link
                                                    href={imports.next_page_url}
                                                    className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                                                >
                                                    Next
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-h-[85vh] max-w-5xl overflow-hidden">
                    <DialogHeader>
                        <DialogTitle>
                            {previewImport?.original_filename}
                        </DialogTitle>
                        <DialogDescription>
                            {previewData
                                ? `Showing ${previewData.rows.length} of ${previewData.total_rows} rows`
                                : 'Loading preview...'}
                        </DialogDescription>
                    </DialogHeader>

                    {previewLoading && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    )}

                    {previewError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                            {previewError}
                        </div>
                    )}

                    {previewData && (
                        <div className="overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10 text-center">
                                            #
                                        </TableHead>
                                        {previewData.headers.map((h) => (
                                            <TableHead key={h}>
                                                <div>
                                                    <span>{h}</span>
                                                    {previewData.mapping?.[
                                                        h
                                                    ] && (
                                                        <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                                            →{' '}
                                                            {
                                                                previewData
                                                                    .mapping[h]
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.rows.map((row, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-center text-xs text-muted-foreground">
                                                {i + 1}
                                            </TableCell>
                                            {previewData.headers.map((h) => (
                                                <TableCell
                                                    key={h}
                                                    className="max-w-[200px] truncate"
                                                >
                                                    {row[h] || (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}