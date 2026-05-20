import OpenAI from "openai";
import {
  onboardingConteudoSchema,
  type OnboardingConteudo,
  type Senioridade,
} from "../types.js";

const apiKey = process.env.OPENAI_API_KEY;
const editorModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const researchModel = process.env.OPENAI_RESEARCH_MODEL || "gpt-4o-mini";
const enableWebSearch =
  (process.env.ENABLE_WEB_SEARCH ?? "true").toLowerCase() !== "false";

if (!apiKey) throw new Error("OPENAI_API_KEY é obrigatório.");
const client = new OpenAI({ apiKey });

const CATALOGO = `Catálogo de competências da casa (escolha apenas as relevantes para o cargo):
- n8n: automação de fluxos, integrações via nós, webhooks, automação de processos internos.
- Nest.js: framework Node para backend modular, controllers, providers, DI, módulos, integração com Postgres/Supabase.
- API Rest: design de endpoints, status codes, autenticação, versionamento, OpenAPI/Swagger.
- React.js: SPA, componentes, hooks, gerenciamento de estado, formulários, integração com APIs.
- Agentes RAG e LLM: prompt engineering, retrieval augmented generation, embeddings, vector stores, tool use, eval.
- Next.js: SSR/ISR, app router, server actions, deploy em Vercel, otimizações de performance.`;

const SISTEMA_GERADOR = `Você é um especialista em People/RH técnico que monta trilhas de onboarding para novas contratações.

Você recebe os dados de um novo colaborador (nome, setor, líder, cargo, descrição, data de início, senioridade) e deve gerar uma trilha de treinamento estruturada em módulos sequenciais, com cronograma realista baseado na data de início.

${CATALOGO}

Regras obrigatórias:
- Responda com um único objeto JSON válido, sem markdown ou texto fora do JSON.
- Use exatamente este schema:
  {
    "resumo": "string — 2 a 3 frases descrevendo a trilha geral",
    "modulos": [
      {
        "titulo": "string",
        "ferramenta": "string — uma das ferramentas do catálogo, ou vazio se for soft skill/integração",
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
- Adapte a profundidade e duração à senioridade: estagio/junior = mais cursos e mais tempo por módulo; pleno = balanceado; senior/especialista = pouca curva técnica, mais foco em contexto, processos, mentoria.
- Comece sempre com um módulo de integração/onboarding cultural (ferramenta vazia).
- Só inclua ferramentas do catálogo que façam sentido para o cargo. Não invente ferramentas que não estão no catálogo.
- Cursos podem ser nomes genéricos (ex.: "Curso oficial de Nest.js na plataforma X") sem link, ou com link real se você tiver certeza.`;

function senioridadeLabel(s: Senioridade): string {
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

export type DadosNovoColaborador = {
  nome: string;
  setor: string;
  lider?: string;
  cargo: string;
  descricao?: string;
  data_inicio: string;
  senioridade: Senioridade;
};

async function pesquisarContexto(dados: DadosNovoColaborador): Promise<string> {
  const input = [
    "Vou montar uma trilha de onboarding para o seguinte colaborador:",
    `- Cargo: ${dados.cargo}`,
    `- Senioridade: ${senioridadeLabel(dados.senioridade)}`,
    `- Setor: ${dados.setor}`,
    dados.descricao ? `- Descrição: ${dados.descricao}` : "",
    "",
    "Pesquise rapidamente boas práticas atuais (2025-2026) de onboarding técnico para esse cargo e senioridade. Cite 2-4 referências sobre:",
    "- Estrutura típica (semanas, módulos, mentor)",
    "- Quais conhecimentos avaliar em cada fase",
    "- Cursos atuais para as tecnologias do catálogo: n8n, Nest.js, API Rest, React.js, Agentes RAG e LLM, Next.js",
    "Devolva um briefing em texto (máx 12 bullets), citando URL entre parênteses quando relevante. Não devolva JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await client.responses.create({
      model: researchModel,
      tools: [{ type: "web_search_preview" }],
      input: [
        {
          role: "system",
          content:
            "Você é um pesquisador de práticas de onboarding técnico. Resposta objetiva e prática.",
        },
        { role: "user", content: input },
      ],
    });
    return response.output_text?.trim() || "(sem briefing)";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[llm-onboarding] web_search falhou:", msg);
    return "(briefing indisponível)";
  }
}

export async function gerarOnboarding(
  dados: DadosNovoColaborador
): Promise<OnboardingConteudo> {
  const briefing = enableWebSearch
    ? await pesquisarContexto(dados)
    : "(web search desabilitado)";

  const userMsg = [
    "Dados do colaborador:",
    JSON.stringify(dados, null, 2),
    "",
    "BRIEFING de pesquisa web:",
    briefing,
    "",
    "Gere a trilha de onboarding em JSON conforme o schema.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: editorModel,
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SISTEMA_GERADOR },
      { role: "user", content: userMsg },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("LLM não retornou conteúdo.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM retornou JSON inválido.");
  }
  const result = onboardingConteudoSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "JSON do LLM fora do schema: " +
        result.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")
    );
  }
  return result.data;
}

const SISTEMA_EDITOR = `Você é um editor de trilhas de onboarding técnico.
Recebe (1) o JSON atual da trilha e (2) uma instrução em linguagem natural.
Sua tarefa: devolver APENAS o novo JSON, aplicando a instrução de forma semântica.

${CATALOGO}

Regras:
- Responda com um único objeto JSON válido, sem markdown.
- Mantenha o mesmo schema do onboarding.
- Aplique a instrução: trocar ferramenta significa adaptar atividades/cursos/avaliação para a nova ferramenta, não só renomear.
- Recalcule data_inicio/data_fim se mudar duracao_dias de algum módulo (em cadeia, mantendo a sequência).
- Preserve módulos/atividades não mencionados na instrução.
- Se ambíguo ou impossível, devolva o JSON original inalterado.`;

export async function aplicarPromptNoOnboarding(
  conteudoAtual: OnboardingConteudo,
  instrucao: string
): Promise<OnboardingConteudo> {
  const userMessage = [
    "JSON atual da trilha:",
    JSON.stringify(conteudoAtual, null, 2),
    "",
    "Instrução do usuário:",
    instrucao,
    "",
    "Responda apenas com o novo JSON.",
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: editorModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SISTEMA_EDITOR },
      { role: "user", content: userMessage },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("LLM não retornou conteúdo.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM retornou JSON inválido.");
  }
  const result = onboardingConteudoSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "JSON do LLM fora do schema: " +
        result.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")
    );
  }
  return result.data;
}
