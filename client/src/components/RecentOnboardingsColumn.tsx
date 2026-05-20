import { Link } from "react-router-dom";
import { GraduationCap, UserRound } from "lucide-react";
import type { OnboardingSummary, Senioridade } from "../api/client";
import { EmptyState } from "./ui/EmptyState";

const LABEL: Record<Senioridade, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
};

export function RecentOnboardingsColumn({ items }: { items: OnboardingSummary[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-7 mx-auto" />}
        title="Nenhum onboarding ainda"
        description="Crie um na aba Onboardings."
      />
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((ob) => (
        <li key={ob.id}>
          <Link
            to={`/onboardings/${ob.id}`}
            className="block border border-border rounded-lg bg-surface hover:border-brand-500 transition-colors p-3"
          >
            <div className="flex items-center gap-2 text-text font-medium text-sm">
              <UserRound className="size-4 text-brand-500" />
              <span className="truncate">{ob.nome}</span>
            </div>
            <p className="text-xs text-text-muted mt-1 truncate">
              {ob.cargo} · {ob.setor}
            </p>
            <p className="text-xs text-text-muted mt-1 opacity-70">
              {LABEL[ob.senioridade]} · {new Date(ob.updated_at).toLocaleDateString()}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
