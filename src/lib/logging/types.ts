/**
 * Wide event type definition.
 * This file contains only types and can be safely imported from client code.
 */

export interface WideEventUser {
  id: string;
  plan?: string;
}

export interface WideEventRpc {
  system: 'trpc' | 'server_fn';
  procedure: string;
}

export interface WideEventError {
  message: string;
  code?: string;
  stack?: string;
}

export interface WideEvent {
  event: 'http_request';
  request_id: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number | null;
  duration_ms: number | null;

  user?: WideEventUser;
  rpc?: WideEventRpc;
  error?: WideEventError;

  [key: string]: unknown;
}

/**
 * Fields that can be added to a wide event after initialization.
 */
export type WideEventFields = Partial<
  Omit<WideEvent, 'event' | 'request_id' | 'timestamp'>
>;
