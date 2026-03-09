# WillDo

A full-stack skill mastery platform that helps users learn any skill through structured practice, progress tracking, and AI-powered learning plans. Break any skill into learnable pieces and go from practice to mastery.

## Features

### AI-Powered Skill Planning
Generate personalized learning paths based on your skill, goal, current level, and context. The AI breaks skills into structured sub-skill trees with clear progression.

### Visual Skill Planner
Interactive flowchart editor (React Flow) for organizing and visualizing skill hierarchies. Drag-and-drop sub-skills, customize colors and icons, and see your entire learning path at a glance.

### Progress Stages
Sub-skills move through proven learning stages: **Not Started** > **Practice** > **Evaluate** > **Complete**. Each stage encourages deliberate practice and self-assessment before marking mastery.

### Daily Todo List
Schedule practice sessions with day or week views. Supports recurring tasks (daily/weekly), priority levels, due dates, and drag-and-drop scheduling between days.

### Practice Evaluations & Reflections
After each practice session, reflect on what went well, what you struggled with, your confidence level, and focus areas for next time. Review all reflections over time to track growth.

### Dashboard & Analytics
Track tasks completed, sub-skills mastered, streaks, weekly goals, and XP/levels. View time-series charts across week, month, and year views.

### Skills Hub
Browse, manage, archive, and export/import skill plans as JSON. Set an active skill to focus your daily practice.

### Mobile App
Expo-based React Native app with push notifications, offline support, and native UI.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19) |
| API | tRPC + SuperJSON |
| Database | Drizzle ORM + Neon PostgreSQL |
| Auth | Clerk |
| AI | OpenAI (GPT-4) via Vercel AI SDK |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Visualization | React Flow, Recharts, dnd-kit |
| Mobile | React Native (Expo) + NativeWind |
| Testing | Playwright (E2E) |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) runtime
- A [Neon](https://neon.tech/) PostgreSQL database
- A [Clerk](https://clerk.com/) application
- An [OpenAI](https://platform.openai.com/) API key

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials (Neon database URL, Clerk keys, OpenAI API key)
4. Push the database schema:
   ```bash
   bun run db:push
   ```
5. Start the dev server:
   ```bash
   bun run dev
   ```
   The app runs at `http://localhost:3000`.

## Development

### Commands

```bash
# Development
bun run dev              # Start dev server on port 3000

# Build & Production
bun run build            # Build for production
bun run start            # Run production build

# Code Quality
bun run check            # Format (Prettier) + lint (ESLint) with auto-fix
bun run lint             # ESLint only
bun run format           # Prettier only

# Testing (Playwright E2E)
bun run test             # Run all Playwright tests
bun run test:ui          # Open Playwright UI mode

# Database (Drizzle + Neon)
bun run db:generate      # Generate migrations from schema changes
bun run db:migrate       # Run pending migrations
bun run db:push          # Push schema directly (dev only)
bun run db:studio        # Open Drizzle Studio GUI
```

### Project Structure

```
src/
├── routes/                  # File-based routing (TanStack Router)
│   ├── __root.tsx           # Root layout
│   ├── index.tsx            # Landing page
│   └── app/                 # Authenticated app routes
│       ├── dashboard/       # Dashboard & analytics
│       ├── skills/          # Skills hub, planner, creation
│       ├── reflections/     # Practice evaluation history
│       └── settings/        # User preferences
├── components/
│   ├── ui/                  # shadcn/ui base components
│   ├── dashboard/           # Dashboard widgets
│   ├── planner/             # Visual skill planner (React Flow)
│   ├── sidebar/             # App navigation
│   ├── skills/              # Skill cards, forms, hub
│   ├── tasks/               # Todo list, task forms
│   └── landing/             # Marketing/landing page
├── db/
│   ├── schemas/             # Drizzle table definitions
│   └── repositories/        # Data access layer
├── integrations/
│   └── trpc/
│       ├── routes/          # tRPC routers (skills, tasks, dashboard, AI, etc.)
│       ├── router.ts        # Root router
│       └── react.ts         # Client-side tRPC hooks
├── lib/
│   ├── zod-schemas/         # All Zod validation schemas
│   ├── types.ts             # Shared TypeScript types
│   └── store.ts             # Client state (TanStack Store)
└── styles.css               # Tailwind + CSS variable theming

tests/
├── fixtures/                # Custom Playwright test fixtures
├── pom/                     # Page Object Model classes
├── helpers/                 # API helpers, DnD helpers
└── specs/                   # E2E test specs

mobile/                      # Expo React Native app
```

### Key Architectural Patterns

- **tRPC routers** in `src/integrations/trpc/routes/` — `protectedProcedure` for authenticated endpoints, `publicProcedure` for open ones
- **Server-only code** — files ending in `.server.ts` are automatically stubbed out in client builds
- **Repository pattern** — `src/db/repositories/` abstracts all database queries
- **Type derivation** — types flow from Drizzle schemas (`$inferSelect`/`$inferInsert`) and Zod schemas (`z.infer`), not manual interfaces
- **Zod schemas** live exclusively in `src/lib/zod-schemas/` — never inline
- **Page Object Model** for Playwright tests — locators live in POM classes, specs only call POM methods

## Contributing

### Branch & PR Workflow

**All changes must go through pull requests.** Do not push directly to `master`.

1. Create a feature branch from `master`:
   ```bash
   git checkout -b feature/your-feature master
   ```
2. Make your changes and commit with clear, descriptive messages
3. Push your branch and open a pull request against `master`
4. PRs require review before merging — no self-merging without review

### Code Quality

- Run `bun run check` before pushing to ensure formatting and linting pass
- Add explicit TypeScript types for function params, return types, and exports — avoid `any`
- Follow existing patterns in the codebase

### AI-Generated Code Policy

**Pull requests that are clearly AI-generated without meaningful human review or effort will be closed without discussion.** Contributors are expected to understand, review, and take ownership of every line they submit. Using AI tools to assist is fine — submitting unreviewed AI output is not.

## License

This project is proprietary. All rights reserved.
