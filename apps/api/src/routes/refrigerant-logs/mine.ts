import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { refrigerantLogs } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

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

export default router;
