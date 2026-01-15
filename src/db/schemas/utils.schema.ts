import { timestamp } from 'drizzle-orm/pg-core';

export const resourceTimestamps = {
  updatedAt: timestamp('updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
};
