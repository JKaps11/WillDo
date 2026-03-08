import { config } from 'dotenv';

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

config({
  path: '.env.local',
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL as string });

export const db = drizzle(pool);

/** The full drizzle instance or a transaction derived from it. */
export type DbClient =
  | typeof db
  | Parameters<Parameters<(typeof db)['transaction']>[0]>[0];
