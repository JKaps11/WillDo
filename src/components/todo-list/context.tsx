import type { TodoListContextValue } from './types';
import { createContext, useContext } from 'react';

const TodoListContext = createContext<TodoListContextValue | null>(null);

export function useTodoListContext(): TodoListContextValue {
  const context = useContext(TodoListContext);
  if (!context) {
    throw new Error(
      'TodoList compound components must be used within TodoList.Root',
    );
  }
  return context;
}

export { TodoListContext };
