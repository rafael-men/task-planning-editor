import { supabase } from "../lib/supabase";

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

export type Me = {
  id: string;
  email: string | null;
  nome: string | null;
  created_at: string;
};


export type Senioridade =
  | "estagio"
  | "junior"
  | "pleno"
  | "senior"
  | "especialista";

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

export type Fornecedor = { id: string; nome: string; descricao?: string | null };
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

export type OnboardingDados = {
  nome: string;
  fornecedor_id: string;
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
  fornecedor: Pick<Fornecedor, "id" | "nome"> | null;
  setor: Pick<Setor, "id" | "slug" | "nome"> | null;
  cargo: Pick<Cargo, "id" | "nome"> | null;
};

export type Onboarding = OnboardingSummary & {
  lider: string | null;
  descricao: string | null;
  conteudo: OnboardingConteudo;
  created_at: string;
  fornecedor: Fornecedor | null;
  setor: Setor | null;
  cargo: Cargo | null;
};

export type Hierarquia = {
  fornecedor: Fornecedor;
  setor: Setor;
  cargo: Cargo;
  senioridade: Senioridade;
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

const BASE = "/api";

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    ...(await authHeader()),
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  const res = await fetch(BASE + path, { ...init, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = typeof body.error === "string" ? body.error : JSON.stringify(body.error ?? body);
    } catch {
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  list: () => request<PlaybookSummary[]>("/playbooks"),
  get: (id: string) => request<Playbook>(`/playbooks/${id}`),
  create: (body: { nome: string; descricao?: string; conteudo?: Conteudo }) =>
    request<Playbook>("/playbooks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { nome?: string; descricao?: string | null; conteudo?: Conteudo }) =>
    request<Playbook>(`/playbooks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/playbooks/${id}`, { method: "DELETE" }),
  previewPrompt: (id: string, prompt: string) =>
    request<PromptPreview>(`/playbooks/${id}/prompt/preview`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  getMe: () => request<Me>("/me"),
  updateMe: (body: { nome?: string; email?: string }) =>
    request<Me>("/me", { method: "PATCH", body: JSON.stringify(body) }),


  listOnboardings: () => request<OnboardingSummary[]>("/onboardings"),
  getOnboarding: (id: string) => request<Onboarding>(`/onboardings/${id}`),
  previewOnboarding: (dados: OnboardingDados) =>
    request<OnboardingPreview>("/onboardings/preview", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  createOnboarding: (body: OnboardingDados & { conteudo: OnboardingConteudo }) =>
    request<Onboarding>("/onboardings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateOnboarding: (
    id: string,
    body: Partial<OnboardingDados> & { conteudo?: OnboardingConteudo }
  ) =>
    request<Onboarding>(`/onboardings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  removeOnboarding: (id: string) =>
    request<void>(`/onboardings/${id}`, { method: "DELETE" }),
  previewOnboardingPrompt: (id: string, prompt: string) =>
    request<OnboardingPromptPreview>(`/onboardings/${id}/prompt/preview`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),

  // catálogo / hierarquia
  listFornecedores: () => request<Fornecedor[]>("/catalogo/fornecedores"),
  listSetores: () => request<Setor[]>("/catalogo/setores"),
  listCargos: (setorId?: string) =>
    request<Cargo[]>(
      `/catalogo/cargos${setorId ? `?setor_id=${encodeURIComponent(setorId)}` : ""}`
    ),
};
