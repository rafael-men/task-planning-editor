import { request } from "../request";
import type {
  Onboarding,
  OnboardingConteudo,
  OnboardingDados,
  OnboardingPreview,
  OnboardingPromptPreview,
  OnboardingSummary,
  Progresso,
  StatusModulo,
} from "../types";

export const onboardingsApi = {
  list: () => request<OnboardingSummary[]>("/onboardings"),
  get: (id: string) => request<Onboarding>(`/onboardings/${id}`),
  preview: (dados: OnboardingDados) =>
    request<OnboardingPreview>("/onboardings/preview", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  create: (body: OnboardingDados & { conteudo: OnboardingConteudo }) =>
    request<Onboarding>("/onboardings", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (
    id: string,
    body: Partial<OnboardingDados> & { conteudo?: OnboardingConteudo }
  ) =>
    request<Onboarding>(`/onboardings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (id: string) =>
    request<void>(`/onboardings/${id}`, { method: "DELETE" }),
  previewPrompt: (id: string, prompt: string) =>
    request<OnboardingPromptPreview>(`/onboardings/${id}/prompt/preview`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  atualizarProgresso: (
    id: string,
    body: { modulo_idx: number; status: StatusModulo; observacao?: string }
  ) =>
    request<{ progresso: Progresso }>(`/onboardings/${id}/progresso`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};
