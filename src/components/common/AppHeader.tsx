import { useStore } from '@tanstack/react-store'
import { useQuery } from '@tanstack/react-query';

import { useMemo } from 'react';
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react';
import { SelectItem } from '@radix-ui/react-select';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import NewTaskModal from '../NewTaskModal';
import { Select } from '../ui/select';
import { withVerticalSeparators } from './utils';
import type { ReactNode} from 'react';
import type { UIStoreHeaderName, UIStoreSettingsTab } from '@/lib/store';
import TodoListConfig from '@/components/todo-list/TodoListConfig';
import { UI_STORE_SETTINGS_TABS, uiStore, uiStoreActions } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTRPC } from '@/integrations/trpc/react';

export default function AppHeader(): React.ReactNode {
    const isMobile: boolean = useIsMobile();
    const trpc = useTRPC();

    const title: UIStoreHeaderName = useStore(uiStore, (s) => s.headerName);

    // Fetch user settings to get the timeSpan for navigation
    const { data: user } = useQuery(trpc.user.get.queryOptions());
    const timeSpan = user?.settings.todoList.timeSpan ?? 'day';

    function handleNavigate(direction: 'prev' | 'next'): void {
        uiStoreActions.navigateTodoList(direction, timeSpan);
    }

    const settingsTab: UIStoreSettingsTab = useStore(uiStore, (s) => s.settingsTab);
    function onSettingsSelected(value: string): void {
        uiStoreActions.setSettingsTab(value as UIStoreSettingsTab)
    }
    function displaySettingsTabValue(value: string): string {
        return (value.charAt(0).toUpperCase() + value.slice(1)).replaceAll('-', ' ');
    }

    const headerMenuOptions: Array<ReactNode> = useMemo(() => {
        let options: Array<ReactNode> = []
        switch (title) {
            case 'Todo List':
                options = [
                    <div key="left-right-button-div" className='flex gap-2'>
                        <Button variant="outline" size="icon" onClick={() => handleNavigate('prev')}>
                            <ArrowBigLeft/>
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleNavigate('next')}>
                            <ArrowBigRight/>
                        </Button>
                    </div>,
                    <TodoListConfig key="todo-list-config-popover"/>,
                    <NewTaskModal key="new-task-button"/>
                ]
                break;
            case 'Unassigned':
                options = [
                    <NewTaskModal key="new-task-button"/>
                ]
                break;
            case 'Calendar':
                options = []
                break;
            case 'Settings':
                options = isMobile ? [
                        <Select value={settingsTab} onValueChange={onSettingsSelected}>
                            <SelectItem value='appearance'>Appearance</SelectItem>
                            <SelectItem value='todo-list'>Todo List</SelectItem>
                            <SelectItem value='tasks'>Tasks</SelectItem>
                            <SelectItem value='calendar'>Calendar</SelectItem>
                        </Select>
                ] : UI_STORE_SETTINGS_TABS.map((value) => (
                        <Button 
                            key={`settings-tab-button-${value}`} 
                            variant="outline" 
                            onClick={() => onSettingsSelected(value)}
                        >
                            {displaySettingsTabValue(value)}
                        </Button>
                    )
                )
                
                break;
        }
        return withVerticalSeparators(options);
    }, [title, timeSpan, isMobile, settingsTab])


    return (
        <header className="w-full flex items-center justify-between py-2 px-4">
            <div className='flex h-full py-2 items-center gap-4'>
                <SidebarTrigger />
                <Separator
                    key={`sep-side-trigger-title`}
                    orientation="vertical"
                    className="border-1"
                />
                <div className="font-large">{title}</div>
            </div>
            <div className='flex h-full items-center gap-4 p-2 border-1'>
                {headerMenuOptions}
            </div>
        </header>
    )
}