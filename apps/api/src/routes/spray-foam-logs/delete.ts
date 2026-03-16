import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  sprayFoamJobLogLines,
  sprayFoamJobLogs,
} from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

const router = Router();

router.delete("/:id", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (req.authUser.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id) {
      return res.status(400).json({ error: "Log id is required." });
    }

    const found = await db
      .select({
        id: sprayFoamJobLogs.id,
      })
      .from(sprayFoamJobLogs)
      .where(eq(sprayFoamJobLogs.id, id))
      .limit(1);

    const log = found[0];

    if (!log) {
      return res.status(404).json({ error: "Log not found." });
    }

    await db
      .delete(sprayFoamJobLogLines)
      .where(eq(sprayFoamJobLogLines.jobLogId, id));

    await db
      .delete(sprayFoamJobLogs)
      .where(eq(sprayFoamJobLogs.id, id));

    return res.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Delete spray foam job log error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
