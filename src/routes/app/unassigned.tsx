import { useEffect, useMemo, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import type { ReactNode } from 'react';
import type { Task as TaskType, Priority } from '@/db/schemas/task.schema';
import { ensureUser } from '@/utils/auth';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStoreActions } from '@/lib/store';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowDownAZ, ArrowUpDown } from 'lucide-react';
import { UnassignedTask } from '@/components/task';

export const Route = createFileRoute('/app/unassigned')({
    loader: () => ensureUser(),
    component: RouteComponent,
});

type SortOption = 'priority' | 'alphabetical';

const PRIORITY_RANK: Record<Priority, number> = {
    Very_High: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Very_Low: 1,
};

function sortTasks(tasks: TaskType[], sortBy: SortOption): TaskType[] {
    const sorted = [...tasks];

    // Always push completed to bottom
    sorted.sort((a, b) => Number(a.completed) - Number(b.completed));

    if (sortBy === 'alphabetical') {
        sorted.sort((a, b) => {
            const c = Number(a.completed) - Number(b.completed);
            if (c !== 0) return c;
            return a.name.localeCompare(b.name);
        });
        return sorted;
    }

    // sortBy === 'priority'
    sorted.sort((a, b) => {
        const c = Number(a.completed) - Number(b.completed);
        if (c !== 0) return c;
        return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    });
    return sorted;
}

function RouteComponent(): ReactNode {
    const trpc = useTRPC();
    const [sortBy, setSortBy] = useState<SortOption>('priority');

    const { data: tasks, isLoading, isError } = useQuery(
        trpc.task.listUnassigned.queryOptions()
    );

    useEffect(() => {
        uiStoreActions.setHeaderName('Unassigned');
    }, []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isError) {
        return (
            <div className="mx-auto w-full px-4 py-6">
                <Card>
                    <CardContent className="py-14 text-center">
                        <div className="text-base font-medium">Couldn't load unassigned tasks</div>
                        <div className="mt-2 text-sm text-muted-foreground">
                            Please try again.
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const sortedTasks = useMemo(
        () => sortTasks(tasks ?? [], sortBy),
        [tasks, sortBy]
    );
    const total = sortedTasks.length;
    const done = sortedTasks.filter((t) => t.completed).length;

    function toggleSort(): void {
        setSortBy((current) => (current === 'priority' ? 'alphabetical' : 'priority'));
    }

    return (
        <div className="mx-auto w-full px-4 py-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-2xl font-semibold tracking-tight">Unassigned Tasks</div>
                        <div className="text-sm text-muted-foreground">
                            Tasks without a due date
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={toggleSort}>
                        {sortBy === 'priority' ? (
                            <>
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Priority
                            </>
                        ) : (
                            <>
                                <ArrowDownAZ className="mr-2 h-4 w-4" />
                                A-Z
                            </>
                        )}
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="space-y-1 pb-3">
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle className="text-base font-medium">
                                All Unassigned
                            </CardTitle>
                            <Badge variant="secondary" className="shrink-0">
                                {done}/{total}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {sortedTasks.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No unassigned tasks. Create a task without a due date to see it here.
                            </div>
                        ) : (
                            <div className="rounded-md border overflow-hidden">
                                <div className="flex flex-col gap-1 p-1 max-h-[600px] overflow-y-auto overflow-x-hidden">
                                    {sortedTasks.map((task) => (
                                        <div key={task.id} className="relative overflow-hidden">
                                            <UnassignedTask task={task} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
