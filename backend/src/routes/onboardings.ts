import { Router, type Response } from "express";
import { supabase } from "../services/supabase.js";
import {
  createOnboardingBody,
  updateOnboardingBody,
  onboardingConteudoSchema,
  promptBody,
} from "../types.js";
import { userOf } from "../middleware/auth.js";
import {
  aplicarPromptNoOnboarding,
  gerarOnboarding,
} from "../services/llm-onboarding.js";

export const onboardingsRouter = Router();

onboardingsRouter.get("/", async (req, res: Response) => {
  const user = userOf(req);
  const { data, error } = await supabase
    .from("onboardings")
    .select("id, nome, setor, cargo, data_inicio, senioridade, versao, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

onboardingsRouter.get("/:id", async (req, res: Response) => {
  const user = userOf(req);
  const { data, error } = await supabase
    .from("onboardings")
    .select("*")
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Onboarding não encontrado." });
  res.json(data);
});


onboardingsRouter.post("/preview", async (req, res: Response) => {
  const parsed = createOnboardingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const conteudo = await gerarOnboarding(parsed.data);
    res.json({ dados: parsed.data, conteudo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao gerar trilha.";
    return res.status(502).json({ error: msg });
  }
});

onboardingsRouter.post("/", async (req, res: Response) => {
  const user = userOf(req);
  const parsed = createOnboardingBody
    .extend({ conteudo: onboardingConteudoSchema })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { conteudo, ...dados } = parsed.data;
  const { data, error } = await supabase
    .from("onboardings")
    .insert({ ...dados, lider: dados.lider ?? null, descricao: dados.descricao ?? null, conteudo, owner_id: user.id })
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

onboardingsRouter.patch("/:id", async (req, res: Response) => {
  const user = userOf(req);
  const parsed = updateOnboardingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data: atual, error: errAtual } = await supabase
    .from("onboardings")
    .select("versao")
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Onboarding não encontrado." });

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    versao: atual.versao + 1,
  };
  for (const k of [
    "nome",
    "setor",
    "lider",
    "cargo",
    "descricao",
    "data_inicio",
    "senioridade",
    "conteudo",
  ] as const) {
    if (parsed.data[k] !== undefined) patch[k] = parsed.data[k];
  }

  const { data, error } = await supabase
    .from("onboardings")
    .update(patch)
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

onboardingsRouter.delete("/:id", async (req, res: Response) => {
  const user = userOf(req);
  const { error } = await supabase
    .from("onboardings")
    .delete()
    .eq("id", req.params.id)
    .eq("owner_id", user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

onboardingsRouter.post("/:id/prompt/preview", async (req, res: Response) => {
  const user = userOf(req);
  const parsed = promptBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data: atual, error: errAtual } = await supabase
    .from("onboardings")
    .select("conteudo")
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Onboarding não encontrado." });

  const conteudoAtual = onboardingConteudoSchema.safeParse(atual.conteudo);
  if (!conteudoAtual.success) {
    return res.status(500).json({ error: "Conteúdo armazenado fora do schema." });
  }

  try {
    const novo = await aplicarPromptNoOnboarding(conteudoAtual.data, parsed.data.prompt);
    res.json({ antes: conteudoAtual.data, depois: novo });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Falha ao chamar o LLM.";
    return res.status(502).json({ error: msg });
  }
});
