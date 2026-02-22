CREATE TABLE "practice_evaluation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"task_id" uuid NOT NULL,
	"sub_skill_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"occurrence_date" date NOT NULL,
	"title" text NOT NULL,
	"went_well" text[] NOT NULL,
	"struggled" text[] NOT NULL,
	"understand_better" text[] NOT NULL,
	"feelings" text[] NOT NULL,
	"focus_next_time" text[] NOT NULL,
	"confidence_level" integer NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "practice_eval_task_occurrence_uniq" UNIQUE("task_id","occurrence_date")
);
--> statement-breakpoint
ALTER TABLE "practice_evaluation" ADD CONSTRAINT "practice_evaluation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_evaluation" ADD CONSTRAINT "practice_evaluation_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_evaluation" ADD CONSTRAINT "practice_evaluation_sub_skill_id_sub_skill_id_fk" FOREIGN KEY ("sub_skill_id") REFERENCES "public"."sub_skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_evaluation" ADD CONSTRAINT "practice_evaluation_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_eval_user_subskill_idx" ON "practice_evaluation" USING btree ("user_id","sub_skill_id");--> statement-breakpoint
CREATE INDEX "practice_eval_user_skill_idx" ON "practice_evaluation" USING btree ("user_id","skill_id");--> statement-breakpoint
CREATE INDEX "practice_eval_task_idx" ON "practice_evaluation" USING btree ("task_id");