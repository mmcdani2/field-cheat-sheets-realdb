import { pgTable, uuid, varchar, boolean, timestamp, decimal, text } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("tech"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const refrigerantLogs = pgTable("refrigerant_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  companyKey: varchar("company_key", { length: 50 }).notNull(),
  techNameSnapshot: varchar("tech_name_snapshot", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  jobNumber: varchar("job_number", { length: 100 }),
  city: varchar("city", { length: 120 }),
  state: varchar("state", { length: 50 }),
  equipmentType: varchar("equipment_type", { length: 120 }),
  refrigerantType: varchar("refrigerant_type", { length: 120 }).notNull(),
  poundsAdded: decimal("pounds_added", { precision: 10, scale: 2 }),
  poundsRecovered: decimal("pounds_recovered", { precision: 10, scale: 2 }),
  leakSuspected: boolean("leak_suspected").default(false),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
