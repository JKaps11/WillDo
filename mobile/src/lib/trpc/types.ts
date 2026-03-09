/**
 * Re-export the tRPC router type from the web app.
 * This is a type-only import — no runtime code from the server is pulled in.
 * Metro will not bundle this since it's only used for type inference.
 */
export type { TRPCRouter } from '../../../../src/integrations/trpc/routes/router';
