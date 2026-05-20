import { Router } from "express";
import { z } from "zod";
import { supabaseAuth } from "../services/supabase.js";

export const authRouter = Router();

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
  nome: z.string().min(1).max(120).optional(),
});

authRouter.post("/signup", async (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAuth.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: parsed.data.nome ? { data: { nome: parsed.data.nome } } : undefined,
  });
  if (error) return res.status(400).json({ error: error.message });
  res.json({
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
    session: data.session,
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = credentials.pick({ email: true, password: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { data, error } = await supabaseAuth.auth.signInWithPassword(parsed.data);
  if (error) return res.status(401).json({ error: error.message });
  res.json({
    user: { id: data.user.id, email: data.user.email },
    session: data.session,
  });
});
