import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
    { name: 'CSV & Excel upload', free: true, pro: true },
    { name: 'AI column mapping', free: false, pro: true },
    { name: 'Contact limit per file', free: '2,000', pro: 'Unlimited' },
    { name: 'AI rows per month', free: '—', pro: '50,000' },
    { name: 'TXT & JSON import', free: false, pro: true },
    { name: 'PDF export', free: false, pro: true },
    { name: 'Google Sheets integration', free: false, pro: true },
    { name: 'Webhooks', free: false, pro: true },
    { name: 'API access', free: false, pro: true },
    { name: 'Priority processing queue', free: false, pro: true },
    { name: 'Shareable download links', free: true, pro: true },
    { name: 'Duplicate detection', free: true, pro: true },
    { name: 'Mapping templates', free: true, pro: true },
    { name: 'Import history', free: false, pro: true },
];

export default function Pricing() {
    const { auth } = usePage().props as {
        auth: { user: { name: string } | null; subscribed?: boolean };
    };
    const isLoggedIn = !!auth?.user;
    const isSubscribed = !!auth?.subscribed;

    return (
        <>
            <Head title="Pricing — VCFWizard" />
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
                                <Link href="/dashboard">
                                    <Button variant="default" size="sm">
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">
                                            Log in
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm">Sign up</Button>
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1 py-16 sm:py-24">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
                                Simple, transparent pricing
                            </h1>
                            <p className="mx-auto mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
                                Start free, upgrade when you need AI mapping, integrations,
                                and unlimited contacts.
                            </p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                            >
                                <Card className="relative h-full">
                                    <CardHeader>
                                        <CardTitle className="text-xl">Free</CardTitle>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">$0</span>
                                            <span className="ml-1 text-neutral-500">/forever</span>
                                        </div>
                                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                            Perfect for quick one-off conversions.
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <Link href={isLoggedIn ? '/import' : '/register'}>
                                            <Button variant="outline" className="w-full">
                                                {isLoggedIn ? 'Start Converting' : 'Get Started'}
                                            </Button>
                                        </Link>
                                        <ul className="mt-8 space-y-3">
                                            {features.map((f) => (
                                                <li key={f.name} className="flex items-center gap-3 text-sm">
                                                    {f.free === true ? (
                                                        <Check className="h-4 w-4 shrink-0 text-green-500" />
                                                    ) : f.free === false ? (
                                                        <X className="h-4 w-4 shrink-0 text-neutral-300 dark:text-neutral-600" />
                                                    ) : (
                                                        <span className="w-4 shrink-0" />
                                                    )}
                                                    <span className={f.free === false ? 'text-neutral-400 dark:text-neutral-600' : ''}>
                                                        {f.name}
                                                    </span>
                                                    {typeof f.free === 'string' && (
                                                        <span className="ml-auto text-xs font-medium text-neutral-500">
                                                            {f.free}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <Card className="relative h-full border-blue-500/50 shadow-lg shadow-blue-500/5">
                                    <div className="absolute -top-3 left-6">
                                        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                                            Most Popular
                                        </Badge>
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-xl">Pro</CardTitle>
                                        <div className="mt-4">
                                            <span className="text-4xl font-bold">$10</span>
                                            <span className="ml-1 text-neutral-500">/ 6 months</span>
                                        </div>
                                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                            AI-powered mapping, integrations, and unlimited contacts.
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        {isSubscribed ? (
                                            <Button variant="outline" className="w-full" disabled>
                                                Current Plan
                                            </Button>
                                        ) : (
                                            <Link href={isLoggedIn ? '/billing' : '/register'}>
                                                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                    {isLoggedIn ? 'Upgrade Now' : 'Sign Up & Upgrade'}
                                                </Button>
                                            </Link>
                                        )}
                                        <ul className="mt-8 space-y-3">
                                            {features.map((f) => (
                                                <li key={f.name} className="flex items-center gap-3 text-sm">
                                                    <Check className="h-4 w-4 shrink-0 text-green-500" />
                                                    <span>{f.name}</span>
                                                    {typeof f.pro === 'string' && (
                                                        <span className="ml-auto text-xs font-medium text-blue-600">
                                                            {f.pro}
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="mt-12 text-center text-sm text-neutral-500 dark:text-neutral-400"
                        >
                            All prices in USD. Cancel anytime. No hidden fees.
                        </motion.div>
                    </div>
                </main>

                <footer className="border-t border-neutral-200 py-8 dark:border-neutral-800">
                    <div className="mx-auto max-w-7xl px-4 text-center text-sm text-neutral-500 sm:px-6 lg:px-8 dark:text-neutral-400">
                        &copy; {new Date().getFullYear()} VCFWizard
                    </div>
                </footer>
            </div>
        </>
    );
}
