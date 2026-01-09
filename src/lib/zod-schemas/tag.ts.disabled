import { z } from 'zod';

/* ---------- Tag Schemas ---------- */

export const createTagSchema = z.object({
  title: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const updateTagSchema = z.object({
  tagId: z.string().uuid(),
  title: z.string().min(1).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
});

export const getTagSchema = z.object({
  tagId: z.string().uuid(),
});

export const deleteTagSchema = z.object({
  tagId: z.string().uuid(),
});
