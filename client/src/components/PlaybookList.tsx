import { Link } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import { FileText, Trash2 } from "lucide-react";
import type { PlaybookSummary } from "../api/client";

type ItemProps = {
  pb: PlaybookSummary;
  onRemove: (id: string) => void;
};

function PlaybookListItem({ pb, onRemove }: ItemProps) {
  return (
    <li className="group relative border border-border rounded-lg bg-surface hover:border-brand-500 transition-colors">
      <Link to={`/playbooks/${pb.id}`} className="block p-4">
        <div className="flex items-center gap-2 text-text font-medium">
          <FileText className="size-4 text-brand-500" />
          {pb.nome}
        </div>
        {pb.descricao && (
          <p className="text-sm text-text-muted mt-1 line-clamp-2">{pb.descricao}</p>
        )}
        <p className="text-xs text-text-muted mt-2 opacity-70">
          v{pb.versao} · {new Date(pb.updated_at).toLocaleString()}
        </p>
      </Link>
      <Tooltip title="Excluir">
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            onRemove(pb.id);
          }}
          className="absolute! top-2 right-2 opacity-0 group-hover:opacity-100"
          aria-label="Excluir"
        >
          <Trash2 className="size-4 text-red-500" />
        </IconButton>
      </Tooltip>
    </li>
  );
}

export function PlaybookList({
  items,
  onRemove,
}: {
  items: PlaybookSummary[];
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((p) => (
        <PlaybookListItem key={p.id} pb={p} onRemove={onRemove} />
      ))}
    </ul>
  );
}
