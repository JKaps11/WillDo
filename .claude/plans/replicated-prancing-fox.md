# Plan: Partnership Integrity Fixes

## Context
Three verified issues in the partnership/check-in system need fixing. One suggested change (partnership_member table) was evaluated and deemed over-engineering for a bilateral partnership model, so it is excluded.

---

## Fix 1: Symmetric Partnership Uniqueness + Self-Partnership CHECK

**Problem**: The UNIQUE index on `(inviter_id, invitee_id)` is directional -- A->B and B->A can both exist. No DB-level self-partnership prevention.

**Files to modify**:
- `src/db/schemas/partnership.schema.ts` -- add `check()` constraint
- New migration `drizzle/0008_partnership_symmetric_constraints.sql`
- `drizzle/meta/_journal.json` -- add entry for new migration

**Changes**:

1. Create `drizzle/0008_partnership_symmetric_constraints.sql`:
   ```sql
   DROP INDEX IF EXISTS "partnership_inviter_invitee_idx";
   CREATE UNIQUE INDEX "partnership_pair_unique_idx"
     ON "partnership" (LEAST(inviter_id, invitee_id), GREATEST(inviter_id, invitee_id));
   ALTER TABLE "partnership"
     ADD CONSTRAINT "partnership_no_self" CHECK (inviter_id <> invitee_id);
   ```

2. Update `src/db/schemas/partnership.schema.ts`:
   - Import `check` from `drizzle-orm/pg-core` and `sql` from `drizzle-orm`
   - Add `check('partnership_no_self', sql`inviter_id <> invitee_id`)` to the table extras
   - Add comment on the existing `uniqueIndex` noting the DB has a symmetric expression index (Drizzle can't represent expression indexes)

3. Add journal entry in `drizzle/meta/_journal.json` for migration 0008

---

## Fix 2: Weekly Check-In Period Enforcement

**Problem**: `checkInFrequency` is stored on partnerships but never enforced -- weekly partnerships allow check-ins on every day of the week.

**Files to modify**:
- `src/db/repositories/check_in.repository.ts` -- add `findByPartnershipInDateRange` method, update `getPendingPartnerships`
- `src/integrations/trpc/routes/check_in.trpc.ts` -- add weekly guard in `submit`

**Changes**:

1. Add `findByPartnershipInDateRange` to `check_in.repository.ts`:
   - Queries for existing check-in within a date range for a given partnership + user
   - Uses `gte`/`lte` on `checkIns.date` with the range bounds

2. Update `submit` in `check_in.trpc.ts` (after existing daily guard, ~line 60):
   - If `partnership.checkInFrequency === 'weekly'`, compute week bounds using `startOfWeek`/`endOfWeek` from `@/lib/dates`
   - Call `findByPartnershipInDateRange` to check if a check-in already exists this week
   - Throw `BAD_REQUEST` if one exists

3. Update `getPendingPartnerships` in `check_in.repository.ts`:
   - For weekly partnerships, check if user has checked in this week (not just today)
   - Filter using `startOfWeek`/`endOfWeek` from `@/lib/dates`

---

## Fix 3: Sanitize Public Invite Token Lookup

**Problem**: `getInviteByToken` is a `publicProcedure` returning `inviterId` and `inviteeEmail` to unauthenticated users.

**Files to modify**:
- `src/integrations/trpc/routes/partnership.trpc.ts` -- sanitize response
- `src/db/repositories/partnership.repository.ts` -- add public-safe query
- `src/routes/invite.$token.tsx` -- update to use new response shape

**Changes**:

1. Add `findInviteByTokenPublic` to `partnership.repository.ts`:
   - Joins `partner_invite` with `users` on `inviterId` to get inviter's name
   - Returns `{ inviterName, status, expiresAt, inviteeEmail }` (inviteeEmail is needed for masking)

2. Update `getInviteByToken` in `partnership.trpc.ts`:
   - Use `findInviteByTokenPublic` instead of `findInviteByToken`
   - Return `{ inviterName, inviteeEmail: masked }` instead of `{ inviterId, inviteeEmail }`
   - Mask email inline: show first char + `***@domain.com`

3. Update `src/routes/invite.$token.tsx`:
   - Display `inviteInfo.inviterName` (e.g., "Invited by {name}")
   - `inviteeEmail` is already masked by backend, no frontend change needed for that field

---

## Skipped: Partnership Member Table

The suggestion to add a `partnership_member` table with composite FK enforcement is **not implemented**. Reasoning:
- Partnerships are always bilateral (exactly 2 members)
- A membership table adds unnecessary indirection for fixed-2-member relationships
- Application-level validation already ensures user_id in check-ins/sharing is a valid partner

---

## Verification

1. **Fix 1**: Run migration, then test that inserting self-partnerships and symmetric duplicates fails at DB level
2. **Fix 2**: Create a weekly partnership, submit a check-in, then verify a second check-in in the same week is rejected. Verify `getPendingPartnerships` correctly hides weekly partnerships already checked in this week.
3. **Fix 3**: Visit `/invite/<token>` while unauthenticated, verify response contains `inviterName` and masked email, not `inviterId` or raw `inviteeEmail`
4. Run `bun run check` to verify linting/formatting
5. Run existing Playwright tests: `bun run test`
