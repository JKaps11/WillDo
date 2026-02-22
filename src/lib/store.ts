import { Store } from '@tanstack/store';
import type { Task } from '@/db/schemas/task.schema';
import type { TodoListTimeSpan } from '@/db/schemas/user.schema';
import { addDays, startOfDay } from '@/lib/dates';

export const UI_STORE_SETTINGS_TABS = ['appearance', 'todo-list'] as const;

export type UIStoreSettingsTab = (typeof UI_STORE_SETTINGS_TABS)[number];

export type UnassignedSortOption = 'priority' | 'alphabetical';

export interface RecurrenceModalState {
  isOpen: boolean;
  task: Task | null;
  targetDate: Date | null;
}

export type MoveRecurringAction = 'this_only' | 'this_and_future' | 'all';

export interface MoveRecurringModalState {
  isOpen: boolean;
  task: Task | null;
  sourceDate: Date | null; // The expanded occurrence date being moved
  targetDate: Date | null; // Where the task is being dropped
}

export interface EvaluationModalState {
  isOpen: boolean;
  task: Task | null;
  occurrenceDate: Date | null;
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
  moveRecurringModal: MoveRecurringModalState;
  evaluationModal: EvaluationModalState;
}

export type UIStoreActions = {
  setSettingsTab: (tab: UIStoreSettingsTab) => void;
  setTodoListBaseDate: (date: Date) => void;
  navigateTodoList: (
    direction: 'prev' | 'next',
    timeSpan: TodoListTimeSpan,
  ) => void;
  setCalendarBaseDate: (date: Date) => void;
  toggleUnassignedSort: () => void;
  toggleShowArchivedSkills: () => void;
  setShowCreateSubSkillModal: (show: boolean) => void;
  setShowAssignTasksSheet: (show: boolean) => void;
  openRecurrenceModal: (task: Task, targetDate?: Date) => void;
  closeRecurrenceModal: () => void;
  openMoveRecurringModal: (
    task: Task,
    sourceDate: Date,
    targetDate: Date,
  ) => void;
  closeMoveRecurringModal: () => void;
  openEvaluationModal: (task: Task, occurrenceDate: Date) => void;
  closeEvaluationModal: () => void;
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
  moveRecurringModal: {
    isOpen: false,
    task: null,
    sourceDate: null,
    targetDate: null,
  },
  evaluationModal: {
    isOpen: false,
    task: null,
    occurrenceDate: null,
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
  openMoveRecurringModal: (task: Task, sourceDate: Date, targetDate: Date) => {
    uiStore.setState((state) => ({
      ...state,
      moveRecurringModal: {
        isOpen: true,
        task,
        sourceDate,
        targetDate,
      },
    }));
  },
  closeMoveRecurringModal: () => {
    uiStore.setState((state) => ({
      ...state,
      moveRecurringModal: {
        isOpen: false,
        task: null,
        sourceDate: null,
        targetDate: null,
      },
    }));
  },
  openEvaluationModal: (task: Task, occurrenceDate: Date) => {
    uiStore.setState((state) => ({
      ...state,
      evaluationModal: {
        isOpen: true,
        task,
        occurrenceDate,
      },
    }));
  },
  closeEvaluationModal: () => {
    uiStore.setState((state) => ({
      ...state,
      evaluationModal: {
        isOpen: false,
        task: null,
        occurrenceDate: null,
      },
    }));
  },
};
