import { request } from "../request";
import type {
  Conteudo,
  Playbook,
  PlaybookSummary,
  PromptPreview,
} from "../types";

export const playbooksApi = {
  list: () => request<PlaybookSummary[]>("/playbooks"),
  get: (id: string) => request<Playbook>(`/playbooks/${id}`),
  create: (body: { nome: string; descricao?: string; conteudo?: Conteudo; prompt?: string }) =>
    request<Playbook>("/playbooks", { method: "POST", body: JSON.stringify(body) }),
  update: (
    id: string,
    body: { nome?: string; descricao?: string | null; conteudo?: Conteudo }
  ) =>
    request<Playbook>(`/playbooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<void>(`/playbooks/${id}`, { method: "DELETE" }),
  previewPrompt: (id: string, prompt: string) =>
    request<PromptPreview>(`/playbooks/${id}/prompt/preview`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
};
