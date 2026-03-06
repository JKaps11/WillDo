import { z } from 'zod';

export const weekDateSchema = z.date();

export const todoListSearchSchema = z.object({
  date: z.string().default(() => new Date().toISOString()),
});
