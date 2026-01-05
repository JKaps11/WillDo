import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';

import { resourceTimestamps } from './utils.schema';
import { subSkills } from './sub_skill.schema';
import { users } from './user.schema';

/* ---------- Table ---------- */

export const subSkillDependencies = pgTable(
  'sub_skill_dependency',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id),

    // The sub-skill that depends on another
    dependentSubSkillId: uuid('dependent_sub_skill_id')
      .notNull()
      .references(() => subSkills.id, { onDelete: 'cascade' }),

    // The sub-skill that must be completed first (prerequisite)
    prerequisiteSubSkillId: uuid('prerequisite_sub_skill_id')
      .notNull()
      .references(() => subSkills.id, { onDelete: 'cascade' }),

    ...resourceTimestamps,
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.dependentSubSkillId, table.prerequisiteSubSkillId],
    }),
  }),
);

/* ---------- Inferred Types ---------- */

export type SubSkillDependency = typeof subSkillDependencies.$inferSelect;
export type NewSubSkillDependency = typeof subSkillDependencies.$inferInsert;
