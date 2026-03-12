import { Router } from "express";
import { asc, eq, and } from "drizzle-orm";
import { db } from "../../db/index.js";
import { divisionModules, divisions, modules } from "../../db/schema.js";
import {
  requireAuth,
  type AuthedRequest,
} from "../../middleware/require-auth.js";

const router = Router();

router.get("/", requireAuth, async (_req: AuthedRequest, res) => {
  try {
    const rows = await db
      .select({
        id: divisions.id,
        companyId: divisions.companyId,
        key: divisions.key,
        name: divisions.name,
        isActive: divisions.isActive,
        createdAt: divisions.createdAt,
        updatedAt: divisions.updatedAt,
      })
      .from(divisions)
      .orderBy(asc(divisions.name));

    return res.json({ divisions: rows });
  } catch (error) {
    console.error("Get divisions error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/:id/modules", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const divisionId = req.params.id;

    const divisionRows = await db
      .select({
        id: divisions.id,
        companyId: divisions.companyId,
        key: divisions.key,
        name: divisions.name,
        isActive: divisions.isActive,
        createdAt: divisions.createdAt,
        updatedAt: divisions.updatedAt,
      })
      .from(divisions)
      .where(eq(divisions.id, divisionId))
      .limit(1);

    const division = divisionRows[0];

    if (!division) {
      return res.status(404).json({ error: "Division not found." });
    }

    const rows = await db
      .select({
        id: divisionModules.id,
        isEnabled: divisionModules.isEnabled,
        createdAt: divisionModules.createdAt,
        updatedAt: divisionModules.updatedAt,
        module: {
          id: modules.id,
          key: modules.key,
          name: modules.name,
          category: modules.category,
          isActive: modules.isActive,
          createdAt: modules.createdAt,
          updatedAt: modules.updatedAt,
        },
      })
      .from(divisionModules)
      .innerJoin(modules, eq(divisionModules.moduleId, modules.id))
      .where(eq(divisionModules.divisionId, divisionId))
      .orderBy(asc(modules.name));

    return res.json({
      division,
      modules: rows,
    });
  } catch (error) {
    console.error("Get division modules error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

router.patch(
  "/:id/modules/:divisionModuleId",
  requireAuth,
  async (req: AuthedRequest, res) => {
    try {
      const divisionId = req.params.id;
      const divisionModuleId = req.params.divisionModuleId;
      const isEnabled = req.body?.isEnabled;

      if (typeof isEnabled !== "boolean") {
        return res.status(400).json({ error: "isEnabled must be a boolean." });
      }

      const match = await db
        .select({
          id: divisionModules.id,
          divisionId: divisionModules.divisionId,
          moduleId: divisionModules.moduleId,
          isEnabled: divisionModules.isEnabled,
          createdAt: divisionModules.createdAt,
          updatedAt: divisionModules.updatedAt,
        })
        .from(divisionModules)
        .where(
          and(
            eq(divisionModules.id, divisionModuleId),
            eq(divisionModules.divisionId, divisionId)
          )
        )
        .limit(1);

      const row = match[0];

      if (!row) {
        return res.status(404).json({ error: "Division module not found." });
      }

      const updated = await db
        .update(divisionModules)
        .set({
          isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(divisionModules.id, divisionModuleId))
        .returning();

      return res.json({
        divisionModule: updated[0],
      });
    } catch (error) {
      console.error("Patch division module error:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
