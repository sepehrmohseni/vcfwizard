import { AnimatePresence, motion } from 'framer-motion';
import {
    Upload,
    FileSpreadsheet,
    AlertCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Progress } from '@/components/ui/progress';
import { applyCsrfHeaders } from '@/lib/csrf';
import { cn } from '@/lib/utils';
import type { UploadResponse } from '@/types/vcfwizard';

type FileDropZoneProps = {
    onUploadComplete: (data: UploadResponse) => void;
    acceptPremiumFormats?: boolean;
};

export function FileDropZone({ onUploadComplete, acceptPremiumFormats = false }: FileDropZoneProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return;
            const file = acceptedFiles[0];
            setFileName(file.name);
            setIsUploading(true);
            setUploadProgress(0);
            setError(null);

            const formData = new FormData();
            formData.append('file', file);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/wizard/upload');

            applyCsrfHeaders(xhr);
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(Math.round((e.loaded / e.total) * 100));
                }
            });

            xhr.addEventListener('load', () => {
                setIsUploading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data: UploadResponse = JSON.parse(xhr.responseText);
                    onUploadComplete(data);
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        setError(err.message || 'Upload failed.');
                    } catch {
                        setError('Upload failed. Please try again.');
                    }
                }
            });

            xhr.addEventListener('error', () => {
                setIsUploading(false);
                setError('Network error. Please try again.');
            });

            xhr.send(formData);
        },
        [onUploadComplete],
    );

    const acceptedTypes: Record<string, string[]> = {
        'text/csv': ['.csv'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls'],
        ...(acceptPremiumFormats ? {
            'text/plain': ['.txt'],
            'application/json': ['.json'],
        } : {}),
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: acceptedTypes,
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        disabled: isUploading,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { onDrag, ...rootProps } = getRootProps();

    return (
        <div className="w-full">
            <div
                {...rootProps}
                className={cn(
                    'relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300',
                    'border-border hover:border-primary/50 hover:bg-muted/30',
                    isUploading && 'pointer-events-none opacity-70',
                    error && 'border-destructive/50 bg-destructive/5',
                )}
            >
                <input {...getInputProps()} />

                <AnimatePresence mode="wait">
                    {isUploading ? (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <div className="relative">
                                <FileSpreadsheet className="h-12 w-12 text-primary" />
                                <motion.div
                                    className="absolute -right-1 -bottom-1 rounded-full bg-primary p-1"
                                    animate={{ rotate: 360 }}
                                    transition={{
                                        duration: 1,
                                        repeat: Infinity,
                                        ease: 'linear',
                                    }}
                                >
                                    <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                                </motion.div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium">
                                    Uploading {fileName}...
                                </p>
                                <Progress
                                    value={uploadProgress}
                                    className="h-2 w-64"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {uploadProgress}%
                                </p>
                            </div>
                        </motion.div>
                    ) : error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div>
                                <p className="text-sm font-medium text-destructive">
                                    {error}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Click or drag to try again
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Upload className="h-12 w-12 text-muted-foreground" />
                            <div>
                                <p className="text-base font-semibold">
                                    Drop your contacts file here
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    or click to browse &middot; {acceptPremiumFormats ? 'CSV, XLSX, TXT, JSON' : 'CSV, XLSX'} up to
                                    10MB
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                    <FileSpreadsheet className="h-3 w-3" /> CSV
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
                                    <FileSpreadsheet className="h-3 w-3" /> XLSX
                                </span>
                                {acceptPremiumFormats && (
                                    <>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                            <FileSpreadsheet className="h-3 w-3" /> TXT
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                            <FileSpreadsheet className="h-3 w-3" /> JSON
                                        </span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
