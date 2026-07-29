import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Onboarding } from '../models/onboarding.entity';
import type { UserCtx } from '../lib/user-ctx';
import { ehRHouAdmin } from '../lib/user-ctx';
import {
  atualizarProgressoBody,
  createOnboardingBody,
  onboardingConteudoSchema,
  promptBody,
  updateOnboardingBody,
} from '../lib/schemas';
import { CatalogoService } from './catalogo.service';
import { LlmService } from './llm.service';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';
import {
  formatarCatalogoHierarquicoParaPrompt,
  formatarHierarquiaParaPrompt,
  montarSistemaEditor,
  montarSistemaGerador,
  type Hierarquia,
  type Senioridade,
} from '../utils/catalogo-prompts';

const SELECT_LIST = `
  id, nome, senioridade, data_inicio, versao, updated_at, fornecedor_user_id,
  setor:setores(id, slug, nome),
  cargo:cargos(id, nome)
`;

const SELECT_DETALHE = `
  *,
  setor:setores(id, slug, nome, descricao),
  cargo:cargos(id, nome, descricao, setor_id)
`;

function aplicarEscopo(
  query: import('typeorm').SelectQueryBuilder<Onboarding>,
  user: UserCtx,
) {
  if (ehRHouAdmin(user.role)) return query;
  return query.andWhere('o.fornecedor_user_id = :uid', { uid: user.id });
}

@Injectable()
export class OnboardingsService {
  constructor(
    @InjectRepository(Onboarding)
    private readonly repo: Repository<Onboarding>,
    private readonly catalogo: CatalogoService,
    private readonly llm: LlmService,
    private readonly notificationService: NotificationService,
    private readonly supabase: SupabaseService,
  ) {}

  private async resolverFornecedor(userId: string | null) {
    if (!userId) return null;
    const u = await this.supabase.getUserById(userId);
    if (!u) return null;
    return {
      id: u.id,
      email: u.email ?? null,
      nome: (u.user_metadata?.nome as string | undefined) ?? null,
    };
  }

  private async resolverFornecedoresEmLote(ids: (string | null)[]) {
    const unicos = [...new Set(ids.filter((x): x is string => !!x))];
    if (unicos.length === 0) return new Map<string, { id: string; email: string | null; nome: string | null }>();
    const users = await this.supabase.getUsersByIds(unicos);
    const map = new Map<string, { id: string; email: string | null; nome: string | null }>();
    for (const u of users) {
      map.set(u.id, {
        id: u.id,
        email: u.email ?? null,
        nome: (u.user_metadata?.nome as string | undefined) ?? null,
      });
    }
    return map;
  }

  async listar(user: UserCtx) {
    let q = this.supabase.admin
      .from('onboardings')
      .select(SELECT_LIST)
      .order('updated_at', { ascending: false });

    if (!ehRHouAdmin(user.role)) {
      q = q.eq('fornecedor_user_id', user.id);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const fornecedoresMap = await this.resolverFornecedoresEmLote(
      (rows ?? []).map((r: any) => r.fornecedor_user_id),
    );

    return (rows ?? []).map((r: any) => ({
      ...r,
      fornecedor: r.fornecedor_user_id
        ? (fornecedoresMap.get(r.fornecedor_user_id) ?? null)
        : null,
    }));
  }

  async obter(id: string, user: UserCtx) {
    let q = this.supabase.admin
      .from('onboardings')
      .select(SELECT_DETALHE)
      .eq('id', id);

    if (!ehRHouAdmin(user.role)) {
      q = q.eq('fornecedor_user_id', user.id);
    }

    const { data, error } = await q.maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new NotFoundException('Onboarding não encontrado.');

    const fornecedor = await this.resolverFornecedor((data as any).fornecedor_user_id ?? null);
    return { ...data, fornecedor };
  }

  async remover(id: string, user: UserCtx) {
    if (!ehRHouAdmin(user.role)) {
      throw new ForbiddenException('Apenas RH ou admin pode excluir onboardings.');
    }
    const on = await this.repo.findOne({ where: { id } });
    if (!on) throw new NotFoundException('Onboarding não encontrado.');
    await this.repo.remove(on);
  }

  async criar(body: unknown, user: UserCtx) {
    if (!ehRHouAdmin(user.role)) {
      throw new ForbiddenException('Apenas RH ou admin pode criar onboardings.');
    }
    const parsed = createOnboardingBody
      .extend({ conteudo: onboardingConteudoSchema.optional() })
      .safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    let hierarquia;
    try {
      hierarquia = await this.catalogo.resolverHierarquia({
        fornecedorUserId: parsed.data.fornecedor_user_id,
        setorId: parsed.data.setor_id,
        cargoId: parsed.data.cargo_id,
        senioridade: parsed.data.senioridade as Senioridade,
      });
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }

    const on = this.repo.create({
      nome: parsed.data.nome,
      lider: parsed.data.lider ?? null,
      descricao: parsed.data.descricao ?? null,
      dataInicio: parsed.data.data_inicio,
      senioridade: parsed.data.senioridade,
      fornecedorUserId: parsed.data.fornecedor_user_id,
      setorId: parsed.data.setor_id,
      cargoId: parsed.data.cargo_id,
      setor: hierarquia.setor.slug,
      cargo: hierarquia.cargo.nome,
      conteudo: (parsed.data as any).conteudo ?? { resumo: '', modulos: [] },
      ownerId: user.id,
    });
    const saved = await this.repo.save(on);
    await this.notificationService.create(
      user.id,
      'Onboarding criado',
      `O onboarding "${saved.nome}" foi criado com sucesso.`,
    );
    return saved;
  }

  async atualizar(id: string, body: unknown, user: UserCtx) {
    const parsed = updateOnboardingBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    if (
      !ehRHouAdmin(user.role) &&
      (parsed.data.fornecedor_user_id !== undefined ||
        parsed.data.setor_id !== undefined ||
        parsed.data.cargo_id !== undefined)
    ) {
      throw new ForbiddenException(
        'Apenas RH ou admin pode alterar fornecedor, setor ou cargo.',
      );
    }

    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.id = :id', { id });
    aplicarEscopo(qb, user);
    const atual = await qb.getOne();
    if (!atual) throw new NotFoundException('Onboarding não encontrado.');

    let hierarquia: Hierarquia | null = null;
    if (
      parsed.data.fornecedor_user_id !== undefined ||
      parsed.data.setor_id !== undefined ||
      parsed.data.cargo_id !== undefined
    ) {
      try {
        hierarquia = await this.catalogo.resolverHierarquia({
          fornecedorUserId:
            parsed.data.fornecedor_user_id ?? atual.fornecedorUserId!,
          setorId: parsed.data.setor_id ?? atual.setorId!,
          cargoId: parsed.data.cargo_id ?? atual.cargoId!,
          senioridade: (parsed.data.senioridade ?? atual.senioridade) as Senioridade,
        });
      } catch (err) {
        throw new BadRequestException(
          err instanceof Error ? err.message : String(err),
        );
      }
    }

    const campos: Array<keyof typeof parsed.data> = [
      'nome', 'lider', 'descricao', 'data_inicio', 'senioridade',
      'fornecedor_user_id', 'setor_id', 'cargo_id', 'conteudo',
    ];

    const map: Record<string, string> = {
      fornecedor_user_id: 'fornecedorUserId',
      setor_id: 'setorId',
      cargo_id: 'cargoId',
      data_inicio: 'dataInicio',
    };

    for (const k of campos) {
      if (parsed.data[k] !== undefined) {
        const entityKey = map[k as string] ?? k;
        (atual as any)[entityKey] = parsed.data[k];
      }
    }

    if (hierarquia) {
      atual.setor = hierarquia.setor.slug;
      atual.cargo = hierarquia.cargo.nome;
    }

    const updateFields: Record<string, unknown> = { versao: () => 'versao + 1' };
    const params: Record<string, unknown> = {};

    for (const k of campos) {
      if (parsed.data[k] !== undefined) {
        const entityKey = map[k as string] ?? k;
        const value = (atual as any)[entityKey];
        if (entityKey === 'conteudo') {
          updateFields[entityKey] = () => `:conteudo_json::jsonb`;
          params['conteudo_json'] = JSON.stringify(value);
        } else {
          updateFields[entityKey] = value;
        }
      }
    }
    if (hierarquia) {
      updateFields['setor'] = atual.setor;
      updateFields['cargo'] = atual.cargo;
    }

    await this.repo
      .createQueryBuilder()
      .update(Onboarding)
      .set(updateFields as any)
      .setParameters(params)
      .where('id = :id', { id: atual.id })
      .execute();

    atual.versao = (atual.versao ?? 0) + 1;
    return atual;
  }

  async previewGerar(body: unknown, user: UserCtx) {
    if (!ehRHouAdmin(user.role)) {
      throw new ForbiddenException('Apenas RH ou admin pode gerar onboardings.');
    }
    const parsed = createOnboardingBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    let hierarquia;
    try {
      hierarquia = await this.catalogo.resolverHierarquia({
        fornecedorUserId: parsed.data.fornecedor_user_id,
        setorId: parsed.data.setor_id,
        cargoId: parsed.data.cargo_id,
        senioridade: parsed.data.senioridade as Senioridade,
      });
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }

    const catalogoH = await this.catalogo.carregarCatalogoHierarquico(hierarquia);
    const catalogoTxt = formatarCatalogoHierarquicoParaPrompt(catalogoH);

    const conteudo = await this.llm.gerarOnboarding({
      nome: parsed.data.nome,
      lider: parsed.data.lider,
      descricao: parsed.data.descricao,
      dataInicio: parsed.data.data_inicio,
      hierarquia,
      systemPrompt: montarSistemaGerador(catalogoTxt),
      hierarquiaPrompt: formatarHierarquiaParaPrompt(hierarquia),
    });

    return { dados: parsed.data, hierarquia, conteudo };
  }

  async previewPrompt(id: string, body: unknown, user: UserCtx) {
    if (!ehRHouAdmin(user.role)) {
      throw new ForbiddenException('Apenas RH ou admin pode editar onboardings via prompt.');
    }
    const parsed = promptBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const qb = this.repo
      .createQueryBuilder('o')
      .where('o.id = :id', { id });
    aplicarEscopo(qb, user);
    const atual = await qb.getOne();
    if (!atual) throw new NotFoundException('Onboarding não encontrado.');

    const conteudoAtual = onboardingConteudoSchema.safeParse(atual.conteudo);
    if (!conteudoAtual.success) {
      throw new BadRequestException('Conteúdo armazenado fora do schema.');
    }
    if (!atual.fornecedorUserId || !atual.setorId || !atual.cargoId) {
      throw new BadRequestException(
        'Este onboarding não tem hierarquia preenchida — edite os dados primeiro.',
      );
    }

    let hierarquia;
    try {
      hierarquia = await this.catalogo.resolverHierarquia({
        fornecedorUserId: atual.fornecedorUserId,
        setorId: atual.setorId,
        cargoId: atual.cargoId,
        senioridade: atual.senioridade as Senioridade,
      });
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : String(err),
      );
    }

    const catalogoH = await this.catalogo.carregarCatalogoHierarquico(hierarquia);
    const catalogoTxt = formatarCatalogoHierarquicoParaPrompt(catalogoH);

    const novo = await this.llm.aplicarPromptNoOnboarding({
      conteudoAtual: conteudoAtual.data,
      instrucao: parsed.data.prompt,
      systemPrompt: montarSistemaEditor(catalogoTxt),
      hierarquiaPrompt: formatarHierarquiaParaPrompt(hierarquia),
    });

    return { antes: conteudoAtual.data, depois: novo };
  }

  async atualizarProgresso(id: string, body: unknown, user: UserCtx) {
    const parsed = atualizarProgressoBody.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const on = await this.repo.findOne({
      where: ehRHouAdmin(user.role)
        ? { id }
        : [{ id, fornecedorUserId: user.id }, { id, ownerId: user.id }],
    });
    if (!on) throw new NotFoundException('Onboarding não encontrado.');

    const totalModulos = ((on.conteudo as any)?.modulos ?? []).length;
    if (parsed.data.modulo_idx >= totalModulos) {
      throw new BadRequestException(
        `Índice de módulo inválido (trilha tem ${totalModulos} módulos).`,
      );
    }

    const progressoAtual = (on.progresso ?? {}) as Record<string, unknown>;
    on.progresso = {
      ...progressoAtual,
      [String(parsed.data.modulo_idx)]: {
        status: parsed.data.status,
        atualizado_em: new Date().toISOString(),
        observacao: parsed.data.observacao,
      },
    };

    const saved = await this.repo.save(on);
    return { progresso: saved.progresso };
  }
}
