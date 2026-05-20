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

export type PromptResult = {
  playbook: Playbook;
  antes: Conteudo;
  depois: Conteudo;
};

export type Me = {
  id: string;
  email: string | null;
  nome: string | null;
  created_at: string;
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
      /* keep default */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // playbooks
  list: () => request<PlaybookSummary[]>("/playbooks"),
  get: (id: string) => request<Playbook>(`/playbooks/${id}`),
  create: (body: { nome: string; descricao?: string; conteudo?: Conteudo }) =>
    request<Playbook>("/playbooks", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { nome?: string; descricao?: string | null; conteudo?: Conteudo }) =>
    request<Playbook>(`/playbooks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) => request<void>(`/playbooks/${id}`, { method: "DELETE" }),
  applyPrompt: (id: string, prompt: string) =>
    request<PromptResult>(`/playbooks/${id}/prompt`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  // perfil
  getMe: () => request<Me>("/me"),
  updateMe: (body: { nome?: string; email?: string }) =>
    request<Me>("/me", { method: "PATCH", body: JSON.stringify(body) }),
};
