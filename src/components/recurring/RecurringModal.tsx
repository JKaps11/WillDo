import { CalendarClock, CalendarIcon, Repeat } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

import { RecurrenceEndSelector } from './RecurrenceEndSelector';
import { RecurrenceSelector } from './RecurrenceSelector';
import type {
  RecurrenceEndType,
  RecurrenceRule,
  Task,
} from '@/db/schemas/task.schema';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface RecurringModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  targetDate: Date;
  onConfirm: (options: RecurringOptions) => void;
}

export interface RecurringOptions {
  isRecurring: boolean;
  selectedDate: Date;
  recurrenceRule?: RecurrenceRule;
  recurrenceEndType?: RecurrenceEndType;
  recurrenceEndValue?: number;
}

const DEFAULT_RECURRENCE_RULE: RecurrenceRule = {
  isRecurring: true,
  frequency: 'daily',
  interval: 1,
  endType: 'never',
};

export function RecurringModal({
  open,
  onOpenChange,
  task,
  targetDate,
  onConfirm,
}: RecurringModalProps): React.ReactElement {
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(targetDate);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>(
    DEFAULT_RECURRENCE_RULE,
  );
  const [endType, setEndType] = useState<RecurrenceEndType>('never');
  const [endValue, setEndValue] = useState<number | undefined>(undefined);

  // Pre-populate form when modal opens with existing recurrence rule
  useEffect(() => {
    if (open && task.recurrenceRule) {
      const rule = task.recurrenceRule;
      setIsRecurring(rule.isRecurring);
      setSelectedDate(targetDate);
      setRecurrenceRule({
        isRecurring: rule.isRecurring,
        frequency: rule.frequency,
        interval: rule.interval,
        daysOfWeek: rule.daysOfWeek,
        endType: rule.endType,
        endAfterCount: rule.endAfterCount,
        endOnDate: rule.endOnDate,
      });
      setEndType(rule.endType);
      setEndValue(rule.endAfterCount);
    } else if (open) {
      // Reset to defaults when opening without existing rule
      setIsRecurring(false);
      setSelectedDate(targetDate);
      setRecurrenceRule(DEFAULT_RECURRENCE_RULE);
      setEndType('never');
      setEndValue(undefined);
    }
  }, [open, task.recurrenceRule, targetDate]);

  const handleConfirm = (): void => {
    if (isRecurring) {
      onConfirm({
        isRecurring: true,
        selectedDate,
        recurrenceRule,
        recurrenceEndType: endType,
        recurrenceEndValue: endValue,
      });
    } else {
      onConfirm({ isRecurring: false, selectedDate });
    }
    onOpenChange(false);
  };

  const handleCancel = (): void => {
    // Reset state
    setIsRecurring(false);
    setSelectedDate(targetDate);
    setRecurrenceRule(DEFAULT_RECURRENCE_RULE);
    setEndType('never');
    setEndValue(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5" />
            Schedule Task
          </DialogTitle>
          <DialogDescription>
            Configure schedule for &quot;{task.name}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <CalendarIcon className="size-4" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <Label
              htmlFor="recurring-toggle"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Repeat className="size-4" />
              Make this a recurring task
            </Label>
            <Switch
              id="recurring-toggle"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <>
              <Separator />
              <RecurrenceSelector
                value={recurrenceRule}
                onChange={setRecurrenceRule}
              />
              <Separator />
              <RecurrenceEndSelector
                endType={endType}
                endValue={endValue}
                onEndTypeChange={setEndType}
                onEndValueChange={setEndValue}
              />
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {isRecurring ? 'Schedule Recurring' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
