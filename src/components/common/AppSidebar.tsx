import {
  BookOpen,
  // CalendarDays, // DISABLED: Calendar feature
  CheckSquare,
  // Inbox,
  LayoutDashboard,
  Settings,
  Target,
} from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';

import { UserButton, useUser } from '@clerk/tanstack-react-start';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { LucideProps } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const navItems: Array<{
  title: string;
  to: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
}> = [
  { title: 'Dashboard', to: '/app/dashboard', icon: LayoutDashboard },
  { title: 'Skills Hub', to: '/app/skills', icon: Target },
  // { title: 'Unassigned Tasks', to: '/app/unassigned', icon: Inbox },
  { title: 'Todo List', to: '/app/todolist', icon: CheckSquare },
  { title: 'Settings', to: '/app/settings', icon: Settings },
  { title: 'Docs', to: '/app/docs', icon: BookOpen },
  // { title: 'Calendar', to: '/app/calendar', icon: CalendarDays }, // DISABLED: Calendar feature
];

export function AppSidebar(): React.ReactElement {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useUser();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="">
        <div className="flex h-10 items-center gap-2">
          <img
            src="/android-chrome-192x192.png"
            alt="Will Do logo"
            className="size-8 scale-125"
          />
          <div className="overflow-hidden transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-0">
            <span className="text-nowrap text-lg font-semibold">Will Do</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.to || pathname.startsWith(item.to + '/');

                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
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

      <SidebarFooter>
        <SidebarMenu>
          {/* <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isSettingsActive}
              tooltip="Settings"
            >
              <Link to="/app/settings">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem> */}
          {/* <SidebarMenuItem>
            <SignOutButton>
              <SidebarMenuButton tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SignOutButton>
          </SidebarMenuItem> */}
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="overflow-visible hover:bg-transparent hover:text-inherit"
              tooltip="Profile"
            >
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'size-8 ring-2 ring-primary',
                  },
                }}
              />
              {user && (
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {user.fullName ?? user.firstName ?? 'User'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
