import {
  Archive,
  ArrowBigLeft,
  ArrowBigRight,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Plus,
  Upload,
} from 'lucide-react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { withVerticalSeparators } from './utils';
import type { ReactNode } from 'react';
import type { UIStoreSettingsTab, UnassignedSortOption } from '@/lib/store';
import { HELP_TOPICS } from '@/components/help';
import { UI_STORE_SETTINGS_TABS, uiStore, uiStoreActions } from '@/lib/store';

import { ImportSkillModal } from '@/components/skills-hub/ImportSkillModal';
import TodoListConfig from '@/components/todo-list/TodoListConfig';
import { useTRPC } from '@/integrations/trpc/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { addDays } from '@/lib/dates';

interface Breadcrumb {
  label: PageTitle;
  href?: string;
}

function getBreadcrumbs(pathname: string): Array<Breadcrumb> {
  const segment = pathname.split('/')[2] ?? '';

  if (segment === 'skills') {
    const breadcrumbs: Array<Breadcrumb> = [
      { label: 'Skill Hub', href: '/app/skills' },
    ];

    if (pathname.endsWith('/new')) {
      breadcrumbs.push({ label: 'New Skill' });
    } else if (pathname.includes('/planner')) {
      breadcrumbs.push({ label: 'Skill Planner' });
    } else {
      // On the main skills page, no href needed for last item
      breadcrumbs[0] = { label: 'Skill Hub' };
    }

    return breadcrumbs;
  }

  // For non-skills pages, return single breadcrumb
  return [{ label: getPageTitle(pathname) }];
}

function getPageTitle(pathname: string): PageTitle {
  const segment = pathname.split('/')[2] ?? '';
  switch (segment) {
    case '':
    case 'dashboard':
      return 'Dashboard';
    case 'todolist':
      return 'Todo List';
    case 'skills':
      if (pathname.endsWith('/new')) return 'New Skill';
      if (pathname.includes('/planner')) return 'Skill Planner';
      return 'Skill Hub';
    case 'help':
      return 'Help';
    case 'settings':
      return 'Settings';
    default:
      return 'Dashboard';
  }
}

export default function AppHeader(): React.ReactNode {
  const isMobile: boolean = useIsMobile();
  const trpc = useTRPC();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const search = useRouterState({ select: (s) => s.location.search });
  const navigate = useNavigate();

  const title: PageTitle = getPageTitle(pathname);
  const breadcrumbs: Array<Breadcrumb> = getBreadcrumbs(pathname);

  const { data: user } = useQuery(trpc.user.get.queryOptions());
  const timeSpan = user?.settings.todoList.timeSpan ?? 'day';

  const { data: unassignedTasks } = useQuery(
    trpc.task.listUnassignedWithSkillInfo.queryOptions(),
  );
  const unassignedCount = unassignedTasks?.length ?? 0;

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next'): void => {
      const currentDate =
        'date' in search && typeof search.date === 'string'
          ? new Date(search.date)
          : new Date();

      const amount = timeSpan === 'week' ? 7 : 1;
      const delta = direction === 'prev' ? -amount : amount;
      const newDate = addDays(currentDate, delta);

      navigate({
        to: '/app/todolist',
        search: { date: newDate.toISOString() },
      });
    },
    [search, timeSpan, navigate],
  );

  const settingsTab: UIStoreSettingsTab = useStore(
    uiStore,
    (s) => s.settingsTab,
  );
  const unassignedSortBy: UnassignedSortOption = useStore(
    uiStore,
    (s) => s.unassignedSortBy,
  );
  const showArchivedSkills: boolean = useStore(
    uiStore,
    (s) => s.showArchivedSkills,
  );
  function onSettingsSelected(value: UIStoreSettingsTab | null): void {
    if (value) {
      uiStoreActions.setSettingsTab(value);
    }
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
          <div key="assign-tasks-button" className="relative">
            <Button
              variant="outline"
              onClick={() => uiStoreActions.setShowAssignTasksSheet(true)}
            >
              <ClipboardList className="mr-2 size-4" />
              Assign Tasks
            </Button>
            {unassignedCount > 0 && (
              <Badge className="absolute -top-2 -right-2 size-5 flex items-center justify-center p-0 text-xs">
                {unassignedCount}
              </Badge>
            )}
          </div>,
        ];
        break;
      case 'Skill Hub':
        options = [
          <Button
            key="toggle-archived-button"
            variant={showArchivedSkills ? 'default' : 'outline'}
            size="sm"
            onClick={() => uiStoreActions.toggleShowArchivedSkills()}
          >
            <Archive className="mr-2 size-4" />
            {showArchivedSkills ? 'Showing Archived' : 'Show Archived'}
          </Button>,
          <ImportSkillModal
            key="import-skill-modal"
            trigger={
              <Button nativeButton={false}>
                <Upload className="mr-2 size-4" />
                Import Skill
              </Button>
            }
          />,
          <Button
            key="new-skill-button"
            render={<Link to="/app/skills/new" />}
            nativeButton={false}
          >
            <Plus className="mr-2 size-4" />
            New Skill
          </Button>,
        ];
        break;
      case 'Skill Planner':
        options = [
          <Button
            key="create-subskill-button"
            data-testid="create-subskill-btn"
            onClick={() => uiStoreActions.setShowCreateSubSkillModal(true)}
          >
            <Plus className="mr-2 size-4" />
            Create Sub-skill
          </Button>,
        ];
        break;
      case 'Help':
        options = [
          <DropdownMenu key="help-topic-dropdown">
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              {HELP_TOPICS.find(
                (t) => t.id === (search as { topic?: string }).topic,
              )?.title ?? 'Getting Started'}
              <ChevronDown className="ml-2 size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {HELP_TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <DropdownMenuItem
                    key={topic.id}
                    render={
                      <Link to="/app/help" search={{ topic: topic.id }} />
                    }
                  >
                    <Icon className="mr-2 size-4" />
                    {topic.title}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>,
        ];
        break;
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
                  <SelectItem value="appearance">Appearance</SelectItem>
                  <SelectItem value="todo-list">Todo List</SelectItem>
                </SelectContent>
              </Select>,
            ]
          : UI_STORE_SETTINGS_TABS.map((value) => (
              <Button
                key={`settings-tab-button-${value}`}
                variant="outline"
                onClick={() => onSettingsSelected(value)}
                data-testid={`settings-tab-${value}`}
              >
                {displaySettingsTabValue(value)}
              </Button>
            ));

        break;
      case 'Dashboard':
        break;
      case 'New Skill':
        break;
      default:
        title satisfies never;
    }
    return withVerticalSeparators(options);
  }, [
    title,
    handleNavigate,
    isMobile,
    settingsTab,
    unassignedSortBy,
    showArchivedSkills,
    unassignedCount,
  ]);

  return (
    <header className="w-full flex items-center justify-between py-2 px-4">
      <div className="flex h-full py-2 items-center gap-4">
        <SidebarTrigger />
        <Separator
          key={`sep-side-trigger-title`}
          orientation="vertical"
          className="border-1"
        />
        <div className="flex items-center gap-1 font-medium">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 && (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              {crumb.href ? (
                <Link
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>
      {headerMenuOptions.length > 0 && (
        <div className="flex h-full items-center gap-4 p-2 border-1">
          {headerMenuOptions}
        </div>
      )}
    </header>
  );
}
