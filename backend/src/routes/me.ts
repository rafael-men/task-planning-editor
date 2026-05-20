import { Router, type Response } from "express";
import { z } from "zod";
import { supabase } from "../services/supabase.js";
import { userOf } from "../middleware/auth.js";

export const meRouter = Router();

const updateMeBody = z.object({
  nome: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
});

meRouter.get("/", async (req, res: Response) => {
  const user = userOf(req);
  const { data, error } = await supabase.auth.admin.getUserById(user.id);
  if (error || !data.user) {
    return res.status(500).json({ error: error?.message || "Usuário não encontrado." });
  }
  res.json({
    id: data.user.id,
    email: data.user.email,
    nome: (data.user.user_metadata?.nome as string | undefined) ?? null,
    created_at: data.user.created_at,
  });
});

meRouter.patch("/", async (req, res: Response) => {
  const user = userOf(req);
  const parsed = updateMeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const patch: { email?: string; user_metadata?: Record<string, unknown> } = {};
  if (parsed.data.email) patch.email = parsed.data.email;
  if (parsed.data.nome !== undefined) {
    patch.user_metadata = { nome: parsed.data.nome };
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "Nada para atualizar." });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, patch);
  if (error || !data.user) {
    return res.status(400).json({ error: error?.message || "Falha ao atualizar." });
  }
  res.json({
    id: data.user.id,
    email: data.user.email,
    nome: (data.user.user_metadata?.nome as string | undefined) ?? null,
    created_at: data.user.created_at,
  });
});
