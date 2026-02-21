import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { Settings2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import type { ReactNode } from 'react';
import type {
  TodoListSortBy,
  TodoListTimeSpan,
  User,
} from '@/db/schemas/user.schema';
import { useTRPC } from '@/integrations/trpc/react';

export default function TodoListConfig(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user, isError } = useQuery(trpc.user.get.queryOptions());

  const patchMutation = useMutation(
    trpc.user.patchSettings.mutationOptions({
      onMutate: async (patch) => {
        await queryClient.cancelQueries({ queryKey: trpc.user.get.queryKey() });
        const previousUser = queryClient.getQueryData<User>(
          trpc.user.get.queryKey(),
        );

        if (previousUser) {
          queryClient.setQueryData(trpc.user.get.queryKey(), {
            ...previousUser,
            settings: {
              ...previousUser.settings,
              appearance: {
                ...previousUser.settings.appearance,
                ...patch.appearance,
              },
              todoList: {
                ...previousUser.settings.todoList,
                ...patch.todoList,
              },
            },
          });
        }

        return { previousUser };
      },
      onError: (_err, _patch, context) => {
        if (context?.previousUser) {
          queryClient.setQueryData(
            trpc.user.get.queryKey(),
            context.previousUser,
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: trpc.user.get.queryKey() });
        // Invalidate the current route to trigger a reload with new settings
        router.invalidate();
      },
    }),
  );

  if (isError || !user) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Settings2 />
      </Button>
    );
  }

  const todoListOptions = user.settings.todoList;

  function onTodoListTimeSpanChange(value: string): void {
    if (!value) return;
    patchMutation.mutate({
      todoList: { ...todoListOptions, timeSpan: value as TodoListTimeSpan },
    });
  }

  function onSortByValueChange(value: string): void {
    patchMutation.mutate({
      todoList: { ...todoListOptions, sortBy: value as TodoListSortBy },
    });
  }

  function onShowCompletedChange(checked: boolean): void {
    patchMutation.mutate({
      todoList: { ...todoListOptions, showCompleted: checked },
    });
  }

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="icon" />}>
        <Settings2 />
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-3">
        {/* Top segmented toggle (Date / Week) */}
        <ToggleGroup
          className="w-full grid grid-cols-2 gap-2"
          value={[todoListOptions.timeSpan]}
          onValueChange={(value) => {
            if (value.length > 0) {
              onTodoListTimeSpanChange(value[0]);
            }
          }}
        >
          <ToggleGroupItem value="day" variant="outline">
            Date
          </ToggleGroupItem>
          <ToggleGroupItem value="week" variant="outline">
            Week
          </ToggleGroupItem>
        </ToggleGroup>

        <Separator className="my-3" />

        {/* Ordering row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Ordering</p>

          <Select
            value={todoListOptions.sortBy}
            onValueChange={onSortByValueChange}
          >
            <SelectTrigger className="h-8 w-40" data-testid="sort-by-select">
              <SelectValue placeholder="Date created" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date created</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Show completed row */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Show completed</p>
          <Switch
            checked={todoListOptions.showCompleted}
            onCheckedChange={onShowCompletedChange}
            data-testid="show-completed-switch"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
