import { createContext, useContext } from 'react';
import type { TaskContextValue } from './types';

const TaskContext = createContext<TaskContextValue | null>(null);

export function useTaskContext(): TaskContextValue {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('Task compound components must be used within Task.Root');
    }
    return context;
}

export { TaskContext };
