CREATE TABLE "refrigerant_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_key" varchar(50) NOT NULL,
	"tech_name_snapshot" varchar(255) NOT NULL,
	"customer_name" varchar(255),
	"job_number" varchar(100),
	"city" varchar(120),
	"state" varchar(50),
	"equipment_type" varchar(120),
	"refrigerant_type" varchar(120) NOT NULL,
	"pounds_added" numeric(10, 2),
	"pounds_recovered" numeric(10, 2),
	"leak_suspected" boolean DEFAULT false,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'tech' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "refrigerant_logs" ADD CONSTRAINT "refrigerant_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;