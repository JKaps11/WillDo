import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import type { z } from 'zod';

import { todoListSearchSchema } from '@/lib/zod-schemas';
import { useTRPC } from '@/integrations/trpc/react';
import { TodoList } from '@/components/todo-list';
import { DndProvider } from '@/components/dnd';
import { startOfDay } from '@/lib/dates';
import { ensureUser } from '@/serverFunctions/auth';

export const Route = createFileRoute('/app/todolist')({
  validateSearch: (search): z.infer<typeof todoListSearchSchema> =>
    todoListSearchSchema.parse(search),
  loaderDeps: ({ search }): { date: string } => ({ date: search.date }),
  loader: async ({ context, deps }) => {
    await ensureUser();
    const user = await context.queryClient.ensureQueryData(
      context.trpc.user.get.queryOptions(),
    );
    const baseDate = startOfDay(new Date(deps.date));
    await context.queryClient.ensureQueryData(
      context.trpc.todoList.list.queryOptions(baseDate),
    );
    return { user, baseDate };
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const { user, baseDate } = Route.useLoaderData();
  const trpc = useTRPC();

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
