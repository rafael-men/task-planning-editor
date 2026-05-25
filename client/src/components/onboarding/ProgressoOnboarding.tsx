import { useMemo, useState } from "react";
import { Alert, Chip, LinearProgress, Menu, MenuItem, Tooltip } from "@mui/material";
import { Check, CircleDashed, Loader2 } from "lucide-react";
import {
  api,
  type Modulo,
  type Progresso,
  type StatusModulo,
} from "../../api/client";

const STATUS_META: Record<
  StatusModulo,
  { label: string; cor: "default" | "info" | "success"; Icone: typeof Check }
> = {
  pendente: { label: "Pendente", cor: "default", Icone: CircleDashed },
  em_andamento: { label: "Em andamento", cor: "info", Icone: Loader2 },
  concluido: { label: "Concluído", cor: "success", Icone: Check },
};

const ORDEM: StatusModulo[] = ["pendente", "em_andamento", "concluido"];

type Props = {
  onboardingId: string;
  modulos: Modulo[];
  progresso: Progresso;
  podeEditar: boolean;
  onChange: (novo: Progresso) => void;
};

export function ProgressoOnboarding({
  onboardingId,
  modulos,
  progresso,
  podeEditar,
  onChange,
}: Props) {
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{
    el: HTMLElement;
    idx: number;
  } | null>(null);

  const stats = useMemo(() => {
    const total = modulos.length;
    let concluidos = 0;
    let emAndamento = 0;
    for (let i = 0; i < total; i++) {
      const s = progresso[String(i)]?.status ?? "pendente";
      if (s === "concluido") concluidos++;
      else if (s === "em_andamento") emAndamento++;
    }
    return {
      total,
      concluidos,
      emAndamento,
      pendentes: total - concluidos - emAndamento,
      pct: total === 0 ? 0 : Math.round((concluidos / total) * 100),
    };
  }, [progresso, modulos.length]);

  async function setStatus(idx: number, status: StatusModulo) {
    setBusyIdx(idx);
    setErro(null);
    try {
      const r = await api.atualizarProgresso(onboardingId, {
        modulo_idx: idx,
        status,
      });
      onChange(r.progresso);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyIdx(null);
      setAnchor(null);
    }
  }

  if (modulos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-text-muted">
            Progresso: <strong className="text-text">{stats.concluidos}</strong> /{" "}
            {stats.total} módulos concluídos
            {stats.emAndamento > 0 && (
              <span className="text-text-muted ml-2">
                ({stats.emAndamento} em andamento)
              </span>
            )}
          </span>
          <span className="text-text-muted text-xs">{stats.pct}%</span>
        </div>
        <LinearProgress
          variant="determinate"
          value={stats.pct}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: stats.pct === 100 ? "#22c55e" : "#aa3bff",
            },
          }}
        />
      </div>

      {erro && <Alert severity="error">{erro}</Alert>}

      <div className="flex flex-wrap gap-2">
        {modulos.map((m, i) => {
          const status = progresso[String(i)]?.status ?? "pendente";
          const meta = STATUS_META[status];
          const Icone = meta.Icone;
          return (
            <Tooltip key={i} title={m.titulo}>
              <Chip
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <span className="opacity-60 text-xs">M{i + 1}</span>
                    <Icone className={`size-3.5 ${status === "em_andamento" ? "animate-spin" : ""}`} />
                    {meta.label}
                  </span>
                }
                color={meta.cor}
                size="small"
                onClick={
                  podeEditar
                    ? (e) => setAnchor({ el: e.currentTarget, idx: i })
                    : undefined
                }
                disabled={busyIdx === i}
                sx={{ cursor: podeEditar ? "pointer" : "default" }}
              />
            </Tooltip>
          );
        })}
      </div>

      <Menu
        anchorEl={anchor?.el}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
      >
        {ORDEM.map((s) => {
          const meta = STATUS_META[s];
          const Icone = meta.Icone;
          return (
            <MenuItem
              key={s}
              onClick={() => anchor && setStatus(anchor.idx, s)}
              dense
            >
              <Icone className="size-4 mr-2" />
              {meta.label}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
}
