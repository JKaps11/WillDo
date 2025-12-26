import { useEffect } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { UIStoreSettingsTab } from '@/lib/store';
import type { TodoListSortBy, TodoListTimeSpan, User } from '@/db/schemas/user.schema';
import { uiStore, uiStoreActions } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { useTRPC } from '@/integrations/trpc/react';
import {
    SettingsAppearanceTab,
    SettingsCalendarTab,
    SettingsTasksTab,
    SettingsTodoListTab,
} from '@/components/settings';

export const Route = createFileRoute('/app/settings')({
    component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
    const currentTab: UIStoreSettingsTab = useStore(uiStore, (s) => s.settingsTab);
    const { theme, setTheme } = useTheme();

    useEffect(() => {
        uiStoreActions.setHeaderName('Settings');
    }, []);

    const trpc = useTRPC();
    const queryClient = useQueryClient();

    // Fetch user settings
    const { data: user, isError } = useQuery(trpc.user.get.queryOptions());

    if (isError || !user) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Unable to load settings</p>
            </div>
        );
    }

    const todoListSettings = user.settings.todoList;

    // Mutation with optimistic updates
    const patchMutation = useMutation(
        trpc.user.patchSettings.mutationOptions({
            onMutate: async (patch) => {
                await queryClient.cancelQueries({ queryKey: trpc.user.get.queryKey() });
                const previousUser = queryClient.getQueryData<User>(trpc.user.get.queryKey());

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
                    queryClient.setQueryData(trpc.user.get.queryKey(), context.previousUser);
                }
            },
            onSettled: () => {
                queryClient.invalidateQueries({ queryKey: trpc.user.get.queryKey() });
            },
        })
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
            return (
                <SettingsAppearanceTab
                    theme={theme}
                    onThemeChange={setTheme}
                />
            );
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
        case 'tasks':
            return <SettingsTasksTab />;
        case 'calendar':
            return <SettingsCalendarTab />;
    }
}
