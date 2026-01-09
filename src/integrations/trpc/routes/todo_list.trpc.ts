import { protectedProcedure } from '../init';
import type { TRPCRouterRecord } from '@trpc/server';

import { taskRepository } from '@/db/repositories/task.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';
import { endOfWeek, startOfWeek } from '@/utils/dates';
import { weekDateSchema } from '@/lib/zod-schemas';

export const todoListRouter = {
  list: protectedProcedure
    .input(weekDateSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const start = startOfWeek(input);
      const end = endOfWeek(input);
      addWide({ week_start: start.toISOString(), week_end: end.toISOString() });

      const tasks = await taskRepository.findByDateRange(userId, start, end);
      addWide({ tasks_count: tasks.length });
      return tasks;
    }),
} satisfies TRPCRouterRecord;
