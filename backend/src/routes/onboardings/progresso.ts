import type { Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { ehRHouAdmin, userOf } from "../../middleware/auth.js";
import { atualizarProgressoBody, type Progresso } from "../../types.js";

/**
 * Atualiza o status de um módulo do onboarding.
 * Líder responsável (fornecedor_user_id) e admin/rh podem atualizar.
 */
export async function atualizarProgresso(req: Request, res: Response) {
  const user = userOf(req);
  const parsed = atualizarProgressoBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data: atual, error: errAtual } = await supabase
    .from("onboardings")
    .select("fornecedor_user_id, progresso, conteudo")
    .eq("id", req.params.id)
    .maybeSingle();
  if (errAtual) return res.status(500).json({ error: errAtual.message });
  if (!atual) return res.status(404).json({ error: "Onboarding não encontrado." });

  // Autorização: admin/rh OU fornecedor responsável.
  const ehFornecedor = atual.fornecedor_user_id === user.id;
  if (!ehRHouAdmin(user.role) && !ehFornecedor) {
    return res.status(403).json({
      error: "Você não tem permissão para atualizar este onboarding.",
    });
  }

  const totalModulos = (atual.conteudo?.modulos ?? []).length;
  if (parsed.data.modulo_idx >= totalModulos) {
    return res.status(400).json({
      error: `Índice de módulo inválido (trilha tem ${totalModulos} módulos).`,
    });
  }

  const progressoAtual = (atual.progresso ?? {}) as Progresso;
  const novoProgresso: Progresso = {
    ...progressoAtual,
    [String(parsed.data.modulo_idx)]: {
      status: parsed.data.status,
      atualizado_em: new Date().toISOString(),
      observacao: parsed.data.observacao,
    },
  };

  const { data, error } = await supabase
    .from("onboardings")
    .update({
      progresso: novoProgresso,
      updated_at: new Date().toISOString(),
    })
    .eq("id", req.params.id)
    .select("progresso")
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}
