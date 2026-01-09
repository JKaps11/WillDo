import type { UserSettings } from '@/db/schemas/user.schema';

// Re-export from repository for consistency
export type {
  TodoListDay,
  TaskWithSkillInfo,
} from '@/db/repositories/task.repository';

export type TodoListOptions = UserSettings['todoList'];

export interface TodoListContextValue {
  options: TodoListOptions;
  baseDate: Date;
}
