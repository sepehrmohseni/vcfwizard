import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { MappingTemplateRecord } from '@/types/vcfwizard';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Templates', href: '/templates' },
];

type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    templates: PaginatedData<MappingTemplateRecord>;
};

export default function Templates({ templates }: Props) {
    const [deleting, setDeleting] = useState<string | null>(null);

    function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this template?')) return;
        setDeleting(id);
        router.delete(`/templates/${id}`, {
            onFinish: () => setDeleting(null),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mapping Templates" />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Mapping Templates</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {templates.data.length === 0 ? (
                            <div className="py-12 text-center text-neutral-500">
                                <p className="text-lg font-medium">
                                    No templates yet
                                </p>
                                <p className="mt-1 text-sm">
                                    Save a mapping template during the
                                    conversion process to reuse it later.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {templates.data.map((template) => (
                                    <div
                                        key={template.id}
                                        className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-semibold text-neutral-900 dark:text-white">
                                                    {template.name}
                                                </h3>
                                                <p className="mt-1 text-xs text-neutral-500">
                                                    {
                                                        Object.keys(
                                                            template.mapping,
                                                        ).length
                                                    }{' '}
                                                    {Object.keys(template.mapping).length === 1 ? 'field' : 'fields'} mapped
                                                </p>
                                            </div>
                                            {template.is_public && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                                >
                                                    Public
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {Object.entries(template.mapping)
                                                .slice(0, 5)
                                                .map(([col, field]) => (
                                                    <span
                                                        key={col}
                                                        className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                                                    >
                                                        {col} → {field}
                                                    </span>
                                                ))}
                                            {Object.keys(template.mapping)
                                                .length > 5 && (
                                                <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800">
                                                    +
                                                    {Object.keys(
                                                        template.mapping,
                                                    ).length - 5}{' '}
                                                    more
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-xs text-neutral-400">
                                                Used {template.usage_count}{' '}
                                                {template.usage_count === 1 ? 'time' : 'times'}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                                onClick={() =>
                                                    handleDelete(template.id)
                                                }
                                                disabled={
                                                    deleting === template.id
                                                }
                                            >
                                                {deleting === template.id
                                                    ? 'Deleting...'
                                                    : 'Delete'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
