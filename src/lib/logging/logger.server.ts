import type { WideEvent } from './types';

/**
 * Tail sampling rules - log if ANY condition is true:
 * - error exists (always log errors)
 * - status_code >= 400 (client/server errors)
 * - duration_ms > 2000 (slow requests)
 * - user.plan === 'enterprise' (enterprise users always logged)
 * - 5% random sample for baseline coverage
 */
export function shouldLog(event: WideEvent): boolean {
  // Always log errors
  if (event.error || event.dbError) {
    return true;
  }

  if (event.status_code !== null && event.status_code >= 400) {
    return true;
  }

  if (event.duration_ms !== null && event.duration_ms > 2000) {
    return true;
  }

  // if (event.user?.plan === 'enterprise') {
  //   return true;
  // }

  // if (Math.random() < 0.05) {
  //   return true;
  // }

  return true;
}

/**
 * Emit a wide event as a structured JSON log line.
 * Uses console.log for compatibility with Netlify serverless functions.
 */
export function emitWideEvent(event: WideEvent): void {
  const logLine = JSON.stringify(event);
  console.log(logLine);
}

/**
 * Finalize and emit the wide event if it passes tail sampling.
 */
export function finalizeAndEmit(event: WideEvent): void {
  if (shouldLog(event)) {
    emitWideEvent(event);
  }
}
