ALTER TABLE "user_metrics" ADD COLUMN "skills_imported" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_metrics" ADD COLUMN "skills_exported" integer DEFAULT 0 NOT NULL;