import type { UserSettings } from "@/db/schemas/user.schema";

export type UIStoreHeaderName = 'Todo List' | 'Calendar' | 'Settings';

export interface UIStoreState {
    headerName: UIStoreHeaderName;
    todoListOptions: UserSettings['todoList']
}

export type UIStoreActions = {
    setHeaderName: (name: UIStoreHeaderName) => void;
    setTodoListOptions: (options: Partial<UserSettings['todoList']>) => void;
};