CREATE TABLE "spray_foam_job_log_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_log_id" uuid NOT NULL,
	"line_number" integer NOT NULL,
	"area_description" varchar(255) NOT NULL,
	"job_type" varchar(120) NOT NULL,
	"foam_type" varchar(120) NOT NULL,
	"square_feet" numeric(10, 2),
	"thickness_inches" numeric(10, 2),
	"board_feet" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spray_foam_job_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_key" varchar(50) NOT NULL,
	"division_key" varchar(100),
	"tech_name_snapshot" varchar(255) NOT NULL,
	"customer_name" varchar(255),
	"job_number" varchar(100),
	"city" varchar(120),
	"state" varchar(50),
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "spray_foam_job_log_lines" ADD CONSTRAINT "spray_foam_job_log_lines_job_log_id_spray_foam_job_logs_id_fk" FOREIGN KEY ("job_log_id") REFERENCES "public"."spray_foam_job_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spray_foam_job_logs" ADD CONSTRAINT "spray_foam_job_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "spray_foam_job_log_lines_job_log_id_idx" ON "spray_foam_job_log_lines" USING btree ("job_log_id");--> statement-breakpoint
CREATE INDEX "spray_foam_job_log_lines_job_log_line_idx" ON "spray_foam_job_log_lines" USING btree ("job_log_id","line_number");--> statement-breakpoint
CREATE INDEX "spray_foam_job_logs_division_key_idx" ON "spray_foam_job_logs" USING btree ("division_key");--> statement-breakpoint
CREATE INDEX "spray_foam_job_logs_submitted_at_idx" ON "spray_foam_job_logs" USING btree ("submitted_at");