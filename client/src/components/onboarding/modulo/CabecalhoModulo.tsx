import { IconButton, TextField, Tooltip } from "@mui/material";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import type { Modulo } from "../../../api/client";

type Props = {
  modulo: Modulo;
  index: number;
  total: number;
  onChange: (patch: Partial<Modulo>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export function CabecalhoModulo({
  modulo,
  index,
  total,
  onChange,
  onMove,
  onRemove,
}: Props) {
  return (
    <>
      <div className="flex items-start gap-2">
        <TextField
          label="Título do módulo"
          value={modulo.titulo}
          onChange={(e) => onChange({ titulo: e.target.value })}
          size="small"
          fullWidth
        />
        <TextField
          label="Ferramenta"
          value={modulo.ferramenta}
          onChange={(e) => onChange({ ferramenta: e.target.value })}
          size="small"
          fullWidth
        />
        <Tooltip title="Subir">
          <span>
            <IconButton size="small" onClick={() => onMove(-1)} disabled={index === 0}>
              <ArrowUp className="size-4" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Descer">
          <span>
            <IconButton
              size="small"
              onClick={() => onMove(1)}
              disabled={index === total - 1}
            >
              <ArrowDown className="size-4" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Remover">
          <IconButton size="small" onClick={onRemove} color="error">
            <Trash2 className="size-4" />
          </IconButton>
        </Tooltip>
      </div>

      <TextField
        label="Objetivo"
        value={modulo.objetivo}
        onChange={(e) => onChange({ objetivo: e.target.value })}
        size="small"
        fullWidth
        multiline
        minRows={2}
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <TextField
          label="Duração (dias)"
          type="number"
          value={modulo.duracao_dias}
          onChange={(e) =>
            onChange({ duracao_dias: parseInt(e.target.value || "0", 10) })
          }
          size="small"
        />
        <TextField
          label="Início"
          type="date"
          value={modulo.data_inicio}
          onChange={(e) => onChange({ data_inicio: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
        />
        <TextField
          label="Fim"
          type="date"
          value={modulo.data_fim}
          onChange={(e) => onChange({ data_fim: e.target.value })}
          slotProps={{ inputLabel: { shrink: true } }}
          size="small"
        />
      </div>
    </>
  );
}
