import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "@mui/material";
import { FileText, GraduationCap, Plus } from "lucide-react";
import {
  api,
  type OnboardingSummary,
  type PlaybookSummary,
} from "../api/client";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { RecentPlaybooksColumn } from "../components/RecentPlaybooksColumn";
import { RecentOnboardingsColumn } from "../components/RecentOnboardingsColumn";

const MAX = 5;

export function Home() {
  const [playbooks, setPlaybooks] = useState<PlaybookSummary[]>([]);
  const [onboardings, setOnboardings] = useState<OnboardingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.list(), api.listOnboardings()])
      .then(([pbs, obs]) => {
        setPlaybooks(pbs.slice(0, MAX));
        setOnboardings(obs.slice(0, MAX));
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atividade recente"
        subtitle="Os últimos playbooks e onboardings que você editou."
      />

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <FileText className="size-4 text-brand-500" />
              Playbooks recentes
            </span>
          }
          actions={
            <Link
              to="/playbooks"
              className="text-xs text-brand-500 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="size-3.5" /> Novo / ver todos
            </Link>
          }
        >
          {loading ? (
            <p className="text-text-muted text-sm">Carregando...</p>
          ) : (
            <RecentPlaybooksColumn items={playbooks} />
          )}
        </Card>

        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <GraduationCap className="size-4 text-brand-500" />
              Onboardings recentes
            </span>
          }
          actions={
            <Link
              to="/onboardings"
              className="text-xs text-brand-500 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="size-3.5" /> Novo / ver todos
            </Link>
          }
        >
          {loading ? (
            <p className="text-text-muted text-sm">Carregando...</p>
          ) : (
            <RecentOnboardingsColumn items={onboardings} />
          )}
        </Card>
      </div>
    </div>
  );
}
