# Fix Skill Export Types and Privacy

## Problem Summary

1. **Privacy issue**: Exported skills include `currentValue` from metrics, exposing user progress when sharing skills
2. **Type duplication**: `src/lib/utils/skill-export.ts` defines redundant interfaces (`ExportedMetric`, `ExportedSubSkill`) instead of deriving from the existing Zod schemas

## Current State

### Zod Schemas (Single Source of Truth)
`src/lib/zod-schemas/skill.ts` already defines:
- `exportedSkillMetricSchema` (lines 201-206)
- `exportedSubSkillSchema` (lines 208-215)
- `importSkillSchema` (lines 217-228)

### skill-export.ts Issues
- Defines `ExportedMetric` interface (lines 19-24) - duplicates Zod schema
- Defines `ExportedSubSkill` interface (lines 26-33) - duplicates Zod schema
- `transformSkillForExport` passes through `metric.currentValue` instead of hardcoding to 0

## Implementation Plan

### File: `src/lib/zod-schemas/skill.ts`

**No changes needed** - the schemas are already well-defined.

### File: `src/lib/utils/skill-export.ts`

1. **Remove redundant interface definitions**:
   - Delete `ExportedMetric` interface (lines 19-24)
   - Delete `ExportedSubSkill` interface (lines 26-33)

2. **Import and derive types from Zod schemas**:
   ```typescript
   import {
     exportedSkillMetricSchema,
     exportedSubSkillSchema,
     importSkillSchema,
   } from '@/lib/zod-schemas/skill';

   // Derive types from Zod (single source of truth)
   type ExportedMetric = z.infer<typeof exportedSkillMetricSchema>;
   type ExportedSubSkill = z.infer<typeof exportedSubSkillSchema>;
   export type ExportedSkill = z.infer<typeof importSkillSchema>;
   ```

3. **Fix privacy issue** - hardcode `currentValue: 0` in the transform:
   ```typescript
   metrics: subSkill.metrics.map((metric) => ({
     name: metric.name,
     unit: metric.unit,
     targetValue: metric.targetValue,
     currentValue: 0,  // Never export user progress
   })),
   ```

4. **Keep internal input types** - `EnrichedSubSkill` and `SkillWithSubSkills` are correctly derived from DB schema types using extension, which is appropriate for internal transform function inputs.

## Verification

1. Run `bun run check` to ensure TypeScript compiles and linting passes
2. Test export flow:
   - Create a skill with subskills and metrics
   - Increment some metrics (so `currentValue > 0`)
   - Export the skill
   - Verify the exported JSON has `currentValue: 0` for all metrics
3. Test import flow:
   - Import a skill JSON file
   - Verify it imports correctly (no type mismatches)
