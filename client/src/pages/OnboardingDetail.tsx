import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Snackbar } from "@mui/material";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import {
  api,
  type Onboarding,
  type OnboardingConteudo,
  type Senioridade,
} from "../api/client";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { OnboardingEditor } from "../components/onboarding/OnboardingEditor";
import { OnboardingPromptReview } from "../components/onboarding/OnboardingPromptReview";
import { ProgressoOnboarding } from "../components/onboarding/ProgressoOnboarding";
import { PromptBox } from "../components/PromptBox";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../auth/AuthProvider";

const LABEL_SENIORIDADE: Record<Senioridade, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
};

type Pending = {
  prompt: string;
  antes: OnboardingConteudo;
  depois: OnboardingConteudo;
};

export function OnboardingDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { isRH, user } = useAuth();
  const [ob, setOb] = useState<Onboarding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
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

  if (loading) return <p className="text-text-muted">Carregando...</p>;
  if (error && !ob) return <Alert severity="error">{error}</Alert>;
  if (!ob) return null;

  const inReview = pending !== null;

  return (
    <div className="space-y-6">
      <Link
        to="/onboardings"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-500"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <PageHeader
        title={ob.nome}
        subtitle={
          <>
            {ob.cargo?.nome ?? "—"} · {ob.setor?.nome ?? "—"} ·{" "}
            {LABEL_SENIORIDADE[ob.senioridade]}
            {ob.fornecedor && (
              <> · líder: {ob.fornecedor.nome ?? "(sem nome)"}{" "}
                {ob.fornecedor.email && (
                  <span className="text-xs opacity-70">
                    ({ob.fornecedor.email})
                  </span>
                )}
              </>
            )}
            {ob.lider && <> · líder: {ob.lider}</>}
            <span className="text-xs">
              {" "}· v{ob.versao} · início{" "}
              {new Date(ob.data_inicio).toLocaleDateString()}
            </span>
          </>
        }
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setEditing((v) => !v)}
              startIcon={<Pencil className="size-4" />}
            >
              {editing ? "Sair da edição" : "Editar manualmente"}
            </Button>
            {isRH && (
              <Button
                variant="outlined"
                color="error"
                onClick={remove}
                startIcon={<Trash2 className="size-4" />}
              >
                Excluir
              </Button>
            )}
          </>
        }
      />

      {ob.descricao && (
        <Card>
          <p className="text-sm text-text-muted">{ob.descricao}</p>
        </Card>
      )}

      {!inReview && !editing && (ob.conteudo.modulos?.length ?? 0) > 0 && (
        <Card title="Acompanhamento">
          <ProgressoOnboarding
            onboardingId={ob.id}
            modulos={ob.conteudo.modulos}
            progresso={ob.progresso ?? {}}
            podeEditar={isRH || ob.fornecedor_user_id === user?.id}
            onChange={(novo) => setOb({ ...ob, progresso: novo })}
          />
        </Card>
      )}

      {!inReview && (
        <Card>
          {editing ? (
            <OnboardingEditor
              initial={ob.conteudo}
              onSave={saveManual}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <OnboardingView conteudo={ob.conteudo} />
          )}
        </Card>
      )}

      {!editing && !inReview && (
        <Card title="Editar por prompt">
          <PromptBox onSubmit={requestPreview} loading={previewing} />
          {error && <Alert severity="error" className="mt-3">{error}</Alert>}
        </Card>
      )}

      {inReview && pending && (
        <OnboardingPromptReview
          prompt={pending.prompt}
          antes={pending.antes}
          depois={pending.depois}
          regenerating={previewing}
          onRegenerate={regenerate}
          onApprove={approve}
          onDiscard={() => setPending(null)}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
      />
    </div>
  );
}
