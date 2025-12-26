import type { WideEvent } from './types'

export interface TailSamplingContext {
    status_code: number | null
    duration_ms: number | null
    user?: { plan?: string }
}

/**
 * Tail sampling rules - log if ANY condition is true:
 * - status_code >= 500 (server errors)
 * - duration_ms > 2000 (slow requests)
 * - user.plan === 'enterprise' (enterprise users always logged)
 * - 5% random sample for baseline coverage
 */
export function shouldLog(ctx: TailSamplingContext): boolean {
    if (ctx.status_code !== null && ctx.status_code >= 500) {
        return true
    }

    if (ctx.duration_ms !== null && ctx.duration_ms > 2000) {
        return true
    }

    if (ctx.user?.plan === 'enterprise') {
        return true
    }

    if (Math.random() < 0.05) {
        return true
    }

    return false
}

/**
 * Emit a wide event as a structured JSON log line.
 * Uses console.log for compatibility with Netlify serverless functions.
 */
export function emitWideEvent(event: WideEvent): void {
    const logLine = JSON.stringify(event)
    console.log(logLine)
}

/**
 * Finalize and emit the wide event if it passes tail sampling.
 */
export function finalizeAndEmit(event: WideEvent): void {
    if (shouldLog(event)) {
        emitWideEvent(event)
    }
}
