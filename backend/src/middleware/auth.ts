import type { NextFunction, Request, Response } from "express";
import { supabaseAuth } from "../services/supabase.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string | null };
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const header = req.header("authorization") || req.header("Authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return res.status(401).json({ error: "Token ausente." });
  }
  const token = header.slice(7).trim();
  if (!token) return res.status(401).json({ error: "Token vazio." });

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Token inválido." });
  }

  req.user = { id: data.user.id, email: data.user.email ?? null };
  next();
}

export function userOf(req: Request): { id: string; email: string | null } {
  if (!req.user) throw new Error("Rota sem requireAuth.");
  return req.user;
}
