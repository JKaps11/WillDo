import { createFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import type { CalendarView } from '@/db/schemas/user.schema';
import type { Event } from '@/db/schemas/event.schema';
import { UnassignedTasksSheet } from '@/components/task/UnassignedTasksSheet';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { EventModal } from '@/components/calendar/EventModal';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayView } from '@/components/calendar/DayView';
import { useTRPC } from '@/integrations/trpc/react';
import { DndProvider } from '@/components/dnd';
import { ensureUser } from '@/utils/auth';
import { uiStore } from '@/lib/store';

export const Route = createFileRoute('/app/calendar')({
  loader: () => ensureUser(),
  component: RouteComponent,
});

function RouteComponent(): React.ReactNode {
  const trpc = useTRPC();

  const { data: user, isLoading: isUserLoading } = useQuery(
    trpc.user.get.queryOptions(),
  );

  // Get current date from store
  const currentDate = useStore(uiStore, (s) => s.calendarBaseDate);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [defaultStartTime, setDefaultStartTime] = useState<Date | undefined>();
  const [defaultEndTime, setDefaultEndTime] = useState<Date | undefined>();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Get view from user settings
  const view = user?.settings.calendar.defaultView ?? 'week';

  // Calculate time range based on view
  const { startTime, endTime } = getTimeRange(currentDate, view);

  const { data: events, isLoading: isEventsLoading } = useQuery(
    trpc.event.list.queryOptions({
      startTime,
      endTime,
    }),
  );

  if (isUserLoading) {
    return <LoadingSpinner />;
  }

  if (isEventsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DndProvider onDragStart={() => setSheetOpen(false)}>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </h2>
        </div>

        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            events={events ?? []}
            onEventClick={(event) => {
              setSelectedEvent(event);
              setDefaultStartTime(undefined);
              setDefaultEndTime(undefined);
              setModalOpen(true);
            }}
            onTimeSlotClick={(date, hour) => {
              const startTime = new Date(date);
              startTime.setHours(hour, 0, 0, 0);
              const endTime = new Date(startTime);
              endTime.setHours(hour + 1, 0, 0, 0);

              setSelectedEvent(undefined);
              setDefaultStartTime(startTime);
              setDefaultEndTime(endTime);
              setModalOpen(true);
            }}
          />
        )}

        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            events={events ?? []}
            onEventClick={(event) => {
              setSelectedEvent(event);
              setDefaultStartTime(undefined);
              setDefaultEndTime(undefined);
              setModalOpen(true);
            }}
            onDayClick={(date) => {
              const startTime = new Date(date);
              startTime.setHours(9, 0, 0, 0);
              const endTime = new Date(startTime);
              endTime.setHours(10, 0, 0, 0);

              setSelectedEvent(undefined);
              setDefaultStartTime(startTime);
              setDefaultEndTime(endTime);
              setModalOpen(true);
            }}
          />
        )}

        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={events ?? []}
            onEventClick={(event) => {
              setSelectedEvent(event);
              setDefaultStartTime(undefined);
              setDefaultEndTime(undefined);
              setModalOpen(true);
            }}
            onTimeSlotClick={(date, hour) => {
              const startTime = new Date(date);
              startTime.setHours(hour, 0, 0, 0);
              const endTime = new Date(startTime);
              endTime.setHours(hour + 1, 0, 0, 0);

              setSelectedEvent(undefined);
              setDefaultStartTime(startTime);
              setDefaultEndTime(endTime);
              setModalOpen(true);
            }}
          />
        )}

        <EventModal
          event={selectedEvent}
          defaultStartTime={defaultStartTime}
          defaultEndTime={defaultEndTime}
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) {
              setSelectedEvent(undefined);
              setDefaultStartTime(undefined);
              setDefaultEndTime(undefined);
            }
          }}
        />

        <UnassignedTasksSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    </DndProvider>
  );
}

/**
 * Calculate time range for querying events based on view
 */
function getTimeRange(
  date: Date,
  view: CalendarView,
): { startTime: Date; endTime: Date } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  switch (view) {
    case 'month': {
      // First day of month to last day of month
      const startTime = new Date(year, month, 1, 0, 0, 0);
      const endTime = new Date(year, month + 1, 0, 23, 59, 59);
      return { startTime, endTime };
    }
    case 'week': {
      // Start of week (Sunday) to end of week (Saturday)
      const dayOfWeek = date.getDay();
      const startTime = new Date(year, month, day - dayOfWeek, 0, 0, 0);
      const endTime = new Date(year, month, day + (6 - dayOfWeek), 23, 59, 59);
      return { startTime, endTime };
    }
    case 'day': {
      // Start of day to end of day
      const startTime = new Date(year, month, day, 0, 0, 0);
      const endTime = new Date(year, month, day, 23, 59, 59);
      return { startTime, endTime };
    }
  }
}
