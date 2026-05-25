import type { Senioridade } from "../../types.js";


export type Fornecedor = {
  id: string;
  nome: string | null;
  email: string | null;
};
export type Setor = { id: string; slug: string; nome: string; descricao: string | null };
export type Cargo = {
  id: string;
  setor_id: string;
  nome: string;
  descricao: string | null;
};

export type Hierarquia = {
  fornecedor: Fornecedor;
  setor: Setor;
  cargo: Cargo;
  senioridade: Senioridade;
};

export type FerramentaRow = {
  id: string;
  nome: string;
  descricao: string;
  setores: string[];
  nivel_minimo: Senioridade;
};

export type CursoRow = {
  id: string;
  nome: string;
  link: string | null;
  ferramenta_id: string | null;
  setores: string[];
  duracao_horas: number | null;
  formato: string | null;
};

export type Escopo = "global" | "setor" | "cargo" | "senioridade";
export type Obrigatoriedade = "obrigatoria" | "sugerida";

export type AlocacaoFerramenta = {
  ferramenta: FerramentaRow;
  escopo: Escopo;
  obrigatoriedade: Obrigatoriedade;
  cursos: CursoRow[];
};

export type CatalogoHierarquico = {
  global: AlocacaoFerramenta[];
  setor: AlocacaoFerramenta[];
  cargo: AlocacaoFerramenta[];
  senioridade: AlocacaoFerramenta[];
};

export const ORDEM_NIVEL: Record<Senioridade, number> = {
  estagio: 0,
  junior: 1,
  pleno: 2,
  senior: 3,
  especialista: 4,
};
