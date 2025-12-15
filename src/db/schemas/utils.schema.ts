import { timestamp } from "drizzle-orm/pg-core";

export const resourceTimestamps = {
    updated_at: timestamp(),
    created_at: timestamp().defaultNow().notNull(),
}