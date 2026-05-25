import type { Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { ehRHouAdmin, userOf } from "../../middleware/auth.js";
import { SELECT_DETALHE, SELECT_LIST } from "./selects.js";
import { aplicarEscopoOnboarding } from "./acesso.js";

type FornecedorResolvido = { id: string; nome: string | null; email: string | null };

async function resolverFornecedor(userId: string | null): Promise<FornecedorResolvido | null> {
  if (!userId) return null;
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !data?.user) return null;
  return {
    id: data.user.id,
    email: data.user.email ?? null,
    nome: (data.user.user_metadata?.nome as string | undefined) ?? null,
  };
}


async function resolverFornecedoresEmLote(
  ids: (string | null)[]
): Promise<Map<string, FornecedorResolvido>> {
  const unicos = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (unicos.length === 0) return new Map();
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) return new Map();
  const map = new Map<string, FornecedorResolvido>();
  for (const u of data.users) {
    if (!unicos.includes(u.id)) continue;
    map.set(u.id, {
      id: u.id,
      email: u.email ?? null,
      nome: (u.user_metadata?.nome as string | undefined) ?? null,
    });
  }
  return map;
}

export async function listar(req: Request, res: Response) {
  const user = userOf(req);
  const base = supabase
    .from("onboardings")
    .select(SELECT_LIST)
    .order("updated_at", { ascending: false });
  const { data, error } = await aplicarEscopoOnboarding(base, user);
  if (error) return res.status(500).json({ error: error.message });
  const rows = data ?? [];
  const fornecedoresMap = await resolverFornecedoresEmLote(
    rows.map((r: any) => r.fornecedor_user_id)
  );
  res.json(
    rows.map((r: any) => ({
      ...r,
      fornecedor: r.fornecedor_user_id
        ? fornecedoresMap.get(r.fornecedor_user_id) ?? null
        : null,
    }))
  );
}

export async function obter(req: Request, res: Response) {
  const user = userOf(req);
  const base = supabase
    .from("onboardings")
    .select(SELECT_DETALHE)
    .eq("id", req.params.id);
  const { data, error } = await aplicarEscopoOnboarding(base, user).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Onboarding não encontrado." });
  const fornecedor = await resolverFornecedor((data as any).fornecedor_user_id ?? null);
  res.json({ ...data, fornecedor });
}

export async function remover(req: Request, res: Response) {
  const user = userOf(req);
  if (!ehRHouAdmin(user.role)) {
    return res
      .status(403)
      .json({ error: "Apenas RH ou admin pode excluir onboardings." });
  }
  const { error } = await supabase
    .from("onboardings")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
}
