import { useState, useCallback, useRef, useEffect } from 'react';
import { getCsrfHeaders } from '@/lib/csrf';
import type {
    WizardStep,
    UploadResponse,
    AiSuggestion,
    GenerateResponse,
    StatusResponse,
} from '@/types/vcfwizard';

export function useWizard(scrollToTop?: () => void) {
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
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollUp = useCallback(() => {
        if (scrollToTop) {
            setTimeout(() => scrollToTop(), 100);
        }
    }, [scrollToTop]);

    const handleUploadComplete = useCallback(
        (data: UploadResponse) => {
            setImportId(data.import_ulid);
            setHeaders(data.headers);
            setPreviewRows(data.preview_rows);
            setTotalRows(data.total_rows);
            setStep('mapping');
            setError(null);
            scrollUp();
        },
        [scrollUp],
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
            scrollUp();
        } catch {
            setError('Failed to apply mapping.');
        } finally {
            setIsApplying(false);
        }
    }, [importId, mapping, scrollUp]);

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
                        scrollUp();
                    } else if (data.status === 'failed') {
                        if (pollingRef.current)
                            clearInterval(pollingRef.current);
                        setError(data.error ?? 'Processing failed.');
                        setIsGenerating(false);
                    }
                } catch {
                    /* polling errors ignored */
                }
            }, 2000);
        },
        [scrollUp],
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
                    scrollUp();
                }
            } catch {
                setError('Failed to generate VCF file.');
                setIsGenerating(false);
            }
        },
        [importId, pollStatus, scrollUp],
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

    const resumeImport = useCallback(
        async (importUlid: string) => {
            setError(null);
            try {
                const res = await fetch(
                    `/wizard/resume?import_ulid=${encodeURIComponent(importUlid)}`,
                    { headers: { Accept: 'application/json' } },
                );
                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(
                        data?.error || 'Failed to resume import.',
                    );
                }
                const data = await res.json();
                setImportId(data.import_ulid);
                setHeaders(data.headers);
                setPreviewRows(data.preview_rows);
                setTotalRows(data.total_rows);
                if (data.suggestions) setSuggestions(data.suggestions);
                if (data.mapping) {
                    setMapping(data.mapping);
                    setDuplicatesFound(data.duplicates_found ?? 0);
                }
                setStep(data.step as WizardStep);
                scrollUp();
            } catch (e) {
                setError(
                    e instanceof Error
                        ? e.message
                        : 'Failed to resume import.',
                );
            }
        },
        [scrollUp],
    );

    return {
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
        resumeImport,
        scrollUp,
    };
}
