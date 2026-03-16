import { Router } from "express";
import createRouter from "./create.js";

const router = Router();

router.use(createRouter);

export default router;
