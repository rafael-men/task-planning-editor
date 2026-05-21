import type { Request, Response } from "express";
import { supabase } from "../../services/supabase.js";
import { userOf } from "../../middleware/auth.js";
import { SELECT_DETALHE, SELECT_LIST } from "./selects.js";

export async function listar(req: Request, res: Response) {
  const user = userOf(req);
  const { data, error } = await supabase
    .from("onboardings")
    .select(SELECT_LIST)
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function obter(req: Request, res: Response) {
  const user = userOf(req);
  const { data, error } = await supabase
    .from("onboardings")
    .select(SELECT_DETALHE)
    .eq("id", req.params.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Onboarding não encontrado." });
  res.json(data);
}

export async function remover(req: Request, res: Response) {
  const user = userOf(req);
  const { error } = await supabase
    .from("onboardings")
    .delete()
    .eq("id", req.params.id)
    .eq("owner_id", user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
}
