import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  sprayFoamJobLogLines,
  sprayFoamJobLogs,
  sprayFoamMaterialLines,
} from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

const router = Router();

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
      .from(sprayFoamJobLogs)
      .where(eq(sprayFoamJobLogs.id, id))
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

    const areaLines = await db
      .select()
      .from(sprayFoamJobLogLines)
      .where(eq(sprayFoamJobLogLines.jobLogId, log.id))
      .orderBy(sprayFoamJobLogLines.lineNumber);

    const materialLines = await db
      .select()
      .from(sprayFoamMaterialLines)
      .where(eq(sprayFoamMaterialLines.jobLogId, log.id))
      .orderBy(sprayFoamMaterialLines.lineNumber);

    return res.json({
      log: {
        ...log,
        lines: areaLines,
        areaLines,
        materialLines,
      },
    });
  } catch (error) {
    console.error("Get spray foam job log by id error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
