import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings2 } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { CalendarView, User } from '@/db/schemas/user.schema';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useTRPC } from '@/integrations/trpc/react';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';

export default function CalendarConfig(): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

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
              calendar: {
                ...previousUser.settings.calendar,
                ...patch.calendar,
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

  const calendarOptions = user.settings.calendar;

  function onViewChange(value: string): void {
    if (!value) return;
    patchMutation.mutate({
      calendar: { ...calendarOptions, defaultView: value as CalendarView },
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-64 p-3">
        <p className="text-sm text-muted-foreground mb-2">View</p>
        <ToggleGroup
          type="single"
          className="w-full grid grid-cols-3 gap-2"
          value={calendarOptions.defaultView}
          onValueChange={onViewChange}
        >
          <ToggleGroupItem value="month" variant="outline">
            Month
          </ToggleGroupItem>
          <ToggleGroupItem value="week" variant="outline">
            Week
          </ToggleGroupItem>
          <ToggleGroupItem value="day" variant="outline">
            Day
          </ToggleGroupItem>
        </ToggleGroup>
      </PopoverContent>
    </Popover>
  );
}
