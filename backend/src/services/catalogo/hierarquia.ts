import { supabase } from "../supabase.js";
import type { Senioridade } from "../../types.js";
import type { Hierarquia } from "./tipos.js";

export async function resolverHierarquia(input: {
  fornecedor_id: string;
  setor_id: string;
  cargo_id: string;
  senioridade: Senioridade;
}): Promise<Hierarquia> {
  const [
    { data: fornecedor, error: e1 },
    { data: setor, error: e2 },
    { data: cargo, error: e3 },
  ] = await Promise.all([
    supabase.from("fornecedores").select("*").eq("id", input.fornecedor_id).maybeSingle(),
    supabase.from("setores").select("*").eq("id", input.setor_id).maybeSingle(),
    supabase.from("cargos").select("*").eq("id", input.cargo_id).maybeSingle(),
  ]);
  if (e1 || e2 || e3) throw new Error("Falha ao consultar hierarquia.");
  if (!fornecedor) throw new Error("Fornecedor não encontrado.");
  if (!setor) throw new Error("Setor não encontrado.");
  if (!cargo) throw new Error("Cargo não encontrado.");
  if (cargo.setor_id !== setor.id) {
    throw new Error("Cargo escolhido não pertence ao setor informado.");
  }
  return { fornecedor, setor, cargo, senioridade: input.senioridade };
}
