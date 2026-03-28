-- Drop the existing directional unique index
DROP INDEX IF EXISTS "partnership_inviter_invitee_idx";

-- Add symmetric unique index: prevents both A->B and B->A duplicates
CREATE UNIQUE INDEX "partnership_pair_unique_idx"
  ON "partnership" (LEAST("inviter_id", "invitee_id"), GREATEST("inviter_id", "invitee_id"));

-- Prevent self-partnerships at DB level
ALTER TABLE "partnership"
  ADD CONSTRAINT "partnership_no_self" CHECK ("inviter_id" <> "invitee_id");
