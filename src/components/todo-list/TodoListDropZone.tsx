import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { useDndState } from '@/components/dnd';
import { cn } from '@/lib/utils';

interface TodoListDropZoneProps {
  children: ReactNode;
  date: Date;
  className?: string;
}

export function TodoListDropZone({
  children,
  date,
  className,
}: TodoListDropZoneProps): ReactNode {
  const { isDragging } = useDndState();
  const { isOver, setNodeRef } = useDroppable({
    id: `dropzone-${date.toISOString()}`,
    data: { type: 'todolist', date },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'h-full transition-all duration-200 rounded-lg',
        isDragging && 'outline outline-2 outline-primary/40 outline-offset-2',
        isOver &&
          'outline outline-2 outline-primary outline-offset-2 scale-[1.02]',
        className,
      )}
    >
      {children}
    </div>
  );
}
