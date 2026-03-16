import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { sprayFoamJobLogLines, sprayFoamJobLogs, users } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

type SprayFoamLineInput = {
  areaDescription?: string | null;
  jobType?: string | null;
  foamType?: string | null;
  squareFeet?: string | number | null;
  thicknessInches?: string | number | null;
  boardFeet?: string | number | null;
  notes?: string | null;
};

type CreateSprayFoamJobLogBody = {
  companyKey?: string;
  divisionKey?: string;
  customerName?: string | null;
  jobNumber?: string | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  lines?: SprayFoamLineInput[];
};

function cleanString(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

const router = Router();

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const authUser = req.authUser;

    if (!authUser?.sub) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    const body = (req.body ?? {}) as CreateSprayFoamJobLogBody;
    const companyKey = cleanString(body.companyKey);
    const divisionKey = cleanString(body.divisionKey);
    const lines = Array.isArray(body.lines) ? body.lines : [];

    if (!companyKey) {
      return res.status(400).json({ error: "companyKey is required." });
    }

    if (!divisionKey) {
      return res.status(400).json({ error: "divisionKey is required." });
    }

    if (lines.length === 0) {
      return res.status(400).json({ error: "At least one spray foam line is required." });
    }

    const normalizedLines = lines
      .map((line, index) => ({
        lineNumber: index + 1,
        areaDescription: cleanString(line.areaDescription),
        jobType: cleanString(line.jobType),
        foamType: cleanString(line.foamType),
        squareFeet: line.squareFeet ?? null,
        thicknessInches: line.thicknessInches ?? null,
        boardFeet: line.boardFeet ?? null,
        notes: cleanString(line.notes),
      }))
      .filter((line) => line.areaDescription && line.jobType && line.foamType);

    if (normalizedLines.length === 0) {
      return res.status(400).json({
        error: "Each spray foam line needs areaDescription, jobType, and foamType.",
      });
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

    const insertedLog = await db
      .insert(sprayFoamJobLogs)
      .values({
        userId: user.id,
        companyKey,
        divisionKey,
        techNameSnapshot: user.fullName,
        customerName: cleanString(body.customerName),
        jobNumber: cleanString(body.jobNumber),
        city: cleanString(body.city),
        state: cleanString(body.state),
        notes: cleanString(body.notes),
      })
      .returning();

    const jobLog = insertedLog[0];

    const insertedLines = await db
      .insert(sprayFoamJobLogLines)
      .values(
        normalizedLines.map((line) => ({
          jobLogId: jobLog.id,
          lineNumber: line.lineNumber,
          areaDescription: line.areaDescription!,
          jobType: line.jobType!,
          foamType: line.foamType!,
          squareFeet: line.squareFeet,
          thicknessInches: line.thicknessInches,
          boardFeet: line.boardFeet,
          notes: line.notes,
        }))
      )
      .returning();

    return res.status(201).json({
      log: jobLog,
      lines: insertedLines,
    });
  } catch (error) {
    console.error("Create spray foam job log error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
