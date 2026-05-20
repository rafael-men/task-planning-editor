import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Plus, Save } from "lucide-react";
import type { Modulo, OnboardingConteudo } from "../../api/client";
import { ModuloEditor } from "./ModuloEditor";
import { moveItem } from "../../utils/moveItem";

type Props = {
  initial: OnboardingConteudo;
  onSave: (conteudo: OnboardingConteudo) => Promise<void>;
  onCancel: () => void;
};

const moduloVazio: Modulo = {
  titulo: "Novo módulo",
  ferramenta: "",
  objetivo: "",
  duracao_dias: 5,
  data_inicio: "",
  data_fim: "",
  atividades: [],
  cursos: [],
  avaliacao: { tipo: "", criterios: [] },
};

export function OnboardingEditor({ initial, onSave, onCancel }: Props) {
  const [resumo, setResumo] = useState(initial.resumo ?? "");
  const [modulos, setModulos] = useState<Modulo[]>(initial.modulos ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchModulo(i: number, patch: Partial<Modulo>) {
    setModulos((arr) => arr.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave({
        resumo: resumo.trim(),
        modulos: modulos.map((m) => ({
          ...m,
          titulo: m.titulo.trim(),
          ferramenta: m.ferramenta.trim(),
          objetivo: m.objetivo.trim(),
          atividades: m.atividades.map((a) => a.trim()).filter(Boolean),
          cursos: m.cursos
            .map((c) => ({ nome: c.nome.trim(), link: c.link?.trim() || undefined }))
            .filter((c) => c.nome),
          avaliacao: m.avaliacao
            ? {
                tipo: m.avaliacao.tipo.trim(),
                criterios: m.avaliacao.criterios.map((c) => c.trim()).filter(Boolean),
              }
            : undefined,
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <TextField
        label="Resumo da trilha"
        value={resumo}
        onChange={(e) => setResumo(e.target.value)}
        multiline
        minRows={2}
        fullWidth
        size="small"
      />

      <div className="space-y-4">
        {modulos.map((m, i) => (
          <ModuloEditor
            key={i}
            index={i}
            total={modulos.length}
            modulo={m}
            onChange={(patch) => patchModulo(i, patch)}
            onMove={(dir) => setModulos((s) => moveItem(s, i, i + dir))}
            onRemove={() => setModulos((s) => s.filter((_, idx) => idx !== i))}
          />
        ))}
        <Button
          type="button"
          variant="outlined"
          onClick={() => setModulos((s) => [...s, { ...moduloVazio }])}
          startIcon={<Plus className="size-4" />}
        >
          Adicionar módulo
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={<Save className="size-4" />}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
