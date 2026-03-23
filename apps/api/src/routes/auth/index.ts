import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { divisionModules, divisions, modules, users } from "../../db/schema.js";
import { requireAuth, type AuthedRequest } from "../../middleware/require-auth.js";
import { getJwtSecret } from "../../lib/get-jwt-secret.js";

const router = Router();

const MODULES_BY_DIVISION: Record<string, string[]> = {
  hvac: ["quick-estimate-calculator", "refrigerant-log", "reimbursement-request"],
  "spray-foam": ["reimbursement-request", "spray-foam-job-log"],
};

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = rows[0];

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      getJwtSecret(),
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const authUser = req.authUser;

    if (!authUser?.sub) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, authUser.sub))
      .limit(1);

    const user = rows[0];

    if (!user || !user.isActive) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/launcher", requireAuth, async (_req: AuthedRequest, res) => {
  try {
    const divisionRows = await db
      .select({
        id: divisions.id,
        key: divisions.key,
        name: divisions.name,
        isActive: divisions.isActive,
      })
      .from(divisions)
      .where(eq(divisions.isActive, true))
      .orderBy(asc(divisions.name));

    const result = [];

    for (const division of divisionRows) {
      const allowedKeys = MODULES_BY_DIVISION[division.key] ?? [];

      if (allowedKeys.length === 0) {
        result.push({
          id: division.id,
          key: division.key,
          name: division.name,
          modules: [],
        });
        continue;
      }

      const moduleRows = await db
        .select({
          id: modules.id,
          key: modules.key,
          name: modules.name,
          category: modules.category,
        })
        .from(divisionModules)
        .innerJoin(modules, eq(divisionModules.moduleId, modules.id))
        .where(
          and(
            eq(divisionModules.divisionId, division.id),
            eq(divisionModules.isEnabled, true),
            eq(modules.isActive, true),
            inArray(modules.key, allowedKeys)
          )
        )
        .orderBy(asc(modules.name));

      result.push({
        id: division.id,
        key: division.key,
        name: division.name,
        modules: moduleRows,
      });
    }

    return res.json({ divisions: result });
  } catch (error) {
    console.error("Get launcher error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;