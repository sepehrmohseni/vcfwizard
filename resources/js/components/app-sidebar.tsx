import { Link, usePage } from '@inertiajs/react';
import { Clock, CreditCard, Key, LayoutGrid, Map, Plug, PlusCircle, Webhook } from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'New Import',
        href: '/import',
        icon: PlusCircle,
    },
    {
        title: 'History',
        href: '/history',
        icon: Clock,
    },
    {
        title: 'Templates',
        href: '/templates',
        icon: Map,
    },
];

const proNavItems: NavItem[] = [
    {
        title: 'Billing',
        href: '/billing',
        icon: CreditCard,
    },
    {
        title: 'Integrations',
        href: '/integrations',
        icon: Plug,
    },
    {
        title: 'Webhooks',
        href: '/webhooks',
        icon: Webhook,
    },
    {
        title: 'API Keys',
        href: '/api-keys',
        icon: Key,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props as {
        auth: { subscribed?: boolean };
    };
    const subscribed = auth?.subscribed ?? false;

    const extraItems: NavItem[] = [
        {
            title: 'Billing',
            href: '/billing',
            icon: CreditCard,
        },
    ];

    const navItems = subscribed
        ? [...mainNavItems, ...proNavItems]
        : [...mainNavItems, ...extraItems];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={navItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
