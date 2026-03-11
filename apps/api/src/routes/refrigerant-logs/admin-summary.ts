import { Router } from "express";
import { db } from "../../db/index.js";
import { refrigerantLogs } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

const router = Router();

router.get(
  "/admin/stats/summary",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      if (!req.authUser) {
        return res.status(401).json({ error: "Unauthorized." });
      }

      if (req.authUser.role !== "admin") {
        return res.status(403).json({ error: "Forbidden." });
      }

      const logs = await db.select().from(refrigerantLogs);

      const totalLogs = logs.length;

      const today = new Date();
      const yyyy = today.getUTCFullYear();
      const mm = String(today.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(today.getUTCDate()).padStart(2, "0");
      const todayKey = `${yyyy}-${mm}-${dd}`;

      const logsToday = logs.filter((log) => {
        const submitted = new Date(log.submittedAt);
        const sy = submitted.getUTCFullYear();
        const sm = String(submitted.getUTCMonth() + 1).padStart(2, "0");
        const sd = String(submitted.getUTCDate()).padStart(2, "0");
        return `${sy}-${sm}-${sd}` === todayKey;
      }).length;

      const activeTechs = new Set(logs.map((log) => log.userId)).size;

      return res.json({
        totalLogs,
        logsToday,
        activeTechs,
      });
    } catch (error) {
      console.error("Admin refrigerant log summary error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  },
);

export default router;
