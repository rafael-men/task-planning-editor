import { Router, type Response } from "express";
import { supabase } from "../services/supabase.js";
import { aplicarPromptNoConteudo } from "../services/llm.js";
import { promptBody, conteudoSchema } from "../types.js";
import { userOf } from "../middleware/auth.js";
import { llmRateLimit } from "../middleware/rateLimit.js";

export const promptRouter = Router();


promptRouter.post("/:id/prompt/preview", llmRateLimit, async (req, res: Response) => {
  const user = userOf(req);
  const parsed = promptBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data: atual, error: errAtual } = await supabase
    .from("playbooks")
    .select("conteudo")
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Playbook não encontrado." });

  const conteudoAtual = conteudoSchema.safeParse(atual.conteudo);
  if (!conteudoAtual.success) {
    return res.status(500).json({ error: "Conteúdo armazenado fora do schema." });
  }

  try {
    const novoConteudo = await aplicarPromptNoConteudo(
      conteudoAtual.data,
      parsed.data.prompt
    );
    res.json({ antes: conteudoAtual.data, depois: novoConteudo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao chamar o LLM.";
    return res.status(502).json({ error: msg });
  }
});
