import { eq } from "drizzle-orm"
import type { NewUser, User, UserSettings } from "@/db/schemas/user.schema";
import type { PatchUserSettings } from "@/lib/zod-schemas";
import { db } from "@/db/index"
import { users } from "@/db/schemas/user.schema"

export const userRepository = {
    findById: async (id: string): Promise<User | null> => {
        const result = await db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1)
        return result[0] ?? null
    },

    create: async (data: NewUser): Promise<User | null> => {
        const result = await db
            .insert(users)
            .values(data)
            .onConflictDoNothing()
            .returning()
        return result[0] ?? null
    },

    update: async (id: string, data: Partial<NewUser>): Promise<User | null> => {
        const result = await db
            .update(users)
            .set(data)
            .where(eq(users.id, id))
            .returning()
        return result[0] ?? null
    },

    delete: async (id: string): Promise<User | null> => {
        const result = await db
            .delete(users)
            .where(eq(users.id, id))
            .returning()
        return result[0] ?? null
    },

    patchSettings: async (id: string, patch: PatchUserSettings): Promise<User | null> => {
        // Fetch current user to merge settings
        const currentUser = await userRepository.findById(id);
        if (!currentUser) {
            return null;
        }

        // Merge patch with existing settings
        const mergedSettings: UserSettings = {
            appearance: {
                ...currentUser.settings.appearance,
                ...patch.appearance,
            },
            todoList: {
                ...currentUser.settings.todoList,
                ...patch.todoList,
            },
        };

        const result = await db
            .update(users)
            .set({ settings: mergedSettings })
            .where(eq(users.id, id))
            .returning()
        return result[0] ?? null
    },
}
