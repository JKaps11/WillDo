import { CalendarClock, CalendarIcon, Repeat } from 'lucide-react';
import { useState } from 'react';
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

interface RecurringFormState {
  isRecurring: boolean;
  selectedDate: Date;
  recurrenceRule: RecurrenceRule;
  endType: RecurrenceEndType;
  endValue: number | undefined;
}

function buildInitialState(task: Task, targetDate: Date): RecurringFormState {
  if (task.recurrenceRule) {
    const rule = task.recurrenceRule;
    return {
      isRecurring: rule.isRecurring,
      selectedDate: targetDate,
      recurrenceRule: {
        isRecurring: rule.isRecurring,
        frequency: rule.frequency,
        interval: rule.interval,
        daysOfWeek: rule.daysOfWeek,
        endType: rule.endType,
        endAfterCount: rule.endAfterCount,
        endOnDate: rule.endOnDate,
      },
      endType: rule.endType,
      endValue: rule.endAfterCount,
    };
  }
  return {
    isRecurring: false,
    selectedDate: targetDate,
    recurrenceRule: DEFAULT_RECURRENCE_RULE,
    endType: 'never',
    endValue: undefined,
  };
}

export function RecurringModal({
  open,
  onOpenChange,
  task,
  targetDate,
  onConfirm,
}: RecurringModalProps): React.ReactElement {
  // Component unmounts when parent guard (pendingDrop &&) is falsy,
  // so state reinitializes from props on each mount — no useEffect needed.
  const [formState, setFormState] = useState<RecurringFormState>(() =>
    buildInitialState(task, targetDate),
  );

  const handleConfirm = (): void => {
    if (formState.isRecurring) {
      onConfirm({
        isRecurring: true,
        selectedDate: formState.selectedDate,
        recurrenceRule: formState.recurrenceRule,
        recurrenceEndType: formState.endType,
        recurrenceEndValue: formState.endValue,
      });
    } else {
      onConfirm({ isRecurring: false, selectedDate: formState.selectedDate });
    }
    onOpenChange(false);
  };

  const handleCancel = (): void => {
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
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  />
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formState.selectedDate, 'EEEE, MMM d, yyyy')}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formState.selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setFormState((prev) => ({ ...prev, selectedDate: date }));
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
              checked={formState.isRecurring}
              onCheckedChange={(checked) =>
                setFormState((prev) => ({ ...prev, isRecurring: checked }))
              }
              data-testid="recurring-toggle"
            />
          </div>

          {formState.isRecurring && (
            <>
              <Separator />
              <RecurrenceSelector
                value={formState.recurrenceRule}
                onChange={(rule) =>
                  setFormState((prev) => ({ ...prev, recurrenceRule: rule }))
                }
              />
              <Separator />
              <RecurrenceEndSelector
                endType={formState.endType}
                endValue={formState.endValue}
                onEndTypeChange={(endType) =>
                  setFormState((prev) => ({ ...prev, endType }))
                }
                onEndValueChange={(endValue) =>
                  setFormState((prev) => ({ ...prev, endValue }))
                }
              />
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {formState.isRecurring ? 'Schedule Recurring' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
