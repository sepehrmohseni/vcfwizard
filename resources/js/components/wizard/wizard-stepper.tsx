import { motion } from 'framer-motion';
import { Upload, Wand2, Eye, Cog, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/types';

type StepperProps = {
    currentStep: WizardStep;
};

const steps: { key: WizardStep; label: string; icon: React.ElementType }[] = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'mapping', label: 'AI Mapping', icon: Wand2 },
    { key: 'preview', label: 'Preview', icon: Eye },
    { key: 'generate', label: 'Generate', icon: Cog },
    { key: 'download', label: 'Download', icon: Download },
];

const stepOrder: WizardStep[] = [
    'upload',
    'mapping',
    'preview',
    'generate',
    'download',
];

export function WizardStepper({ currentStep }: StepperProps) {
    const currentIndex = stepOrder.indexOf(currentStep);

    return (
        <div className="w-full">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = isCompleted ? Check : step.icon;

                    return (
                        <div
                            key={step.key}
                            className="flex flex-1 items-center"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <motion.div
                                    className={cn(
                                        'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors duration-300',
                                        isCompleted &&
                                            'border-primary bg-primary text-primary-foreground',
                                        isCurrent &&
                                            'border-primary bg-primary/10 text-primary',
                                        !isCompleted &&
                                            !isCurrent &&
                                            'border-muted-foreground/30 text-muted-foreground/50',
                                    )}
                                    animate={{
                                        scale: isCurrent ? 1.1 : 1,
                                    }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                    }}
                                >
                                    <Icon className="h-5 w-5" />
                                </motion.div>
                                <span
                                    className={cn(
                                        'text-xs font-medium transition-colors',
                                        isCurrent && 'text-primary',
                                        isCompleted && 'text-primary',
                                        !isCompleted &&
                                            !isCurrent &&
                                            'text-muted-foreground/50',
                                    )}
                                >
                                    {step.label}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className="mx-2 mb-6 h-0.5 flex-1">
                                    <div className="relative h-full w-full rounded-full bg-muted-foreground/20">
                                        <motion.div
                                            className="absolute inset-y-0 left-0 rounded-full bg-primary"
                                            initial={{ width: '0%' }}
                                            animate={{
                                                width: isCompleted
                                                    ? '100%'
                                                    : isCurrent
                                                      ? '50%'
                                                      : '0%',
                                            }}
                                            transition={{
                                                duration: 0.5,
                                                ease: 'easeOut',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
