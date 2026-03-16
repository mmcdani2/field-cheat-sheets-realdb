import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { refrigerantLogs, users } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

type CreateRefrigerantLogBody = {
  companyKey?: string;
  divisionKey?: string;
  customerName?: string | null;
  jobNumber?: string | null;
  city?: string | null;
  state?: string | null;
  equipmentType?: string | null;
  refrigerantType?: string;
  poundsAdded?: string | number | null;
  poundsRecovered?: string | number | null;
  leakSuspected?: boolean;
  notes?: string | null;
};

function cleanString(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function cleanDecimal(value?: string | number | null) {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function createRefrigerantLog(req: AuthedRequest, res: any) {
  try {
    const authUser = req.authUser;

    if (!authUser?.sub) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const body = (req.body ?? {}) as CreateRefrigerantLogBody;

    const companyKey = cleanString(body.companyKey);
    const divisionKey = cleanString(body.divisionKey);
    const refrigerantType = cleanString(body.refrigerantType);
    const poundsAdded = cleanDecimal(body.poundsAdded);
    const poundsRecovered = cleanDecimal(body.poundsRecovered);

    if (!companyKey) {
      return res.status(400).json({ error: "companyKey is required." });
    }

    if (!refrigerantType) {
      return res.status(400).json({ error: "refrigerantType is required." });
    }

    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, authUser.sub))
      .limit(1);

    const user = userRows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const inserted = await db
      .insert(refrigerantLogs)
      .values({
        userId: user.id,
        companyKey,
        divisionKey,
        techNameSnapshot: user.fullName,
        customerName: cleanString(body.customerName),
        jobNumber: cleanString(body.jobNumber),
        city: cleanString(body.city),
        state: cleanString(body.state),
        equipmentType: cleanString(body.equipmentType),
        refrigerantType,
        poundsAdded,
        poundsRecovered,
        leakSuspected: Boolean(body.leakSuspected),
        notes: cleanString(body.notes),
      })
      .returning();

    return res.status(201).json({
      log: inserted[0],
    });
  } catch (error) {
    console.error("Create refrigerant log error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
}

const router = Router();

router.post("/", requireAuth, createRefrigerantLog);

export default router;
