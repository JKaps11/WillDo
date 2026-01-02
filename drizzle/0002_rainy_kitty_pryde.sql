CREATE TYPE "public"."sync_status" AS ENUM('pending', 'synced', 'error');--> statement-breakpoint
CREATE TYPE "public"."calendar_view" AS ENUM('month', 'week', 'day');--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"google_event_id" text,
	"google_calendar_id" text,
	"last_synced_at" timestamp with time zone,
	"syncStatus" "sync_status" DEFAULT 'pending',
	"recurrence_rule" text,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "google_calendar_auth" (
	"user_id" text PRIMARY KEY NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expires_at" timestamp with time zone NOT NULL,
	"primary_calendar_id" text,
	"sync_enabled" boolean DEFAULT true NOT NULL,
	"webhook_channel_id" text,
	"webhook_resource_id" text,
	"webhook_expiration" timestamp with time zone,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "settings" SET DEFAULT '{"appearance":{"theme":"system"},"todoList":{"sortBy":"priority","timeSpan":"week","showCompleted":true},"calendar":{"startOfWeek":0,"defaultEventDuration":60,"defaultView":"week","googleCalendarSync":false}}'::jsonb;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "google_calendar_auth" ADD CONSTRAINT "google_calendar_auth_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_event_user_time" ON "event" ("user_id", "start_time", "end_time");--> statement-breakpoint
CREATE INDEX "idx_event_google" ON "event" ("google_event_id") WHERE "google_event_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_event_sync_status" ON "event" ("syncStatus") WHERE "syncStatus" != 'synced';