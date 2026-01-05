import { createFileRoute } from '@tanstack/react-router';

import { Dashboard } from '@/components/dashboard';
import { ensureUser } from '@/utils/auth';

export const Route = createFileRoute('/app/dashboard')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return <Dashboard />;
}
