import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { refrigerantLogs } from "../db/schema.js";
import { requireAuth, type AuthedRequest } from "../middleware/require-auth.js";

const router = Router();

router.get("/mine", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const logs = await db
      .select()
      .from(refrigerantLogs)
      .where(eq(refrigerantLogs.userId, req.authUser.sub))
      .orderBy(desc(refrigerantLogs.submittedAt));

    return res.json({ logs });
  } catch (error) {
    console.error("Get my refrigerant logs error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/admin/all", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (req.authUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const logs = await db
      .select()
      .from(refrigerantLogs)
      .orderBy(desc(refrigerantLogs.submittedAt));

    return res.json({ logs });
  } catch (error) {
    console.error("Admin get all refrigerant logs error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ error: "Log id is required." });
    }

    const found = await db
      .select()
      .from(refrigerantLogs)
      .where(eq(refrigerantLogs.id, id))
      .limit(1);

    const log = found[0];

    if (!log) {
      return res.status(404).json({ error: "Log not found." });
    }

    const isAdmin = req.authUser.role === "admin";
    const isOwner = log.userId === req.authUser.sub;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: "Forbidden." });
    }

    return res.json({ log });
  } catch (error) {
    console.error("Get refrigerant log by id error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

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
