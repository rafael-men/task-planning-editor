import {
  onboardingConteudoSchema,
  type OnboardingConteudo,
} from "../../types.js";
import {
  carregarCatalogoHierarquico,
  formatarCatalogoHierarquicoParaPrompt,
  type Hierarquia,
} from "../catalogo/index.js";
import { editorModel, enableWebSearch, openai } from "./cliente.js";
import {
  formatarHierarquiaParaPrompt,
  montarSistemaEditor,
  montarSistemaGerador,
} from "./prompts.js";
import { pesquisarContexto } from "./pesquisa.js";

export type DadosNovoColaborador = {
  nome: string;
  lider?: string;
  descricao?: string;
  data_inicio: string;
  hierarquia: Hierarquia;
};

async function carregarCatalogoTxt(h: Hierarquia): Promise<string> {
  const catalogo = await carregarCatalogoHierarquico(h);
  return formatarCatalogoHierarquicoParaPrompt(catalogo);
}


async function executarChatJson(
  systemPrompt: string,
  userMsg: string,
  temperature: number
): Promise<OnboardingConteudo> {
  const completion = await openai.chat.completions.create({
    model: editorModel,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
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

export async function gerarOnboarding(
  dados: DadosNovoColaborador
): Promise<OnboardingConteudo> {
  const [catalogoTxt, briefing] = await Promise.all([
    carregarCatalogoTxt(dados.hierarquia),
    enableWebSearch
      ? pesquisarContexto({
          hierarquia: dados.hierarquia,
          descricao: dados.descricao,
        })
      : Promise.resolve("(web search desabilitado)"),
  ]);

  const userMsg = [
    formatarHierarquiaParaPrompt(dados.hierarquia),
    "",
    "Dados do colaborador:",
    JSON.stringify(
      {
        nome: dados.nome,
        lider: dados.lider ?? null,
        descricao: dados.descricao ?? null,
        data_inicio: dados.data_inicio,
      },
      null,
      2
    ),
    "",
    "BRIEFING de pesquisa web:",
    briefing,
    "",
    "Gere a trilha de onboarding em JSON conforme o schema.",
  ].join("\n");

  return executarChatJson(montarSistemaGerador(catalogoTxt), userMsg, 0.3);
}

export async function aplicarPromptNoOnboarding(
  conteudoAtual: OnboardingConteudo,
  instrucao: string,
  hierarquia: Hierarquia
): Promise<OnboardingConteudo> {
  const catalogoTxt = await carregarCatalogoTxt(hierarquia);

  const userMsg = [
    formatarHierarquiaParaPrompt(hierarquia),
    "",
    "JSON atual da trilha:",
    JSON.stringify(conteudoAtual, null, 2),
    "",
    "Instrução do usuário:",
    instrucao,
    "",
    "Responda apenas com o novo JSON.",
  ].join("\n");

  return executarChatJson(montarSistemaEditor(catalogoTxt), userMsg, 0.2);
}
