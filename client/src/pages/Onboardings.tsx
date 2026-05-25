import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, IconButton, Tooltip } from "@mui/material";
import { GraduationCap, Plus, Trash2, UserRound } from "lucide-react";
import { api, type OnboardingSummary, type Senioridade } from "../api/client";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { useAuth } from "../auth/AuthProvider";

const LABEL_SENIORIDADE: Record<Senioridade, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
};

function OnboardingCardItem({
  ob,
  onRemove,
  canRemove,
}: {
  ob: OnboardingSummary;
  onRemove: (id: string) => void;
  canRemove: boolean;
}) {
  return (
    <li className="group relative border border-border rounded-lg bg-surface hover:border-brand-500 transition-colors">
      <Link to={`/onboardings/${ob.id}`} className="block p-4">
        <div className="flex items-center gap-2 text-text font-medium">
          <UserRound className="size-4 text-brand-500" />
          {ob.nome}
        </div>
        <p className="text-sm text-text-muted mt-1">
          {ob.cargo?.nome ?? "—"} · {ob.setor?.nome ?? "—"}
          {ob.fornecedor && (
            <span className="opacity-70">
              {" "}· {ob.fornecedor.nome ?? "(sem nome)"}
            </span>
          )}
        </p>
        <p className="text-xs text-text-muted mt-2 opacity-80">
          {LABEL_SENIORIDADE[ob.senioridade]} · início{" "}
          {new Date(ob.data_inicio).toLocaleDateString()} · v{ob.versao}
        </p>
      </Link>
      {canRemove && (
        <Tooltip title="Excluir">
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              onRemove(ob.id);
            }}
            className="absolute! top-2 right-2 opacity-0 group-hover:opacity-100"
            aria-label="Excluir"
          >
            <Trash2 className="size-4 text-red-500" />
          </IconButton>
        </Tooltip>
      )}
    </li>
  );
}

export function Onboardings() {
  const [items, setItems] = useState<OnboardingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();
  const { isRH } = useAuth();

  useEffect(() => {
    setLoading(true);
    api
      .listOnboardings()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    const target = items.find((i) => i.id === id);
    if (!target) return;
    if (!confirm(`Excluir o onboarding de "${target.nome}"?`)) return;
    try {
      await api.removeOnboarding(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Onboardings"
        subtitle="Trilhas de treinamento para novas contratações."
        actions={
          isRH ? (
            <button
              type="button"
              onClick={() => nav("/onboardings/novo")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <Plus className="size-4" />
              Novo onboarding
            </button>
          ) : undefined
        }
      />

      <Card>
        {error && <Alert severity="error" className="mb-4">{error}</Alert>}
        {loading ? (
          <p className="text-text-muted">Carregando...</p>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="size-8 mx-auto" />}
            title="Nenhum onboarding ainda"
            description="Crie a primeira trilha clicando em 'Novo onboarding'."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map((ob) => (
              <OnboardingCardItem
                key={ob.id}
                ob={ob}
                onRemove={remove}
                canRemove={isRH}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
