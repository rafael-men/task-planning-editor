import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cargo } from '../models/cargo.entity';
import { CursoAlocacao } from '../models/curso-alocacao.entity';
import { Curso } from '../models/curso.entity';
import { FerramentaAlocacao } from '../models/ferramenta-alocacao.entity';
import { Ferramenta } from '../models/ferramenta.entity';
import { Setor } from '../models/setor.entity';
import { SupabaseService } from './supabase.service';
import type {
  AlocacaoFerramenta,
  CatalogoHierarquico,
  Hierarquia,
  Senioridade,
} from '../utils/catalogo-prompts';

const PRIORIDADE: Record<string, number> = {
  cargo: 3,
  setor: 2,
  senioridade: 1,
  global: 0,
};

const ORDEM_NIVEL: Record<Senioridade, number> = {
  estagio: 0,
  junior: 1,
  pleno: 2,
  senior: 3,
  especialista: 4,
};

@Injectable()
export class CatalogoService {
  constructor(
    private readonly supabase: SupabaseService,
    @InjectRepository(Setor) private readonly setorRepo: Repository<Setor>,
    @InjectRepository(Cargo) private readonly cargoRepo: Repository<Cargo>,
    @InjectRepository(Ferramenta)
    private readonly ferramentaRepo: Repository<Ferramenta>,
    @InjectRepository(Curso) private readonly cursoRepo: Repository<Curso>,
    @InjectRepository(FerramentaAlocacao)
    private readonly ferramentaAlocRepo: Repository<FerramentaAlocacao>,
    @InjectRepository(CursoAlocacao)
    private readonly cursoAlocRepo: Repository<CursoAlocacao>,
  ) {}

  async resolverHierarquia(input: {
    fornecedorUserId: string;
    setorId: string;
    cargoId: string;
    senioridade: Senioridade;
  }): Promise<Hierarquia> {
    const [usuario, setor, cargo] = await Promise.all([
      this.supabase.getUserById(input.fornecedorUserId),
      this.setorRepo.findOne({ where: { id: input.setorId } }),
      this.cargoRepo.findOne({ where: { id: input.cargoId } }),
    ]);

    if (!usuario) throw new Error('Fornecedor (usuário) não encontrado.');
    if (!setor) throw new Error('Setor não encontrado.');
    if (!cargo) throw new Error('Cargo não encontrado.');
    if (cargo.setorId !== setor.id) {
      throw new Error('Cargo escolhido não pertence ao setor informado.');
    }

    const nome =
      (usuario.user_metadata?.nome as string | undefined) ?? null;

    return {
      fornecedor: { id: usuario.id, nome, email: usuario.email ?? null },
      setor: {
        id: setor.id,
        slug: setor.slug,
        nome: setor.nome,
        descricao: setor.descricao,
      },
      cargo: {
        id: cargo.id,
        setor_id: cargo.setorId,
        nome: cargo.nome,
        descricao: cargo.descricao,
      },
      senioridade: input.senioridade,
    };
  }

  async carregarCatalogoHierarquico(
    hierarquia: Hierarquia,
  ): Promise<CatalogoHierarquico> {
    const [alocs, cursoAlocs] = await Promise.all([
      this.ferramentaAlocRepo.find(),
      this.cursoAlocRepo.find(),
    ]);

    const fazMatch = (
      a: FerramentaAlocacao | CursoAlocacao,
      h: Hierarquia,
    ): boolean => {
      if (a.escopo === 'global') return true;
      if (a.escopo === 'setor') return a.alvoId === h.setor.id;
      if (a.escopo === 'cargo') return a.alvoId === h.cargo.id;
      if (a.escopo === 'senioridade') return a.alvoSlug === h.senioridade;
      return false;
    };

    const alocsMatch = alocs.filter((a) => fazMatch(a, hierarquia));
    if (alocsMatch.length === 0) {
      return { global: [], setor: [], cargo: [], senioridade: [] };
    }

    const ferramentaIds = [...new Set(alocsMatch.map((a) => a.ferramentaId))];

    const [ferramentas, cursos] = await Promise.all([
      this.ferramentaRepo.find({ where: { id: In(ferramentaIds) } }),
      this.cursoRepo.find({ where: { ferramentaId: In(ferramentaIds) } }),
    ]);

    const ferramentaPorId = new Map(ferramentas.map((f) => [f.id, f]));

    const cursosPorFerramenta = new Map<string, Curso[]>();
    for (const c of cursos) {
      if (!c.ferramentaId) continue;
      const arr = cursosPorFerramenta.get(c.ferramentaId) ?? [];
      arr.push(c);
      cursosPorFerramenta.set(c.ferramentaId, arr);
    }

    const cursosAlocMatch = cursoAlocs.filter((c) => fazMatch(c, hierarquia));
    const cursoIdsAlocados = new Set(cursosAlocMatch.map((c) => c.cursoId));
    if (cursoIdsAlocados.size > 0) {
      for (const [fid, lista] of cursosPorFerramenta) {
        const filtrados = lista.filter((c) => cursoIdsAlocados.has(c.id));
        if (filtrados.length > 0) cursosPorFerramenta.set(fid, filtrados);
      }
    }

    const escolhida = new Map<string, FerramentaAlocacao>();
    for (const a of alocsMatch) {
      const atual = escolhida.get(a.ferramentaId);
      const subir =
        !atual ||
        PRIORIDADE[a.escopo] > PRIORIDADE[atual.escopo] ||
        (PRIORIDADE[a.escopo] === PRIORIDADE[atual.escopo] &&
          a.obrigatoriedade === 'obrigatoria' &&
          atual.obrigatoriedade === 'sugerida');
      if (subir) escolhida.set(a.ferramentaId, a);
    }

    const buckets: CatalogoHierarquico = {
      global: [],
      setor: [],
      cargo: [],
      senioridade: [],
    };

    for (const a of escolhida.values()) {
      const f = ferramentaPorId.get(a.ferramentaId);
      if (!f) continue;
      const item: AlocacaoFerramenta = {
        ferramenta: { id: f.id, nome: f.nome, descricao: f.descricao },
        escopo: a.escopo,
        obrigatoriedade: a.obrigatoriedade,
        cursos: (cursosPorFerramenta.get(f.id) ?? []).map((c) => ({
          id: c.id,
          nome: c.nome,
          link: c.link,
          duracao_horas: c.duracaoHoras,
          formato: c.formato,
        })),
      };
      buckets[a.escopo].push(item);
    }

    return buckets;
  }

  async lidarSetores() {
    return this.setorRepo.find({ order: { nome: 'ASC' } });
  }

  async lidarCargos(setorId?: string) {
    const where = setorId ? { setorId } : {};
    return this.cargoRepo.find({ where, order: { nome: 'ASC' } });
  }

  async lidarFerramentas(setor?: string) {
    const all = await this.ferramentaRepo.find({ order: { nome: 'ASC' } });
    if (!setor) return all;
    const tag = setor.toLowerCase().trim();
    return all.filter((f) =>
      f.setores.some((s) => s.toLowerCase() === tag),
    );
  }
}
