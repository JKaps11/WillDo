import type { DaysOfWeek, RecurrenceRule } from '@/db/schemas/task.schema';
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

const DAYS_OF_WEEK: Array<{ value: DaysOfWeek; label: string; fullLabel: string }> = [
  { value: 'sunday', label: 'S', fullLabel: 'Sunday' },
  { value: 'monday', label: 'M', fullLabel: 'Monday' },
  { value: 'tuesday', label: 'T', fullLabel: 'Tuesday' },
  { value: 'wednesday', label: 'W', fullLabel: 'Wednesday' },
  { value: 'thursday', label: 'T', fullLabel: 'Thursday' },
  { value: 'friday', label: 'F', fullLabel: 'Friday' },
  { value: 'saturday', label: 'S', fullLabel: 'Saturday' },
];

interface RecurrenceSelectorProps {
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
}

export function RecurrenceSelector({
  value,
  onChange,
}: RecurrenceSelectorProps): React.ReactElement {
  const handleFrequencyChange = (frequency: 'daily' | 'weekly'): void => {
    const newRule: RecurrenceRule = {
      ...value,
      frequency,
    };
    // Reset frequency-specific fields
    if (frequency !== 'weekly') {
      delete newRule.daysOfWeek;
    } else {
      newRule.daysOfWeek = ['monday']; // Default to Monday
    }
    onChange(newRule);
  };

  const handleIntervalChange = (interval: number): void => {
    onChange({ ...value, interval: Math.max(1, interval) });
  };

  const handleDaysOfWeekChange = (days: Array<string>): void => {
    onChange({
      ...value,
      daysOfWeek: days as Array<DaysOfWeek>,
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
          </SelectContent>
        </Select>
      </div>

      {value.frequency === 'weekly' && (
        <div className="space-y-2">
          <Label>On days</Label>
          <ToggleGroup
            type="multiple"
            value={value.daysOfWeek ?? []}
            onValueChange={handleDaysOfWeekChange}
            className="justify-start"
          >
            {DAYS_OF_WEEK.map((day) => (
              <ToggleGroupItem
                key={day.value}
                value={day.value}
                aria-label={day.fullLabel}
                className="size-8"
              >
                {day.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}
