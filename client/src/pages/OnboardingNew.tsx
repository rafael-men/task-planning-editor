import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, CircularProgress } from "@mui/material";
import { ArrowLeft, Check, RefreshCw, X } from "lucide-react";
import {
  api,
  type Hierarquia,
  type OnboardingConteudo,
  type OnboardingDados,
} from "../api/client";
import { OnboardingForm } from "../components/onboarding/OnboardingForm";
import { OnboardingView } from "../components/onboarding/OnboardingView";
import { OnboardingEditor } from "../components/onboarding/OnboardingEditor";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";

type Step = "form" | "loading" | "review";
type Tab = "preview" | "edit";

export function OnboardingNew() {
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [tab, setTab] = useState<Tab>("preview");
  const [dados, setDados] = useState<OnboardingDados | null>(null);
  const [hierarquia, setHierarquia] = useState<Hierarquia | null>(null);
  const [conteudo, setConteudo] = useState<OnboardingConteudo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function gerar(d: OnboardingDados) {
    setStep("loading");
    setError(null);
    try {
      const result = await api.previewOnboarding(d);
      setDados(result.dados);
      setHierarquia(result.hierarquia);
      setConteudo(result.conteudo);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("form");
    }
  }

  async function regerar() {
    if (!dados) return;
    setStep("loading");
    setError(null);
    try {
      const result = await api.previewOnboarding(dados);
      setHierarquia(result.hierarquia);
      setConteudo(result.conteudo);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStep("review");
    }
  }

  async function aprovar(final: OnboardingConteudo) {
    if (!dados) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await api.createOnboarding({ ...dados, conteudo: final });
      nav(`/onboardings/${saved.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to="/onboardings"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-500"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <PageHeader
        title="Novo onboarding"
        subtitle="Preencha os dados e a IA gera a trilha. Você pode revisar e ajustar antes de salvar."
      />

      {error && <Alert severity="error">{error}</Alert>}

      {step === "form" && (
        <Card>
          <OnboardingForm onSubmit={gerar} />
        </Card>
      )}

      {step === "loading" && (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <CircularProgress />
            <p className="text-text-muted text-sm">
              Gerando trilha com IA... isso pode levar alguns segundos.
            </p>
          </div>
        </Card>
      )}

      {step === "review" && conteudo && dados && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-medium text-text">
                  Trilha proposta para {dados.nome}
                </h2>
                <p className="text-xs text-text-muted mt-1">
                  {hierarquia?.cargo.nome ?? "—"} ·{" "}
                  {hierarquia?.setor.nome ?? "—"} ·{" "}
                  {hierarquia?.fornecedor.nome ?? "(sem nome)"} · início{" "}
                  {new Date(dados.data_inicio).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-lg">
                <button
                  type="button"
                  onClick={() => setTab("preview")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    tab === "preview" ? "bg-surface text-text" : "text-text-muted"
                  }`}
                >
                  Visualizar
                </button>
                <button
                  type="button"
                  onClick={() => setTab("edit")}
                  className={`px-3 py-1 text-sm rounded-md ${
                    tab === "edit" ? "bg-surface text-text" : "text-text-muted"
                  }`}
                >
                  Ajustar à mão
                </button>
              </div>
            </div>

            {tab === "preview" ? (
              <OnboardingView conteudo={conteudo} />
            ) : (
              <OnboardingEditor
                initial={conteudo}
                onSave={async (c) => {
                  setConteudo(c);
                  setTab("preview");
                }}
                onCancel={() => setTab("preview")}
              />
            )}
          </Card>

          {tab === "preview" && (
            <Card>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button
                  onClick={() => setStep("form")}
                  disabled={saving}
                  startIcon={<X className="size-4" />}
                >
                  Descartar
                </Button>
                <Button
                  variant="outlined"
                  onClick={regerar}
                  disabled={saving}
                  startIcon={<RefreshCw className="size-4" />}
                >
                  Gerar de novo
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => aprovar(conteudo)}
                  disabled={saving}
                  startIcon={<Check className="size-4" />}
                >
                  {saving ? "Salvando..." : "Aprovar e salvar"}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
