import OpenAI from "openai";
import { conteudoSchema, type Conteudo } from "../types.js";

const apiKey = process.env.OPENAI_API_KEY;
const editorModel = process.env.OPENAI_MODEL || "gpt-4o-mini";
const researchModel = process.env.OPENAI_RESEARCH_MODEL || "gpt-4o-mini";
const enableWebSearch = (process.env.ENABLE_WEB_SEARCH ?? "true").toLowerCase() !== "false";

if (!apiKey) {
  throw new Error("OPENAI_API_KEY é obrigatório.");
}

const client = new OpenAI({ apiKey });

const RESEARCH_SYSTEM = `Você é um pesquisador de fluxos operacionais de ferramentas SaaS e dev.
Você recebe (1) um Playbook atual em JSON e (2) uma instrução do usuário (geralmente trocar uma ferramenta por outra).
Sua tarefa é pesquisar na web e produzir um BRIEFING curto e prático sobre como executar as etapas equivalentes na ferramenta nova mencionada na instrução.

Formato da resposta (texto puro, em português):
- Liste, para cada seção/passo do Playbook que envolve a ferramenta antiga, o equivalente real na ferramenta nova.
- Use termos próprios da ferramenta nova (ex.: "Designer", "CMS Collections", "Site Settings" no Webflow).
- Não invente — se algo não tem equivalente direto, diga "não há equivalente direto, sugerir X".
- Cite a URL fonte entre parênteses quando relevante.
- Máximo 12 bullets, foco em acionável.
Não devolva JSON. Não tente reescrever o Playbook. Só o briefing.`;

const EDITOR_SYSTEM = `Você é um editor de Playbooks operacionais.
Você recebe (1) o JSON atual do conteúdo do Playbook, (2) uma instrução em linguagem natural e (3) um BRIEFING de pesquisa sobre a ferramenta nova.
Sua tarefa é devolver APENAS o novo JSON do conteúdo, aplicando a instrução de forma completa e coerente, usando o briefing para escrever passos realistas.

Regras obrigatórias:
- Responda com um único objeto JSON válido, sem comentários, sem markdown, sem texto fora do JSON.
- Mantenha o schema: { "secoes": [ { "titulo": string, "ferramenta": string, "passos": string[] } ] }.
- Aplique a instrução de forma SEMÂNTICA, não só literal nos campos.
  Quando o usuário pede "trocar X por Y", substitua TODAS as ocorrências de X em: campo "ferramenta",
  texto dos "passos" e "titulo" das seções. Reescreva os passos usando as etapas reais de Y
  conforme o briefing — não basta trocar o nome se o passo descreve uma operação específica de X
  que não existe em Y.
- Use o briefing como fonte da verdade sobre como Y funciona. Se o briefing diz que algo não tem
  equivalente direto, ajuste o passo de acordo (ou remova-o se ficar absurdo).
- Preserve seções, passos e ferramentas que NÃO foram mencionados na instrução.
- Não adicione nem remova seções a menos que a instrução peça explicitamente.
- Se a instrução for ambígua ou impossível, devolva o JSON original inalterado.
- A saída deve ser autoconsistente: se o título da seção diz "Instalação do WordPress" e a
  ferramenta agora é "Webflow", o título também precisa refletir isso.`;

async function pesquisarContexto(
  conteudoAtual: Conteudo,
  instrucao: string
): Promise<string> {
  const input = [
    "JSON atual do Playbook:",
    JSON.stringify(conteudoAtual, null, 2),
    "",
    "Instrução do usuário:",
    instrucao,
    "",
    "Produza o briefing de migração.",
  ].join("\n");

  try {
    const response = await client.responses.create({
      model: researchModel,
      tools: [{ type: "web_search_preview" }],
      input: [
        { role: "system", content: RESEARCH_SYSTEM },
        { role: "user", content: input },
      ],
    });
    const text = response.output_text?.trim();
    return text || "(sem briefing — prossiga apenas com seu conhecimento)";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[llm] web_search falhou, seguindo sem briefing:", msg);
    return "(briefing indisponível — prossiga apenas com seu conhecimento)";
  }
}

export async function aplicarPromptNoConteudo(
  conteudoAtual: Conteudo,
  instrucao: string
): Promise<Conteudo> {
  const briefing = enableWebSearch
    ? await pesquisarContexto(conteudoAtual, instrucao)
    : "(web search desabilitado)";

  const userMessage = [
    "JSON atual do conteúdo:",
    JSON.stringify(conteudoAtual, null, 2),
    "",
    "Instrução do usuário:",
    instrucao,
    "",
    "BRIEFING da pesquisa web:",
    briefing,
    "",
    'Responda apenas com o novo JSON do "conteudo".',
  ].join("\n");

  const completion = await client.chat.completions.create({
    model: editorModel,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: EDITOR_SYSTEM },
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

  const result = conteudoSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "JSON do LLM não bate com o schema do conteúdo: " +
        result.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")
    );
  }
  return result.data;
}
