import { Button, IconButton, TextField } from "@mui/material";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { moveItem } from "../../../utils/moveItem";

type Props = {
  atividades: string[];
  onChange: (atividades: string[]) => void;
};

export function ListaAtividades({ atividades, onChange }: Props) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Atividades</p>
      <ul className="space-y-1.5">
        {atividades.map((a, j) => (
          <li key={j} className="flex items-center gap-2">
            <TextField
              value={a}
              onChange={(e) =>
                onChange(atividades.map((x, k) => (k === j ? e.target.value : x)))
              }
              size="small"
              fullWidth
            />
            <IconButton
              size="small"
              onClick={() => onChange(moveItem(atividades, j, j - 1))}
              disabled={j === 0}
            >
              <ArrowUp className="size-4" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onChange(moveItem(atividades, j, j + 1))}
              disabled={j === atividades.length - 1}
            >
              <ArrowDown className="size-4" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => onChange(atividades.filter((_, k) => k !== j))}
            >
              <X className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="small"
        onClick={() => onChange([...atividades, ""])}
        startIcon={<Plus className="size-4" />}
        sx={{ mt: 1 }}
      >
        Adicionar atividade
      </Button>
    </div>
  );
}
