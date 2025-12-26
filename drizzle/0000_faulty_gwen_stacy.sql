CREATE TYPE "public"."priority" AS ENUM('Very_Low', 'Low', 'Medium', 'High', 'Very_High');--> statement-breakpoint
CREATE TYPE "public"."todo_list_sort_by" AS ENUM('date', 'priority', 'alphabetical');--> statement-breakpoint
CREATE TYPE "public"."todo_list_time_span" AS ENUM('day', 'week');--> statement-breakpoint
CREATE TABLE "task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"todo_list_date" date NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"priority" "priority" DEFAULT 'Medium' NOT NULL,
	"due_date" timestamp,
	"completed" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_list" (
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "todo_list_user_id_date_pk" PRIMARY KEY("user_id","date")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"settings" jsonb DEFAULT '{"todoList":{"sortBy":"priority","timeSpan":"week","showCompleted": true}}'::jsonb NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_todo_list_date_user_id_todo_list_date_user_id_fk" FOREIGN KEY ("todo_list_date","user_id") REFERENCES "public"."todo_list"("date","user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_list" ADD CONSTRAINT "todo_list_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;