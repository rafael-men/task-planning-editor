import { IconButton, TextField } from "@mui/material";
import { ArrowDown, ArrowUp, X } from "lucide-react";

type Props = {
  index: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export function StepEditor({ index, total, value, onChange, onMove, onRemove }: Props) {
  return (
    <li className="flex items-center gap-2">
      <span className="text-xs text-text-muted w-5 text-right">{index + 1}.</span>
      <TextField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        fullWidth
        placeholder="Descreva o passo"
      />
      <IconButton size="small" onClick={() => onMove(-1)} disabled={index === 0}>
        <ArrowUp className="size-4" />
      </IconButton>
      <IconButton size="small" onClick={() => onMove(1)} disabled={index === total - 1}>
        <ArrowDown className="size-4" />
      </IconButton>
      <IconButton size="small" onClick={onRemove} color="error">
        <X className="size-4" />
      </IconButton>
    </li>
  );
}
