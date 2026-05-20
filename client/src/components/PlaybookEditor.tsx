import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Plus, Save } from "lucide-react";
import type { Conteudo, Secao } from "../api/client";
import { SectionEditor } from "./editor/SectionEditor";
import { moveItem } from "../utils/moveItem";

type Props = {
  initialNome: string;
  initialDescricao: string;
  initialConteudo: Conteudo;
  onSave: (data: { nome: string; descricao: string | null; conteudo: Conteudo }) => Promise<void>;
  onCancel: () => void;
};

export function PlaybookEditor({
  initialNome,
  initialDescricao,
  initialConteudo,
  onSave,
  onCancel,
}: Props) {
  const [nome, setNome] = useState(initialNome);
  const [descricao, setDescricao] = useState(initialDescricao);
  const [secoes, setSecoes] = useState<Secao[]>(initialConteudo.secoes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function patchSecao(i: number, patch: Partial<Secao>) {
    setSecoes((s) => s.map((sec, idx) => (idx === i ? { ...sec, ...patch } : sec)));
  }
  function patchPasso(i: number, j: number, value: string) {
    patchSecao(i, { passos: secoes[i].passos.map((p, k) => (k === j ? value : p)) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const conteudo: Conteudo = {
        secoes: secoes.map((s) => ({
          titulo: s.titulo.trim(),
          ferramenta: s.ferramenta.trim(),
          passos: s.passos.map((p) => p.trim()).filter(Boolean),
        })),
      };
      await onSave({ nome: nome.trim(), descricao: descricao.trim() || null, conteudo });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextField
          label="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          fullWidth
          size="small"
        />
        <TextField
          label="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          fullWidth
          size="small"
        />
      </div>

      <div className="space-y-4">
        {secoes.map((sec, i) => (
          <SectionEditor
            key={i}
            index={i}
            total={secoes.length}
            secao={sec}
            onChange={(patch) => patchSecao(i, patch)}
            onMove={(dir) => setSecoes((s) => moveItem(s, i, i + dir))}
            onRemove={() => setSecoes((s) => s.filter((_, idx) => idx !== i))}
            onStepChange={(j, v) => patchPasso(i, j, v)}
            onStepMove={(j, dir) =>
              patchSecao(i, { passos: moveItem(secoes[i].passos, j, j + dir) })
            }
            onStepRemove={(j) =>
              patchSecao(i, { passos: secoes[i].passos.filter((_, k) => k !== j) })
            }
            onStepAdd={() => patchSecao(i, { passos: [...secoes[i].passos, ""] })}
          />
        ))}

        <Button
          type="button"
          variant="outlined"
          onClick={() =>
            setSecoes((s) => [...s, { titulo: "Nova seção", ferramenta: "", passos: [""] }])
          }
          startIcon={<Plus className="size-4" />}
        >
          Adicionar seção
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="flex gap-2 justify-end">
        <Button type="button" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving || !nome.trim()}
          startIcon={<Save className="size-4" />}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
