import { Store } from '@tanstack/store';
import type { UIStoreActions, UIStoreHeaderName, UIStoreState } from '@/types/ui_store_types';

const initialState: UIStoreState = {
    headerName: 'Todo List',
    todoListOptions: {
        sortBy: 'date',
        timeSpan: 'week',
        showCompleted: true,
    },
};

export const uiStore = new Store<UIStoreState>(initialState);

export const uiStoreActions: UIStoreActions = {
    setHeaderName: (name: UIStoreHeaderName) => {
        uiStore.setState((state) => ({
            ...state,
            headerName: name,
        }));
    },
    setTodoListOptions: (options: Partial<UIStoreState['todoListOptions']>) => {
        uiStore.setState((state) => ({
            ...state,
            todoListOptions: {
                ...state.todoListOptions,
                ...options,
            },
        }));
    }
};