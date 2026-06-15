import { Button } from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "./ui/PageHeader";
import type { Playbook } from "../api/client";

function fmtDate(raw: string | null | undefined) {
  if (!raw) return "—";
  const d = new Date(raw);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}

type Props = {
  pb: Playbook;
  editing: boolean;
  onToggleEdit: () => void;
  onRemove: () => void;
};

export function PlaybookHeader({ pb, editing, onToggleEdit, onRemove }: Props) {
  return (
    <PageHeader
      title={pb.nome}
      subtitle={
        <>
          {pb.descricao && <span>{pb.descricao} · </span>}
          <span className="text-xs">
            v{pb.versao} · atualizado em {fmtDate(pb.updated_at)}
          </span>
        </>
      }
      actions={
        <>
          <Button
            variant="outlined"
            onClick={onToggleEdit}
            startIcon={<Pencil className="size-4" />}
          >
            {editing ? "Sair da edição" : "Editar manualmente"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={onRemove}
            startIcon={<Trash2 className="size-4" />}
          >
            Excluir
          </Button>
        </>
      }
    />
  );
}
