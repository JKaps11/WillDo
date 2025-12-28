import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { format } from 'date-fns';
import { CalendarIcon, Clock, Pencil } from 'lucide-react';

import { useTaskContext } from './context';
import type { ReactNode } from 'react';
import type { Priority, Task as TaskType } from '@/db/schemas/task.schema';
import { priorityEnum } from '@/db/schemas/task.schema';
import { formatPriority } from '@/components/todo-list/utils';
import { startOfDay, utcDateToLocal } from '@/utils/dates';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface EditTaskModalProps {
    task: TaskType;
}

export function EditTaskModal({ task }: EditTaskModalProps): ReactNode {
    const { onUpdate } = useTaskContext();
    const [open, setOpen] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const form = useForm({
        defaultValues: {
            name: task.name,
            description: task.description ?? '',
            priority: task.priority,
            todoListDate: utcDateToLocal(task.todoListDate),
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            completed: task.completed,
        },
        onSubmit: ({ value }) => {
            setIsPending(true);
            onUpdate({
                ...task,
                name: value.name,
                description: value.description || null,
                priority: value.priority,
                todoListDate: startOfDay(value.todoListDate),
                dueDate: value.dueDate,
                completed: value.completed,
            });
            setOpen(false);
            setIsPending(false);
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="task-edit-btn h-7 w-7 cursor-pointer hover:text-foreground"
                >
                    <Pencil />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                        Make changes to your task.
                    </DialogDescription>
                </DialogHeader>
                <form
                    id="edit-task-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <form.Field
                            name="name"
                            children={(field) => (
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
                            name="description"
                            children={(field) => (
                                <Field>
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
                        <form.Field
                            name="priority"
                            children={(field) => (
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
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="todoListDate"
                                children={(field) => (
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
                                children={(field) => (
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
                        </div>
                        <form.Field
                            name="completed"
                            children={(field) => (
                                <Field>
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
                                        <FieldLabel htmlFor={field.name} className="mb-0 cursor-pointer">
                                            Mark as completed
                                        </FieldLabel>
                                    </div>
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-task-form" disabled={isPending}>
                        {isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
