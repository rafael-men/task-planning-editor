import { Button, IconButton, TextField } from "@mui/material";
import { Plus, X } from "lucide-react";
import type { Curso } from "../../../api/client";

type Props = {
  cursos: Curso[];
  onChange: (cursos: Curso[]) => void;
};

export function ListaCursos({ cursos, onChange }: Props) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Cursos</p>
      <ul className="space-y-1.5">
        {cursos.map((c, j) => (
          <li key={j} className="flex items-center gap-2">
            <TextField
              placeholder="Nome do curso"
              value={c.nome}
              onChange={(e) =>
                onChange(
                  cursos.map((x, k) => (k === j ? { ...x, nome: e.target.value } : x))
                )
              }
              size="small"
              fullWidth
            />
            <TextField
              placeholder="Link (opcional)"
              value={c.link ?? ""}
              onChange={(e) =>
                onChange(
                  cursos.map((x, k) => (k === j ? { ...x, link: e.target.value } : x))
                )
              }
              size="small"
              fullWidth
            />
            <IconButton
              size="small"
              color="error"
              onClick={() => onChange(cursos.filter((_, k) => k !== j))}
            >
              <X className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="small"
        onClick={() => onChange([...cursos, { nome: "" }])}
        startIcon={<Plus className="size-4" />}
        sx={{ mt: 1 }}
      >
        Adicionar curso
      </Button>
    </div>
  );
}
