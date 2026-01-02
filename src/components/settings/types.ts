import type {
  AppearanceTheme,
  TodoListSortBy,
  TodoListTimeSpan,
  UserSettings,
} from '@/db/schemas/user.schema';

export interface SettingsContextValue {
  settings: UserSettings;
}

export interface AppearanceSettingsProps {
  theme: AppearanceTheme;
  onThemeChange: (theme: AppearanceTheme) => void;
}

export interface TodoListSettingsProps {
  sortBy: TodoListSortBy;
  timeSpan: TodoListTimeSpan;
  showCompleted: boolean;
  onSortByChange: (sortBy: TodoListSortBy) => void;
  onTimeSpanChange: (timeSpan: TodoListTimeSpan) => void;
  onShowCompletedChange: (showCompleted: boolean) => void;
}
