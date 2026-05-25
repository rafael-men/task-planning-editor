import type { NextFunction, Request, Response } from "express";
import { supabase, supabaseAuth } from "../services/supabase.js";

export type Role = "admin" | "rh" | "lider";


export function ehRHouAdmin(role: Role): boolean {
  return role === "admin" || role === "rh";
}

export function ehAdmin(role: Role): boolean {
  return role === "admin";
}

export type UserCtx = {
  id: string;
  email: string | null;
  role: Role;
  setor_id: string | null;

  token: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: UserCtx;
    }
  }
}

async function carregarPerfil(
  userId: string
): Promise<{ role: Role; setor_id: string | null }> {
  const { data } = await supabase
    .from("perfis_usuario")
    .select("role, setor_id")
    .eq("user_id", userId)
    .maybeSingle();
  return {
    role: (data?.role as Role | undefined) ?? "lider",
    setor_id: data?.setor_id ?? null,
  };
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

  const perfil = await carregarPerfil(data.user.id);
  req.user = {
    id: data.user.id,
    email: data.user.email ?? null,
    token,
    ...perfil,
  };
  next();
}

export function userOf(req: Request): UserCtx {
  if (!req.user) throw new Error("Rota sem requireAuth.");
  return req.user;
}

export function requireRH(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  if (!ehRHouAdmin(user.role)) {
    return res.status(403).json({ error: "Apenas RH ou admin pode acessar." });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Não autenticado." });
  if (!ehAdmin(user.role)) {
    return res.status(403).json({ error: "Apenas admin pode acessar este recurso." });
  }
  next();
}
