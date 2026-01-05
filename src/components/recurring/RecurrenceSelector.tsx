import type { RecurrenceRule } from '@/db/schemas/task.schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DAYS_OF_WEEK = [
  { value: 0, label: 'S', fullLabel: 'Sunday' },
  { value: 1, label: 'M', fullLabel: 'Monday' },
  { value: 2, label: 'T', fullLabel: 'Tuesday' },
  { value: 3, label: 'W', fullLabel: 'Wednesday' },
  { value: 4, label: 'T', fullLabel: 'Thursday' },
  { value: 5, label: 'F', fullLabel: 'Friday' },
  { value: 6, label: 'S', fullLabel: 'Saturday' },
];

interface RecurrenceSelectorProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

export function RecurrenceSelector({
  value,
  onChange,
}: RecurrenceSelectorProps): React.ReactElement {
  const handleFrequencyChange = (
    frequency: 'daily' | 'weekly' | 'monthly',
  ): void => {
    const newRule: RecurrenceRule = {
      ...value,
      frequency,
    };
    // Reset frequency-specific fields
    if (frequency !== 'weekly') {
      delete newRule.daysOfWeek;
    } else {
      newRule.daysOfWeek = [1]; // Default to Monday
    }
    if (frequency !== 'monthly') {
      delete newRule.dayOfMonth;
    } else {
      newRule.dayOfMonth = 1; // Default to 1st
    }
    onChange(newRule);
  };

  const handleIntervalChange = (interval: number): void => {
    onChange({ ...value, interval: Math.max(1, interval) });
  };

  const handleDaysOfWeekChange = (days: Array<string>): void => {
    onChange({
      ...value,
      daysOfWeek: days.map(Number),
    });
  };

  const handleDayOfMonthChange = (day: number): void => {
    onChange({
      ...value,
      dayOfMonth: Math.min(31, Math.max(1, day)),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Label htmlFor="interval" className="shrink-0">
          Every
        </Label>
        <Input
          id="interval"
          type="number"
          min={1}
          value={value.interval}
          onChange={(e) =>
            handleIntervalChange(parseInt(e.target.value, 10) || 1)
          }
          className="w-16"
        />
        <Select value={value.frequency} onValueChange={handleFrequencyChange}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">
              {value.interval === 1 ? 'day' : 'days'}
            </SelectItem>
            <SelectItem value="weekly">
              {value.interval === 1 ? 'week' : 'weeks'}
            </SelectItem>
            <SelectItem value="monthly">
              {value.interval === 1 ? 'month' : 'months'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {value.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label>On days</Label>
          <ToggleGroup
            type="multiple"
            value={(value.daysOfWeek ?? []).map(String)}
            onValueChange={handleDaysOfWeekChange}
            className="justify-start"
          >
            {DAYS_OF_WEEK.map((day) => (
              <ToggleGroupItem
                key={day.value}
                value={String(day.value)}
                aria-label={day.fullLabel}
                className="size-8"
              >
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {value.frequency === 'monthly' && (
        <div className="flex items-center gap-3">
          <Label htmlFor="dayOfMonth" className="shrink-0">
            On day
          </Label>
          <Input
            id="dayOfMonth"
            type="number"
            min={1}
            max={31}
            value={value.dayOfMonth ?? 1}
            onChange={(e) =>
              handleDayOfMonthChange(parseInt(e.target.value, 10) || 1)
            }
            className="w-16"
          />
          <span className="text-sm text-muted-foreground">of each month</span>
        </div>
      )}
    </div>
  );
}
