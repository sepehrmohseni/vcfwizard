import { motion } from 'framer-motion';
import { AlertTriangle, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
                <ScrollArea className="h-[400px] rounded-xl border">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-12 text-center">
                                    #
                                </TableHead>
                                {mappedHeaders.map((header) => (
                                    <TableHead key={header}>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs font-semibold">
                                                {header}
                                            </span>
                                            <span className="text-[10px] font-normal text-muted-foreground">
                                                → {mapping[header]}
                                            </span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.slice(0, 50).map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center text-xs text-muted-foreground">
                                        {index + 1}
                                    </TableCell>
                                    {mappedHeaders.map((header) => (
                                        <TableCell
                                            key={header}
                                            className="max-w-[200px] truncate text-xs"
                                        >
                                            {row[header] || '—'}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </motion.div>

            {totalRows > 50 && (
                <p className="text-center text-xs text-muted-foreground">
                    Showing 50 of {totalRows} contacts
                </p>
            )}
        </div>
    );
}
