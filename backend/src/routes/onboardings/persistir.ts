import type { Request, Response } from "express";
import {
  createOnboardingBody,
  onboardingConteudoSchema,
  updateOnboardingBody,
} from "../../types.js";
import { supabase } from "../../services/supabase.js";
import { ehRHouAdmin, userOf } from "../../middleware/auth.js";
import { resolverHierarquia } from "../../services/catalogo/index.js";
import { aplicarEscopoOnboarding } from "./acesso.js";

const CAMPOS_PATCH = [
  "nome",
  "lider",
  "descricao",
  "data_inicio",
  "senioridade",
  "fornecedor_user_id",
  "setor_id",
  "cargo_id",
  "conteudo",
] as const;

export async function criar(req: Request, res: Response) {
  const user = userOf(req);
  if (!ehRHouAdmin(user.role)) {
    return res
      .status(403)
      .json({ error: "Apenas RH ou admin pode criar onboardings." });
  }
  const parsed = createOnboardingBody
    .extend({ conteudo: onboardingConteudoSchema })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  let hierarquia;
  try {
    hierarquia = await resolverHierarquia({
      fornecedor_user_id: parsed.data.fornecedor_user_id,
      setor_id: parsed.data.setor_id,
      cargo_id: parsed.data.cargo_id,
      senioridade: parsed.data.senioridade,
    });
  } catch (err) {
    return res
      .status(400)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }

  const {
    conteudo,
    fornecedor_user_id,
    setor_id,
    cargo_id,
    senioridade,
    nome,
    lider,
    descricao,
    data_inicio,
  } = parsed.data;

  const { data, error } = await supabase
    .from("onboardings")
    .insert({
      nome,
      lider: lider ?? null,
      descricao: descricao ?? null,
      data_inicio,
      senioridade,
      fornecedor_user_id,
      setor_id,
      cargo_id,
      setor: hierarquia.setor.slug,
      cargo: hierarquia.cargo.nome,
      conteudo,
      owner_id: user.id,
    })
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
}

export async function atualizar(req: Request, res: Response) {
  const user = userOf(req);
  const parsed = updateOnboardingBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (
    !ehRHouAdmin(user.role) &&
    (parsed.data.fornecedor_user_id !== undefined ||
      parsed.data.setor_id !== undefined ||
      parsed.data.cargo_id !== undefined)
  ) {
    return res.status(403).json({
      error: "Apenas RH ou admin pode alterar fornecedor, setor ou cargo.",
    });
  }

  const baseSelect = supabase
    .from("onboardings")
    .select("versao, fornecedor_user_id, setor_id, cargo_id, senioridade")
    .eq("id", req.params.id);
  const { data: atual, error: errAtual } = await aplicarEscopoOnboarding(
    baseSelect,
    user
  ).maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Onboarding não encontrado." });

  let hierarquia = null;
  if (
    parsed.data.fornecedor_user_id !== undefined ||
    parsed.data.setor_id !== undefined ||
    parsed.data.cargo_id !== undefined
  ) {
    try {
      hierarquia = await resolverHierarquia({
        fornecedor_user_id:
          parsed.data.fornecedor_user_id ?? atual.fornecedor_user_id,
        setor_id: parsed.data.setor_id ?? atual.setor_id,
        cargo_id: parsed.data.cargo_id ?? atual.cargo_id,
        senioridade: parsed.data.senioridade ?? atual.senioridade,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ error: err instanceof Error ? err.message : String(err) });
    }
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    versao: atual.versao + 1,
  };
  for (const k of CAMPOS_PATCH) {
    if (parsed.data[k] !== undefined) patch[k] = parsed.data[k];
  }
  if (hierarquia) {
    patch.setor = hierarquia.setor.slug;
    patch.cargo = hierarquia.cargo.nome;
  }

  const baseUpdate = supabase
    .from("onboardings")
    .update(patch)
    .eq("id", req.params.id);
  const { data, error } = await aplicarEscopoOnboarding(baseUpdate, user)
    .select("*")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
