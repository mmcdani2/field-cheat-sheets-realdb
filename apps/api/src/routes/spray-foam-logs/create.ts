import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
  sprayFoamJobLogLines,
  sprayFoamJobLogs,
  sprayFoamMaterialLines,
  users,
} from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

type SprayFoamAreaLineInput = {
  areaName?: string | null;
  areaDescription?: string | null;
  applicationType?: string | null;
  jobType?: string | null;
  foamType?: string | null;
  squareFeet?: string | number | null;
  averageThicknessIn?: string | number | null;
  thicknessInches?: string | number | null;
};

type SprayFoamMaterialLineInput = {
  areaLineNumber?: string | number | null;
  manufacturer?: string | null;
  lotNumber?: string | null;
  setsUsed?: string | number | null;
  theoreticalYieldPerSet?: string | number | null;
};

type CreateSprayFoamJobLogBody = {
  companyKey?: string;
  divisionKey?: string;
  jobDate?: string | null;
  customerName?: string | null;
  jobNumber?: string | null;
  crewLead?: string | null;
  helpersText?: string | null;
  rigName?: string | null;
  timeOnJob?: string | null;
  ambientTempF?: string | number | null;
  substrateTempF?: string | number | null;
  humidityPercent?: string | number | null;
  downtimeMinutes?: string | number | null;
  downtimeReason?: string | null;
  otherNotes?: string | null;
  photosUploadedToHcp?: boolean | null;
  areaLines?: SprayFoamAreaLineInput[];
  materialLines?: SprayFoamMaterialLineInput[];
};

function cleanString(value?: string | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseNumber(value?: string | number | null) {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const trimmed = value.trim();

  if (!trimmed.length) {
    return null;
  }

  const parsed = Number(trimmed);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value?: string | number | null) {
  const parsed = parseNumber(value);

  if (parsed === null) {
    return null;
  }

  return Math.round(parsed);
}

function toDecimalString(value: number | null) {
  return value === null ? null : value.toFixed(2);
}

function deriveBoardFeet(squareFeet: number | null, thicknessInches: number | null) {
  if (squareFeet === null || thicknessInches === null) {
    return null;
  }

  return toDecimalString(squareFeet * thicknessInches);
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
    const areaLines = Array.isArray(body.areaLines) ? body.areaLines : [];
    const materialLines = Array.isArray(body.materialLines) ? body.materialLines : [];

    if (!companyKey) {
      return res.status(400).json({ error: "companyKey is required." });
    }

    if (!divisionKey) {
      return res.status(400).json({ error: "divisionKey is required." });
    }

    if (areaLines.length === 0) {
      return res.status(400).json({ error: "At least one area line is required." });
    }

    if (materialLines.length === 0) {
      return res.status(400).json({ error: "At least one material line is required." });
    }

    const normalizedAreaLines = areaLines
      .map((line, index) => {
        const squareFeetNumber = parseNumber(line.squareFeet);
        const thicknessInchesNumber = parseNumber(
          line.averageThicknessIn ?? line.thicknessInches
        );

        return {
          lineNumber: index + 1,
          areaDescription: cleanString(line.areaName ?? line.areaDescription),
          jobType: cleanString(line.applicationType ?? line.jobType),
          foamType: cleanString(line.foamType),
          squareFeet: toDecimalString(squareFeetNumber),
          thicknessInches: toDecimalString(thicknessInchesNumber),
          boardFeet: deriveBoardFeet(squareFeetNumber, thicknessInchesNumber),
        };
      })
      .filter(
        (line) =>
          line.areaDescription ||
          line.jobType ||
          line.foamType ||
          line.squareFeet ||
          line.thicknessInches
      );

    const invalidAreaLine = normalizedAreaLines.find(
      (line) =>
        !line.areaDescription ||
        !line.jobType ||
        !line.foamType ||
        !line.squareFeet ||
        !line.thicknessInches ||
        !line.boardFeet
    );

    if (invalidAreaLine) {
      return res.status(400).json({
        error:
          "Each area line needs area name, application type, foam type, square feet, and average thickness.",
      });
    }

    const areaLineMap = new Map(normalizedAreaLines.map((line) => [line.lineNumber, line]));

    const normalizedMaterialLines = materialLines
      .map((line, index) => {
        const areaLineNumber = parseInteger(line.areaLineNumber);
        const setsUsedNumber = parseNumber(line.setsUsed);
        const theoreticalYieldPerSetNumber = parseNumber(line.theoreticalYieldPerSet);
        const linkedAreaLine = areaLineNumber ? areaLineMap.get(areaLineNumber) ?? null : null;
        const boardFeetNumber = linkedAreaLine?.boardFeet ? Number(linkedAreaLine.boardFeet) : null;
        const theoreticalTotalYieldNumber =
          setsUsedNumber !== null && theoreticalYieldPerSetNumber !== null
            ? setsUsedNumber * theoreticalYieldPerSetNumber
            : null;
        const actualYieldNumber =
          boardFeetNumber !== null && setsUsedNumber !== null && setsUsedNumber > 0
            ? boardFeetNumber / setsUsedNumber
            : null;
        const yieldPercentNumber =
          boardFeetNumber !== null &&
          theoreticalTotalYieldNumber !== null &&
          theoreticalTotalYieldNumber > 0
            ? (boardFeetNumber / theoreticalTotalYieldNumber) * 100
            : null;

        return {
          lineNumber: index + 1,
          areaLineNumber,
          linkedAreaLine,
          manufacturer: cleanString(line.manufacturer),
          lotNumber: cleanString(line.lotNumber),
          setsUsed: toDecimalString(setsUsedNumber),
          theoreticalYieldPerSet: toDecimalString(theoreticalYieldPerSetNumber),
          theoreticalTotalYield: toDecimalString(theoreticalTotalYieldNumber),
          actualYield: toDecimalString(actualYieldNumber),
          yieldPercent: toDecimalString(yieldPercentNumber),
        };
      })
      .filter(
        (line) =>
          line.areaLineNumber ||
          line.manufacturer ||
          line.lotNumber ||
          line.setsUsed ||
          line.theoreticalYieldPerSet
      );

    const invalidMaterialLine = normalizedMaterialLines.find(
      (line) =>
        !line.areaLineNumber ||
        !line.linkedAreaLine ||
        !line.manufacturer ||
        !line.lotNumber ||
        !line.setsUsed ||
        !line.theoreticalYieldPerSet
    );

    if (invalidMaterialLine) {
      return res.status(400).json({
        error:
          "Each material line needs a linked area line, manufacturer, lot number, sets used, and theoretical yield per set.",
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

    const result = await db.transaction(async (tx) => {
      const insertedLogRows = await tx
        .insert(sprayFoamJobLogs)
        .values({
          userId: user.id,
          companyKey,
          divisionKey,
          techNameSnapshot: user.fullName,
          jobDate: cleanString(body.jobDate),
          customerName: cleanString(body.customerName),
          jobNumber: cleanString(body.jobNumber),
          crewLead: cleanString(body.crewLead),
          helpersText: cleanString(body.helpersText),
          rigName: cleanString(body.rigName),
          timeOnJob: cleanString(body.timeOnJob),
          ambientTempF: toDecimalString(parseNumber(body.ambientTempF)),
          substrateTempF: toDecimalString(parseNumber(body.substrateTempF)),
          humidityPercent: toDecimalString(parseNumber(body.humidityPercent)),
          downtimeMinutes: parseInteger(body.downtimeMinutes),
          downtimeReason: cleanString(body.downtimeReason),
          otherNotes: cleanString(body.otherNotes),
          photosUploadedToHcp: Boolean(body.photosUploadedToHcp),
          notes: cleanString(body.otherNotes),
        })
        .returning();

      const jobLog = insertedLogRows[0];

      const insertedAreaLines = await tx
        .insert(sprayFoamJobLogLines)
        .values(
          normalizedAreaLines.map((line) => ({
            jobLogId: jobLog.id,
            lineNumber: line.lineNumber,
            areaDescription: line.areaDescription!,
            jobType: line.jobType!,
            foamType: line.foamType!,
            squareFeet: line.squareFeet,
            thicknessInches: line.thicknessInches,
            boardFeet: line.boardFeet,
            notes: null,
          }))
        )
        .returning({
          id: sprayFoamJobLogLines.id,
          lineNumber: sprayFoamJobLogLines.lineNumber,
          areaDescription: sprayFoamJobLogLines.areaDescription,
          jobType: sprayFoamJobLogLines.jobType,
          foamType: sprayFoamJobLogLines.foamType,
          squareFeet: sprayFoamJobLogLines.squareFeet,
          thicknessInches: sprayFoamJobLogLines.thicknessInches,
          boardFeet: sprayFoamJobLogLines.boardFeet,
        });

      const insertedAreaLineMap = new Map(
        insertedAreaLines.map((line) => [line.lineNumber, line])
      );

      const insertedMaterialRows = await tx
        .insert(sprayFoamMaterialLines)
        .values(
          normalizedMaterialLines.map((line) => {
            const linkedAreaLine = insertedAreaLineMap.get(line.areaLineNumber!);

            return {
              jobLogId: jobLog.id,
              areaLineId: linkedAreaLine!.id,
              lineNumber: line.lineNumber,
              foamType: linkedAreaLine!.foamType,
              manufacturer: line.manufacturer!,
              lotNumber: line.lotNumber!,
              setsUsed: line.setsUsed,
              theoreticalYieldPerSet: line.theoreticalYieldPerSet,
              theoreticalTotalYield: line.theoreticalTotalYield,
              actualYield: line.actualYield,
              yieldPercent: line.yieldPercent,
            };
          })
        )
        .returning();

      return {
        jobLog,
        areaLines: insertedAreaLines,
        materialLines: insertedMaterialRows,
      };
    });

    return res.status(201).json({
      log: result.jobLog,
      areaLines: result.areaLines,
      materialLines: result.materialLines,
    });
  } catch (error) {
    console.error("Create spray foam job log error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
