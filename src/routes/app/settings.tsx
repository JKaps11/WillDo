import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';

import type {
  // CalendarView,
  // DefaultHomePage,
  TodoListSortBy,
  TodoListTimeSpan,
  User,
} from '@/db/schemas/user.schema';
import type { UIStoreSettingsTab } from '@/lib/store';
import {
  SettingsAppearanceTab,
  // SettingsCalendarTab, // DISABLED: Calendar feature
  // SettingsGeneralTab, // DISABLED: General settings
  // SettingsIntegrationsTab, // DISABLED: Not implemented
  // SettingsTasksTab,
  SettingsTodoListTab,
} from '@/components/settings';
import { useTRPC } from '@/integrations/trpc/react';
import { useTheme } from '@/lib/theme';
import { uiStore } from '@/lib/store';
// import { Settings } from 'lucide-react';

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

  // const generalSettings = user.settings.general;
  const todoListSettings = user.settings.todoList;
  // const calendarSettings = user.settings.calendar;

  // Mutation with optimistic updates
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

  // const handleDefaultHomePageChange = (
  //   defaultHomePage: DefaultHomePage,
  // ): void => {
  //   patchMutation.mutate({
  //     general: { ...generalSettings, defaultHomePage },
  //   });
  // };

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

  // const handleStartOfWeekChange = (startOfWeek: 0 | 1 | 6): void => {
  //   patchMutation.mutate({
  //     calendar: { ...calendarSettings, startOfWeek },
  //   });
  // };

  // const handleDefaultEventDurationChange = (
  //   defaultEventDuration: 30 | 60 | 90 | 120,
  // ): void => {
  //   patchMutation.mutate({
  //     calendar: { ...calendarSettings, defaultEventDuration },
  //   });
  // };

  // const handleDefaultViewChange = (defaultView: CalendarView): void => {
  //   patchMutation.mutate({
  //     calendar: { ...calendarSettings, defaultView },
  //   });
  // };

  // const handleGoogleCalendarSyncChange = (
  //   googleCalendarSync: boolean,
  // ): void => {
  //   patchMutation.mutate({
  //     calendar: { ...calendarSettings, googleCalendarSync },
  //   });
  // };

  switch (currentTab) {
    // DISABLED: General settings
    // case 'general':
    //   return (
    //     <SettingsGeneralTab
    //       defaultHomePage={generalSettings.defaultHomePage}
    //       onDefaultHomePageChange={handleDefaultHomePageChange}
    //     />
    //   );
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
    // case 'tasks':
    //   return <SettingsTasksTab />;
    // return <SettingsTasksTab />;
    // DISABLED: Calendar feature
    // case 'calendar':
    //   return (
    //     <SettingsCalendarTab
    //       startOfWeek={calendarSettings.startOfWeek}
    //       defaultEventDuration={calendarSettings.defaultEventDuration}
    //       defaultView={calendarSettings.defaultView}
    //       googleCalendarSync={calendarSettings.googleCalendarSync}
    //       onStartOfWeekChange={handleStartOfWeekChange}
    //       onDefaultEventDurationChange={handleDefaultEventDurationChange}
    //       onDefaultViewChange={handleDefaultViewChange}
    //       onGoogleCalendarSyncChange={handleGoogleCalendarSyncChange}
    //     />
    //   );
    // DISABLED: Not implemented
    // case 'integrations':
    //   return <SettingsIntegrationsTab />;
  }
}
