import { supabase } from "../supabase.js";
import type { Senioridade } from "../../types.js";
import type { Hierarquia } from "./tipos.js";

export async function resolverHierarquia(input: {
  fornecedor_user_id: string;
  setor_id: string;
  cargo_id: string;
  senioridade: Senioridade;
}): Promise<Hierarquia> {
  const [
    { data: usuario, error: eUser },
    { data: setor, error: e2 },
    { data: cargo, error: e3 },
  ] = await Promise.all([
    supabase.auth.admin.getUserById(input.fornecedor_user_id),
    supabase.from("setores").select("*").eq("id", input.setor_id).maybeSingle(),
    supabase.from("cargos").select("*").eq("id", input.cargo_id).maybeSingle(),
  ]);
  if (eUser || !usuario?.user) throw new Error("Fornecedor (usuário) não encontrado.");
  if (e2 || !setor) throw new Error("Setor não encontrado.");
  if (e3 || !cargo) throw new Error("Cargo não encontrado.");
  if (cargo.setor_id !== setor.id) {
    throw new Error("Cargo escolhido não pertence ao setor informado.");
  }
  const nome = (usuario.user.user_metadata?.nome as string | undefined) ?? null;
  return {
    fornecedor: {
      id: usuario.user.id,
      nome: nome,
      email: usuario.user.email ?? null,
    },
    setor,
    cargo,
    senioridade: input.senioridade,
  };
}
