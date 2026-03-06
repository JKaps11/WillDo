import type { Priority } from '@/db/schemas/task.schema';
import type { TaskWithOptionalSkillInfo, TodoListOptions } from './types';

const PRIORITY_RANK: Record<Priority, number> = {
  Very_High: 5,
  High: 4,
  Medium: 3,
  Low: 2,
  Very_Low: 1,
};

export function sortAndFilterTasks(
  tasks: Array<TaskWithOptionalSkillInfo>,
  options: TodoListOptions,
): Array<TaskWithOptionalSkillInfo> {
  const filtered = options.showCompleted
    ? tasks
    : tasks.filter((t) => !t.completed);

  const sorted = [...filtered];

  // Always push completed to bottom
  sorted.sort((a, b) => Number(a.completed) - Number(b.completed));

  if (options.sortBy === 'alphabetical') {
    sorted.sort((a, b) => {
      const c = Number(a.completed) - Number(b.completed);
      if (c !== 0) return c;
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }

  if (options.sortBy === 'priority') {
    sorted.sort((a, b) => {
      const c = Number(a.completed) - Number(b.completed);
      if (c !== 0) return c;
      return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    });
    return sorted;
  }

  // sortBy === 'date' (dueDate first; nulls last)
  sorted.sort((a, b) => {
    const c = Number(a.completed) - Number(b.completed);
    if (c !== 0) return c;

    const at = a.dueDate ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
    const bt = b.dueDate ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
    return at - bt;
  });

  return sorted;
}

export function formatPriority(priority: Priority): string {
  const s = priority.replaceAll('_', ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
