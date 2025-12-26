import type { Task } from '@/db/schemas/task.schema';

export interface TaskContextValue {
    task: Task;
    onUpdate: (task: Task) => void;
}
