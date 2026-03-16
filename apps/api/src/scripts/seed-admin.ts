import "dotenv/config";
import bcrypt from "bcrypt";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  companies,
  divisions,
  divisionModules,
  modules,
  users,
} from "../db/schema.js";

async function ensureCompany() {
  const slug = "bossos-workspace";
  const name = "BossOS Workspace";

  const existing = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Company already exists: ${slug}`);
    return existing[0];
  }

  const inserted = await db
    .insert(companies)
    .values({
      name,
      slug,
      isActive: true,
    })
    .returning();

  console.log(`Company created: ${slug}`);
  return inserted[0];
}

async function ensureDivision(companyId: string, key: string, name: string) {
  const existing = await db
    .select()
    .from(divisions)
    .where(and(eq(divisions.companyId, companyId), eq(divisions.key, key)))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Division already exists: ${key}`);
    return existing[0];
  }

  const inserted = await db
    .insert(divisions)
    .values({
      companyId,
      key,
      name,
      isActive: true,
    })
    .returning();

  console.log(`Division created: ${key}`);
  return inserted[0];
}

async function ensureModule(key: string, name: string, category: string) {
  const existing = await db
    .select()
    .from(modules)
    .where(eq(modules.key, key))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Module already exists: ${key}`);
    return existing[0];
  }

  const inserted = await db
    .insert(modules)
    .values({
      key,
      name,
      category,
      isActive: true,
    })
    .returning();

  console.log(`Module created: ${key}`);
  return inserted[0];
}

async function ensureDivisionModule(
  divisionId: string,
  moduleId: string,
  isEnabled: boolean
) {
  const existing = await db
    .select()
    .from(divisionModules)
    .where(
      and(
        eq(divisionModules.divisionId, divisionId),
        eq(divisionModules.moduleId, moduleId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const updated = await db
      .update(divisionModules)
      .set({
        isEnabled,
        updatedAt: new Date(),
      })
      .where(eq(divisionModules.id, existing[0].id))
      .returning();

    console.log(
      `Division module updated: ${existing[0].id} -> ${isEnabled ? "enabled" : "disabled"}`
    );

    return updated[0];
  }

  const inserted = await db
    .insert(divisionModules)
    .values({
      divisionId,
      moduleId,
      isEnabled,
    })
    .returning();

  console.log(
    `Division module created: ${divisionId}/${moduleId} -> ${isEnabled ? "enabled" : "disabled"}`
  );

  return inserted[0];
}

async function ensureAdminUser() {
  const email = "alex@laurelstreetcreative.com";
  const password = "Eclipse12!@#$";
  const fullName = "Alex McDaniel";
  const role = "admin";

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`User already exists: ${email}`);
    return existing[0];
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const inserted = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      fullName,
      role,
      isActive: true,
    })
    .returning();

  console.log(`Admin user created: ${email}`);
  return inserted[0];
}

async function main() {
  const company = await ensureCompany();

  const hvacDivision = await ensureDivision(company.id, "hvac", "HVAC");
  const sprayFoamDivision = await ensureDivision(
    company.id,
    "spray-foam",
    "Spray Foam"
  );

  const refrigerantLogModule = await ensureModule(
    "refrigerant-log",
    "Refrigerant Log",
    "reports"
  );

  const sprayFoamJobLogModule = await ensureModule(
    "spray-foam-job-log",
    "Spray Foam Job Log",
    "reports"
  );

  await ensureDivisionModule(hvacDivision.id, refrigerantLogModule.id, true);
  await ensureDivisionModule(sprayFoamDivision.id, sprayFoamJobLogModule.id, true);

  await ensureAdminUser();

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
