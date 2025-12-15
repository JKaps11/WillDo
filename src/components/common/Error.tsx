import { Link } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import type { ErrorComponentProps } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';

export function DefaultErrorPage({ error: _error }: ErrorComponentProps) {
    return (
        <div className="flex min-h-screen items-center justify-center p-6">
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