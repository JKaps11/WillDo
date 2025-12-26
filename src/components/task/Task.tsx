import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { CalendarIcon, GripVertical } from 'lucide-react';

import { TaskContext, useTaskContext } from './context';
import { formatPriority } from '@/components/todo-list/utils';
import { useTRPC } from '@/integrations/trpc/react';
import { startOfDay, utcDateToLocal } from '@/utils/dates';
import { cn } from '@/lib/utils';
import { uiStore } from '@/lib/store';

import { Badge } from '@/components/ui/badge';
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import type { ReactNode } from 'react';
import type { Task as TaskType, Priority } from '@/db/schemas/task.schema';
import type { TodoListWithTasks } from '@/components/todo-list/types';
import type { z } from 'zod';
import type { updateTaskSchema } from '@/lib/zod-schemas/task';

type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

const PRIORITY_OPTIONS: Array<Priority> = [
    'Very_Low',
    'Low',
    'Medium',
    'High',
    'Very_High',
];

/* ---------- Root ---------- */

interface RootProps {
    children: ReactNode;
    task: TaskType;
}

function Root({ children, task }: RootProps): ReactNode {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);

    const updateMutation = useMutation(
        trpc.task.update.mutationOptions({
            onMutate: async (variables) => {
                const updatedTask = variables as UpdateTaskInput;
                const queryKey = trpc.todoList.list.queryKey(baseDate);
                await queryClient.cancelQueries({ queryKey });
                const previous = queryClient.getQueryData(queryKey);

                queryClient.setQueryData(
                    queryKey,
                    (old: Array<TodoListWithTasks> | undefined) => {
                        if (!old) return old;
                        return old.map((list) => ({
                            ...list,
                            tasks: list.tasks.map((t) =>
                                t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                            ),
                        }));
                    }
                );

                return { previous, queryKey };
            },
            onError: (_err, _updatedTask, context) => {
                if (context?.previous && context?.queryKey) {
                    queryClient.setQueryData(context.queryKey, context.previous);
                }
            },
            onSettled: () => {
                queryClient.invalidateQueries({
                    queryKey: trpc.todoList.list.pathKey()
                });
            },
        })
    );

    function handleUpdate(updatedTask: TaskType): void {
        updateMutation.mutate({
            id: updatedTask.id,
            name: updatedTask.name,
            description: updatedTask.description,
            priority: updatedTask.priority,
            dueDate: updatedTask.dueDate ?? undefined,
            completed: updatedTask.completed,
            todoListDate: updatedTask.todoListDate,
        });
    }

    return (
        <TaskContext.Provider value={{ task, onUpdate: handleUpdate }}>
            {children}
        </TaskContext.Provider>
    );
}

/* ---------- Card ---------- */

interface CardProps {
    className?: string;
}

function Card({ className }: CardProps): ReactNode {
    const { task, onUpdate } = useTaskContext();
    const [editOpen, setEditOpen] = useState(false);

    function handleCheckboxClick(e: React.MouseEvent): void {
        e.stopPropagation();
    }

    function handleCheckboxChange(checked: boolean | 'indeterminate'): void {
        if (checked === 'indeterminate') return;
        onUpdate({ ...task, completed: checked });
    }

    return (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
                <div
                    className={cn(
                        'group flex items-start gap-3 py-3 cursor-pointer transition-colors hover:bg-accent/50',
                        '[&:has(.task-checkbox:hover)]:bg-transparent',
                        className
                    )}
                >
                    <div
                        className="task-checkbox pt-0.5 pl-4"
                        onClick={handleCheckboxClick}
                    >
                        <Checkbox
                            className="hover:border-ring hover:ring-[3px] hover:ring-ring/50"
                            checked={task.completed}
                            onCheckedChange={handleCheckboxChange}
                        />
                    </div>

                    <div className="min-w-0 flex-1 pr-4">
                        <div className="flex items-start justify-between gap-3">
                            <div
                                className={cn(
                                    'min-w-0 font-medium leading-5',
                                    task.completed && 'text-muted-foreground line-through'
                                )}
                            >
                                <div className="truncate">{task.name}</div>
                            </div>

                            <Badge variant="outline" className="shrink-0 text-xs">
                                {formatPriority(task.priority)}
                            </Badge>
                        </div>

                        {task.description && (
                            <div
                                className={cn(
                                    'mt-1 text-sm text-muted-foreground line-clamp-2',
                                    task.completed && 'line-through'
                                )}
                            >
                                {task.description}
                            </div>
                        )}

                        {task.dueDate && (
                            <div className="mt-2 text-xs text-muted-foreground">
                                Due {format(new Date(task.dueDate), 'MMM d, p')}
                            </div>
                        )}
                    </div>
                </div>
            </DialogTrigger>

            <EditModalContent task={task} onClose={() => setEditOpen(false)} />
        </Dialog>
    );
}

/* ---------- EditModalContent ---------- */

interface EditModalContentProps {
    task: TaskType;
    onClose: () => void;
}

function EditModalContent({ task, onClose }: EditModalContentProps): ReactNode {
    const { onUpdate } = useTaskContext();
    const [isPending, setIsPending] = useState(false);

    const form = useForm({
        defaultValues: {
            name: task.name,
            description: task.description ?? '',
            priority: task.priority,
            todoListDate: utcDateToLocal(task.todoListDate),
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
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
            });
            onClose();
            setIsPending(false);
        },
    });

    return (
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
                        children={(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Task Name</FieldLabel>
                                    <Input
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        aria-invalid={isInvalid}
                                        placeholder="Enter task name"
                                        autoComplete="off"
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
                    />
                    <form.Field
                        name="description"
                        children={(field) => {
                            const isInvalid =
                                field.state.meta.isTouched && !field.state.meta.isValid;
                            return (
                                <Field data-invalid={isInvalid}>
                                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                                    <textarea
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Add a description (optional)"
                                        rows={3}
                                        className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full min-h-20 resize-none rounded-md border bg-transparent px-3 py-2 text-base shadow-xs outline-none focus-visible:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm"
                                        aria-invalid={isInvalid}
                                    />
                                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                </Field>
                            );
                        }}
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
                                        {PRIORITY_OPTIONS.map((priority) => (
                                            <SelectItem key={priority} value={priority}>
                                                {formatPriority(priority)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                        )}
                    />
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
                </FieldGroup>
            </form>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit" form="edit-task-form" disabled={isPending}>
                    {isPending ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}

/* ---------- Draggable ---------- */

interface DraggableProps {
    children: ReactNode;
}

function Draggable({ children }: DraggableProps): ReactNode {
    const { task } = useTaskContext();

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { task },
    });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn('flex items-center', isDragging && 'overflow-hidden')}
        >
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
            >
                <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1">{children}</div>
        </div>
    );
}

/* ---------- Export as compound component ---------- */

export const Task = {
    Root,
    Card,
    Draggable,
};
