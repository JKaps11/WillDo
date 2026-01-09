CREATE TYPE "public"."sub_skill_stage" AS ENUM('not_started', 'practice', 'feedback', 'evaluate', 'complete');--> statement-breakpoint
CREATE TYPE "public"."days_of_week" AS ENUM('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('Very_Low', 'Low', 'Medium', 'High', 'Very_High');--> statement-breakpoint
CREATE TYPE "public"."recurrence_end_type" AS ENUM('never', 'after_count', 'on_date');--> statement-breakpoint
CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."appearance_theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TYPE "public"."todo_list_sort_by" AS ENUM('date', 'priority', 'alphabetical');--> statement-breakpoint
CREATE TYPE "public"."todo_list_time_span" AS ENUM('day', 'week');--> statement-breakpoint
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
	"color" text NOT NULL,
	"icon" text,
	"goal" text,
	"archived" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_skill" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"skill_id" uuid NOT NULL,
	"parent_sub_skill_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"stage" "sub_skill_stage" DEFAULT 'not_started' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"todo_list_date" date,
	"name" text NOT NULL,
	"description" text,
	"priority" "priority" DEFAULT 'Medium' NOT NULL,
	"due_date" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"sub_skill_id" uuid NOT NULL,
	"recurrence_rule" json,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"settings" jsonb DEFAULT '{"appearance":{"theme":"system"},"todoList":{"sortBy":"priority","timeSpan":"week","showCompleted":true}}'::jsonb NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "skill_metric" ADD CONSTRAINT "skill_metric_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_metric" ADD CONSTRAINT "skill_metric_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill" ADD CONSTRAINT "skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill" ADD CONSTRAINT "sub_skill_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill" ADD CONSTRAINT "sub_skill_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_skill" ADD CONSTRAINT "sub_skill_parent_fkey" FOREIGN KEY ("parent_sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_user_date_idx" ON "task" USING btree ("user_id","todo_list_date");