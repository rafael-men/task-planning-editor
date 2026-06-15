import { useState } from "react";
import { Button, TextField } from "@mui/material";
import { Plus } from "lucide-react";

type Props = {
  onCreate: (data: { nome: string; descricao?: string; prompt?: string }) => Promise<void>;
};

export function NewPlaybookForm({ onCreate }: Props) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setCreating(true);
    try {
      await onCreate({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        prompt: prompt.trim() || undefined,
      });
      setNome("");
      setDescricao("");
      setPrompt("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid sm:grid-cols-2 gap-3">
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
      </div>
      <TextField
        label="Prompt inicial (opcional) — o Groq gera o conteúdo ao criar"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        size="small"
        fullWidth
        multiline
        minRows={2}
        placeholder="Ex: Crie um playbook de onboarding para desenvolvedores Java com foco em Spring Boot..."
      />
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="contained"
          disabled={creating || !nome.trim()}
          startIcon={<Plus className="size-4" />}
        >
          {creating ? "Criando..." : "Criar"}
        </Button>
      </div>
    </form>
  );
}
