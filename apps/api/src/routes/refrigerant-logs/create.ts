import { Router } from "express";
import { db } from "../../db/index.js";
import { refrigerantLogs } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

const router = Router();

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {
      companyKey,
      customerName,
      jobNumber,
      city,
      state,
      equipmentType,
      refrigerantType,
      poundsAdded,
      poundsRecovered,
      leakSuspected,
      notes,
    } = req.body as {
      companyKey?: string;
      customerName?: string;
      jobNumber?: string;
      city?: string;
      state?: string;
      equipmentType?: string;
      refrigerantType?: string;
      poundsAdded?: number | string | null;
      poundsRecovered?: number | string | null;
      leakSuspected?: boolean;
      notes?: string;
    };

    if (!req.authUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (!companyKey || !refrigerantType) {
      return res
        .status(400)
        .json({ error: "companyKey and refrigerantType are required." });
    }

    const inserted = await db
      .insert(refrigerantLogs)
      .values({
        userId: req.authUser.sub,
        companyKey,
        techNameSnapshot: req.authUser.fullName,
        customerName: customerName ?? null,
        jobNumber: jobNumber ?? null,
        city: city ?? null,
        state: state ?? null,
        equipmentType: equipmentType ?? null,
        refrigerantType,
        poundsAdded:
          poundsAdded != null && poundsAdded !== ""
            ? String(poundsAdded)
            : null,
        poundsRecovered:
          poundsRecovered != null && poundsRecovered !== ""
            ? String(poundsRecovered)
            : null,
        leakSuspected: Boolean(leakSuspected),
        notes: notes ?? null,
      })
      .returning();

    return res.status(201).json({
      message: "Refrigerant log created.",
      log: inserted[0],
    });
  } catch (error) {
    console.error("Create refrigerant log error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
