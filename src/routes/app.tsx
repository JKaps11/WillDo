import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SignedIn } from '@clerk/tanstack-react-start';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/common/AppSidebar';
import {
  GlobalRecurringModal,
  MoveRecurringModal,
} from '@/components/recurring';
import { PracticeEvaluationModal } from '@/components/practice-evaluation';
import AppHeader from '@/components/common/AppHeader';

export const Route = createFileRoute('/app')({
  component: AppLayout,
});

export function AppLayout() {
  return (
    <SignedIn>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <main className="p-4 h-full">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
      <GlobalRecurringModal />
      <MoveRecurringModal />
      <PracticeEvaluationModal />
    </SignedIn>
  );
}
