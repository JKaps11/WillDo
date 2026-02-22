import { createFileRoute } from '@tanstack/react-router';

import { PracticeLogPage } from '@/components/reflections';

export const Route = createFileRoute('/app/reflections')({
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  return <PracticeLogPage />;
}
