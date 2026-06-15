import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Check, RefreshCw, Sparkles, X } from "lucide-react";
import type { OnboardingConteudo } from "../../api/client";
import { Card } from "../ui/Card";
import { DiffViewer } from "../DiffViewer";
import { OnboardingEditor } from "./OnboardingEditor";
import { OnboardingView } from "./OnboardingView";

type Props = {
  prompt: string;
  antes: OnboardingConteudo;
  depois: OnboardingConteudo;
  regenerating: boolean;
  onRegenerate: (novoPrompt: string) => Promise<void>;
  onApprove: (final: OnboardingConteudo) => Promise<void>;
  onDiscard: () => void;
};

type Tab = "preview" | "diff" | "edit";

export function OnboardingPromptReview({
  prompt,
  antes,
  depois,
  regenerating,
  onRegenerate,
  onApprove,
  onDiscard,
}: Props) {
  const [tab, setTab] = useState<Tab>("preview");
  const [tweak, setTweak] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleApprove(conteudo: OnboardingConteudo) {
    setSaving(true);
    setError(null);
    try {
      await onApprove(conteudo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function regen(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onRegenerate(tweak.trim() || prompt);
      setTweak("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-medium text-text inline-flex items-center gap-2">
              <Sparkles className="size-4 text-brand-500" /> Revisar alteração
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Prompt aplicado: <span className="italic">"{prompt}"</span>
            </p>
          </div>
          <div className="flex gap-1 p-1 bg-surface-2 border border-border rounded-lg">
            {(["preview", "diff", "edit"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  tab === t ? "bg-surface text-text" : "text-text-muted hover:text-text"
                }`}
              >
                {t === "preview" ? "Visualizar" : t === "diff" ? "Diff" : "Ajustar"}
              </button>
            ))}
          </div>
        </div>

        {tab === "preview" && <OnboardingView conteudo={depois} />}
        {tab === "diff" && <DiffViewer antes={antes} depois={depois} />}
        {tab === "edit" && (
          <OnboardingEditor
            initial={depois}
            onSave={handleApprove}
            onCancel={onDiscard}
          />
        )}
      </Card>

      {tab !== "edit" && (
        <Card>
          <form onSubmit={regen} className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Não ficou bom? Refine o prompt e gere uma nova proposta:
            </p>
            <TextField
              value={tweak}
              onChange={(e) => setTweak(e.target.value)}
              placeholder={`Refinar... (vazio = repetir "${prompt.slice(0, 40)}${prompt.length > 40 ? "…" : ""}")`}
              multiline
              minRows={2}
              fullWidth
              size="small"
              disabled={regenerating}
            />
            {error && <Alert severity="error">{error}</Alert>}
            <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
              <Button onClick={onDiscard} disabled={regenerating} startIcon={<X className="size-4" />}>
                Descartar
              </Button>
              <Button
                type="submit"
                variant="outlined"
                disabled={regenerating}
                startIcon={<RefreshCw className={`size-4 ${regenerating ? "animate-spin" : ""}`} />}
              >
                {regenerating ? "Gerando..." : "Gerar de novo"}
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleApprove(depois)}
                disabled={regenerating || saving}
                startIcon={saving ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
              >
                {saving ? "Salvando..." : "Aprovar e salvar"}
              </Button>
            </div>
          </form>
        </Card>
      )}

     
      <details className="text-xs text-text-muted">
        <summary className="cursor-pointer">Ver estado anterior</summary>
        <div className="mt-2">
          <OnboardingView conteudo={antes} />
        </div>
      </details>
    </div>
  );
}
