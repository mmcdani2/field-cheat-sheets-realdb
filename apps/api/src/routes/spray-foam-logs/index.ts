import { Router } from "express";
import createRouter from "./create.js";
import adminAllRouter from "./admin-all.js";
import detailRouter from "./detail.js";
import deleteRouter from "./delete.js";

const router = Router();

router.use(adminAllRouter);
router.use(detailRouter);
router.use(deleteRouter);
router.use(createRouter);

export default router;