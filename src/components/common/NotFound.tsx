import { Link, useRouterState } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex h-full items-center justify-center p-6">
      <Empty className="max-w-xl">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert className="size-6" />
          </EmptyMedia>

          <EmptyTitle>404 — Not Found</EmptyTitle>

          <EmptyDescription>
            We couldn&apos;t find that page.
            <span className="mt-2 block text-xs text-muted-foreground">
              Requested:{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">
                {pathname}
              </code>
            </span>
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="flex justify-center">
          <Button size="lg" render={<Link to={'/'} />} nativeButton={false}>Go Home</Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
