import type { Request, Response } from "express";
import {
  createOnboardingBody,
  promptBody,
  onboardingConteudoSchema,
} from "../../types.js";
import { supabase } from "../../services/supabase.js";
import { ehRHouAdmin, userOf } from "../../middleware/auth.js";
import { resolverHierarquia } from "../../services/catalogo/index.js";
import { aplicarEscopoOnboarding } from "./acesso.js";
import {
  aplicarPromptNoOnboarding,
  gerarOnboarding,
} from "../../services/llm-onboarding/index.js";

export async function previewGerar(req: Request, res: Response) {
  const user = userOf(req);
  if (!ehRHouAdmin(user.role)) {
    return res
      .status(403)
      .json({ error: "Apenas RH ou admin pode gerar onboardings." });
  }
  const parsed = createOnboardingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const hierarquia = await resolverHierarquia({
      fornecedor_user_id: parsed.data.fornecedor_user_id,
      setor_id: parsed.data.setor_id,
      cargo_id: parsed.data.cargo_id,
      senioridade: parsed.data.senioridade,
    });
    const conteudo = await gerarOnboarding({
      nome: parsed.data.nome,
      lider: parsed.data.lider,
      descricao: parsed.data.descricao,
      data_inicio: parsed.data.data_inicio,
      hierarquia,
    });
    res.json({ dados: parsed.data, hierarquia, conteudo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao gerar trilha.";
    return res.status(502).json({ error: msg });
  }
}


export async function previewPrompt(req: Request, res: Response) {
  const user = userOf(req);
  const parsed = promptBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const base = supabase
    .from("onboardings")
    .select("conteudo, fornecedor_user_id, setor_id, cargo_id, senioridade")
    .eq("id", req.params.id);
  const { data: atual, error: errAtual } = await aplicarEscopoOnboarding(
    base,
    user
  ).maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Onboarding não encontrado." });

  const conteudoAtual = onboardingConteudoSchema.safeParse(atual.conteudo);
  if (!conteudoAtual.success) {
    return res.status(500).json({ error: "Conteúdo armazenado fora do schema." });
  }
  if (!atual.fornecedor_user_id || !atual.setor_id || !atual.cargo_id) {
    return res
      .status(400)
      .json({
        error:
          "Este onboarding não tem hierarquia preenchida — edite os dados primeiro.",
      });
  }

  try {
    const hierarquia = await resolverHierarquia({
      fornecedor_user_id: atual.fornecedor_user_id,
      setor_id: atual.setor_id,
      cargo_id: atual.cargo_id,
      senioridade: atual.senioridade,
    });
    const novo = await aplicarPromptNoOnboarding(
      conteudoAtual.data,
      parsed.data.prompt,
      hierarquia
    );
    res.json({ antes: conteudoAtual.data, depois: novo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao chamar o LLM.";
    return res.status(502).json({ error: msg });
  }
}
