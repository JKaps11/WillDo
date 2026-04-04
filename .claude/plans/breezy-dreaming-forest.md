# Plan: Skill Import/Export with Metrics Tracking

## Overview
Add functionality to export skills as JSON files and import them back. Track import/export events in user metrics.

---

## Implementation Steps

### 1. Database Schema Update
**File:** `src/db/schemas/user_metrics.schema.ts`

Add after line 17 (`skillsArchived`):
```typescript
skillsImported: integer('skills_imported').default(0).notNull(),
skillsExported: integer('skills_exported').default(0).notNull(),
```

Then run:
```bash
bun run db:generate
bun run db:migrate
```

---

### 2. Repository Methods
**File:** `src/db/repositories/user_metrics.repository.ts`

Add methods following `incrementSkillsArchived` pattern (~line 135):
- `incrementSkillsImported(userId: string)`
- `incrementSkillsExported(userId: string)`

---

### 3. Zod Schemas
**File:** `src/lib/zod-schemas/skill.ts`

Add at end of file:
```typescript
// Export/Import schemas
export const exportedSkillMetricSchema = z.object({
  name: z.string().min(1).max(255),
  unit: z.string().nullable(),
  targetValue: z.number().int().positive(),
  currentValue: z.number().int().min(0),
});

export const exportedSubSkillSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable(),
  stage: subSkillStageSchema,
  sortOrder: z.number().int(),
  parentIndex: z.number().int().nullable(), // Index in array for hierarchy
  metrics: z.array(exportedSkillMetricSchema),
});

export const importSkillSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  skill: z.object({
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    icon: z.string().nullable(),
    goal: z.string().nullable(),
  }),
  subSkills: z.array(exportedSubSkillSchema),
});
```

---

### 4. tRPC Routes
**File:** `src/integrations/trpc/routes/skill.trpc.ts`

#### Add `import` endpoint (follow `createWithPlan` pattern at line 88):
```typescript
import: protectedProcedure
  .input(importSkillSchema)
  .mutation(async ({ ctx, input }) => {
    // 1. Create skill from input.skill
    // 2. Loop through input.subSkills, create each with parentSubSkillId resolved from parentIndex
    // 3. Create metrics for each subSkill
    // 4. Track: userMetricsRepository.incrementSkillsImported(ctx.userId)
    // 5. Return created skill
  }),
```

#### Add `trackExport` endpoint:
```typescript
trackExport: protectedProcedure
  .input(z.object({ skillId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    await userMetricsRepository.incrementSkillsExported(ctx.userId);
    addWide({ skill_id: input.skillId, event: 'skill_exported' });
    return { success: true };
  }),
```

---

### 5. Export Utility Function
**New file:** `src/lib/utils/skill-export.ts`

```typescript
interface ExportedSkill { ... } // Type from Zod schema

export function transformSkillForExport(skill, enrichedSubSkills): ExportedSkill {
  // Transform skill.get response to export format
  // Map subSkills to use parentIndex instead of parentSubSkillId
}

export function downloadSkillAsJson(data: ExportedSkill, skillName: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${skillName.toLowerCase().replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

---

### 6. Export Button Handler
**File:** `src/components/skills-hub/SkillCard.tsx`

Update Export button (lines 145-152) with onClick:
```typescript
const trpc = useTRPC();

// Add mutation for tracking
const trackExportMutation = useMutation(
  trpc.skill.trackExport.mutationOptions()
);

// Add handler
async function handleExport(): Promise<void> {
  // 1. Fetch full skill data via skill.get (already have basic skill in props)
  // 2. Transform to export format
  // 3. Trigger download
  // 4. Track export: trackExportMutation.mutate({ skillId: skill.id })
}
```

Wire button:
```typescript
<Button onClick={handleExport} ...>
  <Download className="mr-2 size-4" />
  Export
</Button>
```

---

### 7. Import Modal Component
**New file:** `src/components/skills-hub/ImportSkillModal.tsx`

Follow `EditSkillModal.tsx` pattern:
- Dialog with trigger prop
- Hidden file input (accept=".json")
- On file select: parse JSON, validate with Zod schema
- Show preview (skill name, subskill count)
- Import button calls `skill.import` mutation
- Invalidate `['skill', 'list']` on success
- Error handling for invalid JSON/schema

---

### 8. Wire Import Button
**File:** `src/components/common/AppHeader.tsx`

Update lines 204-207:
```typescript
<ImportSkillModal
  trigger={
    <Button key="import-skill-button" nativeButton={false}>
      <Upload className="mr-2 size-4" />
      Import Skill
    </Button>
  }
/>
```

---

## Files to Modify/Create

| File | Action |
|------|--------|
| `src/db/schemas/user_metrics.schema.ts` | Add 2 fields |
| `src/db/repositories/user_metrics.repository.ts` | Add 2 methods |
| `src/lib/zod-schemas/skill.ts` | Add export/import schemas |
| `src/lib/zod-schemas/index.ts` | Export new schemas |
| `src/integrations/trpc/routes/skill.trpc.ts` | Add import + trackExport endpoints |
| `src/lib/utils/skill-export.ts` | **New** - export utilities |
| `src/components/skills-hub/SkillCard.tsx` | Add export handler |
| `src/components/skills-hub/ImportSkillModal.tsx` | **New** - import modal |
| `src/components/common/AppHeader.tsx` | Wire import modal |

---

## Verification

1. **Export flow:**
   - Go to Skill Hub
   - Click skill menu → Export
   - Verify JSON file downloads with correct structure
   - Verify `skillsExported` metric increments (check in dev tools/db)

2. **Import flow:**
   - Click "Import Skill" in header
   - Select exported JSON file
   - Verify skill appears in list with all subskills and metrics
   - Verify `skillsImported` metric increments

3. **Run existing tests:**
   ```bash
   bun run test
   ```
