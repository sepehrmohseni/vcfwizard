import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import {
    Download,
    CheckCircle2,
    PartyPopper,
    Copy,
} from 'lucide-react';
import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';

type DownloadPanelProps = {
    exportUlid: string;
    filename: string;
    contactCount: number;
};

export function DownloadPanel({
    exportUlid,
    filename,
    contactCount,
}: DownloadPanelProps) {
    const triggerConfetti = useCallback(() => {
        const duration = 2000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 3,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#3b82f6', '#8b5cf6', '#06b6d4'],
            });
            confetti({
                particleCount: 3,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#3b82f6', '#8b5cf6', '#06b6d4'],
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };

        frame();
    }, []);

    useEffect(() => {
        triggerConfetti();
    }, [triggerConfetti]);

    const downloadUrl = `/wizard/download/${exportUlid}`;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.origin + downloadUrl);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-8 py-8"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10"
            >
                <CheckCircle2 className="h-12 w-12 text-green-500" />
            </motion.div>

            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-2 flex items-center justify-center gap-2"
                >
                    <PartyPopper className="h-5 w-5 text-yellow-500" />
                    <h3 className="text-2xl font-bold">Your VCF is Ready!</h3>
                    <PartyPopper className="h-5 w-5 text-yellow-500" />
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-muted-foreground"
                >
                    {contactCount} contacts converted to {filename}
                </motion.p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-3"
            >
                <a href={downloadUrl}>
                    <Button size="lg" className="gap-2 px-10">
                        <Download className="h-5 w-5" />
                        Download {filename}
                    </Button>
                </a>

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyLink}
                        className="gap-2"
                    >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Link
                    </Button>
                </div>
            </motion.div>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center text-xs text-muted-foreground"
            >
                Guest files are automatically deleted after 5 minutes.
                <br />
                Sign up for unlimited history and shareable links.
            </motion.p>
        </motion.div>
    );
}
