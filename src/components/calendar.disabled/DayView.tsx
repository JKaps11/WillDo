import { CalendarDropZone } from './CalendarDropZone';
import type { Event } from '@/db/schemas/event.schema';

interface DayViewProps {
  currentDate: Date;
  events: Array<Event>;
  onEventClick?: (event: Event) => void;
  onTimeSlotClick?: (date: Date, time: number) => void;
}

export function DayView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}: DayViewProps): React.ReactNode {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Header with date */}
      <div className="border-b bg-muted/50 p-4">
        <div className="text-center">
          <div className="text-sm font-medium text-muted-foreground">
            {currentDate.toLocaleDateString('en-US', {
              weekday: 'long',
            })}
          </div>
          <div
            className={`text-3xl font-bold ${
              isToday(currentDate) ? 'text-primary' : ''
            }`}
          >
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
        {hours.map((hour) => {
          const slotDate = new Date(currentDate);
          slotDate.setHours(hour, 0, 0, 0);

          const slotEvents = getEventsForTimeSlot(events, slotDate, hour);

          return (
            <CalendarDropZone key={hour} date={currentDate} hour={hour}>
              <div className="flex border-b min-h-[80px]">
                {/* Time label */}
                <div className="w-24 p-2 text-sm text-muted-foreground shrink-0">
                  {formatHour(hour)}
                </div>

                {/* Event slot */}
                <div
                  className="flex-1 border-l p-2 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => onTimeSlotClick?.(currentDate, hour)}
                >
                  <div className="space-y-1">
                    {slotEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-2 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        style={{
                          backgroundColor: event.color,
                          color: getContrastColor(event.color),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm opacity-90">
                          {formatTimeRange(event.startTime, event.endTime)}
                        </div>
                        {event.location && (
                          <div className="text-xs opacity-75 mt-1">
                            📍 {event.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CalendarDropZone>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Check if a date is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Format hour as 12-hour time
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

/**
 * Format time from Date object
 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format time range
 */
function formatTimeRange(startTime: Date, endTime: Date): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Get events that fall within a specific time slot
 */
function getEventsForTimeSlot(
  events: Array<Event>,
  slotDate: Date,
  hour: number,
): Array<Event> {
  const slotStart = new Date(slotDate);
  slotStart.setHours(hour, 0, 0, 0);

  const slotEnd = new Date(slotDate);
  slotEnd.setHours(hour + 1, 0, 0, 0);

  return events.filter((event) => {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Event overlaps with this time slot
    return eventStart < slotEnd && eventEnd > slotStart;
  });
}

/**
 * Get contrasting text color for background
 */
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
