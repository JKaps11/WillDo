import type { UserSettings } from '@/db/schemas/user.schema';

// Re-export from repository for consistency
export type {
  TodoListWithTasks,
  TaskWithSkillContext,
} from '@/db/repositories/todo_list.repository';

export type TodoListOptions = UserSettings['todoList'];

export interface TodoListContextValue {
  options: TodoListOptions;
  baseDate: Date;
}
