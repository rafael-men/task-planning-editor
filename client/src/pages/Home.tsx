import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert } from "@mui/material";
import { FileText } from "lucide-react";
import { api, type PlaybookSummary } from "../api/client";
import { PlaybookList } from "../components/PlaybookList";
import { NewPlaybookForm } from "../components/NewPlaybookForm";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

export function Home() {
  const [items, setItems] = useState<PlaybookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    api
      .list()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function create(data: { nome: string; descricao?: string }) {
    try {
      const p = await api.create({ ...data, conteudo: { secoes: [] } });
      nav(`/playbooks/${p.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    if (!confirm(`Excluir "${target.nome}"?`)) return;
    try {
      await api.remove(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Seus playbooks"
        subtitle="Crie playbooks e edite-os por linguagem natural ou manualmente."
      />

      <Card title="Novo playbook">
        <NewPlaybookForm onCreate={create} />
      </Card>

      <section>
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        {loading ? (
          <p className="text-text-muted">Carregando...</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-8 mx-auto" />}
            title="Nenhum playbook ainda"
            description="Crie o primeiro acima."
          />
        ) : (
          <PlaybookList items={items} onRemove={remove} />
        )}
      </section>
    </div>
  );
}
