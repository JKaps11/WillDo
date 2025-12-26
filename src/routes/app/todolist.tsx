import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import type { TodoListWithTasks } from '@/components/todo-list';
import { ensureUser } from '@/utils/auth';
import { useTRPC } from '@/integrations/trpc/react';
import { DndProvider } from '@/components/dnd';
import { TodoList } from '@/components/todo-list';
import { uiStore, uiStoreActions } from '@/lib/store';

export const Route = createFileRoute('/app/todolist')({
    loader: () => ensureUser(),
    component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
    const trpc = useTRPC();

    const { data: user, isLoading: isUserLoading, isError: isUserError } = useQuery(trpc.user.get.queryOptions());

    const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

    const { data, isLoading, isError } = useQuery(
        trpc.todoList.list.queryOptions(baseDate)
    );

    useEffect(() => {
        uiStoreActions.setHeaderName('Todo List');
    }, []);

    if (isUserError || isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">
                    {isUserLoading ? 'Loading...' : 'Unable to load user settings'}
                </p>
            </div>
        );
    }

    const todoOptions = user.settings.todoList;
    const lists = (data ?? []) as Array<TodoListWithTasks>;

    if (isLoading) {
        return (
            <TodoList.Root options={todoOptions} baseDate={baseDate}>
                <TodoList.LoadingSkeleton />
            </TodoList.Root>
        );
    }

    if (isError) {
        return (
            <TodoList.Root options={todoOptions} baseDate={baseDate}>
                <TodoList.ErrorState />
            </TodoList.Root>
        );
    }

    return (
        <DndProvider>
            <TodoList.Root options={todoOptions} baseDate={baseDate}>
                <div className="flex flex-col gap-4">
                    <TodoList.Header />
                    {todoOptions.timeSpan === 'day' ? (
                        <TodoList.DayView lists={lists} />
                    ) : (
                        <TodoList.WeekView lists={lists} />
                    )}
                </div>
            </TodoList.Root>
        </DndProvider>
    );
}
