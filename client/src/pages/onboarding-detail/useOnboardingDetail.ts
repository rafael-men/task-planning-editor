import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  type Onboarding,
  type OnboardingConteudo,
} from "../../api/client";

export type PendingReview = {
  prompt: string;
  antes: OnboardingConteudo;
  depois: OnboardingConteudo;
};


export function useOnboardingDetail(id: string | undefined) {
  const nav = useNavigate();
  const [ob, setOb] = useState<Onboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [pending, setPending] = useState<PendingReview | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .getOnboarding(id)
      .then(setOb)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function requestPreview(prompt: string) {
    if (!id) return;
    setPreviewing(true);
    setError(null);
    try {
      const result = await api.previewOnboardingPrompt(id, prompt);
      setPending({ prompt, ...result });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPreviewing(false);
    }
  }

  async function regenerate(novoPrompt: string) {
    if (!id) return;
    setPreviewing(true);
    try {
      const result = await api.previewOnboardingPrompt(id, novoPrompt);
      setPending({ prompt: novoPrompt, ...result });
    } finally {
      setPreviewing(false);
    }
  }

  async function approve(final: OnboardingConteudo) {
    if (!id) return;
    const updated = await api.updateOnboarding(id, { conteudo: final });
    setOb(updated);
    setPending(null);
    setToast(`Aprovado (v${updated.versao})`);
  }

  async function saveManual(c: OnboardingConteudo) {
    if (!id) return;
    const updated = await api.updateOnboarding(id, { conteudo: c });
    setOb(updated);
    setEditing(false);
    setToast(`Salvo (v${updated.versao})`);
  }

  async function remove() {
    if (!id || !ob) return;
    if (!confirm(`Excluir onboarding de "${ob.nome}"?`)) return;
    try {
      await api.removeOnboarding(id);
      nav("/onboardings");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return {
    ob,
    setOb,
    loading,
    error,
    setError,
    editing,
    setEditing,
    previewing,
    pending,
    setPending,
    toast,
    setToast,
    requestPreview,
    regenerate,
    approve,
    saveManual,
    remove,
  };
}
