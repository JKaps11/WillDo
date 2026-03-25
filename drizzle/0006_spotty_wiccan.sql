CREATE TYPE "public"."prompt_category" AS ENUM('self_assessment', 'insight_extraction', 'forward_looking', 'meta_cognitive');--> statement-breakpoint
CREATE TYPE "public"."still_true_response_type" AS ENUM('still_struggling', 'improved', 'resolved');--> statement-breakpoint
CREATE TABLE "practice_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid NOT NULL,
	"sub_skill_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"occurrence_date" date NOT NULL,
	"title" text NOT NULL,
	"pre_confidence" integer NOT NULL,
	"post_confidence" integer,
	"iteration_number" integer NOT NULL,
	"completed_at" timestamp,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "practice_session_task_occurrence_uniq" UNIQUE("task_id","occurrence_date")
);
--> statement-breakpoint
CREATE TABLE "session_reflection_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"prompt_key" text NOT NULL,
	"prompt_text" text NOT NULL,
	"prompt_category" "prompt_category" NOT NULL,
	"response_text" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "still_true_response" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"source_session_id" uuid NOT NULL,
	"source_response_id" uuid,
	"source_text" text NOT NULL,
	"response" "still_true_response_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "practice_evaluation" CASCADE;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_session" ADD CONSTRAINT "practice_session_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_reflection_response" ADD CONSTRAINT "session_reflection_response_session_id_practice_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "still_true_response" ADD CONSTRAINT "still_true_response_session_id_practice_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "still_true_response" ADD CONSTRAINT "still_true_response_source_session_id_practice_session_id_fk" FOREIGN KEY ("source_session_id") REFERENCES "public"."practice_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "still_true_response" ADD CONSTRAINT "still_true_response_source_response_id_session_reflection_response_id_fk" FOREIGN KEY ("source_response_id") REFERENCES "public"."session_reflection_response"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_session_user_subskill_idx" ON "practice_session" USING btree ("user_id","sub_skill_id");--> statement-breakpoint
CREATE INDEX "practice_session_user_skill_idx" ON "practice_session" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "practice_session_task_idx" ON "practice_session" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "session_reflection_session_idx" ON "session_reflection_response" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "still_true_session_idx" ON "still_true_response" USING btree ("session_id");