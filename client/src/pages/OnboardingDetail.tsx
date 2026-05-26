import { Link, useParams } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { OnboardingEditor } from "../components/onboarding/OnboardingEditor";
import { OnboardingPromptReview } from "../components/onboarding/OnboardingPromptReview";
import { ProgressoOnboarding } from "../components/onboarding/ProgressoOnboarding";
import { PromptBox } from "../components/PromptBox";
import { Card } from "../components/ui/Card";
import { useAuth } from "../auth/AuthProvider";
import { OnboardingHeader } from "./onboarding-detail/OnboardingHeader";
import { useOnboardingDetail } from "./onboarding-detail/useOnboardingDetail";

export function OnboardingDetail() {
  const { id } = useParams<{ id: string }>();
  const { isRH, user } = useAuth();
  const {
    ob,
    setOb,
    loading,
    error,
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
  } = useOnboardingDetail(id);

  if (loading) return <p className="text-text-muted">Carregando...</p>;
  if (error && !ob) return <Alert severity="error">{error}</Alert>;
  if (!ob) return null;

  const inReview = pending !== null;
  const podeAcompanhar = isRH || ob.fornecedor_user_id === user?.id;

  return (
    <div className="space-y-6">
      <Link
        to="/onboardings"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-500"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <OnboardingHeader
        ob={ob}
        editing={editing}
        podeExcluir={isRH}
        onToggleEdit={() => setEditing((v) => !v)}
        onRemove={remove}
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
            podeEditar={podeAcompanhar}
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
