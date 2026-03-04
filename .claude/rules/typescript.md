---
paths: **/*.{ts,tsx}
---

# TypeScript typing rules (project-wide)

- ALWAYS add explicit types for:
  - function params
  - function return types
  - exported constants/functions
  - object shapes (interfaces/types)
- Avoid `any` (use `unknown`, generics, or proper types instead).
- No implicit `any`. Fix typing at the source rather than casting.

## Type hierarchy — single source of truth

The DB schema (`src/db/schemas/`) is the **canonical source of truth** for all data that lives in the database. Every other type that describes the same data must be derived from, or verified against, the DB schema types.

### The chain: DB schema → Zod schema → TypeScript types → component props

1. **DB schema types** (`$inferSelect` / `$inferInsert`) define the canonical field names and types.
2. **Zod schemas** (`src/lib/zod-schemas/`) add runtime validation on top. They must:
   - Include a `satisfies` assertion proving their inferred type is assignable to the corresponding DB type (e.g., `satisfies z.ZodType<Omit<NewPracticeEvaluation, 'id' | 'createdAt' | 'updatedAt'>>`).
   - Derive enum values from DB enums (e.g., `z.enum(priorityEnum.enumValues)`), never re-declare them.
   - Use `.pick()` / `.omit()` / `.extend()` to create variants — never copy-paste fields into a new `z.object()`.
3. **TypeScript types** elsewhere must derive from the highest available source:
   - If the data is in the DB → use `Pick<Skill, 'id' | 'name'>`, `Omit<NewTask, 'id' | 'createdAt'>`, etc.
   - If the data is a Zod-validated input → use `z.infer<typeof schema>`.
   - If neither applies (e.g., UI-only state) → define a local interface, but still compose from DB/Zod types for any overlapping fields.
4. **Component props** — keep in the same file. Derive from DB/Zod types where possible (e.g., `Pick<Task, 'id' | 'name' | 'completed'>`).

### What this means in practice

- **Never** manually write `{ title: string; wentWell: Array<string>; ... }` if those fields exist on a DB schema type. Use `Pick`/`Omit` instead.
- **Never** define a Zod `z.object({ field: z.string(), ... })` that re-declares fields from another Zod schema. Use `.pick()`, `.omit()`, or `.extend()`.
- **Repository return types** for joined queries (where field names differ from the schema, e.g., `skillName` instead of `name`) are the one exception — these are projection types and can be defined as local interfaces.
