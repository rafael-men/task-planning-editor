import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Alert, Snackbar } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import {
  api,
  type Conteudo,
  type Playbook as PlaybookT,
} from "../api/client";
import { PlaybookView } from "../components/PlaybookView";
import { PlaybookEditor } from "../components/PlaybookEditor";
import { PromptBox } from "../components/PromptBox";
import { PromptReview } from "../components/PromptReview";
import { PlaybookHeader } from "../components/PlaybookHeader";
import { Card } from "../components/ui/Card";

type Pending = {
  prompt: string;
  antes: Conteudo;
  depois: Conteudo;
};

export function PlaybookPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [pb, setPb] = useState<PlaybookT | null>(null);
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
      .get(id)
      .then(setPb)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  async function requestPreview(prompt: string) {
    if (!id) return;
    setPreviewing(true);
    setError(null);
    try {
      const preview = await api.previewPrompt(id, prompt);
      setPending({ prompt, ...preview });
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
      const preview = await api.previewPrompt(id, novoPrompt);
      setPending({ prompt: novoPrompt, ...preview });
    } finally {
      setPreviewing(false);
    }
  }

  async function approve(data: {
    nome: string;
    descricao: string | null;
    conteudo: Conteudo;
  }) {
    if (!id) return;
    const updated = await api.update(id, data);
    setPb(updated);
    setPending(null);
    setToast(`Aprovado e salvo (v${updated.versao})`);
  }

  async function saveManual(data: {
    nome: string;
    descricao: string | null;
    conteudo: Conteudo;
  }) {
    if (!id) return;
    const updated = await api.update(id, data);
    setPb(updated);
    setEditing(false);
    setToast(`Salvo (v${updated.versao})`);
  }

  async function remove() {
    if (!id || !pb) return;
    if (!confirm(`Excluir "${pb.nome}"?`)) return;
    try {
      await api.remove(id);
      nav("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (loading) return <p className="text-text-muted">Carregando...</p>;
  if (error && !pb) return <Alert severity="error">{error}</Alert>;
  if (!pb) return null;

  const inReview = pending !== null;

  return (
    <div className="space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-500"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <PlaybookHeader
        pb={pb}
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
        onRemove={remove}
      />

      {!inReview && (
        <Card>
          {editing ? (
            <PlaybookEditor
              initialNome={pb.nome}
              initialDescricao={pb.descricao ?? ""}
              initialConteudo={pb.conteudo}
              onSave={saveManual}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <PlaybookView conteudo={pb.conteudo} />
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
        <PromptReview
          prompt={pending.prompt}
          antes={pending.antes}
          depois={pending.depois}
          nome={pb.nome}
          descricao={pb.descricao}
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
