# Wide Event Logging — TanStack Start (Claude Opus Prompt)

## Context / Constraints

You are working in a **TanStack Start** application.

- Local development & builds use **Bun**
- Production hosting is **Netlify**
  - Server code runs in **Netlify Serverless Functions (Node 18)**
  - NOT Edge Functions
- Previous attempts at logging failed due to **server code leaking into client bundles**

Logging requirements follow **https://loggingsucks.com/**:

- Structured JSON logs
- **Wide events / canonical log line**
- **Exactly one log event per request**
- Tail sampling after request completion

### Non-Goals

- ❌ No console spam
- ❌ No per-step logs
- ❌ No client-side logging
- ❌ No browser APIs
- ❌ No logging middleware that runs on the client

---

## Goal

Design and implement a **production-grade wide-event logging system** for TanStack Start that:

1. Emits **one canonical JSON log event per request**
2. Accumulates context across:
   - Global request middleware
   - tRPC procedures
   - Server functions
3. Avoids **any server code being bundled into the client**
4. Works correctly on **Netlify Node serverless**
5. Allows easy enrichment from anywhere server-side without manual parameter threading

---

## Required Architecture

### 1. Request-Scoped Wide Event Store

- Use a **request-scoped store**
- Prefer **AsyncLocalStorage (Node)** — this runs safely in Netlify Functions
- The wide event must be a **mutable object**
- The same object must be enriched throughout the request lifecycle

---

### 2. Global Request Middleware (Canonical Log Line)

- Register **TanStack Start global request middleware**
- On request start:
  - Generate `request_id`
  - Initialize the wide event
  - Record HTTP `method` and `path`
- On request completion:
  - Attach `status_code`
  - Attach `duration_ms`
  - Apply tail-sampling rules
  - Emit **exactly one JSON log line**

---

### 3. Tail Sampling Rules

Log the event **if ANY are true**:

- `status_code >= 500`
- `duration_ms > 2000`
- `user.plan === 'enterprise'`
- `Math.random() < 0.05`

Sampling happens **after request completion**, never before.

---

## Server-Only Boundaries (Critical)

You **must** guarantee server-only execution.

### Required Rules

- Place server-only code in `*.server.ts` modules
- Never import Node-only APIs (`async_hooks`, filesystem, loggers) into files that can be client-bundled
- Prefer TanStack Start **server-only execution boundaries**
- If unsure, isolate harder — **correctness > convenience**

The final solution must be **impossible to bundle into the client**.

---

## Deliverables

Generate **real, production-ready code** for the following:

---

### A) `wideEventStore.server.ts`

Responsibilities:

- Define the `WideEvent` type
- Use `AsyncLocalStorage`
- Expose:
  - `runWithWideEvent(initial, fn)`
  - `addWide(fields)`

---

### B) `logger.server.ts`

Responsibilities:

- Emit structured JSON logs using:
  ```ts
  console.log(JSON.stringify(event))
  No transports
  ```

No external services

Must be safe for Netlify Function logs

C) start.ts (or equivalent entry)

Responsibilities:

Register global request middleware

Initialize and finalize the wide event

Apply tail sampling

Emit the canonical log line exactly once

D) tRPC Integration Example

Show how to enrich the wide event with:

rpc: {
system: 'trpc',
procedure: string
}

Must be server-only.

E) Server Function Integration Example

Show how to enrich the wide event with:

rpc: {
system: 'server_fn',
procedure: string
}

Must be safe for client-callable server functions.

Output Requirements

✅ Show real code, not pseudocode

✅ Clearly separate files

✅ Follow TanStack Start conventions

✅ Minimal but production-grade

❌ Do not include client-side code

❌ Do not emit more than one log per request

Expected Result

A single request should produce one structured JSON log like:

{
"event": "http_request",
"request_id": "…",
"method": "POST",
"path": "/api/trpc/todo.create",
"status_code": 200,
"duration_ms": 84,
"user": {
"id": "user_123",
"plan": "free"
},
"rpc": {
"system": "trpc",
"procedure": "todo.create"
}
}

If there is any ambiguity about TanStack Start execution boundaries, default to server-only isolation over convenience.
