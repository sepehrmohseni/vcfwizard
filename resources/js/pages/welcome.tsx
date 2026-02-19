import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DownloadPanel } from '@/components/wizard/download-panel';
import { FileDropZone } from '@/components/wizard/file-drop-zone';
import { GeneratePanel } from '@/components/wizard/generate-panel';
import { MappingPanel } from '@/components/wizard/mapping-panel';
import { PreviewTable } from '@/components/wizard/preview-table';
import { WizardStepper } from '@/components/wizard/wizard-stepper';
import { getCsrfHeaders } from '@/lib/csrf';
import type {
    WizardStep,
    UploadResponse,
    AiSuggestion,
    GenerateResponse,
    StatusResponse,
} from '@/types/vcfwizard';
import { dashboard, login, register } from '@/routes';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage().props as {
        auth: { user: { name: string } | null; subscribed?: boolean };
    };
    const isLoggedIn = !!auth?.user;
    const isSubscribed = !!auth?.subscribed;

    const [step, setStep] = useState<WizardStep>('upload');
    const [importId, setImportId] = useState<string | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<Record<string, string>[]>(
        [],
    );
    const [totalRows, setTotalRows] = useState(0);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
    const [duplicatesFound, setDuplicatesFound] = useState(0);
    const [exportId, setExportId] = useState<string | null>(null);
    const [exportFilename, setExportFilename] = useState('');
    const [exportContactCount, setExportContactCount] = useState(0);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const wizardRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollToWizard = useCallback(() => {
        setTimeout(() => {
            wizardRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }, 100);
    }, []);

    const handleUploadComplete = useCallback(
        (data: UploadResponse) => {
            setImportId(data.import_ulid);
            setHeaders(data.headers);
            setPreviewRows(data.preview_rows);
            setTotalRows(data.total_rows);
            setStep('mapping');
            setError(null);
            scrollToWizard();
        },
        [scrollToWizard],
    );

    const handleAutoMap = useCallback(async () => {
        if (!importId) return;
        setIsLoadingAi(true);
        setError(null);
        try {
            const res = await fetch('/wizard/ai-mapping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({ import_ulid: importId }),
            });
            if (!res.ok) throw new Error('AI mapping failed');
            const data = await res.json();
            setSuggestions(data.suggestions);
            const autoMapping: Record<string, string> = {};
            data.suggestions.forEach((s: AiSuggestion) => {
                if (s.confidence >= 50)
                    autoMapping[s.column_name] = s.field_type;
            });
            setMapping((prev) => ({ ...prev, ...autoMapping }));
        } catch {
            setError('AI mapping failed. Please map columns manually.');
        } finally {
            setIsLoadingAi(false);
        }
    }, [importId]);

    const handleApplyMapping = useCallback(async () => {
        if (!importId) return;
        setIsApplying(true);
        setError(null);
        try {
            const res = await fetch('/wizard/apply-mapping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCsrfHeaders(),
                },
                body: JSON.stringify({ import_ulid: importId, mapping }),
            });
            if (!res.ok) throw new Error('Apply mapping failed');
            const data = await res.json();
            setDuplicatesFound(data.duplicates_found);
            setStep('preview');
            scrollToWizard();
        } catch {
            setError('Failed to apply mapping.');
        } finally {
            setIsApplying(false);
        }
    }, [importId, mapping, scrollToWizard]);

    const pollStatus = useCallback(
        (pollingImportId: string) => {
            pollingRef.current = setInterval(async () => {
                try {
                    const res = await fetch(
                        `/wizard/status?import_ulid=${pollingImportId}`,
                        {
                            headers: { Accept: 'application/json' },
                        },
                    );
                    if (!res.ok) return;
                    const data: StatusResponse = await res.json();
                    if (data.status === 'completed' && data.export_ulid) {
                        if (pollingRef.current)
                            clearInterval(pollingRef.current);
                        setExportId(data.export_ulid);
                        setExportFilename(data.filename ?? '');
                        setExportContactCount(data.contact_count ?? 0);
                        setIsGenerating(false);
                        setStep('download');
                        scrollToWizard();
                    } else if (data.status === 'failed') {
                        if (pollingRef.current)
                            clearInterval(pollingRef.current);
                        setError(data.error ?? 'Processing failed.');
                        setIsGenerating(false);
                    }
                } catch {
                    /* ignore polling errors */
                }
            }, 2000);
        },
        [scrollToWizard],
    );

    useEffect(() => {
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const handleGenerate = useCallback(
        async (
            format: 'single' | 'zip',
            saveTemplate: boolean,
            templateName: string,
        ) => {
            if (!importId) return;
            setIsGenerating(true);
            setError(null);
            try {
                const res = await fetch('/wizard/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCsrfHeaders(),
                    },
                    body: JSON.stringify({
                        import_ulid: importId,
                        format,
                        save_template: saveTemplate,
                        template_name: templateName,
                    }),
                });
                if (!res.ok) throw new Error('Generate failed');
                const data: GenerateResponse = await res.json();
                if (data.status === 'queued') {
                    pollStatus(data.import_ulid!);
                } else {
                    setExportId(data.export_ulid!);
                    setExportFilename(data.filename ?? '');
                    setExportContactCount(data.contact_count ?? 0);
                    setIsGenerating(false);
                    setStep('download');
                    scrollToWizard();
                }
            } catch {
                setError('Failed to generate VCF file.');
                setIsGenerating(false);
            }
        },
        [importId, pollStatus, scrollToWizard],
    );

    const handleReset = useCallback(() => {
        setStep('upload');
        setImportId(null);
        setHeaders([]);
        setPreviewRows([]);
        setTotalRows(0);
        setMapping({});
        setSuggestions([]);
        setDuplicatesFound(0);
        setExportId(null);
        setExportFilename('');
        setExportContactCount(0);
        setError(null);
        setIsGenerating(false);
        if (pollingRef.current) clearInterval(pollingRef.current);
    }, []);

    return (
        <>
            <Head title="VCFWizard — Convert Contacts to VCF">
                <meta
                    name="description"
                    content="Convert CSV and Excel contact files to vCard (VCF) format instantly. AI-powered column mapping, duplicate detection, and bulk export. Free online tool."
                />
                <meta
                    name="keywords"
                    content="vcf converter, csv to vcf, excel to vcard, contact converter, vcard generator, bulk contacts, import contacts"
                />
                <meta property="og:title" content="VCFWizard — Convert Contacts to VCF" />
                <meta
                    property="og:description"
                    content="Convert CSV and Excel contact files to vCard (VCF) format instantly. AI-powered column mapping, duplicate detection, and bulk export."
                />
                <meta property="og:type" content="website" />
                <meta property="og:image" content="/android-chrome-512x512.png" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content="VCFWizard — Convert Contacts to VCF" />
                <meta
                    name="twitter:description"
                    content="Convert CSV and Excel contact files to vCard (VCF) format instantly. AI-powered column mapping and bulk export."
                />
                <link rel="canonical" href="/" />
            </Head>
            <div className="flex min-h-screen flex-col bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
                <header className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/80">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link href="/" className="flex items-center gap-2">
                            <img
                                src="/logo-64.png"
                                alt="VCFWizard"
                                className="h-9 w-9 rounded-lg object-cover"
                            />
                            <span className="text-lg font-semibold tracking-tight">
                                VCFWizard
                            </span>
                        </Link>
                        <nav className="flex items-center gap-3">
                            {isLoggedIn ? (
                                <Link href={dashboard().url}>
                                    <Button variant="default" size="sm">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={login().url}>
                                        <Button variant="ghost" size="sm">
                                            Log in
                                        </Button>
                                    </Link>
                                    {canRegister && (
                                        <Link href={register().url}>
                                            <Button size="sm">Sign up</Button>
                                        </Link>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    <section className="relative overflow-hidden py-24 sm:py-32">
                        <div className="absolute inset-0 -z-10">
                            <div className="absolute top-0 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-100/40 to-violet-100/40 blur-3xl dark:from-blue-900/20 dark:to-violet-900/20" />
                        </div>
                        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl dark:text-white">
                                    Convert your contacts
                                    <br />
                                    <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                                        to VCF in seconds
                                    </span>
                                </h1>
                                <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
                                    Upload your CSV or Excel file, let AI map
                                    your columns, and download a ready-to-import
                                    vCard file. No signup required.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="mt-10 flex items-center justify-center gap-4"
                            >
                                <Button
                                    size="lg"
                                    onClick={() =>
                                        wizardRef.current?.scrollIntoView({
                                            behavior: 'smooth',
                                        })
                                    }
                                >
                                    Start Converting
                                </Button>
                                {!isLoggedIn && (
                                    <Link href={register().url}>
                                        <Button variant="outline" size="lg">
                                            Create Free Account
                                        </Button>
                                    </Link>
                                )}
                            </motion.div>
                            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
                                {[
                                    {
                                        title: 'AI Mapping',
                                        desc: 'Auto-detect columns with Artificial Intelligence',
                                    },
                                    {
                                        title: 'Full vCard 4.0',
                                        desc: '27+ field types including photos and addresses',
                                    },
                                    {
                                        title: 'No Signup',
                                        desc: 'Convert up to 2,000 contacts instantly as a guest',
                                    },
                                ].map((f, i) => (
                                    <motion.div
                                        key={f.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.3 + i * 0.1,
                                        }}
                                        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                                    >
                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            {f.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                            {f.desc}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section
                        ref={wizardRef}
                        className="border-t border-neutral-200 bg-neutral-50 py-16 sm:py-24 dark:border-neutral-800 dark:bg-neutral-900/50"
                    >
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
                                                onUploadComplete={
                                                    handleUploadComplete
                                                }
                                                acceptPremiumFormats={isSubscribed}
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
                                                canUseAi={isLoggedIn && isSubscribed}
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
                                                duplicatesFound={
                                                    duplicatesFound
                                                }
                                            />
                                            <div className="mt-6">
                                                <Button
                                                    onClick={() => {
                                                        setStep('generate');
                                                        scrollToWizard();
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
                                                isAuthenticated={isLoggedIn}
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
                                                contactCount={
                                                    exportContactCount
                                                }
                                            />
                                            <div className="mt-6 flex gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={handleReset}
                                                >
                                                    Convert Another File
                                                </Button>
                                                {!isLoggedIn && (
                                                    <Link href={register().url}>
                                                        <Button variant="secondary">
                                                            Sign up to save
                                                            history
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </section>

                    <section className="py-16 sm:py-24">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
                                Everything you need
                            </h2>
                            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    {
                                        title: 'CSV & Excel',
                                        desc: 'Upload .csv, .xlsx, or .xls files up to 10MB.',
                                    },
                                    {
                                        title: 'AI Column Mapping',
                                        desc: 'AI auto-detects your column types with confidence scores.',
                                    },
                                    {
                                        title: 'Duplicate Detection',
                                        desc: 'Finds duplicate contacts by email and phone number.',
                                    },
                                    {
                                        title: 'vCard 4.0',
                                        desc: 'Full specification support with 27+ field types.',
                                    },
                                    {
                                        title: 'Bulk Export',
                                        desc: 'Single .vcf file or individual contacts in a ZIP archive.',
                                    },
                                    {
                                        title: 'Shareable Links',
                                        desc: 'Create download links for your team with expiry dates.',
                                    },
                                ].map((f) => (
                                    <div
                                        key={f.title}
                                        className="rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
                                    >
                                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                                            {f.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                            {f.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="border-t border-neutral-200 py-16 sm:py-24 dark:border-neutral-800">
                        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
                                Need more power?
                            </h2>
                            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
                                Upgrade to Pro for AI-powered mapping, unlimited contacts,
                                Google Sheets integration, webhooks, and API access.
                            </p>
                            <div className="mt-4 text-3xl font-bold text-blue-600">
                                $10 <span className="text-base font-normal text-neutral-500">/ 6 months</span>
                            </div>
                            <div className="mt-6">
                                <Link href="/pricing">
                                    <Button size="lg" variant="outline">
                                        View Pricing
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
                    <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500 sm:px-6 lg:px-8 dark:text-neutral-400">
                        &copy; {new Date().getFullYear()} VCFWizard. Built with
                        ❤️
                    </div>
                </footer>
            </div>
        </>
    );
}
