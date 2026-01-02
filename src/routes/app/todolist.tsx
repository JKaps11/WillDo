import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useQuery } from '@tanstack/react-query';

import type { TodoListWithTasks } from '@/components/todo-list';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useTRPC } from '@/integrations/trpc/react';
import { TodoList } from '@/components/todo-list';
import { DndProvider } from '@/components/dnd';
import { ensureUser } from '@/utils/auth';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/todolist')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const trpc = useTRPC();

  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError,
  } = useQuery(trpc.user.get.queryOptions());

  const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

  const {
    data,
    isLoading: isTodoListLoading,
    isError,
  } = useQuery(trpc.todoList.list.queryOptions(baseDate));

  if (isUserLoading && isTodoListLoading) {
    return <LoadingSpinner />;
  }

  if (isUserError || !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Unable to load user settings</p>
      </div>
    );
  }

  const todoOptions = user.settings.todoList;
  const lists = (data ?? []) as Array<TodoListWithTasks>;

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
