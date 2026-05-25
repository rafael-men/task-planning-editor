import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { supabase } from "../services/supabase.js";
import { ehAdmin, ehRHouAdmin, userOf } from "../middleware/auth.js";

export const adminRouter = Router();

function ehRHouAdminGate(req: Request, res: Response): boolean {
  const user = userOf(req);
  if (!ehRHouAdmin(user.role)) {
    res.status(403).json({ error: "Apenas RH ou admin pode acessar." });
    return false;
  }
  return true;
}

function ehAdminGate(req: Request, res: Response): boolean {
  const user = userOf(req);
  if (!ehAdmin(user.role)) {
    res.status(403).json({ error: "Apenas admin pode alterar papéis." });
    return false;
  }
  return true;
}

const updatePerfilBody = z.object({
  role: z.enum(["admin", "rh", "lider"]).optional(),
  setor_id: z.string().uuid().nullable().optional(),
});

adminRouter.get("/perfis", async (req, res) => {
  if (!ehRHouAdminGate(req, res)) return;

  const { data: perfis, error } = await supabase
    .from("perfis_usuario")
    .select("user_id, role, setor_id, updated_at, setor:setores(id, slug, nome)")
    .order("updated_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const { data: usersData, error: errUsers } = await supabase.auth.admin.listUsers({
    perPage: 200,
  });
  if (errUsers) return res.status(500).json({ error: errUsers.message });

  const usersById = new Map(usersData.users.map((u) => [u.id, u]));
  const out = (perfis ?? []).map((p) => {
    const u = usersById.get(p.user_id);
    return {
      ...p,
      email: u?.email ?? null,
      nome: (u?.user_metadata?.nome as string | undefined) ?? null,
    };
  });
  res.json(out);
});

adminRouter.patch("/perfis/:user_id", async (req, res) => {
  if (!ehAdminGate(req, res)) return;
  const user = userOf(req);
  const parsed = updatePerfilBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nada para atualizar." });
  }

  
  if (req.params.user_id === user.id && parsed.data.role && parsed.data.role !== "admin") {
    return res.status(400).json({
      error: "Você não pode rebaixar a si mesmo. Promova outro usuário a admin primeiro.",
    });
  }

  const { data, error } = await supabase
    .from("perfis_usuario")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("user_id", req.params.user_id)
    .select("user_id, role, setor_id, updated_at")
    .single();
  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: "Já existe um usuário admin. Rebaixe o atual antes de promover outro.",
      });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});
