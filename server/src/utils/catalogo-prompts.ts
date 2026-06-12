export type Senioridade =
  | 'estagio'
  | 'junior'
  | 'pleno'
  | 'senior'
  | 'especialista';

export type Hierarquia = {
  fornecedor: { id: string; nome: string | null; email: string | null };
  setor: { id: string; slug: string; nome: string; descricao: string | null };
  cargo: { id: string; setor_id: string; nome: string; descricao: string | null };
  senioridade: Senioridade;
};

export type AlocacaoFerramenta = {
  ferramenta: { id: string; nome: string; descricao: string };
  escopo: 'global' | 'setor' | 'cargo' | 'senioridade';
  obrigatoriedade: 'obrigatoria' | 'sugerida';
  cursos: { id: string; nome: string; link: string | null; duracao_horas: number | null; formato: string | null }[];
};

export type CatalogoHierarquico = {
  global: AlocacaoFerramenta[];
  setor: AlocacaoFerramenta[];
  cargo: AlocacaoFerramenta[];
  senioridade: AlocacaoFerramenta[];
};

const SENIORIDADE_LABEL: Record<Senioridade, string> = {
  estagio: 'Estágio',
  junior: 'Júnior',
  pleno: 'Pleno',
  senior: 'Sênior',
  especialista: 'Especialista',
};

export function senioridadeLabel(s: Senioridade): string {
  return SENIORIDADE_LABEL[s];
}

export function formatarHierarquiaParaPrompt(h: Hierarquia): string {
  return [
    'Alocação hierárquica do colaborador:',
    `- Fornecedor (líder responsável): ${h.fornecedor.nome ?? '(sem nome)'}${h.fornecedor.email ? ` <${h.fornecedor.email}>` : ''}`,
    `- Setor: ${h.setor.nome}${h.setor.descricao ? ` — ${h.setor.descricao}` : ''}`,
    `- Cargo: ${h.cargo.nome}${h.cargo.descricao ? ` — ${h.cargo.descricao}` : ''}`,
    `- Senioridade: ${senioridadeLabel(h.senioridade)}`,
  ].join('\n');
}

function blocoTxt(label: string, items: AlocacaoFerramenta[]): string | null {
  if (items.length === 0) return null;
  const linhas = items.map((it) => {
    const cursosTxt = it.cursos.length
      ? '\n      Cursos:' +
        it.cursos
          .map(
            (c) =>
              `\n      - "${c.nome}"${c.link ? ` (${c.link})` : ''}${c.duracao_horas ? ` — ~${c.duracao_horas}h` : ''}${c.formato ? ` [${c.formato}]` : ''}`,
          )
          .join('')
      : '';
    const tag =
      it.obrigatoriedade === 'obrigatoria' ? '[OBRIGATÓRIA]' : '[sugerida]';
    return `  - ${it.ferramenta.nome} ${tag}: ${it.ferramenta.descricao}${cursosTxt}`;
  });
  return `${label}\n${linhas.join('\n')}`;
}

export function formatarCatalogoHierarquicoParaPrompt(
  c: CatalogoHierarquico,
): string {
  const blocos = [
    blocoTxt('- Base da empresa (todo mundo passa por isso):', c.global),
    blocoTxt('- Específico do setor:', c.setor),
    blocoTxt('- Específico do cargo:', c.cargo),
    blocoTxt('- Ajustes por senioridade:', c.senioridade),
  ].filter((b): b is string => b !== null);

  if (blocos.length === 0) {
    return 'Catálogo: (vazio — nenhuma ferramenta alocada para esta combinação)';
  }
  return [
    'Catálogo de competências obrigatórias e sugeridas (use APENAS estas):',
    ...blocos,
  ].join('\n\n');
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
        "avaliacao": { "tipo": "string", "criterios": ["string", "..."] }
      }
    ]
  }
- Escolha 4 a 7 módulos sequenciais. Cada módulo deve ter pelo menos 1 atividade prática e 1 critério de avaliação.
- Calcule data_inicio/data_fim de cada módulo a partir da data_inicio do colaborador, somando duracao_dias sequencialmente.
- Adapte profundidade e duração à senioridade: estagio/junior = mais cursos e mais tempo; pleno = balanceado; senior/especialista = pouca curva técnica, mais foco em contexto.
- Comece sempre com um módulo de integração/onboarding cultural (ferramenta vazia).
- Só use ferramentas presentes no catálogo acima. NÃO invente ferramentas fora do catálogo.`;
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
