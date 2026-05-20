import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Check, RefreshCw, Sparkles, X } from "lucide-react";
import type { Conteudo } from "../api/client";
import { Card } from "./ui/Card";
import { DiffViewer } from "./DiffViewer";
import { PlaybookEditor } from "./PlaybookEditor";

type Props = {
  prompt: string;
  antes: Conteudo;
  depois: Conteudo;
  nome: string;
  descricao: string | null;
  onRegenerate: (novoPrompt: string) => Promise<void>;
  onApprove: (final: {
    nome: string;
    descricao: string | null;
    conteudo: Conteudo;
  }) => Promise<void>;
  onDiscard: () => void;
  regenerating: boolean;
};

export function PromptReview({
  prompt,
  antes,
  depois,
  nome,
  descricao,
  onRegenerate,
  onApprove,
  onDiscard,
  regenerating,
}: Props) {
  const [tweakPrompt, setTweakPrompt] = useState("");
  const [tab, setTab] = useState<"diff" | "edit">("diff");
  const [error, setError] = useState<string | null>(null);

  async function regen(e: React.FormEvent) {
    e.preventDefault();
    const finalPrompt = tweakPrompt.trim() || prompt;
    setError(null);
    try {
      await onRegenerate(finalPrompt);
      setTweakPrompt("");
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
            <button
              type="button"
              onClick={() => setTab("diff")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                tab === "diff" ? "bg-surface text-text" : "text-text-muted hover:text-text"
              }`}
            >
              Diff
            </button>
            <button
              type="button"
              onClick={() => setTab("edit")}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                tab === "edit" ? "bg-surface text-text" : "text-text-muted hover:text-text"
              }`}
            >
              Ajustar à mão
            </button>
          </div>
        </div>

        {tab === "diff" ? (
          <DiffViewer antes={antes} depois={depois} />
        ) : (
          <PlaybookEditor
            initialNome={nome}
            initialDescricao={descricao ?? ""}
            initialConteudo={depois}
            onSave={async (data) => {
              await onApprove(data);
            }}
            onCancel={onDiscard}
          />
        )}
      </Card>

      {tab === "diff" && (
        <Card>
          <form onSubmit={regen} className="flex flex-col gap-3">
            <p className="text-sm text-text-muted">
              Não ficou bom? Refine o prompt e gere uma nova proposta:
            </p>
            <TextField
              value={tweakPrompt}
              onChange={(e) => setTweakPrompt(e.target.value)}
              placeholder={`Refinar... (vazio = repetir "${prompt.slice(0, 40)}${prompt.length > 40 ? "…" : ""}")`}
              multiline
              minRows={2}
              fullWidth
              disabled={regenerating}
              size="small"
            />
            {error && <Alert severity="error">{error}</Alert>}
            <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-border">
              <Button
                onClick={onDiscard}
                disabled={regenerating}
                startIcon={<X className="size-4" />}
              >
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
                onClick={() => onApprove({ nome, descricao, conteudo: depois })}
                disabled={regenerating}
                startIcon={<Check className="size-4" />}
              >
                Aprovar e salvar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
