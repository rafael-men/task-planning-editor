import { Button, IconButton, TextField, Tooltip } from "@mui/material";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Secao } from "../../api/client";
import { StepEditor } from "./StepEditor";

type Props = {
  index: number;
  total: number;
  secao: Secao;
  onChange: (patch: Partial<Secao>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onStepChange: (j: number, v: string) => void;
  onStepMove: (j: number, dir: -1 | 1) => void;
  onStepRemove: (j: number) => void;
  onStepAdd: () => void;
};

export function SectionEditor({
  index,
  total,
  secao,
  onChange,
  onMove,
  onRemove,
  onStepChange,
  onStepMove,
  onStepRemove,
  onStepAdd,
}: Props) {
  return (
    <div className="border border-border rounded-lg p-4 bg-surface-2">
      <div className="flex items-start gap-2 mb-3">
        <TextField
          label="Título da seção"
          value={secao.titulo}
          onChange={(e) => onChange({ titulo: e.target.value })}
          size="small"
          fullWidth
        />
        <TextField
          label="Ferramenta"
          value={secao.ferramenta}
          onChange={(e) => onChange({ ferramenta: e.target.value })}
          size="small"
          fullWidth
        />
        <Tooltip title="Subir seção">
          <span>
            <IconButton size="small" onClick={() => onMove(-1)} disabled={index === 0}>
              <ArrowUp className="size-4" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Descer seção">
          <span>
            <IconButton size="small" onClick={() => onMove(1)} disabled={index === total - 1}>
              <ArrowDown className="size-4" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Remover seção">
          <IconButton size="small" onClick={onRemove} color="error">
            <Trash2 className="size-4" />
          </IconButton>
        </Tooltip>
      </div>

      <ol className="space-y-2">
        {secao.passos.map((p, j) => (
          <StepEditor
            key={j}
            index={j}
            total={secao.passos.length}
            value={p}
            onChange={(v) => onStepChange(j, v)}
            onMove={(dir) => onStepMove(j, dir)}
            onRemove={() => onStepRemove(j)}
          />
        ))}
      </ol>
      <Button
        type="button"
        size="small"
        onClick={onStepAdd}
        startIcon={<Plus className="size-4" />}
        sx={{ mt: 1.5 }}
      >
        Adicionar passo
      </Button>
    </div>
  );
}
