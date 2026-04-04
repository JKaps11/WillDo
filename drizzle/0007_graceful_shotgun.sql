CREATE TYPE "public"."check_in_response" AS ENUM('yes', 'no', 'partial');--> statement-breakpoint
CREATE TYPE "public"."partner_invite_status" AS ENUM('pending', 'accepted', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."partner_notification_type" AS ENUM('invite_received', 'invite_accepted', 'check_in_reminder', 'partner_checked_in', 'partner_missed', 'streak_milestone', 'shared_streak_milestone', 'partner_level_up');--> statement-breakpoint
CREATE TYPE "public"."check_in_frequency" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TYPE "public"."partnership_status" AS ENUM('pending', 'active', 'paused', 'ended');--> statement-breakpoint
CREATE TYPE "public"."sharing_level" AS ENUM('none', 'summary', 'detailed');--> statement-breakpoint
CREATE TABLE "check_in" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partnership_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"response" "check_in_response" NOT NULL,
	"note" text,
	"xp_awarded" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_invite" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_id" text NOT NULL,
	"token" text NOT NULL,
	"invitee_email" text,
	"status" "partner_invite_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"partnership_id" uuid,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "partner_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "partner_notification_type" NOT NULL,
	"partnership_id" uuid,
	"data" jsonb,
	"read" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership_sharing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partnership_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"share_streaks" "sharing_level" DEFAULT 'summary' NOT NULL,
	"share_completion_rate" "sharing_level" DEFAULT 'summary' NOT NULL,
	"share_skill_names" "sharing_level" DEFAULT 'summary' NOT NULL,
	"share_skill_tree" "sharing_level" DEFAULT 'none' NOT NULL,
	"share_tasks" "sharing_level" DEFAULT 'none' NOT NULL,
	"share_xp_level" "sharing_level" DEFAULT 'summary' NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partnership" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"inviter_id" text NOT NULL,
	"invitee_id" text NOT NULL,
	"status" "partnership_status" DEFAULT 'pending' NOT NULL,
	"check_in_frequency" "check_in_frequency" DEFAULT 'daily' NOT NULL,
	"damage_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_metrics" ADD COLUMN "partner_check_ins_completed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_metrics" ADD COLUMN "shared_streak_current" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_metrics" ADD COLUMN "shared_streak_best" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_metrics" ADD COLUMN "partner_bonus_xp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_partnership_id_partnership_id_fk" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "check_in" ADD CONSTRAINT "check_in_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invite" ADD CONSTRAINT "partner_invite_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_invite" ADD CONSTRAINT "partner_invite_partnership_id_partnership_id_fk" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnership"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_notification" ADD CONSTRAINT "partner_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_notification" ADD CONSTRAINT "partner_notification_partnership_id_partnership_id_fk" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership_sharing" ADD CONSTRAINT "partnership_sharing_partnership_id_partnership_id_fk" FOREIGN KEY ("partnership_id") REFERENCES "public"."partnership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership_sharing" ADD CONSTRAINT "partnership_sharing_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership" ADD CONSTRAINT "partnership_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partnership" ADD CONSTRAINT "partnership_invitee_id_user_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "check_in_unique_idx" ON "check_in" USING btree ("partnership_id","user_id","date");--> statement-breakpoint
CREATE INDEX "check_in_user_date_idx" ON "check_in" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "partner_invite_token_idx" ON "partner_invite" USING btree ("token");--> statement-breakpoint
CREATE INDEX "partner_invite_inviter_idx" ON "partner_invite" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "partner_notification_user_read_idx" ON "partner_notification" USING btree ("user_id","read");--> statement-breakpoint
CREATE INDEX "partner_notification_user_idx" ON "partner_notification" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partnership_sharing_unique_idx" ON "partnership_sharing" USING btree ("partnership_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "partnership_inviter_invitee_idx" ON "partnership" USING btree ("inviter_id","invitee_id");--> statement-breakpoint
CREATE INDEX "partnership_inviter_idx" ON "partnership" USING btree ("inviter_id");--> statement-breakpoint
CREATE INDEX "partnership_invitee_idx" ON "partnership" USING btree ("invitee_id");