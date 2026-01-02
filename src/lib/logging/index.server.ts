/**
 * Server-only logging module.
 * This file must only be imported from server-side code (.server.ts files).
 */

// Re-export types from the shared types file (safe for client import)
export type {
  WideEvent,
  WideEventUser,
  WideEventRpc,
  WideEventError,
  WideEventFields,
} from './types';

export {
  runWithWideEvent,
  getWideEvent,
  addWide,
  addWideUser,
  addWideRpc,
  addWideError,
  getRequestId,
} from './wideEventStore.server';

export {
  type TailSamplingContext,
  shouldLog,
  emitWideEvent,
  finalizeAndEmit,
} from './logger.server';

export { withLogging, withLoggingInput } from './serverFn.server';
