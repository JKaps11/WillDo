import { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { TaskForm } from './task/TaskForm';
import { Button } from './ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { useTRPC } from '@/integrations/trpc/react';
import { startOfDay } from '@/utils/dates';

import type { ReactNode } from 'react';

export default function NewTaskModal(): ReactNode {
    const [open, setOpen] = useState(false);
    const trpc = useTRPC();
    const queryClient = useQueryClient();

    const createTaskMutation = useMutation(
        trpc.task.create.mutationOptions({
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: trpc.todoList.list.queryKey() });
                setOpen(false);
                form.reset();
            },
        })
    );

    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
            priority: 'medium' as const,
            todoListDate: startOfDay(new Date()),
            dueDate: null as Date | null,
        },
        onSubmit: ({ value }) => {
            createTaskMutation.mutate({
                name: value.name,
                todoListDate: value.todoListDate,
                description: value.description || undefined,
                priority: value.priority,
                dueDate: value.dueDate ?? undefined,
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>New Task</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                        Add a new task to your todo list.
                    </DialogDescription>
                </DialogHeader>
                <form
                    id="new-task-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <TaskForm form={form} />
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" form="new-task-form" disabled={createTaskMutation.isPending}>
                        {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
