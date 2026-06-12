import { Injectable, OnModuleInit } from '@nestjs/common';
import Groq from 'groq-sdk';
import { tavily } from '@tavily/core';
import { type ZodType } from 'zod';
import {
  conteudoSchema,
  onboardingConteudoSchema,
  type Conteudo,
  type OnboardingConteudo,
} from '../lib/schemas';

const RESEARCH_SYSTEM = `Você é um pesquisador de fluxos operacionais de ferramentas SaaS e dev.
Você recebe (1) um Playbook atual em JSON e (2) uma instrução do usuário (geralmente trocar uma ferramenta por outra).
Sua tarefa é produzir um BRIEFING curto e prático sobre como executar as etapas equivalentes na ferramenta nova mencionada na instrução.

Formato da resposta (texto puro, em português):
- Liste, para cada seção/passo do Playbook que envolve a ferramenta antiga, o equivalente real na ferramenta nova.
- Use termos próprios da ferramenta nova.
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
- Use o briefing como fonte da verdade sobre como Y funciona.
- Preserve seções, passos e ferramentas que NÃO foram mencionados na instrução.
- Não adicione nem remova seções a menos que a instrução peça explicitamente.
- Se a instrução for ambígua ou impossível, devolva o JSON original inalterado.
- A saída deve ser autoconsistente.`;

@Injectable()
export class LlmService implements OnModuleInit {
  private groq: Groq;
  private tavilyClient: ReturnType<typeof tavily>;
  private model: string;
  private enableWebSearch: boolean;

  onModuleInit() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY é obrigatório.');

    const tavilyKey = process.env.TAVILY_API_KEY;

    this.groq = new Groq({ apiKey });
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    this.enableWebSearch =
      (process.env.ENABLE_WEB_SEARCH ?? 'true').toLowerCase() !== 'false';

    if (this.enableWebSearch && tavilyKey) {
      this.tavilyClient = tavily({ apiKey: tavilyKey });
    } else {
      this.enableWebSearch = false;
    }
  }

  private async pesquisarWebPlaybook(
    conteudoAtual: Conteudo,
    instrucao: string,
  ): Promise<string> {
    if (!this.enableWebSearch) return '(web search desabilitado)';
    try {
      const query = `${instrucao} equivalente operacional ferramenta SaaS passos tutorial`;
      const result = await this.tavilyClient.search(query, {
        maxResults: 5,
        searchDepth: 'basic',
      });
      const bullets = result.results
        .slice(0, 5)
        .map((r) => `- ${r.title}: ${r.content?.slice(0, 200)} (${r.url})`)
        .join('\n');
      return bullets || '(sem resultados de busca)';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[llm] tavily falhou:', msg);
      return '(briefing indisponível — prossiga apenas com seu conhecimento)';
    }
  }

  private async pesquisarWebOnboarding(
    cargo: string,
    senioridade: string,
    setor: string,
    descricao?: string,
  ): Promise<string> {
    if (!this.enableWebSearch) return '(web search desabilitado)';
    try {
      const query = `onboarding técnico ${cargo} ${senioridade} ${setor} boas práticas 2025 estrutura módulos`;
      const result = await this.tavilyClient.search(query, {
        maxResults: 5,
        searchDepth: 'basic',
      });
      const bullets = result.results
        .slice(0, 5)
        .map((r) => `- ${r.title}: ${r.content?.slice(0, 200)} (${r.url})`)
        .join('\n');
      return bullets || '(sem resultados de busca)';
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[llm-onboarding] tavily falhou:', msg);
      return '(briefing indisponível)';
    }
  }

  private async chatJson<T>(
    systemPrompt: string,
    userMsg: string,
    schema: ZodType<T>,
    temperature: number,
  ): Promise<T> {
    const completion = await this.groq.chat.completions.create({
      model: this.model,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('LLM não retornou conteúdo.');

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('LLM retornou JSON inválido.');
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        'JSON do LLM fora do schema: ' +
          result.error.issues
            .map((i) => `${i.path.join('.')} ${i.message}`)
            .join('; '),
      );
    }
    return result.data;
  }

  async aplicarPromptNoConteudo(
    conteudoAtual: Conteudo,
    instrucao: string,
  ): Promise<Conteudo> {
    const briefing = await this.pesquisarWebPlaybook(conteudoAtual, instrucao);

    const userMessage = [
      'JSON atual do conteúdo:',
      JSON.stringify(conteudoAtual, null, 2),
      '',
      'Instrução do usuário:',
      instrucao,
      '',
      'BRIEFING da pesquisa web:',
      briefing,
      '',
      'Responda apenas com o novo JSON do "conteudo".',
    ].join('\n');

    return this.chatJson(EDITOR_SYSTEM, userMessage, conteudoSchema, 0.2);
  }

  async gerarOnboarding(params: {
    nome: string;
    lider?: string;
    descricao?: string;
    dataInicio: string;
    hierarquia: {
      cargo: { nome: string };
      setor: { nome: string };
      senioridade: string;
    };
    systemPrompt: string;
    hierarquiaPrompt: string;
  }): Promise<OnboardingConteudo> {
    const briefing = await this.pesquisarWebOnboarding(
      params.hierarquia.cargo.nome,
      params.hierarquia.senioridade,
      params.hierarquia.setor.nome,
      params.descricao,
    );

    const userMsg = [
      params.hierarquiaPrompt,
      '',
      'Dados do colaborador:',
      JSON.stringify(
        {
          nome: params.nome,
          lider: params.lider ?? null,
          descricao: params.descricao ?? null,
          data_inicio: params.dataInicio,
        },
        null,
        2,
      ),
      '',
      'BRIEFING de pesquisa web:',
      briefing,
      '',
      'Gere a trilha de onboarding em JSON conforme o schema.',
    ].join('\n');

    return this.chatJson(
      params.systemPrompt,
      userMsg,
      onboardingConteudoSchema,
      0.3,
    );
  }

  async aplicarPromptNoOnboarding(params: {
    conteudoAtual: OnboardingConteudo;
    instrucao: string;
    systemPrompt: string;
    hierarquiaPrompt: string;
  }): Promise<OnboardingConteudo> {
    const userMsg = [
      params.hierarquiaPrompt,
      '',
      'JSON atual da trilha:',
      JSON.stringify(params.conteudoAtual, null, 2),
      '',
      'Instrução do usuário:',
      params.instrucao,
      '',
      'Responda apenas com o novo JSON.',
    ].join('\n');

    return this.chatJson(
      params.systemPrompt,
      userMsg,
      onboardingConteudoSchema,
      0.2,
    );
  }
}
