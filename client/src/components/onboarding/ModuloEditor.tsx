import { Button, IconButton, TextField, Tooltip } from "@mui/material";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import type { Curso, Modulo } from "../../api/client";
import { moveItem } from "../../utils/moveItem";

type Props = {
  index: number;
  total: number;
  modulo: Modulo;
  onChange: (patch: Partial<Modulo>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export function ModuloEditor({
  index,
  total,
  modulo,
  onChange,
  onMove,
  onRemove,
}: Props) {
  function patchAtividade(j: number, v: string) {
    onChange({ atividades: modulo.atividades.map((a, k) => (k === j ? v : a)) });
  }
  function patchCurso(j: number, p: Partial<Curso>) {
    onChange({
      cursos: modulo.cursos.map((c, k) => (k === j ? { ...c, ...p } : c)),
    });
  }
  function patchCriterio(j: number, v: string) {
    if (!modulo.avaliacao) return;
    onChange({
      avaliacao: {
        ...modulo.avaliacao,
        criterios: modulo.avaliacao.criterios.map((c, k) => (k === j ? v : c)),
      },
    });
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-surface-2 space-y-3">
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
            <IconButton size="small" onClick={() => onMove(1)} disabled={index === total - 1}>
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

      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Atividades</p>
        <ul className="space-y-1.5">
          {modulo.atividades.map((a, j) => (
            <li key={j} className="flex items-center gap-2">
              <TextField
                value={a}
                onChange={(e) => patchAtividade(j, e.target.value)}
                size="small"
                fullWidth
              />
              <IconButton
                size="small"
                onClick={() =>
                  onChange({ atividades: moveItem(modulo.atividades, j, j - 1) })
                }
                disabled={j === 0}
              >
                <ArrowUp className="size-4" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() =>
                  onChange({ atividades: moveItem(modulo.atividades, j, j + 1) })
                }
                disabled={j === modulo.atividades.length - 1}
              >
                <ArrowDown className="size-4" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  onChange({ atividades: modulo.atividades.filter((_, k) => k !== j) })
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
          onClick={() => onChange({ atividades: [...modulo.atividades, ""] })}
          startIcon={<Plus className="size-4" />}
          sx={{ mt: 1 }}
        >
          Adicionar atividade
        </Button>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted mb-1">Cursos</p>
        <ul className="space-y-1.5">
          {modulo.cursos.map((c, j) => (
            <li key={j} className="flex items-center gap-2">
              <TextField
                placeholder="Nome do curso"
                value={c.nome}
                onChange={(e) => patchCurso(j, { nome: e.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                placeholder="Link (opcional)"
                value={c.link ?? ""}
                onChange={(e) => patchCurso(j, { link: e.target.value })}
                size="small"
                fullWidth
              />
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  onChange({ cursos: modulo.cursos.filter((_, k) => k !== j) })
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
          onClick={() => onChange({ cursos: [...modulo.cursos, { nome: "" }] })}
          startIcon={<Plus className="size-4" />}
          sx={{ mt: 1 }}
        >
          Adicionar curso
        </Button>
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <p className="text-xs uppercase tracking-wide text-text-muted">Avaliação</p>
        <TextField
          label="Tipo de avaliação"
          value={modulo.avaliacao?.tipo ?? ""}
          onChange={(e) =>
            onChange({
              avaliacao: {
                tipo: e.target.value,
                criterios: modulo.avaliacao?.criterios ?? [],
              },
            })
          }
          size="small"
          fullWidth
        />
        <ul className="space-y-1.5">
          {(modulo.avaliacao?.criterios ?? []).map((c, j) => (
            <li key={j} className="flex items-center gap-2">
              <TextField
                value={c}
                onChange={(e) => patchCriterio(j, e.target.value)}
                size="small"
                fullWidth
                placeholder="Critério de avaliação"
              />
              <IconButton
                size="small"
                color="error"
                onClick={() =>
                  onChange({
                    avaliacao: modulo.avaliacao
                      ? {
                          ...modulo.avaliacao,
                          criterios: modulo.avaliacao.criterios.filter(
                            (_, k) => k !== j
                          ),
                        }
                      : undefined,
                  })
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
          onClick={() =>
            onChange({
              avaliacao: {
                tipo: modulo.avaliacao?.tipo ?? "",
                criterios: [...(modulo.avaliacao?.criterios ?? []), ""],
              },
            })
          }
          startIcon={<Plus className="size-4" />}
        >
          Adicionar critério
        </Button>
      </div>
    </div>
  );
}
