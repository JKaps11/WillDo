import { useDroppable } from '@dnd-kit/core';
import { useDndState } from '../dnd/context';
import type { ReactNode } from 'react';

interface CalendarDropZoneProps {
  date: Date;
  hour: number;
  children: ReactNode;
}

export function CalendarDropZone({
  date,
  hour,
  children,
}: CalendarDropZoneProps): ReactNode {
  const { isDragging } = useDndState();

  const slotTime = new Date(date);
  slotTime.setHours(hour, 0, 0, 0);

  const { isOver, setNodeRef } = useDroppable({
    id: `calendar-slot-${date.toISOString()}-${hour}`,
    data: {
      type: 'calendar-slot',
      date,
      hour,
      slotTime,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
                min-h-[60px] border-l p-1 transition-all duration-200
                ${isDragging ? 'ring-1 ring-primary/40' : ''}
                ${isOver ? 'bg-primary/10 ring-2 ring-primary scale-[1.02]' : 'hover:bg-muted/30'}
                cursor-pointer
            `}
    >
      {children}
    </div>
  );
}
