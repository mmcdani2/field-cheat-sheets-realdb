import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/index.js";
import refrigerantLogRoutes from "./routes/refrigerant-logs/index.js";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API is running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/refrigerant-logs", refrigerantLogRoutes);
