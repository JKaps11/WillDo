import { createFileRoute } from '@tanstack/react-router'
import { Webhook } from 'svix'
import { z } from 'zod'

import { users } from '@/db/schemas/user.schema'
import { db } from '@/db/index'

/* ---------- Zod schemas ---------- */

const ClerkEmailSchema = z.object({
    id: z.string(),
    email_address: z.email(),
})

const ClerkUserCreatedDataSchema = z.object({
    id: z.string(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    primary_email_address_id: z.string().nullable(),
    email_addresses: z.array(ClerkEmailSchema),
})

const ClerkUserCreatedEventSchema = z.object({
    type: z.literal('user.created'),
    data: ClerkUserCreatedDataSchema,
})

/* ---------- Route ---------- */

export const Route = createFileRoute('/api/webhooks/clerk')({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET
                if (!secret) {
                    console.error('Missing CLERK_WEBHOOK_SECRET')
                    return new Response('Server misconfigured', { status: 500 })
                }

                // Clerk/Svix requires the RAW body
                const payload = await request.text()
                const headers = Object.fromEntries(request.headers)

                let rawEvent: unknown
                try {
                    rawEvent = new Webhook(secret).verify(payload, headers)
                } catch (err) {
                    console.error('Webhook verification failed:', err)
                    return new Response('Invalid signature', { status: 400 })
                }

                // Zod validation
                const parsed = ClerkUserCreatedEventSchema.safeParse(rawEvent)
                if (!parsed.success) {
                    // Not user.created or malformed — safely ignore
                    return new Response('Ignored', { status: 200 })
                }

                const { data: user } = parsed.data
                const clerkUserId = user.id

                const primaryEmail =
                    user.email_addresses.find(
                        (e) => e.id === user.primary_email_address_id
                    )?.email_address ??
                    user.email_addresses[0]?.email_address

                if (!primaryEmail) {
                    console.warn('user.created without email; skipping insert', {
                        clerkUserId,
                    })
                    return new Response('No email on user', { status: 200 })
                }

                const name =
                    [user.first_name, user.last_name].filter(Boolean).join(' ')

                await db
                    .insert(users)
                    .values({
                        id: clerkUserId,
                        email: primaryEmail,
                        name,
                    })
                    .onConflictDoNothing()

                return new Response('ok', { status: 200 })
            },
        },
    },
})
