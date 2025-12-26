import { Store } from '@tanstack/store';
import type { TodoListTimeSpan } from '@/db/schemas/user.schema';
import { addDays, startOfDay } from '@/utils/dates';

export const UI_STORE_HEADER_NAMES = [
  'Todo List',
  'Calendar',
  'Settings',
] as const;

export type UIStoreHeaderName = typeof UI_STORE_HEADER_NAMES[number];

export const UI_STORE_SETTINGS_TABS = [
  'appearance',
  'todo-list',
  'tasks',
  'calendar',
] as const;

export type UIStoreSettingsTab = typeof UI_STORE_SETTINGS_TABS[number];

export interface UIStoreState {
    headerName: UIStoreHeaderName;
    settingsTab: UIStoreSettingsTab;
    todoListBaseDate: Date;
}

export type UIStoreActions = {
    setHeaderName: (name: UIStoreHeaderName) => void;
    setSettingsTab: (tab: UIStoreSettingsTab) => void;
    setTodoListBaseDate: (date: Date) => void;
    navigateTodoList: (direction: 'prev' | 'next', timeSpan: TodoListTimeSpan) => void;
};

const initialState: UIStoreState = {
    headerName: 'Todo List',
    settingsTab: 'appearance',
    todoListBaseDate: startOfDay(new Date()),
};

export const uiStore = new Store<UIStoreState>(initialState);

export const uiStoreActions: UIStoreActions = {
    setHeaderName: (name: UIStoreHeaderName) => {
        uiStore.setState((state) => ({
            ...state,
            headerName: name,
        }));
    },
    setSettingsTab: (tab: UIStoreSettingsTab) => {
        uiStore.setState((state) => ({
            ...state,
            settingsTab: tab
        }))
    },
    setTodoListBaseDate: (date: Date) => {
        uiStore.setState((state) => ({
            ...state,
            todoListBaseDate: startOfDay(date),
        }));
    },
    navigateTodoList: (direction: 'prev' | 'next', timeSpan: TodoListTimeSpan) => {
        const amount = timeSpan === 'week' ? 7 : 1;
        const delta = direction === 'prev' ? -amount : amount;
        uiStore.setState((state) => ({
            ...state,
            todoListBaseDate: addDays(state.todoListBaseDate, delta),
        }));
    },
};
