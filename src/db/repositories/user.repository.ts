import { eq } from 'drizzle-orm';
import type { NewUser, User, UserSettings } from '@/db/schemas/user.schema';
import type { PatchUserSettings } from '@/lib/zod-schemas';
import type { DbClient } from '@/db/index';
import { DEFAULT_USER_SETTINGS, users } from '@/db/schemas/user.schema';
import { db } from '@/db/index';

export const userRepository = {
  findById: async (id: string): Promise<User | null> => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    // Ensure existing users have all settings with defaults for missing keys
    return {
      ...user,
      settings: {
        appearance: {
          ...DEFAULT_USER_SETTINGS.appearance,
          ...user.settings.appearance,
        },
        todoList: {
          ...DEFAULT_USER_SETTINGS.todoList,
          ...user.settings.todoList,
        },
        // calendar: {
        //   ...DEFAULT_USER_SETTINGS.calendar,
        //   ...user.settings.calendar,
        // },
      },
    };
  },

  create: async (
    data: NewUser,
    dbClient: DbClient = db,
  ): Promise<User | null> => {
    const result = await dbClient
      .insert(users)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return result[0] ?? null;
  },

  update: async (
    id: string,
    data: Partial<NewUser>,
    dbClient: DbClient = db,
  ): Promise<User | null> => {
    const result = await dbClient
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  },

  delete: async (id: string, dbClient: DbClient = db): Promise<User | null> => {
    const result = await dbClient
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  },

  setActiveSkill: async (
    userId: string,
    skillId: string,
    dbClient: DbClient = db,
  ): Promise<User | null> => {
    const result = await dbClient
      .update(users)
      .set({ activeSkillId: skillId })
      .where(eq(users.id, userId))
      .returning();
    return result[0] ?? null;
  },

  patchSettings: async (
    id: string,
    patch: PatchUserSettings,
    dbClient: DbClient = db,
  ): Promise<User | null> => {
    // Fetch current user to merge settings
    const currentUser = await userRepository.findById(id);
    if (!currentUser) {
      return null;
    }

    // Merge patch with existing settings (currentUser already has defaults applied from findById)
    const mergedSettings: UserSettings = {
      appearance: {
        ...currentUser.settings.appearance,
        ...patch.appearance,
      },
      todoList: {
        ...currentUser.settings.todoList,
        ...patch.todoList,
      },
      // calendar: {
      //   ...currentUser.settings.calendar,
      //   ...patch.calendar,
      // },
    };

    const result = await dbClient
      .update(users)
      .set({ settings: mergedSettings })
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  },
};
