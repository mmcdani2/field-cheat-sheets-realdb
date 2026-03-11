import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { refrigerantLogs } from "../../db/schema.js";
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

export default router;
