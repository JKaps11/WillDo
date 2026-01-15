import { Store } from '@tanstack/store';
import type { Task } from '@/db/schemas/task.schema';
import type { TodoListTimeSpan } from '@/db/schemas/user.schema';
import { addDays, startOfDay } from '@/utils/dates';

export const UI_STORE_SETTINGS_TABS = [
  'appearance',
  'todo-list',
  'tasks',
  // 'general', // DISABLED: General settings
  // 'calendar', // DISABLED: Calendar feature
  // 'integrations', // DISABLED: Not implemented
] as const;

export type UIStoreSettingsTab = (typeof UI_STORE_SETTINGS_TABS)[number];

export type UnassignedSortOption = 'priority' | 'alphabetical';

export interface RecurrenceModalState {
  isOpen: boolean;
  task: Task | null;
  targetDate: Date | null;
}

export interface UIStoreState {
  settingsTab: UIStoreSettingsTab;
  todoListBaseDate: Date;
  calendarBaseDate: Date;
  unassignedSortBy: UnassignedSortOption;
  showArchivedSkills: boolean;
  showCreateSubSkillModal: boolean;
  showAssignTasksSheet: boolean;
  recurrenceModal: RecurrenceModalState;
}

export type UIStoreActions = {
  setSettingsTab: (tab: UIStoreSettingsTab) => void;
  setTodoListBaseDate: (date: Date) => void;
  navigateTodoList: (
    direction: 'prev' | 'next',
    timeSpan: TodoListTimeSpan,
  ) => void;
  setCalendarBaseDate: (date: Date) => void;
  // navigateCalendar: (direction: 'prev' | 'next', view: CalendarView) => void;
  toggleUnassignedSort: () => void;
  toggleShowArchivedSkills: () => void;
  setShowCreateSubSkillModal: (show: boolean) => void;
  setShowAssignTasksSheet: (show: boolean) => void;
  openRecurrenceModal: (task: Task, targetDate?: Date) => void;
  closeRecurrenceModal: () => void;
};

const initialState: UIStoreState = {
  settingsTab: 'appearance',
  todoListBaseDate: startOfDay(new Date()),
  calendarBaseDate: startOfDay(new Date()),
  unassignedSortBy: 'priority',
  showArchivedSkills: false,
  showCreateSubSkillModal: false,
  showAssignTasksSheet: false,
  recurrenceModal: {
    isOpen: false,
    task: null,
    targetDate: null,
  },
};

export const uiStore = new Store<UIStoreState>(initialState);

export const uiStoreActions: UIStoreActions = {
  setSettingsTab: (tab: UIStoreSettingsTab) => {
    uiStore.setState((state) => ({
      ...state,
      settingsTab: tab,
    }));
  },
  setTodoListBaseDate: (date: Date) => {
    uiStore.setState((state) => ({
      ...state,
      todoListBaseDate: startOfDay(date),
    }));
  },
  navigateTodoList: (
    direction: 'prev' | 'next',
    timeSpan: TodoListTimeSpan,
  ) => {
    const amount = timeSpan === 'week' ? 7 : 1;
    const delta = direction === 'prev' ? -amount : amount;
    uiStore.setState((state) => ({
      ...state,
      todoListBaseDate: addDays(state.todoListBaseDate, delta),
    }));
  },
  setCalendarBaseDate: (date: Date) => {
    uiStore.setState((state) => ({
      ...state,
      calendarBaseDate: startOfDay(date),
    }));
  },
  // navigateCalendar: (direction: 'prev' | 'next', view: CalendarView) => {
  //   uiStore.setState((state) => {
  //     const current = state.calendarBaseDate;
  //     let newDate: Date;

  //     switch (view) {
  //       case 'month':
  //         newDate = new Date(
  //           current.getFullYear(),
  //           current.getMonth() + (direction === 'prev' ? -1 : 1),
  //           1,
  //         );
  //         break;
  //       case 'week':
  //         newDate = addDays(current, direction === 'prev' ? -7 : 7);
  //         break;
  //       case 'day':
  //         newDate = addDays(current, direction === 'prev' ? -1 : 1);
  //         break;
  //     }

  //     return {
  //       ...state,
  //       calendarBaseDate: newDate,
  //     };
  //   });
  // },
  toggleUnassignedSort: () => {
    uiStore.setState((state) => ({
      ...state,
      unassignedSortBy:
        state.unassignedSortBy === 'priority' ? 'alphabetical' : 'priority',
    }));
  },
  toggleShowArchivedSkills: () => {
    uiStore.setState((state) => ({
      ...state,
      showArchivedSkills: !state.showArchivedSkills,
    }));
  },
  setShowCreateSubSkillModal: (show: boolean) => {
    uiStore.setState((state) => ({
      ...state,
      showCreateSubSkillModal: show,
    }));
  },
  setShowAssignTasksSheet: (show: boolean) => {
    uiStore.setState((state) => ({
      ...state,
      showAssignTasksSheet: show,
    }));
  },
  openRecurrenceModal: (task: Task, targetDate?: Date) => {
    uiStore.setState((state) => ({
      ...state,
      recurrenceModal: {
        isOpen: true,
        task,
        targetDate: targetDate ?? task.todoListDate ?? new Date(),
      },
    }));
  },
  closeRecurrenceModal: () => {
    uiStore.setState((state) => ({
      ...state,
      recurrenceModal: {
        isOpen: false,
        task: null,
        targetDate: null,
      },
    }));
  },
};
