import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import {
  createEventFromTaskSchema,
  createEventSchema,
  deleteEventSchema,
  getEventSchema,
  listEventsSchema,
  updateEventSchema,
} from '@/lib/zod-schemas/event';
import { eventRepository } from '@/db/repositories/event.repository';
import { taskRepository } from '@/db/repositories/task.repository';

export const eventRouter = {
  /** GET /event/list - Get events for time range */
  list: protectedProcedure
    .input(listEventsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const events = await eventRepository.findByTimeRange(
        userId,
        input.startTime,
        input.endTime,
      );
      return events;
    }),

  /** GET /event */
  get: protectedProcedure
    .input(getEventSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const event = await eventRepository.findById(input.id, userId);

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      return event;
    }),

  /** POST /event */
  create: protectedProcedure
    .input(createEventSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const event = await eventRepository.create({
        ...input,
        userId,
      });

      if (!event) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create event',
        });
      }

      // TODO: Trigger Google Calendar sync if enabled
      // if (ctx.user.settings.calendar.googleCalendarSync) {
      //     await syncEventToGoogle(event);
      // }

      return event;
    }),

  /** PUT /event */
  update: protectedProcedure
    .input(updateEventSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const { id, ...updates } = input;

      const event = await eventRepository.update(id, userId, updates);

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // TODO: Trigger Google Calendar sync if enabled
      // if (ctx.user.settings.calendar.googleCalendarSync) {
      //     await syncEventToGoogle(event);
      // }

      return event;
    }),

  /** DELETE /event */
  delete: protectedProcedure
    .input(deleteEventSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const event = await eventRepository.delete(input.id, userId);

      if (!event) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // TODO: Delete from Google Calendar if synced
      // if (event.googleEventId && ctx.user.settings.calendar.googleCalendarSync) {
      //     await deleteEventFromGoogle(event);
      // }

      return event;
    }),

  /** POST /event/from-task - Convert task to event */
  createFromTask: protectedProcedure
    .input(createEventFromTaskSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Fetch the task
      const task = await taskRepository.findById(input.taskId, userId);

      if (!task) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Task not found',
        });
      }

      // Calculate end time if not provided
      const endTime =
        input.endTime ??
        new Date(
          input.startTime.getTime() + 60 * 60 * 1000, // Default 1 hour
        );

      // Create event from task
      const event = await eventRepository.create({
        userId,
        title: task.name,
        description: task.description ?? undefined,
        startTime: input.startTime,
        endTime: endTime,
      });

      if (!event) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create event from task',
        });
      }

      // Optionally delete the task or mark it as completed
      // For now, we'll just leave the task as-is
      // await taskRepository.delete(input.taskId, userId);

      return event;
    }),
};
