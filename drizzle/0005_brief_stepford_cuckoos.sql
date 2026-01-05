CREATE TYPE "public"."sub_skill_stage" AS ENUM('not_started', 'practice', 'feedback', 'evaluate', 'complete');--> statement-breakpoint
CREATE TYPE "public"."recurrence_end_type" AS ENUM('never', 'after_count', 'on_date');--> statement-breakpoint
CREATE TABLE "skill_metric" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"sub_skill_id" uuid NOT NULL,
	"name" text NOT NULL,
	"unit" text,
	"target_value" integer DEFAULT 1 NOT NULL,
	"current_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT '#3B82F6' NOT NULL,
	"icon" text,
	"goal" text,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_skill_dependency" (
	"user_id" text NOT NULL,
	"dependent_sub_skill_id" uuid NOT NULL,
	"prerequisite_sub_skill_id" uuid NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sub_skill_dependency_dependent_sub_skill_id_prerequisite_sub_skill_id_pk" PRIMARY KEY("dependent_sub_skill_id","prerequisite_sub_skill_id")
);
--> statement-breakpoint
CREATE TABLE "sub_skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"skill_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"stage" "sub_skill_stage" DEFAULT 'not_started' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "sub_skill_id" uuid;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "is_recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence_rule" json;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence_end_type" "recurrence_end_type";--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "recurrence_end_value" integer;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "parent_task_id" uuid;--> statement-breakpoint
ALTER TABLE "skill_metric" ADD CONSTRAINT "skill_metric_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_metric" ADD CONSTRAINT "skill_metric_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill_dependency" ADD CONSTRAINT "sub_skill_dependency_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill_dependency" ADD CONSTRAINT "sub_skill_dependency_dependent_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("dependent_sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill_dependency" ADD CONSTRAINT "sub_skill_dependency_prerequisite_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("prerequisite_sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill" ADD CONSTRAINT "sub_skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill" ADD CONSTRAINT "sub_skill_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_parent_task_id_task_id_fk" FOREIGN KEY ("parent_task_id") REFERENCES "public"."task"("id") ON DELETE no action ON UPDATE no action;