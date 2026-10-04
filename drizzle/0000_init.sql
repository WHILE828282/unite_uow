CREATE TABLE "app_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"user_email" text NOT NULL,
	"name" text NOT NULL,
	"whatsapp" text NOT NULL,
	"year" text,
	"message" text,
	"status" text DEFAULT 'new' NOT NULL,
	"consent_at" timestamp with time zone,
	"consent_version" text,
	"contacted_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"declined_at" timestamp with time zone,
	"reminded_at" timestamp with time zone,
	"decided_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_roles" (
	"club_id" integer NOT NULL,
	"user_email" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "club_roles_club_id_user_email_pk" PRIMARY KEY("club_id","user_email")
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"lead_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_hosts" (
	"event_ref" text NOT NULL,
	"user_email" text NOT NULL,
	"role" text DEFAULT 'host' NOT NULL,
	CONSTRAINT "event_hosts_event_ref_user_email_pk" PRIMARY KEY("event_ref","user_email")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"ref" text PRIMARY KEY NOT NULL,
	"source" text DEFAULT 'hosted' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"kind" text DEFAULT 'own' NOT NULL,
	"title" text NOT NULL,
	"category" text,
	"date" text,
	"start_time" text,
	"end_time" text,
	"spots" integer,
	"price" numeric,
	"venue_name" text,
	"host_email" text,
	"data" jsonb NOT NULL,
	"cover" text,
	"logo" text,
	"tg_message_id" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "external_ticket_deliveries" (
	"ticket_id" text PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"note" text,
	"file_name" text,
	"file_type" text,
	"file_data" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"club_id" integer NOT NULL,
	"user_email" text NOT NULL,
	"status" text NOT NULL,
	"source" text DEFAULT 'app' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_club_id_user_email_pk" PRIMARY KEY("club_id","user_email")
);
--> statement-breakpoint
CREATE TABLE "notifications_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_email" text,
	"channel" text NOT NULL,
	"kind" text NOT NULL,
	"subject" text,
	"ref" text,
	"ok" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"event_ref" text NOT NULL,
	"user_email" text,
	"name" text,
	"student_id" text,
	"method" text,
	"price" numeric DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'valid' NOT NULL,
	"qr_id" text NOT NULL,
	"checked_in_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"email" text PRIMARY KEY NOT NULL,
	"name" text,
	"student_id" text,
	"avatar_url" text,
	"telegram" text,
	"telegram_chat_id" text,
	"whatsapp" text,
	"notify_email" boolean DEFAULT true NOT NULL,
	"notify_telegram" boolean DEFAULT true NOT NULL,
	"theme" text,
	"legal_version" text,
	"legal_accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_ref" text NOT NULL,
	"user_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_applications" ADD CONSTRAINT "club_applications_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_applications" ADD CONSTRAINT "club_applications_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "club_roles" ADD CONSTRAINT "club_roles_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_roles" ADD CONSTRAINT "club_roles_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_event_ref_events_ref_fk" FOREIGN KEY ("event_ref") REFERENCES "public"."events"("ref") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "external_ticket_deliveries" ADD CONSTRAINT "external_ticket_deliveries_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_event_ref_events_ref_fk" FOREIGN KEY ("event_ref") REFERENCES "public"."events"("ref") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_user_email_users_email_fk" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "apps_club_status_idx" ON "club_applications" USING btree ("club_id","status");--> statement-breakpoint
CREATE INDEX "apps_user_idx" ON "club_applications" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "apps_new_idx" ON "club_applications" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "apps_one_open_idx" ON "club_applications" USING btree ("club_id","user_email") WHERE "club_applications"."status" <> 'declined';--> statement-breakpoint
CREATE INDEX "club_roles_user_idx" ON "club_roles" USING btree ("user_email");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_slug_idx" ON "clubs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "event_hosts_user_idx" ON "event_hosts" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_kind_status_idx" ON "events" USING btree ("kind","status");--> statement-breakpoint
CREATE INDEX "events_host_idx" ON "events" USING btree ("host_email");--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "notifications_user_idx" ON "notifications_log" USING btree ("user_email");--> statement-breakpoint
CREATE INDEX "notifications_created_idx" ON "notifications_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tickets_event_idx" ON "tickets" USING btree ("event_ref");--> statement-breakpoint
CREATE INDEX "tickets_user_idx" ON "tickets" USING btree ("user_email");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_qr_idx" ON "tickets" USING btree ("qr_id");--> statement-breakpoint
CREATE INDEX "users_telegram_idx" ON "users" USING btree (lower("telegram"));--> statement-breakpoint
CREATE INDEX "users_tg_chat_idx" ON "users" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_event_user_idx" ON "waitlist" USING btree ("event_ref","user_email");