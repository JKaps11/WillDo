import { auth } from '@clerk/tanstack-react-start/server';
import { db } from '@/db/index';

export async function createTRPCContext() {
    const { userId, isAuthenticated, sessionId } = await auth();
    return { userId, isAuthenticated, sessionId, db };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
