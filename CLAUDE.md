# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
bun run dev              # Start dev server on port 3000

# Build & Production
bun run build            # Build for production
bun run start            # Run production build

# Code Quality
bun run check            # Format with Prettier and lint with ESLint (with fixes)
bun run lint             # ESLint only
bun run format           # Prettier only

# Testing (Playwright E2E)
bun run test             # Run all Playwright tests
bun run test:ui          # Open Playwright UI mode
bunx playwright test --project=chromium  # Run specific project
bunx playwright show-report              # Open last HTML report

# Database (Drizzle + Neon PostgreSQL)
bun run db:generate      # Generate migrations from schema changes
bun run db:migrate       # Run pending migrations
bun run db:push          # Push schema directly (dev only)
bun run db:studio        # Open Drizzle Studio GUI
```

## Architecture

**Stack**: TanStack Start (React 19) + tRPC + Drizzle ORM + Neon PostgreSQL + Clerk Auth + Tailwind v4

### Key Patterns

**Routing**: TanStack Router with file-based routes in `src/routes/`. Route tree is auto-generated in `src/routeTree.gen.ts`.

**API Layer**: tRPC with SuperJSON transformer. Routers in `src/integrations/trpc/routes/`:

- `protectedProcedure` - requires auth (most endpoints)
- `publicProcedure` - no auth required
- Client usage via `src/integrations/trpc/react.ts`

**Database**: Drizzle ORM with Neon serverless PostgreSQL.

- Schemas: `src/db/schemas/*.ts`
- Repositories: `src/db/repositories/*.ts` (data access layer)
- Validation: Zod schemas in `src/lib/zod-schemas/`

**Server-Only Code**: Files with `.server.ts` suffix are automatically stubbed out in client builds via custom Vite plugin.

**UI Components**: shadcn/ui components in `src/components/ui/`. Uses CSS variables for theming defined in `src/styles.css`.

**State Management**: TanStack Store (`src/lib/store.ts`) for client state, TanStack Query for server state.

## TypeScript Rules

- ALWAYS add explicit types for function params, return types, and exported items
- Avoid `any` - use `unknown`, generics, or proper types
- No implicit `any` - fix typing at source rather than casting

## Typing

Derive types in this order of preference:

1. **DB schemas** (`src/db/schemas/`) - use `$inferSelect`/`$inferInsert` from Drizzle tables
2. **Zod schemas** - use `z.infer<typeof schema>` when DB types don't apply
3. **Shared types** - put in `src/lib/types.ts` if no schema exists and type is reused
4. **Component-specific** - keep in same file (e.g., prop types)

## Zod Schemas

- ALL Zod schemas must live in `src/lib/zod-schemas/` - never define schemas inline in other files

## React Patterns

- **Group related state**: Combine related state values into a single `useState` object rather than separate calls. For example, form fields like `name` and `description` should be `useState({ name, description })` not two separate `useState` calls. This reduces re-renders and keeps related data together.

## Testing (Playwright E2E)

Tests use the **Page Object Model** pattern. All locators live in POM classes; specs only call POM methods.

### Structure

- `tests/fixtures/base.fixture.ts` — custom `test` with POM fixtures + Clerk token setup
- `tests/pom/*.pom.ts` — one POM per feature area (sidebar, skills-hub, planner, etc.)
- `tests/helpers/api.helpers.ts` — tRPC shortcuts via `page.request` for test data setup/teardown
- `tests/helpers/dnd.helpers.ts` — drag-and-drop simulation for `@dnd-kit`
- `tests/specs/*.spec.ts` — one spec per major workflow

### Conventions

- All specs import `test` and `expect` from `tests/fixtures/base.fixture.ts` (not `@playwright/test`)
- Prefer role/label/text selectors. Use `data-testid` only when no semantic selector exists
- Test data names are prefixed with `E2E_` for easy cleanup via `deleteAllTestSkills()`
- Serial test suites use `beforeAll`/`afterAll` to create/delete test data via API helpers