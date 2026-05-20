import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import type { PlaybookSummary } from "../api/client";
import { EmptyState } from "./ui/EmptyState";

export function RecentPlaybooksColumn({ items }: { items: PlaybookSummary[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-7 mx-auto" />}
        title="Nenhum playbook ainda"
        description="Crie um na aba Playbooks."
      />
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li key={p.id}>
          <Link
            to={`/playbooks/${p.id}`}
            className="block border border-border rounded-lg bg-surface hover:border-brand-500 transition-colors p-3"
          >
            <div className="flex items-center gap-2 text-text font-medium text-sm">
              <FileText className="size-4 text-brand-500" />
              <span className="truncate">{p.nome}</span>
            </div>
            {p.descricao && (
              <p className="text-xs text-text-muted mt-1 line-clamp-1">{p.descricao}</p>
            )}
            <p className="text-xs text-text-muted mt-1 opacity-70">
              v{p.versao} · {new Date(p.updated_at).toLocaleDateString()}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
