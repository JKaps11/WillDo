import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';

import { useTRPC } from '@/integrations/trpc/react';
import { TodoList } from '@/components/todo-list';
import { DndProvider } from '@/components/dnd';
import { ensureUser } from '@/utils/auth';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/todolist')({
  loader: async ({ context }) => {
    await ensureUser();
    const user = await context.queryClient.ensureQueryData(
      context.trpc.user.get.queryOptions(),
    );
    // Prefetch today's date as default
    const today = new Date();
    await context.queryClient.ensureQueryData(
      context.trpc.todoList.list.queryOptions(today),
    );
    return { user };
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const { user } = Route.useLoaderData();
  const trpc = useTRPC();
  const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

  const { data } = useSuspenseQuery(trpc.todoList.list.queryOptions(baseDate));

  const todoOptions = user.settings.todoList;
  const lists = data;

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
