import { z } from 'zod';

export const passoSchema = z.string().min(1);

export const secaoSchema = z.object({
  titulo: z.string().min(1),
  ferramenta: z.string().optional().default(''),
  passos: z.array(passoSchema).default([]),
});

export const conteudoSchema = z.object({
  secoes: z.array(secaoSchema).default([]),
});

export type Conteudo = z.infer<typeof conteudoSchema>;

export const senioridadeEnum = z.enum([
  'estagio',
  'junior',
  'pleno',
  'senior',
  'especialista',
]);

export type Senioridade = z.infer<typeof senioridadeEnum>;

export const avaliacaoSchema = z.object({
  tipo: z.string().min(1),
  criterios: z.array(z.string()).default([]),
});

export const cursoItemSchema = z.object({
  nome: z.string().min(1),
  link: z.string().optional(),
});

export const moduloSchema = z.object({
  titulo: z.string().min(1),
  ferramenta: z.string().optional().default(''),
  objetivo: z.string().optional().default(''),
  duracao_dias: z.number().int().min(0).default(0),
  data_inicio: z.string().optional().default(''),
  data_fim: z.string().optional().default(''),
  atividades: z.array(z.string()).default([]),
  cursos: z.array(cursoItemSchema).default([]),
  avaliacao: avaliacaoSchema.optional(),
});

export const onboardingConteudoSchema = z.object({
  resumo: z.string().optional().default(''),
  modulos: z.array(moduloSchema).default([]),
});

export type OnboardingConteudo = z.infer<typeof onboardingConteudoSchema>;

export const statusModuloEnum = z.enum(['pendente', 'em_andamento', 'concluido']);

export const progressoModuloSchema = z.object({
  status: statusModuloEnum,
  atualizado_em: z.string().optional(),
  observacao: z.string().max(2000).optional(),
});

export const progressoSchema = z.record(z.string(), progressoModuloSchema);
export type Progresso = z.infer<typeof progressoSchema>;

export const atualizarProgressoBody = z.object({
  modulo_idx: z.number().int().min(0),
  status: statusModuloEnum,
  observacao: z.string().max(2000).optional(),
});

const uuid = z.string().uuid();

export const createOnboardingBody = z.object({
  nome: z.string().min(1).max(120),
  fornecedor_user_id: uuid,
  setor_id: uuid,
  cargo_id: uuid,
  senioridade: senioridadeEnum,
  lider: z.string().max(120).optional(),
  descricao: z.string().max(2000).optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD'),
});

export const updateOnboardingBody = z.object({
  nome: z.string().min(1).max(120).optional(),
  fornecedor_user_id: uuid.optional(),
  setor_id: uuid.optional(),
  cargo_id: uuid.optional(),
  senioridade: senioridadeEnum.optional(),
  lider: z.string().max(120).nullable().optional(),
  descricao: z.string().max(2000).nullable().optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  conteudo: onboardingConteudoSchema.optional(),
});

export const createPlaybookBody = z.object({
  nome: z.string().min(1).max(200),
  descricao: z.string().max(2000).optional(),
  conteudo: conteudoSchema.optional(),
});

export const updatePlaybookBody = z.object({
  nome: z.string().min(1).max(200).optional(),
  descricao: z.string().max(2000).nullable().optional(),
  conteudo: conteudoSchema.optional(),
});

export const promptBody = z.object({
  prompt: z.string().min(3).max(4000),
});
