import { CalendarIcon, Clock } from 'lucide-react';
import { format, startOfDay } from 'date-fns';

import type { Priority } from '@/db/schemas/task.schema';
import type { AnyFieldApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { priorityEnum } from '@/db/schemas/task.schema';
import { formatPriority } from '@/components/todo-list/utils';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Field, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface TaskFormValues {
  name: string;
  description: string;
  priority: Priority;
  todoListDate: Date;
  dueDate: Date | null;
  // tagIds: Array<string>;
  completed?: boolean;
}

type StringFieldApi = AnyFieldApi & {
  state: { value: string };
  handleChange: (value: string) => void;
};

type PriorityFieldApi = AnyFieldApi & {
  state: { value: Priority };
  handleChange: (value: Priority) => void;
};

type DateFieldApi = AnyFieldApi & {
  state: { value: Date };
  handleChange: (value: Date) => void;
};

type NullableDateFieldApi = AnyFieldApi & {
  state: { value: Date | null };
  handleChange: (value: Date | null) => void;
};

type BooleanFieldApi = AnyFieldApi & {
  state: { value: boolean | undefined };
  handleChange: (value: boolean) => void;
};

interface TaskFormProps {
  form: {
    Field: React.ComponentType<{
      name: keyof TaskFormValues;
      children: (field: AnyFieldApi) => ReactNode;
    }>;
  };
  showCompleted?: boolean;
}

export function TaskForm({
  form,
  showCompleted = false,
}: TaskFormProps): ReactNode {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Row 1: Name, Priority */}
      <form.Field
        name="name"
        children={(field: StringFieldApi) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Task Name</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter task name"
              autoComplete="off"
            />
          </Field>
        )}
      />
      <form.Field
        name="priority"
        children={(field: PriorityFieldApi) => (
          <Field>
            <FieldLabel>Priority</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as Priority)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityEnum.enumValues.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {formatPriority(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
      />

      {/* Row 2: Description */}
      <form.Field
        name="description"
        children={(field: StringFieldApi) => (
          <Field className="col-span-2">
            <FieldLabel htmlFor={field.name}>Description</FieldLabel>
            <textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Add a description (optional)"
              rows={3}
              className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-h-20 resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] md:text-sm"
            />
          </Field>
        )}
      />

      {/* Row 3: Tags
      <form.Field
        name="tagIds"
        children={(field) => (
          <Field className="col-span-2">
            <FieldLabel>Tags</FieldLabel>
            <TagPicker
              value={field.state.value}
              onChange={(tagIds) => field.handleChange(tagIds)}
            />
          </Field>
        )}
      /> */}

      {/* Row 4: Task Date, Due Date */}
      <form.Field
        name="todoListDate"
        children={(field: DateFieldApi) => (
          <Field>
            <FieldLabel>Date</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(field.state.value, 'MM/dd/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.state.value}
                  onSelect={(date) => {
                    if (date) {
                      field.handleChange(date);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </Field>
        )}
      />
      <form.Field
        name="dueDate"
        children={(field: NullableDateFieldApi) => (
          <Field>
            <FieldLabel>Due Date</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {field.state.value
                    ? format(field.state.value, 'MM/dd/yyyy')
                    : 'No due date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.state.value ?? undefined}
                  onSelect={(date) => {
                    field.handleChange(date ?? null);
                  }}
                  disabled={{ before: startOfDay(new Date()) }}
                />
                {field.state.value && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => field.handleChange(null)}
                    >
                      Clear due date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </Field>
        )}
      />

      {/* Row 5: Completed (optional) */}
      {showCompleted && (
        <form.Field
          name="completed"
          children={(field: BooleanFieldApi) => (
            <Field className="col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) => {
                    if (checked !== 'indeterminate') {
                      field.handleChange(checked);
                    }
                  }}
                />
                <FieldLabel
                  htmlFor={field.name}
                  className="mb-0 cursor-pointer"
                >
                  Mark as completed
                </FieldLabel>
              </div>
            </Field>
          )}
        />
      )}
    </div>
  );
}
