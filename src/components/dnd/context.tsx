import { createContext, useContext } from 'react';

export interface DndContextValue {
    isDragging: boolean;
}

export const DndStateContext = createContext<DndContextValue | null>(null);

export function useDndState(): DndContextValue {
    const context = useContext(DndStateContext);
    if (!context) {
        throw new Error('useDndState must be used within a DndProvider');
    }
    return context;
}
