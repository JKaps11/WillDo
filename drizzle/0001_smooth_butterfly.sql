CREATE TYPE "public"."appearance_theme" AS ENUM('light', 'dark', 'system');--> statement-breakpoint
CREATE TABLE "tag" (
	"user_id" text NOT NULL,
	"tag_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"color" text NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tag_user_id_tag_id_pk" PRIMARY KEY("user_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "settings" SET DEFAULT '{"appearance":{"theme":"system"},"todoList":{"sortBy":"priority","timeSpan":"week","showCompleted":true}}'::jsonb;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "tag_ids" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "tag" ADD CONSTRAINT "tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;