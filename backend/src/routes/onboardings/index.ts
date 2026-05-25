import { Router } from "express";
import { llmRateLimit } from "../../middleware/rateLimit.js";
import { listar, obter, remover } from "./listar.js";
import { criar, atualizar } from "./persistir.js";
import { previewGerar, previewPrompt } from "./preview.js";
import { atualizarProgresso } from "./progresso.js";

export const onboardingsRouter = Router();

onboardingsRouter.get("/", listar);
onboardingsRouter.get("/:id", obter);
onboardingsRouter.delete("/:id", remover);

onboardingsRouter.post("/preview", llmRateLimit, previewGerar);
onboardingsRouter.post("/", criar);
onboardingsRouter.patch("/:id", atualizar);

onboardingsRouter.post("/:id/prompt/preview", llmRateLimit, previewPrompt);

onboardingsRouter.patch("/:id/progresso", atualizarProgresso);
