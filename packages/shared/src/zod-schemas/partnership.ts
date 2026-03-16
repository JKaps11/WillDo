import { z } from 'zod';
import {
  CHECK_IN_FREQUENCY_VALUES,
  CHECK_IN_RESPONSE_VALUES,
  SHARING_LEVEL_VALUES,
} from '../db-types';

/* ---------- Enum Schemas ---------- */

export const checkInFrequencySchema = z.enum(CHECK_IN_FREQUENCY_VALUES);
export const sharingLevelSchema = z.enum(SHARING_LEVEL_VALUES);
export const checkInResponseSchema = z.enum(CHECK_IN_RESPONSE_VALUES);

/* ---------- Invite Schemas ---------- */

export const createInviteSchema = z.object({
  inviteeEmail: z.string().email().optional(),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
});

export const revokeInviteSchema = z.object({
  inviteId: z.string().uuid(),
});

export const getInviteByTokenSchema = z.object({
  token: z.string().min(1),
});

/* ---------- Partnership Schemas ---------- */

export const getPartnershipSchema = z.object({
  partnershipId: z.string().uuid(),
});

export const updateSharingPrefsSchema = z.object({
  partnershipId: z.string().uuid(),
  shareStreaks: sharingLevelSchema.optional(),
  shareCompletionRate: sharingLevelSchema.optional(),
  shareSkillNames: sharingLevelSchema.optional(),
  shareSkillTree: sharingLevelSchema.optional(),
  shareTasks: sharingLevelSchema.optional(),
  shareXpLevel: sharingLevelSchema.optional(),
});

export const updatePartnershipSettingsSchema = z.object({
  partnershipId: z.string().uuid(),
  checkInFrequency: checkInFrequencySchema.optional(),
  damageEnabled: z.boolean().optional(),
});

export const partnershipActionSchema = z.object({
  partnershipId: z.string().uuid(),
});

/* ---------- Check-In Schemas ---------- */

export const submitCheckInSchema = z.object({
  partnershipId: z.string().uuid(),
  response: checkInResponseSchema,
  note: z.string().max(500).optional(),
});

export const getCheckInHistorySchema = z.object({
  partnershipId: z.string().uuid(),
  cursor: z.date().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

/* ---------- Notification Schemas ---------- */

export const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
});

export const listNotificationsSchema = z.object({
  cursor: z.date().optional(),
  limit: z.number().int().min(1).max(50).default(20),
});
