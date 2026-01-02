import type { TodoList } from '@/db/schemas/todo_list.schema';
import type { UserSettings } from '@/db/schemas/user.schema';
import type { Task } from '@/db/schemas/task.schema';

export type TodoListWithTasks = TodoList & { tasks: Array<Task> };

export type TodoListOptions = UserSettings['todoList'];

export interface TodoListContextValue {
  options: TodoListOptions;
  baseDate: Date;
}
