import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth & { subscribed: boolean };
            sidebarOpen: boolean;
            stripeKey: string;
            [key: string]: unknown;
        };
    }
}
