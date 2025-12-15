import { Outlet, createFileRoute, } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { SignedIn } from '@clerk/tanstack-react-start';
import type { UIStoreHeaderName } from '@/types/ui_store_types';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/common/AppSidebar';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

export function AppLayout() {
  const title: UIStoreHeaderName = useStore(uiStore, (s) => s.headerName);

  return (
    <SignedIn>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="font-medium">{title}</div>
          </header>
          <main className="p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </SignedIn>
  );
}