import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';

import type {
  TodoListSortBy,
  TodoListTimeSpan,
  User,
} from '@/db/schemas/user.schema';
import type { UIStoreSettingsTab } from '@/lib/store';
import {
  SettingsAppearanceTab,
  SettingsTodoListTab,
} from '@/components/settings';
import { useTRPC } from '@/integrations/trpc/react';
import { useTheme } from '@/lib/theme';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/settings')({
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(
      context.trpc.user.get.queryOptions(),
    );
    return { user };
  },
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const { user } = Route.useLoaderData();
  const currentTab: UIStoreSettingsTab = useStore(
    uiStore,
    (s) => s.settingsTab,
  );
  const { theme, setTheme } = useTheme();

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const todoListSettings = user.settings.todoList;

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
      },
    }),
  );

  const handleSortByChange = (sortBy: TodoListSortBy): void => {
    patchMutation.mutate({
      todoList: { ...todoListSettings, sortBy },
    });
  };

  const handleTimeSpanChange = (timeSpan: TodoListTimeSpan): void => {
    patchMutation.mutate({
      todoList: { ...todoListSettings, timeSpan },
    });
  };

  const handleShowCompletedChange = (showCompleted: boolean): void => {
    patchMutation.mutate({
      todoList: { ...todoListSettings, showCompleted },
    });
  };

  switch (currentTab) {
    case 'appearance':
      return <SettingsAppearanceTab theme={theme} onThemeChange={setTheme} />;
    case 'todo-list':
      return (
        <SettingsTodoListTab
          sortBy={todoListSettings.sortBy}
          timeSpan={todoListSettings.timeSpan}
          showCompleted={todoListSettings.showCompleted}
          onSortByChange={handleSortByChange}
          onTimeSpanChange={handleTimeSpanChange}
          onShowCompletedChange={handleShowCompletedChange}
        />
      );
    default:
      currentTab satisfies never;
  }
}
