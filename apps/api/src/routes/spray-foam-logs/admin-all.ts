import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sprayFoamJobLogLines, sprayFoamJobLogs } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

const router = Router();

router.get("/admin/all", requireAuth, async (req: AuthedRequest, res) => {
  try {
    if (!req.authUser) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    if (req.authUser.role !== "admin") {
      return res.status(403).json({ error: "Forbidden." });
    }

    const divisionKey =
      typeof req.query.divisionKey === "string" ? req.query.divisionKey.trim() : "";

    const logs = divisionKey
      ? await db
          .select()
          .from(sprayFoamJobLogs)
          .where(eq(sprayFoamJobLogs.divisionKey, divisionKey))
          .orderBy(desc(sprayFoamJobLogs.submittedAt))
      : await db
          .select()
          .from(sprayFoamJobLogs)
          .orderBy(desc(sprayFoamJobLogs.submittedAt));

    const logsWithLines = await Promise.all(
      logs.map(async (log) => {
        const lines = await db
          .select()
          .from(sprayFoamJobLogLines)
          .where(eq(sprayFoamJobLogLines.jobLogId, log.id))
          .orderBy(sprayFoamJobLogLines.lineNumber);

        return {
          ...log,
          lines,
        };
      })
    );

    return res.json({ logs: logsWithLines });
  } catch (error) {
    console.error("Admin get all spray foam job logs error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
