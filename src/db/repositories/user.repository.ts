import { eq } from 'drizzle-orm';
import type { NewUser, User, UserSettings } from '@/db/schemas/user.schema';
import type { PatchUserSettings } from '@/lib/zod-schemas';
import { DEFAULT_USER_SETTINGS, users } from '@/db/schemas/user.schema';
import { db } from '@/db/index';

export const userRepository = {
  findById: async (id: string): Promise<User | null> => {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    const user = result[0] ?? null;

    // Ensure existing users have all settings with defaults for missing keys
    if (user) {
      return {
        ...user,
        settings: {
          general: {
            ...DEFAULT_USER_SETTINGS.general,
            ...user.settings.general,
          },
          appearance: {
            ...DEFAULT_USER_SETTINGS.appearance,
            ...user.settings.appearance,
          },
          todoList: {
            ...DEFAULT_USER_SETTINGS.todoList,
            ...user.settings.todoList,
          },
          calendar: {
            ...DEFAULT_USER_SETTINGS.calendar,
            ...user.settings.calendar,
          },
        },
      };
    }

    return user;
  },

  create: async (data: NewUser): Promise<User | null> => {
    const result = await db
      .insert(users)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return result[0] ?? null;
  },

  update: async (id: string, data: Partial<NewUser>): Promise<User | null> => {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  },

  delete: async (id: string): Promise<User | null> => {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result[0] ?? null;
  },

  patchSettings: async (
    id: string,
    patch: PatchUserSettings,
  ): Promise<User | null> => {
    // Fetch current user to merge settings
    const currentUser = await userRepository.findById(id);
    if (!currentUser) {
      return null;
    }

    // Merge patch with existing settings (currentUser already has defaults applied from findById)
    const mergedSettings: UserSettings = {
      general: {
        ...currentUser.settings.general,
        ...patch.general,
      },
      appearance: {
        ...currentUser.settings.appearance,
        ...patch.appearance,
      },
      todoList: {
        ...currentUser.settings.todoList,
        ...patch.todoList,
      },
      calendar: {
        ...currentUser.settings.calendar,
        ...patch.calendar,
      },
    };

    const result = await db
      .update(users)
      .set({ settings: mergedSettings })
      .where(eq(users.id, id))
      .returning();
    return result[0] ?? null;
  },
};
