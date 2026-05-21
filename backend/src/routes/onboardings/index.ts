import { Router } from "express";
import { listar, obter, remover } from "./listar.js";
import { criar, atualizar } from "./persistir.js";
import { previewGerar, previewPrompt } from "./preview.js";

export const onboardingsRouter = Router();

onboardingsRouter.get("/", listar);
onboardingsRouter.get("/:id", obter);
onboardingsRouter.delete("/:id", remover);

onboardingsRouter.post("/preview", previewGerar);
onboardingsRouter.post("/", criar);
onboardingsRouter.patch("/:id", atualizar);

onboardingsRouter.post("/:id/prompt/preview", previewPrompt);
