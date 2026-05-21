import { supabase } from "../supabase.js";
import type { Senioridade } from "../../types.js";
import { ORDEM_NIVEL, type CursoRow, type FerramentaRow } from "./tipos.js";

const SINONIMOS_SETOR: Record<string, string[]> = {
  tecnologia: ["tec", "eng", "dev", "ti", "software", "produto", "engenharia"],
  design: ["design", "ux", "ui", "criação", "criacao"],
  social: [
    "social",
    "marketing",
    "midia",
    "mídia",
    "conteudo",
    "conteúdo",
    "comunicacao",
    "comunicação",
  ],
  vendas: ["vend", "comercial", "sdr", "bdr", "cs", "sales"],
  bi: ["bi", "dados", "data", "analytics", "analític", "analitic"],
  operacoes: ["oper", "rh", "people", "financ", "adm"],
};

export function normalizarSetor(setor: string): string {
  const s = setor.toLowerCase().trim();
  for (const [tag, keywords] of Object.entries(SINONIMOS_SETOR)) {
    if (keywords.some((k) => s.includes(k))) return tag;
  }
  return s;
}

export async function carregarFerramentasPorSetor(
  setor: string,
  senioridade: Senioridade
): Promise<FerramentaRow[]> {
  const tag = normalizarSetor(setor);
  const { data, error } = await supabase
    .from("ferramentas")
    .select("*")
    .contains("setores", [tag]);
  if (error) throw new Error("Falha ao carregar ferramentas: " + error.message);

  const nivelAtual = ORDEM_NIVEL[senioridade];
  return (data ?? []).filter(
    (f: FerramentaRow) => ORDEM_NIVEL[f.nivel_minimo] <= nivelAtual + 1
  );
}

export async function carregarCursosPorFerramentas(
  ferramentaIds: string[]
): Promise<CursoRow[]> {
  if (ferramentaIds.length === 0) return [];
  const { data, error } = await supabase
    .from("cursos")
    .select("*")
    .in("ferramenta_id", ferramentaIds);
  if (error) throw new Error("Falha ao carregar cursos: " + error.message);
  return data ?? [];
}

export function formatarCatalogoParaPrompt(
  ferramentas: FerramentaRow[],
  cursos: CursoRow[]
): string {
  if (ferramentas.length === 0) {
    return "Catálogo de competências: (vazio — não há ferramentas cadastradas para esse setor)";
  }
  const cursosPorFerramenta = new Map<string, CursoRow[]>();
  for (const c of cursos) {
    if (!c.ferramenta_id) continue;
    const arr = cursosPorFerramenta.get(c.ferramenta_id) ?? [];
    arr.push(c);
    cursosPorFerramenta.set(c.ferramenta_id, arr);
  }

  const linhas = ferramentas.map((f) => {
    const cs = cursosPorFerramenta.get(f.id) ?? [];
    const cursosTxt = cs.length
      ? "\n    Cursos sugeridos:\n" +
        cs
          .map(
            (c) =>
              `    - "${c.nome}"${c.link ? ` (${c.link})` : ""}${
                c.duracao_horas ? ` — ~${c.duracao_horas}h` : ""
              }${c.formato ? ` [${c.formato}]` : ""}`
          )
          .join("\n")
      : "";
    return `- ${f.nome}: ${f.descricao}${cursosTxt}`;
  });

  return [
    "Catálogo de competências da casa (use APENAS estas ferramentas e cursos):",
    ...linhas,
  ].join("\n");
}
