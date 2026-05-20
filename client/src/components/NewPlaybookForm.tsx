import { useState } from "react";
import { Button, TextField } from "@mui/material";
import { Plus } from "lucide-react";

type Props = {
  onCreate: (data: { nome: string; descricao?: string }) => Promise<void>;
};

export function NewPlaybookForm({ onCreate }: Props) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setCreating(true);
    try {
      await onCreate({ nome: nome.trim(), descricao: descricao.trim() || undefined });
      setNome("");
      setDescricao("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-start">
      <TextField
        label="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
        size="small"
        fullWidth
      />
      <TextField
        label="Descrição (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        size="small"
        fullWidth
      />
      <Button
        type="submit"
        variant="contained"
        disabled={creating || !nome.trim()}
        startIcon={<Plus className="size-4" />}
      >
        {creating ? "Criando..." : "Criar"}
      </Button>
    </form>
  );
}
