import { Router } from "express";
import { supabase } from "../services/supabase.js";
export const catalogoRouter = Router();


catalogoRouter.get("/fornecedores", async (_req, res) => {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("id, nome, descricao")
    .order("nome");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

catalogoRouter.get("/setores", async (_req, res) => {
  const { data, error } = await supabase
    .from("setores")
    .select("id, slug, nome, descricao")
    .order("nome");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

catalogoRouter.get("/cargos", async (req, res) => {
  const setorId = req.query.setor_id as string | undefined;
  let q = supabase
    .from("cargos")
    .select("id, setor_id, nome, descricao")
    .order("nome");
  if (setorId) q = q.eq("setor_id", setorId);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

catalogoRouter.get("/ferramentas", async (req, res) => {
  const setor = (req.query.setor as string | undefined)?.trim();
  let q = supabase
    .from("ferramentas")
    .select("id, nome, descricao, setores, nivel_minimo")
    .order("nome");
  if (setor) q = q.contains("setores", [setor.toLowerCase()]);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

catalogoRouter.get("/cursos", async (req, res) => {
  const ferramentaId = req.query.ferramenta_id as string | undefined;
  const setor = (req.query.setor as string | undefined)?.trim();
  let q = supabase
    .from("cursos")
    .select("id, nome, link, ferramenta_id, setores, duracao_horas, formato")
    .order("nome");
  if (ferramentaId) q = q.eq("ferramenta_id", ferramentaId);
  if (setor) q = q.contains("setores", [setor.toLowerCase()]);
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});
