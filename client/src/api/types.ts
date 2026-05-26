
export type Secao = {
  titulo: string;
  ferramenta: string;
  passos: string[];
};

export type Conteudo = { secoes: Secao[] };

export type PlaybookSummary = {
  id: string;
  nome: string;
  descricao: string | null;
  versao: number;
  updated_at: string;
};

export type Playbook = PlaybookSummary & {
  conteudo: Conteudo;
  created_at: string;
};

export type PromptPreview = {
  antes: Conteudo;
  depois: Conteudo;
};


export type Role = "admin" | "rh" | "lider";

export type Me = {
  id: string;
  email: string | null;
  nome: string | null;
  created_at: string;
  role: Role;
  setor_id: string | null;
};

export type PerfilUsuario = {
  user_id: string;
  role: Role;
  setor_id: string | null;
  email: string | null;
  nome: string | null;
  updated_at: string;
  setor: { id: string; slug: string; nome: string } | null;
};


export type Senioridade =
  | "estagio"
  | "junior"
  | "pleno"
  | "senior"
  | "especialista";

export type Setor = {
  id: string;
  slug: string;
  nome: string;
  descricao?: string | null;
};

export type Cargo = {
  id: string;
  setor_id: string;
  nome: string;
  descricao?: string | null;
};


export type Fornecedor = {
  id: string;
  nome: string | null;
  email: string | null;
};

export type Hierarquia = {
  fornecedor: Fornecedor;
  setor: Setor;
  cargo: Cargo;
  senioridade: Senioridade;
};

export type Curso = { nome: string; link?: string };

export type Modulo = {
  titulo: string;
  ferramenta: string;
  objetivo: string;
  duracao_dias: number;
  data_inicio: string;
  data_fim: string;
  atividades: string[];
  cursos: Curso[];
  avaliacao?: { tipo: string; criterios: string[] };
};

export type OnboardingConteudo = {
  resumo: string;
  modulos: Modulo[];
};

export type StatusModulo = "pendente" | "em_andamento" | "concluido";

export type ProgressoModulo = {
  status: StatusModulo;
  atualizado_em?: string;
  observacao?: string;
};


export type Progresso = Record<string, ProgressoModulo>;

export type OnboardingDados = {
  nome: string;
  fornecedor_user_id: string;
  setor_id: string;
  cargo_id: string;
  senioridade: Senioridade;
  lider?: string;
  descricao?: string;
  data_inicio: string;
};

export type OnboardingSummary = {
  id: string;
  nome: string;
  senioridade: Senioridade;
  data_inicio: string;
  versao: number;
  updated_at: string;
  fornecedor_user_id: string | null;
  fornecedor: Fornecedor | null;
  setor: Pick<Setor, "id" | "slug" | "nome"> | null;
  cargo: Pick<Cargo, "id" | "nome"> | null;
};

export type Onboarding = OnboardingSummary & {
  lider: string | null;
  descricao: string | null;
  conteudo: OnboardingConteudo;
  progresso: Progresso;
  created_at: string;
  fornecedor: Fornecedor | null;
  setor: Setor | null;
  cargo: Cargo | null;
};

export type OnboardingPreview = {
  dados: OnboardingDados;
  hierarquia: Hierarquia;
  conteudo: OnboardingConteudo;
};

export type OnboardingPromptPreview = {
  antes: OnboardingConteudo;
  depois: OnboardingConteudo;
};
