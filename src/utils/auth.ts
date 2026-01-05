import { auth, clerkClient } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import type { User as ClerkUser } from '@clerk/tanstack-react-start/server';
import type { User as DBUser, NewUser } from '@/db/schemas/user.schema';
import { userRepository } from '@/db/repositories/user.repository';
import { withLogging } from '@/lib/logging/index.server';
import { clerkUserSchema } from '@/lib/zod-schemas';

export const authStateFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { isAuthenticated } = await auth();
    if (isAuthenticated) throw redirect({ to: '/app/dashboard' });
  },
);

export const ensureUser = createServerFn({ method: 'GET' }).handler(
  withLogging('Ensure User', async () => {
    // 1. Ensure user is authenticated
    const { isAuthenticated, userId } = await auth();
    if (!isAuthenticated || !userId) throw redirect({ to: '/' });

    // 2. Check if user exists in dv
    let existing: DBUser | null;
    try {
      existing = await userRepository.findById(userId);
    } catch (error) {
      throw new Error(
        `Failed to check existing user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
    if (existing) return { user: existing, isFirstTime: false };

    // 3. Create user in db from clerk user info
    let clerkUser: ClerkUser;
    try {
      clerkUser = await clerkClient().users.getUser(userId);
    } catch (error) {
      throw new Error(
        `Failed to fetch Clerk user: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    const validationResult = clerkUserSchema.safeParse({
      id: clerkUser.id,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
      primary_email_address_id: clerkUser.primaryEmailAddressId,
      email_addresses: clerkUser.emailAddresses.map((e) => ({
        id: e.id,
        email_address: e.emailAddress,
      })),
    });

    if (!validationResult.success) {
      throw new Error('Clerk user validation failed');
    }

    const validatedClerkUser = validationResult.data;
    const primaryEmail: string | undefined =
      validatedClerkUser.email_addresses.find(
        (e) => e.id === validatedClerkUser.primary_email_address_id,
      )?.email_address;

    if (!primaryEmail) {
      throw new Error('No primary email address found for user');
    }

    const name: string = [
      validatedClerkUser.first_name,
      validatedClerkUser.last_name,
    ].join(' ');

    let user: NewUser | null;
    try {
      user = await userRepository.create({
        id: userId,
        email: primaryEmail,
        name,
      });
    } catch (error) {
      throw new Error(
        `Failed to create user in database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    if (!user) throw new Error('Failed to create user in database');

    return { user, isFirstTime: true };
  }),
);
