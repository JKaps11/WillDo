import { z } from 'zod';

export const clerkEmailSchema = z.object({
  id: z.string(),
  email_address: z.email(),
});

export const clerkUserSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  primary_email_address_id: z.string().nullable(),
  email_addresses: z.array(clerkEmailSchema),
});
