CREATE TABLE "ai_regenerations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"note_id" uuid NOT NULL,
	"type" varchar(10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_regenerations" ADD CONSTRAINT "ai_regenerations_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_regenerations_user_id_type_idx" ON "ai_regenerations" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "ai_regenerations_created_at_idx" ON "ai_regenerations" USING btree ("created_at");