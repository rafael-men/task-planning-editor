import { Router } from "express";
import { supabase } from "../services/supabase.js";

export const catalogoRouter = Router();

/**
 * Lista os "fornecedores possíveis" para um onboarding: usuários com
 * papel `lider`, identificados por email e exibidos pelo nome
 * (ou "(sem nome)" no UI quando vazio).
 */
catalogoRouter.get("/lideres", async (_req, res) => {
  const { data: perfis, error } = await supabase
    .from("perfis_usuario")
    .select("user_id, role, setor_id")
    .eq("role", "lider");
  if (error) return res.status(500).json({ error: error.message });
  const ids = (perfis ?? []).map((p) => p.user_id);
  if (ids.length === 0) return res.json([]);

  const { data: usersData, error: errUsers } = await supabase.auth.admin.listUsers({
    perPage: 200,
  });
  if (errUsers) return res.status(500).json({ error: errUsers.message });

  const usersById = new Map(usersData.users.map((u) => [u.id, u]));
  const out = ids
    .map((id) => {
      const u = usersById.get(id);
      if (!u) return null;
      return {
        id: u.id,
        email: u.email ?? null,
        nome: (u.user_metadata?.nome as string | undefined) ?? null,
      };
    })
    .filter((x): x is { id: string; email: string | null; nome: string | null } => x !== null)
    // ordena por nome (com "(sem nome)" no final)
    .sort((a, b) => (a.nome ?? "￿").localeCompare(b.nome ?? "￿"));
  res.json(out);
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
