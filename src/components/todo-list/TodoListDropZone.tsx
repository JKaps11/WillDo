import { useDroppable } from '@dnd-kit/core';
import { useDndState } from '@/components/dnd';
import { cn } from '@/lib/utils';

import type { ReactNode } from 'react';

interface TodoListDropZoneProps {
    children: ReactNode;
    date: Date;
    className?: string;
}

export function TodoListDropZone({ children, date, className }: TodoListDropZoneProps): ReactNode {
    const { isDragging } = useDndState();
    const { isOver, setNodeRef } = useDroppable({
        id: `dropzone-${date.toISOString()}`,
        data: { date },
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'h-full transition-all rounded-md',
                isDragging && 'ring-2 ring-primary/30 ring-inset',
                isOver && 'ring-2 ring-primary ring-inset',
                className
            )}
        >
            {children}
        </div>
    );
}
