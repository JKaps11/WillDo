import type { Event } from '@/db/schemas/event.schema';
import { CalendarDropZone } from './CalendarDropZone';

interface MonthViewProps {
  currentDate: Date;
  events: Array<Event>;
  onEventClick?: (event: Event) => void;
  onDayClick?: (date: Date) => void;
}

export function MonthView({
  currentDate,
  events,
  onEventClick,
  onDayClick,
}: MonthViewProps): React.ReactNode {
  const weeks = getMonthWeeks(currentDate);

  return (
    <div className="flex flex-col border rounded-lg overflow-hidden">
      {/* Header with day names */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1">
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className="grid grid-cols-7 border-b last:border-b-0"
          >
            {week.map((date, dayIndex) => {
              const dayEvents = getEventsForDay(events, date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = checkIsToday(date);

              return (
                <CalendarDropZone
                  key={`${weekIndex}-${dayIndex}`}
                  date={date}
                  hour={9}
                >
                  <div
                    className={`min-h-[100px] p-2 border-l first:border-l-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : ''
                    }`}
                    onClick={() => onDayClick?.(date)}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isToday
                          ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center'
                          : ''
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded truncate cursor-pointer"
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
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-muted-foreground pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
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
 * Get array of weeks for the current month (including overflow from prev/next months)
 */
function getMonthWeeks(date: Date): Array<Array<Date>> {
  const year = date.getFullYear();
  const month = date.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();

  // Start from the Sunday of the week containing the first day
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);

  const weeks: Array<Array<Date>> = [];
  const currentDate = new Date(startDate);

  // Generate 6 weeks (standard calendar grid)
  for (let week = 0; week < 6; week++) {
    const days: Array<Date> = [];
    for (let day = 0; day < 7; day++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    weeks.push(days);
  }

  return weeks;
}

/**
 * Get events that occur on a specific day
 */
function getEventsForDay(events: Array<Event>, date: Date): Array<Event> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return events
    .filter((event) => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      return eventStart < dayEnd && eventEnd > dayStart;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
}

/**
 * Check if a date is today
 */
function checkIsToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
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
