import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth-route";
import orgRoutes from "./routes/org-routes";
import teamRoutes from "./routes/team-routes";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/org", orgRoutes);
app.use("/api/v1/team", teamRoutes);

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});