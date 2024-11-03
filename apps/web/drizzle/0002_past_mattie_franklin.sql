CREATE TABLE IF NOT EXISTS "ec_cover_me" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"requester_id" text NOT NULL,
	"requester_address" text NOT NULL,
	"event_id" text NOT NULL,
	"covered_by_id" text
);
--> statement-breakpoint
ALTER TABLE "ec_pledge" ADD COLUMN "attendee_address" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ec_cover_me" ADD CONSTRAINT "ec_cover_me_event_id_ec_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ec_event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
