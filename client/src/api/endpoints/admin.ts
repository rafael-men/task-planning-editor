import { request } from "../request";
import type { PerfilUsuario, Role } from "../types";

export const adminApi = {
  listPerfis: () => request<PerfilUsuario[]>("/admin/perfis"),
  updatePerfil: (
    userId: string,
    body: { role?: Role; setor_id?: string | null }
  ) =>
    request<{
      user_id: string;
      role: Role;
      setor_id: string | null;
      updated_at: string;
    }>(`/admin/perfis/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
