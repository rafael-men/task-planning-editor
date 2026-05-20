import { Router, type Response } from "express";
import { supabase } from "../services/supabase.js";
import {
  createPlaybookBody,
  updatePlaybookBody,
  conteudoSchema,
} from "../types.js";
import { userOf } from "../middleware/auth.js";

export const playbooksRouter = Router();

playbooksRouter.get("/", async (req, res: Response) => {
  const user = userOf(req);
  const { data, error } = await supabase
    .from("playbooks")
    .select("id, nome, descricao, versao, updated_at")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

playbooksRouter.get("/:id", async (req, res: Response) => {
  const user = userOf(req);
  const { data, error } = await supabase
    .from("playbooks")
    .select("*")
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Playbook não encontrado." });
  res.json(data);
});

playbooksRouter.post("/", async (req, res: Response) => {
  const user = userOf(req);
  const parsed = createPlaybookBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const conteudo = parsed.data.conteudo ?? { secoes: [] };
  const { data, error } = await supabase
    .from("playbooks")
    .insert({
      nome: parsed.data.nome,
      descricao: parsed.data.descricao ?? null,
      conteudo,
      owner_id: user.id,
    })
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

playbooksRouter.patch("/:id", async (req, res: Response) => {
  const user = userOf(req);
  const parsed = updatePlaybookBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data: atual, error: errAtual } = await supabase
    .from("playbooks")
    .select("*")
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Playbook não encontrado." });

  if (parsed.data.conteudo) {
    const ok = conteudoSchema.safeParse(parsed.data.conteudo);
    if (!ok.success) return res.status(400).json({ error: ok.error.flatten() });
  }

  await supabase.from("playbooks_historico").insert({
    playbook_id: atual.id,
    conteudo: atual.conteudo,
    versao: atual.versao,
    prompt: null,
  });

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    versao: atual.versao + 1,
  };
  if (parsed.data.nome !== undefined) patch.nome = parsed.data.nome;
  if (parsed.data.descricao !== undefined) patch.descricao = parsed.data.descricao;
  if (parsed.data.conteudo !== undefined) patch.conteudo = parsed.data.conteudo;

  const { data, error } = await supabase
    .from("playbooks")
    .update(patch)
    .eq("id", atual.id)
    .eq("owner_id", user.id)
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

playbooksRouter.delete("/:id", async (req, res: Response) => {
  const user = userOf(req);
  const { error } = await supabase
    .from("playbooks")
    .delete()
    .eq("id", req.params.id)
    .eq("owner_id", user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});
