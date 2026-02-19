import { motion } from 'framer-motion';
import { Wand2, Loader2, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { AiSuggestion } from '@/types';
import { VCARD_FIELD_OPTIONS } from '@/types';

type MappingPanelProps = {
    headers: string[];
    suggestions: AiSuggestion[];
    mapping: Record<string, string>;
    onMappingChange: (mapping: Record<string, string>) => void;
    onAutoMap: () => void;
    isLoadingAi: boolean;
    onApply: () => void;
    isApplying: boolean;
    previewRows: Record<string, string>[];
};

export function MappingPanel({
    headers,
    suggestions,
    mapping,
    onMappingChange,
    onAutoMap,
    isLoadingAi,
    onApply,
    isApplying,
    previewRows,
}: MappingPanelProps) {
    const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

    const getSuggestion = (header: string): AiSuggestion | undefined => {
        return suggestions.find((s) => s.column_name === header);
    };

    const getConfidenceColor = (confidence: number): string => {
        if (confidence >= 90)
            return 'bg-green-500/10 text-green-600 border-green-500/20';
        if (confidence >= 70)
            return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
    };

    const handleFieldChange = (header: string, value: string) => {
        onMappingChange({ ...mapping, [header]: value });
    };

    const getSampleValues = (header: string): string[] => {
        return previewRows
            .map((row) => row[header])
            .filter(Boolean)
            .slice(0, 3);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Column Mapping</h3>
                    <p className="text-sm text-muted-foreground">
                        Map your file columns to vCard fields
                    </p>
                </div>
                <Button
                    onClick={onAutoMap}
                    disabled={isLoadingAi}
                    className="gap-2"
                >
                    {isLoadingAi ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Wand2 className="h-4 w-4" />
                            AI Auto-Map
                        </>
                    )}
                </Button>
            </div>

            <div className="grid gap-3">
                {headers.map((header, index) => {
                    const suggestion = getSuggestion(header);
                    const currentValue = mapping[header] || '';
                    const samples = getSampleValues(header);
                    const isExpanded = expandedColumn === header;

                    return (
                        <motion.div
                            key={header}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card
                                className={cn(
                                    'transition-all duration-200',
                                    currentValue &&
                                        currentValue !== 'skip' &&
                                        'border-primary/30 bg-primary/[0.02]',
                                )}
                            >
                                <CardHeader
                                    className="cursor-pointer p-4 pb-2"
                                    onClick={() =>
                                        setExpandedColumn(
                                            isExpanded ? null : header,
                                        )
                                    }
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <CardTitle className="text-sm font-medium">
                                                {header}
                                            </CardTitle>
                                            {suggestion && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-xs',
                                                        getConfidenceColor(
                                                            suggestion.confidence,
                                                        ),
                                                    )}
                                                >
                                                    {suggestion.confidence}%
                                                    match
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={currentValue}
                                                onChange={(e) =>
                                                    handleFieldChange(
                                                        header,
                                                        e.target.value,
                                                    )
                                                }
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="h-8 rounded-md border border-input bg-background px-3 text-xs ring-offset-background focus:ring-2 focus:ring-ring focus:outline-none"
                                            >
                                                <option value="">
                                                    Select field...
                                                </option>
                                                {VCARD_FIELD_OPTIONS.map(
                                                    (opt) => (
                                                        <option
                                                            key={opt.value}
                                                            value={opt.value}
                                                        >
                                                            {opt.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            <ChevronDown
                                                className={cn(
                                                    'h-4 w-4 text-muted-foreground transition-transform',
                                                    isExpanded && 'rotate-180',
                                                )}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                {isExpanded && (
                                    <CardContent className="px-4 pt-0 pb-4">
                                        <div className="space-y-2">
                                            {samples.length > 0 && (
                                                <div>
                                                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                                                        Sample values:
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {samples.map(
                                                            (sample, i) => (
                                                                <span
                                                                    key={i}
                                                                    className="rounded bg-muted px-2 py-0.5 text-xs"
                                                                >
                                                                    {sample}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {suggestion?.reasoning && (
                                                <p className="text-xs text-muted-foreground italic">
                                                    AI: {suggestion.reasoning}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex justify-end pt-2">
                <Button
                    onClick={onApply}
                    disabled={
                        isApplying ||
                        Object.keys(mapping).filter(
                            (k) => mapping[k] && mapping[k] !== 'skip',
                        ).length === 0
                    }
                    className="gap-2"
                >
                    {isApplying ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Applying...
                        </>
                    ) : (
                        'Apply Mapping'
                    )}
                </Button>
            </div>
        </div>
    );
}
