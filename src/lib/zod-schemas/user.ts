// Re-export from shared package — single source of truth
export {
  appearanceThemeSchema,
  todoListSortBySchema,
  todoListTimeSpanSchema,
  notificationSettingsSchema,
  userSettingsSchema,
  createUserSchema,
  updateUserSchema,
  setActiveSkillSchema,
  patchUserSettingsSchema,
} from '@willdo/shared';
export type { PatchUserSettings } from '@willdo/shared';
