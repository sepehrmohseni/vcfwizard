import { motion } from 'framer-motion';
import { AlertTriangle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type PreviewTableProps = {
    headers: string[];
    rows: Record<string, string>[];
    mapping: Record<string, string>;
    duplicatesFound: number;
    totalRows: number;
};

export function PreviewTable({
    headers,
    rows,
    mapping,
    duplicatesFound,
    totalRows,
}: PreviewTableProps) {
    const mappedHeaders = headers.filter(
        (h) => mapping[h] && mapping[h] !== 'skip',
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Preview & Review</h3>
                    <p className="text-sm text-muted-foreground">
                        Review your mapped contacts before generating
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="gap-1.5">
                        <Users className="h-3 w-3" />
                        {totalRows} contacts
                    </Badge>
                    {duplicatesFound > 0 && (
                        <Badge
                            variant="outline"
                            className="gap-1.5 border-yellow-500/30 text-yellow-600"
                        >
                            <AlertTriangle className="h-3 w-3" />
                            {duplicatesFound} duplicates
                        </Badge>
                    )}
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="h-[400px] overflow-y-auto rounded-xl border">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b bg-muted/50">
                                <th className="h-10 w-12 px-4 text-center text-sm font-medium text-muted-foreground">
                                    #
                                </th>
                                {mappedHeaders.map((header) => (
                                    <th key={header} className="h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-semibold">
                                                {header}
                                            </span>
                                            <span className="text-[10px] font-normal text-muted-foreground">
                                                → {mapping[header]}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {rows.slice(0, 50).map((row, index) => (
                                <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 text-center text-xs text-muted-foreground">
                                        {index + 1}
                                    </td>
                                    {mappedHeaders.map((header) => (
                                        <td
                                            key={header}
                                            className="max-w-[200px] truncate p-4 text-xs"
                                        >
                                            {row[header] || '—'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {totalRows > 50 && (
                <p className="text-center text-xs text-muted-foreground">
                    Showing 50 of {totalRows} contacts
                </p>
            )}
        </div>
    );
}
