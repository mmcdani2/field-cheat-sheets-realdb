import { Router } from "express";
import mineRouter from "./mine.js";
import adminAllRouter from "./admin-all.js";
import adminSummaryRouter from "./admin-summary.js";
import detailRouter from "./detail.js";
import createRouter from "./create.js";

const router = Router();

router.use(mineRouter);
router.use(adminAllRouter);
router.use(adminSummaryRouter);
router.use(detailRouter);
router.use(createRouter);

export default router;
