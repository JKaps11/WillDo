import { addWideRpc, addWideError } from './wideEventStore.server'

/**
 * Context object passed to server function handlers with input.
 */
export interface ServerFnContext<TInput> {
    data: TInput
}

/**
 * Wrapper for server functions that enriches the wide event with RPC context.
 *
 * Usage:
 * ```ts
 * import { createServerFn } from '@tanstack/react-start'
 * import { withLogging } from '@/lib/logging/serverFn.server'
 *
 * export const myServerFn = createServerFn()
 *   .handler(withLogging('myServerFn', async () => {
 *     // your server function logic
 *     return { result: 'data' }
 *   }))
 * ```
 */
export function withLogging<TOutput>(
    procedureName: string,
    handler: () => TOutput | Promise<TOutput>
): () => Promise<TOutput> {
    return async (): Promise<TOutput> => {
        addWideRpc({
            system: 'server_fn',
            procedure: procedureName,
        })

        try {
            return await handler()
        } catch (err: unknown) {
            if (err instanceof Error) {
                addWideError(err)
            }
            throw err
        }
    }
}

/**
 * Wrapper for server functions with input that enriches the wide event.
 *
 * Usage:
 * ```ts
 * import { createServerFn } from '@tanstack/react-start'
 * import { withLoggingInput } from '@/lib/logging/serverFn.server'
 *
 * export const myServerFn = createServerFn()
 *   .validator((data: { id: string }) => data)
 *   .handler(withLoggingInput('myServerFn', async ({ data }) => {
 *     return { result: data.id }
 *   }))
 * ```
 */
export function withLoggingInput<TInput, TOutput>(
    procedureName: string,
    handler: (ctx: ServerFnContext<TInput>) => TOutput | Promise<TOutput>
): (ctx: ServerFnContext<TInput>) => Promise<TOutput> {
    return async (ctx: ServerFnContext<TInput>): Promise<TOutput> => {
        addWideRpc({
            system: 'server_fn',
            procedure: procedureName,
        })

        try {
            return await handler(ctx)
        } catch (err: unknown) {
            if (err instanceof Error) {
                addWideError(err)
            }
            throw err
        }
    }
}
