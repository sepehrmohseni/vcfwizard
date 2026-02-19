import { motion } from 'framer-motion';
import {
    FileArchive,
    FileText,
    Loader2,
    Sparkles,
    Save,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type GeneratePanelProps = {
    totalRows: number;
    onGenerate: (
        format: 'single' | 'zip',
        saveTemplate: boolean,
        templateName: string,
    ) => void;
    isGenerating: boolean;
    isAuthenticated: boolean;
};

export function GeneratePanel({
    totalRows,
    onGenerate,
    isGenerating,
    isAuthenticated,
}: GeneratePanelProps) {
    const [format, setFormat] = useState<'single' | 'zip'>('single');
    const [saveTemplate, setSaveTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-semibold">Ready to Generate</h3>
                <p className="text-sm text-muted-foreground">
                    {totalRows} contacts will be converted to vCard format
                </p>
            </div>

            <div className="mx-auto grid max-w-lg gap-4 sm:grid-cols-2">
                <Card
                    className={cn(
                        'cursor-pointer transition-all',
                        format === 'single' &&
                            'border-primary ring-2 ring-primary/20',
                    )}
                    onClick={() => setFormat('single')}
                >
                    <CardContent className="flex flex-col items-center gap-3 p-6">
                        <FileText
                            className={cn(
                                'h-10 w-10',
                                format === 'single'
                                    ? 'text-primary'
                                    : 'text-muted-foreground',
                            )}
                        />
                        <div className="text-center">
                            <p className="text-sm font-medium">Single VCF</p>
                            <p className="text-xs text-muted-foreground">
                                All contacts in one file
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={cn(
                        'cursor-pointer transition-all',
                        format === 'zip' &&
                            'border-primary ring-2 ring-primary/20',
                    )}
                    onClick={() => setFormat('zip')}
                >
                    <CardContent className="flex flex-col items-center gap-3 p-6">
                        <FileArchive
                            className={cn(
                                'h-10 w-10',
                                format === 'zip'
                                    ? 'text-primary'
                                    : 'text-muted-foreground',
                            )}
                        />
                        <div className="text-center">
                            <p className="text-sm font-medium">ZIP Archive</p>
                            <p className="text-xs text-muted-foreground">
                                Individual files per contact
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {isAuthenticated && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mx-auto max-w-lg space-y-3"
                >
                    <div className="flex items-center gap-3">
                        <Switch
                            id="save-template"
                            checked={saveTemplate}
                            onCheckedChange={setSaveTemplate}
                        />
                        <Label
                            htmlFor="save-template"
                            className="flex items-center gap-2 text-sm"
                        >
                            <Save className="h-4 w-4" />
                            Save mapping as template
                        </Label>
                    </div>
                    {saveTemplate && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Input
                                placeholder="Template name..."
                                value={templateName}
                                onChange={(e) =>
                                    setTemplateName(e.target.value)
                                }
                            />
                        </motion.div>
                    )}
                </motion.div>
            )}

            <div className="flex justify-center">
                <Button
                    size="lg"
                    onClick={() =>
                        onGenerate(format, saveTemplate, templateName)
                    }
                    disabled={isGenerating || (saveTemplate && !templateName)}
                    className="gap-2 px-8"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4" />
                            Generate VCF
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
