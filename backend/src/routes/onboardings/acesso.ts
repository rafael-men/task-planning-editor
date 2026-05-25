import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
import { ehRHouAdmin, type UserCtx } from "../../middleware/auth.js";

/**
 * Visibilidade de onboardings:
 *   - admin/rh: veem todos (sem filtro).
 *   - lider: vê apenas os onboardings em que ele é o `fornecedor_user_id`
 *     (o líder responsável pela contratação).
 */
export function aplicarEscopoOnboarding<
  T extends PostgrestFilterBuilder<any, any, any, any, any>,
>(query: T, user: UserCtx): T {
  if (ehRHouAdmin(user.role)) return query;
  return query.eq("fornecedor_user_id", user.id) as T;
}
