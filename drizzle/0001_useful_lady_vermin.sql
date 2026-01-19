CREATE TYPE "public"."completion_event_type" AS ENUM('task_completed', 'subskill_completed', 'skill_archived');--> statement-breakpoint
CREATE TABLE "completion_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"event_type" "completion_event_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"skill_id" uuid,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_metrics" (
	"user_id" text PRIMARY KEY NOT NULL,
	"tasks_completed" integer DEFAULT 0 NOT NULL,
	"tasks_created" integer DEFAULT 0 NOT NULL,
	"sub_skills_completed" integer DEFAULT 0 NOT NULL,
	"skills_archived" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"best_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" date,
	"weekly_goal" integer DEFAULT 10 NOT NULL,
	"weekly_completed" integer DEFAULT 0 NOT NULL,
	"week_start_date" date,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" DROP CONSTRAINT "task_sub_skill_id_sub_skill_id_fk";
--> statement-breakpoint
ALTER TABLE "sub_skill" ALTER COLUMN "stage" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "sub_skill" ALTER COLUMN "stage" SET DEFAULT 'not_started'::text;--> statement-breakpoint
DROP TYPE "public"."sub_skill_stage";--> statement-breakpoint
CREATE TYPE "public"."sub_skill_stage" AS ENUM('not_started', 'practice', 'evaluate', 'complete');--> statement-breakpoint
ALTER TABLE "sub_skill" ALTER COLUMN "stage" SET DEFAULT 'not_started'::"public"."sub_skill_stage";--> statement-breakpoint
ALTER TABLE "sub_skill" ALTER COLUMN "stage" SET DATA TYPE "public"."sub_skill_stage" USING "stage"::"public"."sub_skill_stage";--> statement-breakpoint
ALTER TABLE "completion_event" ADD CONSTRAINT "completion_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_metrics" ADD CONSTRAINT "user_metrics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "completion_event_user_date_idx" ON "completion_event" USING btree ("user_id","completed_at");--> statement-breakpoint
CREATE INDEX "completion_event_user_type_idx" ON "completion_event" USING btree ("user_id","event_type");--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;