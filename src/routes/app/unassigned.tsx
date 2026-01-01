import { useEffect, useMemo, useRef, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ArrowDownAZ, ArrowUpDown, Check, Plus, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Priority, Task as TaskType } from '@/db/schemas/task.schema';
import { ensureUser } from '@/utils/auth';
import { useTRPC } from '@/integrations/trpc/react';
import { uiStoreActions } from '@/lib/store';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UnassignedTask } from '@/components/task';
import { startOfDay } from '@/utils/dates';

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

function sortTasks(tasks: Array<TaskType>, sortBy: SortOption): Array<TaskType> {
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
    const queryClient = useQueryClient();
    const [sortBy, setSortBy] = useState<SortOption>('priority');
    const [isCreating, setIsCreating] = useState<boolean>(false);
    const [newTaskTitle, setNewTaskTitle] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: tasks, isLoading, isError } = useQuery(
        trpc.task.listUnassigned.queryOptions()
    );

    const createTaskMutation = useMutation(
        trpc.task.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: trpc.task.listUnassigned.queryKey() });
                setNewTaskTitle('');
                setIsCreating(false);
            },
        })
    );

    useEffect(() => {
        uiStoreActions.setHeaderName('Unassigned');
    }, []);

    useEffect(() => {
        if (isCreating && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isCreating]);

    const sortedTasks = useMemo(
        () => sortTasks(tasks ?? [], sortBy),
        [tasks, sortBy]
    );
    const total = sortedTasks.length;
    const done = sortedTasks.filter((t) => t.completed).length;

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

    function toggleSort(): void {
        setSortBy((current) => (current === 'priority' ? 'alphabetical' : 'priority'));
    }

    function handleCreateTask(): void {
        if (!newTaskTitle.trim()) return;
        createTaskMutation.mutate({
            name: newTaskTitle.trim(),
            todoListDate: startOfDay(new Date()),
        });
    }

    function handleCancel(): void {
        setIsCreating(false);
        setNewTaskTitle('');
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.key === 'Enter') {
            handleCreateTask();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
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
                                Tasks
                            </CardTitle>
                            <Badge variant="secondary" className="shrink-0">
                                {done}/{total}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                        {sortedTasks.length === 0 ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No unassigned tasks. Create a task without a due date to see it here.
                            </div>
                        ) : (
                            <div className="rounded-md overflow-hidden">
                                <div className="flex flex-col gap-1 p-1 max-h-[600px] overflow-y-auto overflow-x-hidden">
                                    {sortedTasks.map((task) => (
                                        <div key={task.id} className="relative overflow-hidden">
                                            <UnassignedTask task={task} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inline Task Creation */}
                        {isCreating ? (
                            <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                                <Input
                                    ref={inputRef}
                                    placeholder="Task title"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1"
                                    disabled={createTaskMutation.isPending}
                                />
                                <Button
                                    size="icon"
                                    onClick={handleCreateTask}
                                    disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                                    className="h-9 w-9 shrink-0"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={handleCancel}
                                    disabled={createTaskMutation.isPending}
                                    className="h-9 w-9 shrink-0"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="ghost"
                                onClick={() => setIsCreating(true)}
                                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                            >
                                <Plus className="h-4 w-4" />
                                Add task
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
