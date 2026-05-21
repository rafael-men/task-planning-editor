import type { Hierarquia } from "../catalogo/index.js";
import { openai, researchModel } from "./cliente.js";
import { senioridadeLabel } from "./prompts.js";

export type ContextoPesquisa = {
  hierarquia: Hierarquia;
  descricao?: string;
};

export async function pesquisarContexto(ctx: ContextoPesquisa): Promise<string> {
  const h = ctx.hierarquia;
  const input = [
    "Vou montar uma trilha de onboarding para o seguinte colaborador:",
    `- Cargo: ${h.cargo.nome}`,
    `- Senioridade: ${senioridadeLabel(h.senioridade)}`,
    `- Setor: ${h.setor.nome}`,
    `- Fornecedor: ${h.fornecedor.nome}`,
    ctx.descricao ? `- Descrição: ${ctx.descricao}` : "",
    "",
    "Pesquise rapidamente boas práticas atuais (2025-2026) de onboarding técnico para esse cargo e senioridade. Cite 2-4 referências sobre:",
    "- Estrutura típica (semanas, módulos, mentor)",
    "- Quais conhecimentos avaliar em cada fase",
    "Devolva um briefing em texto (máx 12 bullets), citando URL entre parênteses quando relevante. Não devolva JSON.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await openai.responses.create({
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
