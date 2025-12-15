import { Link, useRouterState } from '@tanstack/react-router';
import { CalendarDays, CheckSquare, LogOut, Settings } from 'lucide-react';

import { SignOutButton, UserButton } from '@clerk/tanstack-react-start';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { LucideProps } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems: Array<{ title: string, to: string, icon: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>> }> = [
    { title: 'Todo List', to: '/app/todolist', icon: CheckSquare },
    { title: 'Calendar', to: '/app/calendar', icon: CalendarDays },
    { title: 'Settings', to: '/app/settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = useRouterState({ select: (s) => s.location.pathname });

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Will Do</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.to || pathname.startsWith(item.to + '/');

                                return (
                                    <SidebarMenuItem key={item.to}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                            <Link to={item.to}>
                                                <Icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Bottom: profile + sign out */}
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Profile">
                            <UserButton />
                            {/* <Link to="/">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? 'User'} />
                                    <AvatarFallback>
                                        {(user?.firstName?.[0] ?? user?.fullName?.[0] ?? 'U').toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>


                                <span className="truncate">
                                    {isLoaded ? user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Profile' : 'Profile'}
                                </span>
                            </Link> */}
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SignOutButton>
                            <SidebarMenuButton tooltip="Sign out">
                                <LogOut />
                                <span>Sign out</span>
                            </SidebarMenuButton>
                        </SignOutButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
