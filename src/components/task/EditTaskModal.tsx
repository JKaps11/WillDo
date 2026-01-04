import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@tanstack/react-store';
import { useForm } from '@tanstack/react-form';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

import type { TodoListWithTasks } from '@/components/todo-list/types';
import type { Task as TaskType } from '@/db/schemas/task.schema';
import { startOfDay, utcDateToLocal } from '@/utils/dates';
import { useTRPC } from '@/integrations/trpc/react';
import type { ReactNode } from 'react';
import { uiStore } from '@/lib/store';
import { TaskForm } from './TaskForm';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EditTaskModalProps {
  task: TaskType;
}

export function EditTaskModal({ task }: EditTaskModalProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const baseDate = useStore(uiStore, (s) => s.todoListBaseDate);
  const [open, setOpen] = useState(false);

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onMutate: async (variables) => {
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
                t.id === variables.id ? { ...t, ...variables } : t,
              ),
            }));
          },
        );

        return { previous, queryKey };
      },
      onError: (_err, _updatedTask, context) => {
        if (context?.previous) {
          queryClient.setQueryData(context.queryKey, context.previous);
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.todoList.list.pathKey(),
        });
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      name: task.name,
      description: task.description ?? '',
      priority: task.priority,
      todoListDate: utcDateToLocal(task.todoListDate),
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      tagIds: task.tagIds ?? [],
      completed: task.completed,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: task.id,
        name: value.name,
        description: value.description || null,
        priority: value.priority,
        dueDate: value.dueDate ?? undefined,
        tagIds: value.tagIds.length > 0 ? value.tagIds : undefined,
        completed: value.completed,
        todoListDate: startOfDay(value.todoListDate),
      });
      setOpen(false);
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
          <DialogDescription>Make changes to your task.</DialogDescription>
        </DialogHeader>
        <form
          id="edit-task-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <TaskForm form={form} showCompleted />
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-task-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
