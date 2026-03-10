import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

async function main() {
  const email = "alex@laurelstreetcreative.com";
  const password = "Eclipse12!@#$";
  const fullName = "Alex McDaniel";
  const role = "admin";

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existing.length > 0) {
    console.log(`User already exists: ${email}`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email,
    passwordHash,
    fullName,
    role,
    isActive: true,
  });

  console.log(`Admin user created: ${email}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
