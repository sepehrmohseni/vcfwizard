import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadPanel } from '@/components/wizard/download-panel';
import { FileDropZone } from '@/components/wizard/file-drop-zone';
import { GeneratePanel } from '@/components/wizard/generate-panel';
import { MappingPanel } from '@/components/wizard/mapping-panel';
import { PreviewTable } from '@/components/wizard/preview-table';
import { WizardStepper } from '@/components/wizard/wizard-stepper';
import { useWizard } from '@/hooks/use-wizard';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { dashboard } from '@/routes';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'New Import', href: '/import' },
];

export default function Import() {
    const containerRef = useRef<HTMLDivElement>(null);

    const scrollToTop = useCallback(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const {
        step,
        setStep,
        headers,
        previewRows,
        totalRows,
        mapping,
        suggestions,
        duplicatesFound,
        exportId,
        exportFilename,
        exportContactCount,
        isLoadingAi,
        isApplying,
        isGenerating,
        error,
        setMapping,
        handleUploadComplete,
        handleAutoMap,
        handleApplyMapping,
        handleGenerate,
        handleReset,
        scrollUp,
    } = useWizard(scrollToTop);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Import" />
            <div
                ref={containerRef}
                className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6"
            >
                <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">
                            Convert Contacts to VCF
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Upload a CSV or Excel file, map your columns, and
                            download a vCard file.
                        </p>
                    </div>

                    <WizardStepper currentStep={step} />

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400"
                        >
                            {error}
                        </motion.div>
                    )}

                    <div className="mt-10">
                        <AnimatePresence mode="wait">
                            {step === 'upload' && (
                                <motion.div
                                    key="upload"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <FileDropZone
                                        onUploadComplete={handleUploadComplete}
                                    />
                                </motion.div>
                            )}

                            {step === 'mapping' && (
                                <motion.div
                                    key="mapping"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <MappingPanel
                                        headers={headers}
                                        previewRows={previewRows}
                                        mapping={mapping}
                                        suggestions={suggestions}
                                        onMappingChange={setMapping}
                                        onAutoMap={handleAutoMap}
                                        onApply={handleApplyMapping}
                                        isLoadingAi={isLoadingAi}
                                        isApplying={isApplying}
                                    />
                                </motion.div>
                            )}

                            {step === 'preview' && (
                                <motion.div
                                    key="preview"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <PreviewTable
                                        headers={headers}
                                        rows={previewRows}
                                        mapping={mapping}
                                        totalRows={totalRows}
                                        duplicatesFound={duplicatesFound}
                                    />
                                    <div className="mt-6">
                                        <Button
                                            onClick={() => {
                                                setStep('generate');
                                                scrollUp();
                                            }}
                                        >
                                            Continue to Generate
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 'generate' && (
                                <motion.div
                                    key="generate"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <GeneratePanel
                                        totalRows={totalRows}
                                        isAuthenticated={true}
                                        onGenerate={handleGenerate}
                                        isGenerating={isGenerating}
                                    />
                                </motion.div>
                            )}

                            {step === 'download' && exportId && (
                                <motion.div
                                    key="download"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <DownloadPanel
                                        exportUlid={exportId}
                                        filename={exportFilename}
                                        contactCount={exportContactCount}
                                    />
                                    <div className="mt-6 flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={handleReset}
                                        >
                                            Convert Another File
                                        </Button>
                                        <Link href="/history">
                                            <Button variant="secondary">
                                                View History
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
