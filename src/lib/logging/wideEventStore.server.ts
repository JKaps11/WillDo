import { AsyncLocalStorage } from 'node:async_hooks'
import type { WideEvent, WideEventUser, WideEventRpc, WideEventFields } from './types'

// Re-export the types for convenience
export type { WideEvent, WideEventUser, WideEventRpc, WideEventFields } from './types'

const wideEventStorage: AsyncLocalStorage<WideEvent> = new AsyncLocalStorage<WideEvent>()

/**
 * Run a function within a wide event context.
 * The wide event will be available via getWideEvent() throughout the execution.
 */
export function runWithWideEvent<T>(
    initial: WideEvent,
    fn: () => T | Promise<T>
): T | Promise<T> {
    return wideEventStorage.run(initial, fn)
}

/**
 * Get the current wide event from the async context.
 * Returns undefined if called outside of a request context.
 */
export function getWideEvent(): WideEvent | undefined {
    return wideEventStorage.getStore()
}

/**
 * Add fields to the current wide event.
 * Safely no-ops if called outside of a request context.
 */
export function addWide(fields: WideEventFields): void {
    const event: WideEvent | undefined = wideEventStorage.getStore()
    if (event) {
        Object.assign(event, fields)
    }
}

/**
 * Enrich the user context on the wide event.
 */
export function addWideUser(user: WideEventUser): void {
    const event: WideEvent | undefined = wideEventStorage.getStore()
    if (event) {
        event.user = { ...event.user, ...user }
    }
}

/**
 * Set the RPC context on the wide event.
 */
export function addWideRpc(rpc: WideEventRpc): void {
    const event: WideEvent | undefined = wideEventStorage.getStore()
    if (event) {
        event.rpc = rpc
    }
}

/**
 * Record an error on the wide event.
 */
export function addWideError(err: Error, code?: string): void {
    const event: WideEvent | undefined = wideEventStorage.getStore()
    if (event) {
        event.error = {
            message: err.message,
            code,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        }
    }
}

/**
 * Get the current request ID if available.
 */
export function getRequestId(): string | undefined {
    return wideEventStorage.getStore()?.request_id
}
