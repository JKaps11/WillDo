import {
  ArrowBigLeft,
  ArrowBigRight,
  ArrowDownAZ,
  ArrowUpDown,
} from 'lucide-react';
import { useRouterState } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { UI_STORE_SETTINGS_TABS, uiStore, uiStoreActions } from '@/lib/store';
import type { UIStoreSettingsTab, UnassignedSortOption } from '@/lib/store';
import { withVerticalSeparators } from './utils';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import NewTaskModal from '../NewTaskModal';
import type { ReactNode } from 'react';
import { Button } from '../ui/button';

import TodoListConfig from '@/components/todo-list/TodoListConfig';
// import CalendarConfig from '@/components/calendar/CalendarConfig'; // DISABLED: Calendar feature
import { useTRPC } from '@/integrations/trpc/react';
import { useIsMobile } from '@/hooks/use-mobile';

type PageTitle = 'Todo List' | 'Unassigned Tasks' | 'Calendar' | 'Settings';

function getPageTitle(pathname: string): PageTitle {
  const segment = pathname.split('/')[2] ?? '';
  switch (segment) {
    case 'todolist':
      return 'Todo List';
    case 'unassigned':
      return 'Unassigned Tasks';
    case 'calendar':
      return 'Calendar';
    case 'settings':
      return 'Settings';
    default:
      return 'Todo List';
  }
}

export default function AppHeader(): React.ReactNode {
  const isMobile: boolean = useIsMobile();
  const trpc = useTRPC();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const title: PageTitle = getPageTitle(pathname);

  // Fetch user settings to get the timeSpan/view for navigation
  const { data: user } = useQuery(trpc.user.get.queryOptions());
  const timeSpan = user?.settings.todoList.timeSpan ?? 'day';
  const calendarView = user?.settings.calendar.defaultView ?? 'week';

  function handleNavigate(direction: 'prev' | 'next'): void {
    uiStoreActions.navigateTodoList(direction, timeSpan);
  }

  function handleCalendarNavigate(direction: 'prev' | 'next'): void {
    uiStoreActions.navigateCalendar(direction, calendarView);
  }

  const settingsTab: UIStoreSettingsTab = useStore(
    uiStore,
    (s) => s.settingsTab,
  );
  const unassignedSortBy: UnassignedSortOption = useStore(
    uiStore,
    (s) => s.unassignedSortBy,
  );
  function onSettingsSelected(value: string): void {
    uiStoreActions.setSettingsTab(value as UIStoreSettingsTab);
  }
  function displaySettingsTabValue(value: string): string {
    return (value.charAt(0).toUpperCase() + value.slice(1)).replaceAll(
      '-',
      ' ',
    );
  }

  const headerMenuOptions: Array<ReactNode> = useMemo(() => {
    let options: Array<ReactNode> = [];
    switch (title) {
      case 'Todo List':
        options = [
          <div key="left-right-button-div" className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate('prev')}
            >
              <ArrowBigLeft />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate('next')}
            >
              <ArrowBigRight />
            </Button>
          </div>,
          <TodoListConfig key="todo-list-config-popover" />,
          <NewTaskModal key="new-task-button" />,
        ];
        break;
      case 'Unassigned Tasks':
        options = [
          <Button
            key="unassigned-sort-button"
            variant="outline"
            size="sm"
            onClick={() => uiStoreActions.toggleUnassignedSort()}
          >
            {unassignedSortBy === 'priority' ? (
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
          </Button>,
          <NewTaskModal key="new-task-button" />,
        ];
        break;
      // DISABLED: Calendar feature
      // case 'Calendar':
      //   options = [
      //     <div key="calendar-nav-buttons" className="flex gap-2">
      //       <Button
      //         variant="outline"
      //         size="icon"
      //         onClick={() => handleCalendarNavigate('prev')}
      //       >
      //         <ArrowBigLeft />
      //       </Button>
      //       <Button
      //         variant="outline"
      //         size="icon"
      //         onClick={() => handleCalendarNavigate('next')}
      //       >
      //         <ArrowBigRight />
      //       </Button>
      //     </div>,
      //     <Button
      //       key="calendar-today-button"
      //       variant="outline"
      //       onClick={() => uiStoreActions.setCalendarBaseDate(new Date())}
      //     >
      //       Today
      //     </Button>,
      //     <CalendarConfig key="calendar-config-popover" />,
      //   ];
      //   break;
      case 'Settings':
        options = isMobile
          ? [
              <Select
                key="settings-tab-select"
                value={settingsTab}
                onValueChange={onSettingsSelected}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {displaySettingsTabValue(settingsTab)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="general">General</SelectItem> */}
                  <SelectItem value="appearance">Appearance</SelectItem>
                  <SelectItem value="todo-list">Todo List</SelectItem>
                  <SelectItem value="tasks">Tasks</SelectItem>
                  {/* <SelectItem value="calendar">Calendar</SelectItem> */}
                  {/* <SelectItem value="integrations">Integrations</SelectItem> */}
                </SelectContent>
              </Select>,
            ]
          : UI_STORE_SETTINGS_TABS.map((value) => (
              <Button
                key={`settings-tab-button-${value}`}
                variant="outline"
                onClick={() => onSettingsSelected(value)}
              >
                {displaySettingsTabValue(value)}
              </Button>
            ));

        break;
    }
    return withVerticalSeparators(options);
  }, [title, timeSpan, calendarView, isMobile, settingsTab, unassignedSortBy]);

  return (
    <header className="w-full flex items-center justify-between py-2 px-4">
      <div className="flex h-full py-2 items-center gap-4">
        <SidebarTrigger />
        <Separator
          key={`sep-side-trigger-title`}
          orientation="vertical"
          className="border-1"
        />
        <div className="font-large">{title}</div>
      </div>
      <div className="flex h-full items-center gap-4 p-2 border-1">
        {headerMenuOptions}
      </div>
    </header>
  );
}
