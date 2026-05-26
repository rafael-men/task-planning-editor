import { Button, IconButton, TextField } from "@mui/material";
import { Plus, X } from "lucide-react";
import type { Modulo } from "../../../api/client";

type Props = {
  avaliacao: Modulo["avaliacao"];
  onChange: (av: NonNullable<Modulo["avaliacao"]>) => void;
};

export function AvaliacaoEditor({ avaliacao, onChange }: Props) {
  const tipo = avaliacao?.tipo ?? "";
  const criterios = avaliacao?.criterios ?? [];

  return (
    <div className="border-t border-border pt-3 space-y-2">
      <p className="text-xs uppercase tracking-wide text-text-muted">Avaliação</p>
      <TextField
        label="Tipo de avaliação"
        value={tipo}
        onChange={(e) => onChange({ tipo: e.target.value, criterios })}
        size="small"
        fullWidth
      />
      <ul className="space-y-1.5">
        {criterios.map((c, j) => (
          <li key={j} className="flex items-center gap-2">
            <TextField
              value={c}
              onChange={(e) =>
                onChange({
                  tipo,
                  criterios: criterios.map((x, k) => (k === j ? e.target.value : x)),
                })
              }
              size="small"
              fullWidth
              placeholder="Critério de avaliação"
            />
            <IconButton
              size="small"
              color="error"
              onClick={() =>
                onChange({ tipo, criterios: criterios.filter((_, k) => k !== j) })
              }
            >
              <X className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="small"
        onClick={() => onChange({ tipo, criterios: [...criterios, ""] })}
        startIcon={<Plus className="size-4" />}
      >
        Adicionar critério
      </Button>
    </div>
  );
}
