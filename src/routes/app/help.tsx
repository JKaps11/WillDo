import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { HelpContent } from '@/components/help';
import { ensureUser } from '@/utils/auth';

const helpSearchSchema = z.object({
  topic: z.string().optional(),
});

export const Route = createFileRoute('/app/help')({
  validateSearch: helpSearchSchema,
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const { topic } = Route.useSearch();

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-auto">
      <HelpContent topicId={topic ?? 'getting-started'} />
    </div>
  );
}
