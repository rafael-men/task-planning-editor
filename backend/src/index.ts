import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { playbooksRouter } from "./routes/playbooks.js";
import { promptRouter } from "./routes/prompt.js";
import { meRouter } from "./routes/me.js";
import { onboardingsRouter } from "./routes/onboardings/index.js";
import { catalogoRouter } from "./routes/catalogo.js";
import { adminRouter } from "./routes/admin.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const port = Number(process.env.PORT) || 3001;
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/me", requireAuth, meRouter);
app.use("/api/playbooks", requireAuth, playbooksRouter);
app.use("/api/playbooks", requireAuth, promptRouter);
app.use("/api/onboardings", requireAuth, onboardingsRouter);
app.use("/api/catalogo", requireAuth, catalogoRouter);
app.use("/api/admin", requireAuth, adminRouter);

app.listen(port, () => {
  console.log(`Backend Rodando em http://localhost:${port}`);
});
