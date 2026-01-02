import { Settings } from './Settings';
import type { CalendarView } from '@/db/schemas/user.schema';
import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SettingsCalendarTabProps {
  startOfWeek: 0 | 1 | 6;
  defaultEventDuration: 30 | 60 | 90 | 120;
  defaultView: CalendarView;
  googleCalendarSync: boolean;
  onStartOfWeekChange: (value: 0 | 1 | 6) => void;
  onDefaultEventDurationChange: (value: 30 | 60 | 90 | 120) => void;
  onDefaultViewChange: (value: CalendarView) => void;
  onGoogleCalendarSyncChange: (value: boolean) => void;
}

export function SettingsCalendarTab({
  startOfWeek,
  defaultEventDuration,
  defaultView,
  onStartOfWeekChange,
  onDefaultEventDurationChange,
  onDefaultViewChange,
}: SettingsCalendarTabProps): ReactNode {
  return (
    <Settings.Root>
      <Settings.Header
        title="Calendar"
        description="Configure calendar settings and integrations."
      />

      <Settings.Section
        title="Display"
        description="Customize how your calendar is displayed"
      >
        <Settings.FieldGroup>
          <Settings.Field
            label="Start of Week"
            description="First day shown in calendar views"
          >
            <Select
              value={startOfWeek.toString()}
              onValueChange={(value) =>
                onStartOfWeekChange(parseInt(value) as 0 | 1 | 6)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </Settings.Field>

          <Settings.Field
            label="Default Event Duration"
            description="Default length for new events"
          >
            <Select
              value={defaultEventDuration.toString()}
              onValueChange={(value) =>
                onDefaultEventDurationChange(
                  parseInt(value) as 30 | 60 | 90 | 120,
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </Settings.Field>

          <Settings.Field
            label="Default View"
            description="View shown when opening calendar"
          >
            <Select value={defaultView} onValueChange={onDefaultViewChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </Settings.Field>
        </Settings.FieldGroup>
      </Settings.Section>

      <Settings.Section
        title="Google Calendar"
        description="Integration with Google Calendar (coming soon)"
      >
        <Settings.Placeholder
          title="Coming Soon"
          description="Google Calendar sync will be available in a future update."
        />
      </Settings.Section>
    </Settings.Root>
  );
}
