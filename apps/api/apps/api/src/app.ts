import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth/index.js";
import refrigerantLogRoutes from "./routes/refrigerant-logs/index.js";
import sprayFoamLogRoutes from "./routes/spray-foam-logs/index.js";
import companyRoutes from "./routes/company/index.js";
import divisionRoutes from "./routes/divisions/index.js";

export const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/refrigerant-logs", refrigerantLogRoutes);
app.use("/api/spray-foam-logs", sprayFoamLogRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/divisions", divisionRoutes);
