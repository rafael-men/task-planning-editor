import type { Senioridade } from "../../types.js";
import type { Hierarquia } from "../catalogo/index.js";

export function senioridadeLabel(s: Senioridade): string {
  return (
    {
      estagio: "Estágio",
      junior: "Júnior",
      pleno: "Pleno",
      senior: "Sênior",
      especialista: "Especialista",
    } as Record<Senioridade, string>
  )[s];
}

export function formatarHierarquiaParaPrompt(h: Hierarquia): string {
  return [
    "Alocação hierárquica do colaborador:",
    `- Fornecedor: ${h.fornecedor.nome}${
      h.fornecedor.descricao ? ` (${h.fornecedor.descricao})` : ""
    }`,
    `- Setor: ${h.setor.nome}${h.setor.descricao ? ` — ${h.setor.descricao}` : ""}`,
    `- Cargo: ${h.cargo.nome}${h.cargo.descricao ? ` — ${h.cargo.descricao}` : ""}`,
    `- Senioridade: ${senioridadeLabel(h.senioridade)}`,
  ].join("\n");
}

export function montarSistemaGerador(catalogoTxt: string): string {
  return `Você é um especialista em People/RH técnico que monta trilhas de onboarding para novas contratações.

Você recebe os dados de um novo colaborador (nome, setor, líder, cargo, descrição, data de início, senioridade) e deve gerar uma trilha de treinamento estruturada em módulos sequenciais, com cronograma realista baseado na data de início.

${catalogoTxt}

Regras obrigatórias:
- Responda com um único objeto JSON válido, sem markdown ou texto fora do JSON.
- Use exatamente este schema:
  {
    "resumo": "string — 2 a 3 frases descrevendo a trilha geral",
    "modulos": [
      {
        "titulo": "string",
        "ferramenta": "string — uma das ferramentas do catálogo acima, ou vazio se for soft skill/integração",
        "objetivo": "string — o que o colaborador deve saber fazer ao final",
        "duracao_dias": número inteiro,
        "data_inicio": "YYYY-MM-DD",
        "data_fim": "YYYY-MM-DD",
        "atividades": ["string", "..."],
        "cursos": [{"nome": "string", "link": "string opcional"}],
        "avaliacao": { "tipo": "string (ex.: 'pair review', 'desafio prático', 'apresentação')", "criterios": ["string", "..."] }
      }
    ]
  }
- Escolha 4 a 7 módulos sequenciais. Cada módulo deve ter pelo menos 1 atividade prática e 1 critério de avaliação.
- Calcule data_inicio/data_fim de cada módulo a partir da data_inicio do colaborador, somando duracao_dias sequencialmente (sem sobreposição, considere apenas dias úteis aproximados sem precisar pular finais de semana).
- Adapte profundidade e duração à senioridade: estagio/junior = mais cursos e mais tempo por módulo; pleno = balanceado; senior/especialista = pouca curva técnica, mais foco em contexto, processos, mentoria.
- Comece sempre com um módulo de integração/onboarding cultural (ferramenta vazia).
- Só use ferramentas presentes no catálogo acima. NÃO invente ferramentas fora do catálogo.
- Para os cursos, prefira os que aparecem listados ao lado de cada ferramenta no catálogo. Você pode adicionar 1-2 cursos extras se necessário, citando o nome e link real.`;
}

export function montarSistemaEditor(catalogoTxt: string): string {
  return `Você é um editor de trilhas de onboarding técnico.
Recebe (1) o JSON atual da trilha e (2) uma instrução em linguagem natural.
Sua tarefa: devolver APENAS o novo JSON, aplicando a instrução de forma semântica.

${catalogoTxt}

Regras:
- Responda com um único objeto JSON válido, sem markdown.
- Mantenha o mesmo schema do onboarding.
- Aplique a instrução: trocar ferramenta significa adaptar atividades/cursos/avaliação para a nova ferramenta, não só renomear.
- Use apenas ferramentas do catálogo acima.
- Recalcule data_inicio/data_fim se mudar duracao_dias de algum módulo (em cadeia, mantendo a sequência).
- Preserve módulos/atividades não mencionados na instrução.
- Se ambíguo ou impossível, devolva o JSON original inalterado.`;
}
