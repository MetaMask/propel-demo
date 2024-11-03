CREATE TABLE IF NOT EXISTS "ec_event" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"proposal_address" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"happens_at" timestamp NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"image_url" text,
	"min_tickets" integer DEFAULT 1 NOT NULL,
	"pledge_price" integer NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"nonce" jsonb NOT NULL,
	CONSTRAINT "ec_event_proposal_address_unique" UNIQUE("proposal_address")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ec_pledge" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"amount" integer NOT NULL,
	"delegation" jsonb NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ec_pledge" ADD CONSTRAINT "ec_pledge_event_id_ec_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ec_event"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
