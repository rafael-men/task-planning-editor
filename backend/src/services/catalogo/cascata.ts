import { supabase } from "../supabase.js";
import type {
  AlocacaoFerramenta,
  CatalogoHierarquico,
  CursoRow,
  Escopo,
  FerramentaRow,
  Hierarquia,
  Obrigatoriedade,
} from "./tipos.js";

type AlocRow = {
  ferramenta_id: string;
  escopo: Escopo;
  alvo_id: string | null;
  alvo_slug: string | null;
  obrigatoriedade: Obrigatoriedade;
};

type CursoAlocRow = {
  curso_id: string;
  escopo: Escopo;
  alvo_id: string | null;
  alvo_slug: string | null;
  obrigatoriedade: Obrigatoriedade;
};

const PRIORIDADE: Record<Escopo, number> = {
  cargo: 3,
  setor: 2,
  senioridade: 1,
  fornecedor: 0,
};

function fazMatch(
  a: AlocRow | CursoAlocRow,
  h: Hierarquia
): boolean {
  if (a.escopo === "fornecedor") return a.alvo_id === h.fornecedor.id;
  if (a.escopo === "setor") return a.alvo_id === h.setor.id;
  if (a.escopo === "cargo") return a.alvo_id === h.cargo.id;
  if (a.escopo === "senioridade") return a.alvo_slug === h.senioridade;
  return false;
}

function dedupPorNivelMaisEspecifico(alocs: AlocRow[]): Map<string, AlocRow> {
  const escolhida = new Map<string, AlocRow>();
  for (const a of alocs) {
    const atual = escolhida.get(a.ferramenta_id);
    const subir =
      !atual ||
      PRIORIDADE[a.escopo] > PRIORIDADE[atual.escopo] ||
      (PRIORIDADE[a.escopo] === PRIORIDADE[atual.escopo] &&
        a.obrigatoriedade === "obrigatoria" &&
        atual.obrigatoriedade === "sugerida");
    if (subir) escolhida.set(a.ferramenta_id, a);
  }
  return escolhida;
}

export async function carregarCatalogoHierarquico(
  hierarquia: Hierarquia
): Promise<CatalogoHierarquico> {
  const [{ data: alocs, error: e1 }, { data: cursoAlocs, error: e2 }] = await Promise.all([
    supabase
      .from("ferramenta_alocacoes")
      .select("ferramenta_id, escopo, alvo_id, alvo_slug, obrigatoriedade"),
    supabase
      .from("curso_alocacoes")
      .select("curso_id, escopo, alvo_id, alvo_slug, obrigatoriedade"),
  ]);
  if (e1) throw new Error("Falha ao carregar alocações: " + e1.message);
  if (e2) throw new Error("Falha ao carregar alocações de cursos: " + e2.message);

  const alocsMatch = ((alocs ?? []) as AlocRow[]).filter((a) => fazMatch(a, hierarquia));
  if (alocsMatch.length === 0) {
    return { fornecedor: [], setor: [], cargo: [], senioridade: [] };
  }

  const ferramentaIds = Array.from(new Set(alocsMatch.map((a) => a.ferramenta_id)));

  const [{ data: ferramentas, error: e3 }, { data: cursos, error: e4 }] = await Promise.all([
    supabase
      .from("ferramentas")
      .select("id, nome, descricao, setores, nivel_minimo")
      .in("id", ferramentaIds),
    supabase
      .from("cursos")
      .select("id, nome, link, ferramenta_id, setores, duracao_horas, formato")
      .in("ferramenta_id", ferramentaIds),
  ]);
  if (e3) throw new Error("Falha ao carregar ferramentas: " + e3.message);
  if (e4) throw new Error("Falha ao carregar cursos: " + e4.message);

  const ferramentaPorId = new Map<string, FerramentaRow>();
  for (const f of (ferramentas ?? []) as FerramentaRow[]) ferramentaPorId.set(f.id, f);

  const cursosPorFerramenta = new Map<string, CursoRow[]>();
  for (const c of (cursos ?? []) as CursoRow[]) {
    if (!c.ferramenta_id) continue;
    const arr = cursosPorFerramenta.get(c.ferramenta_id) ?? [];
    arr.push(c);
    cursosPorFerramenta.set(c.ferramenta_id, arr);
  }

  const cursosAlocMatch = ((cursoAlocs ?? []) as CursoAlocRow[]).filter((c) =>
    fazMatch(c, hierarquia)
  );
  const cursoIdsAlocados = new Set(cursosAlocMatch.map((c) => c.curso_id));
  if (cursoIdsAlocados.size > 0) {
    for (const [fid, lista] of cursosPorFerramenta) {
      const filtrados = lista.filter((c) => cursoIdsAlocados.has(c.id));
      if (filtrados.length > 0) cursosPorFerramenta.set(fid, filtrados);
    }
  }

  const escolhida = dedupPorNivelMaisEspecifico(alocsMatch);

  const buckets: CatalogoHierarquico = {
    fornecedor: [],
    setor: [],
    cargo: [],
    senioridade: [],
  };
  for (const a of escolhida.values()) {
    const f = ferramentaPorId.get(a.ferramenta_id);
    if (!f) continue;
    buckets[a.escopo].push({
      ferramenta: f,
      escopo: a.escopo,
      obrigatoriedade: a.obrigatoriedade,
      cursos: cursosPorFerramenta.get(f.id) ?? [],
    });
  }
  return buckets;
}

function blocoTxt(label: string, items: AlocacaoFerramenta[]): string | null {
  if (items.length === 0) return null;
  const linhas = items.map((it) => {
    const cursosTxt = it.cursos.length
      ? "\n      Cursos:" +
        it.cursos
          .map(
            (c) =>
              `\n      - "${c.nome}"${c.link ? ` (${c.link})` : ""}${
                c.duracao_horas ? ` — ~${c.duracao_horas}h` : ""
              }${c.formato ? ` [${c.formato}]` : ""}`
          )
          .join("")
      : "";
    const tag = it.obrigatoriedade === "obrigatoria" ? "[OBRIGATÓRIA]" : "[sugerida]";
    return `  - ${it.ferramenta.nome} ${tag}: ${it.ferramenta.descricao}${cursosTxt}`;
  });
  return `${label}\n${linhas.join("\n")}`;
}

export function formatarCatalogoHierarquicoParaPrompt(c: CatalogoHierarquico): string {
  const blocos = [
    blocoTxt("- Base do fornecedor (todo mundo passa por isso):", c.fornecedor),
    blocoTxt("- Específico do setor:", c.setor),
    blocoTxt("- Específico do cargo:", c.cargo),
    blocoTxt("- Ajustes por senioridade:", c.senioridade),
  ].filter((b): b is string => b !== null);

  if (blocos.length === 0) {
    return "Catálogo: (vazio — nenhuma ferramenta alocada para esta combinação)";
  }
  return [
    "Catálogo de competências obrigatórias e sugeridas (use APENAS estas):",
    ...blocos,
  ].join("\n\n");
}
