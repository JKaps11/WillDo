import { protectedProcedure } from '../init';
import type { TRPCRouterRecord } from '@trpc/server';

import type { DaysOfWeek } from '@/db/schemas/task.schema';
import type {
  TaskWithOptionalSkillInfo,
  TodoListDay,
} from '@/db/repositories/task.repository';
import { taskRepository } from '@/db/repositories/task.repository';
import { addWide } from '@/lib/logging/wideEventStore.server';
import { addDays, endOfWeek, startOfWeek } from '@/lib/dates';
import { weekDateSchema } from '@/lib/zod-schemas';

const DAY_OF_WEEK_MAP: Record<DaysOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Check if a date is skipped due to exceptions (skip or moved away) */
function isDateSkipped(task: TaskWithOptionalSkillInfo, date: Date): boolean {
  const exceptions = task.recurrenceRule?.exceptions ?? [];
  const dateKey = date.toISOString().split('T')[0];

  // Any exception (skip or moved) means the original date should be skipped
  return exceptions.some((ex) => ex.originalDate === dateKey);
}

/** Get moved exceptions that should appear in the date range */
function getMovedExceptionsInRange(
  task: TaskWithOptionalSkillInfo,
  rangeStart: Date,
  rangeEnd: Date,
): Array<{ task: TaskWithOptionalSkillInfo; date: Date }> {
  const exceptions = task.recurrenceRule?.exceptions ?? [];
  const result: Array<{ task: TaskWithOptionalSkillInfo; date: Date }> = [];

  for (const exception of exceptions) {
    if (exception.action === 'moved' && exception.movedToDate) {
      const movedDate = new Date(exception.movedToDate);
      if (movedDate >= rangeStart && movedDate <= rangeEnd) {
        result.push({
          task,
          date: movedDate,
        });
      }
    }
  }

  return result;
}

/** Check if a date matches the recurrence pattern */
function matchesRecurrence(
  task: TaskWithOptionalSkillInfo,
  date: Date,
  occurrenceCount: number,
): boolean {
  const rule = task.recurrenceRule;
  if (!rule?.isRecurring || !task.todoListDate) return false;

  const startDate = task.todoListDate;

  // Date must be on or after the start date
  if (date < startDate) return false;

  // Check end conditions
  if (rule.endType === 'after_count' && rule.endAfterCount) {
    if (occurrenceCount >= rule.endAfterCount) return false;
  }
  if (rule.endType === 'on_date' && rule.endOnDate) {
    const endDate = new Date(rule.endOnDate);
    if (date > endDate) return false;
  }

  if (rule.frequency === 'daily') {
    // Check if the date is on the correct interval
    const daysDiff = Math.floor(
      (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysDiff % rule.interval === 0;
  }

  // frequency === 'weekly': check if the day of week matches
  const dayOfWeek = date.getDay();
  const daysOfWeek = rule.daysOfWeek ?? [];

  // If no specific days are set, use the start date's day
  if (daysOfWeek.length === 0) {
    const startDayOfWeek = startDate.getDay();
    if (dayOfWeek !== startDayOfWeek) return false;
  } else {
    // Check if current day is in the allowed days
    const matchesDay = daysOfWeek.some(
      (day) => DAY_OF_WEEK_MAP[day] === dayOfWeek,
    );
    if (!matchesDay) return false;
  }

  // Check week interval
  const weeksDiff = Math.floor(
    (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7),
  );
  return weeksDiff % rule.interval === 0;
}

/** Expand recurring tasks within a date range */
function expandRecurringTasks(
  tasks: Array<TaskWithOptionalSkillInfo>,
  rangeStart: Date,
  rangeEnd: Date,
): Array<{ task: TaskWithOptionalSkillInfo; date: Date }> {
  const expanded: Array<{ task: TaskWithOptionalSkillInfo; date: Date }> = [];

  for (const task of tasks) {
    if (!task.todoListDate) continue;

    const rule = task.recurrenceRule;

    // Non-recurring tasks: just add if in range
    if (!rule?.isRecurring) {
      if (task.todoListDate >= rangeStart && task.todoListDate <= rangeEnd) {
        expanded.push({ task, date: task.todoListDate });
      }
      continue;
    }

    // Recurring tasks: check each day in the range
    let currentDate = new Date(rangeStart);
    let occurrenceCount = 0;

    // Count occurrences before the range start (excluding skipped dates)
    if (task.todoListDate < rangeStart) {
      let countDate = new Date(task.todoListDate);
      while (countDate < rangeStart) {
        if (
          matchesRecurrence(task, countDate, occurrenceCount) &&
          !isDateSkipped(task, countDate)
        ) {
          occurrenceCount++;
        }
        countDate = addDays(countDate, 1);
      }
    }

    // Check each day in the range
    while (currentDate <= rangeEnd) {
      if (matchesRecurrence(task, currentDate, occurrenceCount)) {
        // Only add if the date is not skipped due to an exception
        if (!isDateSkipped(task, currentDate)) {
          expanded.push({ task, date: new Date(currentDate) });
        }
        occurrenceCount++;
      }
      currentDate = addDays(currentDate, 1);
    }

    // Add moved exceptions that fall within the range
    const movedExceptions = getMovedExceptionsInRange(
      task,
      rangeStart,
      rangeEnd,
    );
    expanded.push(...movedExceptions);
  }

  return expanded;
}

/** Group expanded tasks by date */
function groupTasksByDate(
  expandedTasks: Array<{ task: TaskWithOptionalSkillInfo; date: Date }>,
): Array<TodoListDay> {
  const byDate = new Map<string, TodoListDay>();

  for (const { task, date } of expandedTasks) {
    const dateKey = date.toISOString().split('T')[0];
    const existing = byDate.get(dateKey);

    // Create a task copy with todoListDate set to the expanded occurrence date
    // This ensures dragging knows which occurrence is being moved
    const expandedTask: TaskWithOptionalSkillInfo = {
      ...task,
      todoListDate: date,
    };

    if (existing) {
      existing.tasks.push(expandedTask);
    } else {
      byDate.set(dateKey, {
        date,
        tasks: [expandedTask],
      });
    }
  }

  return Array.from(byDate.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );
}

export const todoListRouter = {
  list: protectedProcedure
    .input(weekDateSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const start = startOfWeek(input);
      const end = endOfWeek(input);
      addWide({ week_start: start.toISOString(), week_end: end.toISOString() });

      // Fetch tasks that could appear in this range (with skill color info):
      // 1. Non-recurring tasks with todoListDate in range
      // 2. Recurring tasks with todoListDate <= end (they might recur into this range)
      const tasks = await taskRepository.findForTodoListWithSkillInfo(
        userId,
        start,
        end,
      );
      addWide({ tasks_count: tasks.length });

      // Expand recurring tasks and group by date
      const expandedTasks = expandRecurringTasks(tasks, start, end);
      return groupTasksByDate(expandedTasks);
    }),
} satisfies TRPCRouterRecord;
