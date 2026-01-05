import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';

import { DocsLayout } from '@/components/docs';
import { ensureUser } from '@/utils/auth';

export const Route = createFileRoute('/app/docs')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const [selectedDoc, setSelectedDoc] = useState('getting-started');

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      <DocsLayout selectedDoc={selectedDoc} onSelectDoc={setSelectedDoc} />
    </div>
  );
}
