import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import type { ReactNode } from 'react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Event } from '@/db/schemas/event.schema';
import { useTRPC } from '@/integrations/trpc/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';

interface EventModalProps {
  event?: Event;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventModal({
  event,
  defaultStartTime,
  defaultEndTime,
  open,
  onOpenChange,
}: EventModalProps): ReactNode {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const isEditing = !!event;

  const mutation = useMutation(
    isEditing
      ? trpc.event.update.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.event.list.pathKey(),
            });
            onOpenChange(false);
          },
        })
      : trpc.event.create.mutationOptions({
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: trpc.event.list.pathKey(),
            });
            onOpenChange(false);
          },
        }),
  );

  const form = useForm({
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      location: event?.location ?? '',
      startTime: event?.startTime
        ? new Date(event.startTime)
        : (defaultStartTime ?? new Date()),
      endTime: event?.endTime
        ? new Date(event.endTime)
        : (defaultEndTime ?? new Date(Date.now() + 60 * 60 * 1000)), // 1 hour from now
      color: event?.color ?? '#3b82f6',
    },
    onSubmit: ({ value }) => {
      if (isEditing) {
        mutation.mutate({
          id: event.id,
          title: value.title,
          description: value.description || null,
          location: value.location || null,
          startTime: value.startTime,
          endTime: value.endTime,
          color: value.color,
        });
      } else {
        mutation.mutate({
          title: value.title,
          description: value.description || undefined,
          location: value.location || undefined,
          startTime: value.startTime,
          endTime: value.endTime,
          color: value.color,
        });
      }
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Make changes to your event.'
              : 'Add a new event to your calendar.'}
          </DialogDescription>
        </DialogHeader>
        <form
          id="event-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="title">
            {(field) => (
              <Field>
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Event title"
                  required
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="description">
            {(field) => (
              <Field>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Event description"
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="location">
            {(field) => (
              <Field>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Event location"
                />
              </Field>
            )}
          </form.Field>

          <div className="grid grid-cols-2 gap-4">
            <form.Field name="startTime">
              {(field) => (
                <Field>
                  <Label htmlFor="startTime">
                    Start Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formatDateTimeLocal(field.state.value)}
                    onChange={(e) =>
                      field.handleChange(new Date(e.target.value))
                    }
                    required
                  />
                </Field>
              )}
            </form.Field>

            <form.Field name="endTime">
              {(field) => (
                <Field>
                  <Label htmlFor="endTime">
                    End Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formatDateTimeLocal(field.state.value)}
                    onChange={(e) =>
                      field.handleChange(new Date(e.target.value))
                    }
                    required
                  />
                </Field>
              )}
            </form.Field>
          </div>

          <form.Field name="color">
            {(field) => (
              <Field>
                <Label htmlFor="color">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="color"
                    type="color"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </Field>
            )}
          </form.Field>
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="event-form" disabled={mutation.isPending}>
            {mutation.isPending
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Create Event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Format date for datetime-local input
 */
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
