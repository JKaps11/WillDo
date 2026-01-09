import { TRPCError } from '@trpc/server';
import { protectedProcedure } from '../init';
import { taskRepository } from '@/db/repositories/task.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';
import { startOfDay } from '@/utils/dates';

export const dashboardRouter = {
  getTodaysTasks: protectedProcedure.query(async ({ ctx }) => {
    try {
      const today = startOfDay(new Date());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const tasks = await taskRepository.findByDateRange(
        ctx.userId,
        today,
        tomorrow,
      );
      addWide({ tasks_count: tasks.length });
      return tasks;
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: "Failed to fetch today's tasks",
        cause: error,
      });
    }
  }),
};
