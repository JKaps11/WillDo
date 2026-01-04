import type { ErrorComponentProps } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
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

export function DefaultErrorPage({ error: _error }: ErrorComponentProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <Empty className="max-w-lg">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert className="size-6" />
          </EmptyMedia>

          <EmptyTitle>Something went wrong</EmptyTitle>

          <EmptyDescription>
            We hit an unexpected error. Please go home and try again.
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="flex justify-center">
          <Button asChild size="lg">
            <Link to={'/'}>Go home</Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
