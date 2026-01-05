import { CalendarDropZone } from './CalendarDropZone';
import type { Event } from '@/db/schemas/event.schema';

interface WeekViewProps {
  currentDate: Date;
  events: Array<Event>;
  onEventClick?: (event: Event) => void;
  onTimeSlotClick?: (date: Date, time: number) => void;
}

export function WeekView({
  currentDate,
  events,
  onEventClick,
  onTimeSlotClick,
}: WeekViewProps): React.ReactNode {
  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-8 border-b bg-muted/50">
        <div className="p-2 text-sm font-medium text-muted-foreground">
          Time
        </div>
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="p-2 text-center border-l">
            <div className="text-sm font-medium">
              {day.toLocaleDateString('en-US', {
                weekday: 'short',
              })}
            </div>
            <div
              className={`text-xl ${isToday(day) ? 'text-primary font-bold' : ''}`}
            >
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto max-h-[600px] scrollbar-hide">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b">
            {/* Time label */}
            <div className="p-2 text-sm text-muted-foreground">
              {formatHour(hour)}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const slotDate = new Date(day);
              slotDate.setHours(hour, 0, 0, 0);

              const slotEvents = getEventsForTimeSlot(events, slotDate, hour);

              return (
                <CalendarDropZone
                  key={`${day.toISOString()}-${hour}`}
                  date={day}
                  hour={hour}
                >
                  <div onClick={() => onTimeSlotClick?.(day, hour)}>
                    {slotEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-xs p-1 mb-1 rounded truncate"
                        style={{
                          backgroundColor: event.color,
                          color: getContrastColor(event.color),
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                      >
                        {formatTime(event.startTime)} {event.title}
                      </div>
                    ))}
                  </div>
                </CalendarDropZone>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Get array of dates for the current week
 */
function getWeekDays(date: Date): Array<Date> {
  const days: Array<Date> = [];
  const current = new Date(date);
  const dayOfWeek = current.getDay();

  // Go to Sunday of current week
  current.setDate(current.getDate() - dayOfWeek);

  // Get all 7 days
  for (let i = 0; i < 7; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
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
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}
