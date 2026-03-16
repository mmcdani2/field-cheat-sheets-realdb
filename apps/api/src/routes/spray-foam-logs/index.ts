import { Router } from "express";
import createRouter from "./create.js";
import adminAllRouter from "./admin-all.js";

const router = Router();

router.use(createRouter);
router.use(adminAllRouter);

export default router;
