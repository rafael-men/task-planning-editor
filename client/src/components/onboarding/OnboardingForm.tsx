import { useState } from "react";
import { Alert, Button, MenuItem, TextField } from "@mui/material";
import { Sparkles } from "lucide-react";
import type { OnboardingDados, Senioridade } from "../../api/client";

const SENIORIDADES: { value: Senioridade; label: string }[] = [
  { value: "estagio", label: "Estágio" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sênior" },
  { value: "especialista", label: "Especialista" },
];

type Props = {
  initial?: Partial<OnboardingDados>;
  onSubmit: (dados: OnboardingDados) => Promise<void>;
  submitLabel?: string;
  submittingLabel?: string;
};

export function OnboardingForm({
  initial,
  onSubmit,
  submitLabel = "Gerar trilha",
  submittingLabel = "Gerando...",
}: Props) {
  const [nome, setNome] = useState(initial?.nome ?? "");
  const [setor, setSetor] = useState(initial?.setor ?? "");
  const [lider, setLider] = useState(initial?.lider ?? "");
  const [cargo, setCargo] = useState(initial?.cargo ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [dataInicio, setDataInicio] = useState(
    initial?.data_inicio ?? new Date().toISOString().slice(0, 10)
  );
  const [senioridade, setSenioridade] = useState<Senioridade>(
    initial?.senioridade ?? "pleno"
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        nome: nome.trim(),
        setor: setor.trim(),
        lider: lider.trim() || undefined,
        cargo: cargo.trim(),
        descricao: descricao.trim() || undefined,
        data_inicio: dataInicio,
        senioridade,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="text-xs uppercase tracking-wide text-text-muted mb-1 col-span-full">
          Identificação
        </legend>
        <TextField
          label="Nome do colaborador"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          size="small"
          fullWidth
        />
        <TextField
          label="Cargo"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          required
          size="small"
          fullWidth
        />
        <TextField
          label="Setor"
          value={setor}
          onChange={(e) => setSetor(e.target.value)}
          required
          size="small"
          fullWidth
        />
        <TextField
          label="Líder direto"
          value={lider}
          onChange={(e) => setLider(e.target.value)}
          size="small"
          fullWidth
        />
      </fieldset>

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="text-xs uppercase tracking-wide text-text-muted mb-1 col-span-full">
          Cronograma e nível
        </legend>
        <TextField
          label="Data de início"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          required
          size="small"
          fullWidth
        />
        <TextField
          select
          label="Senioridade"
          value={senioridade}
          onChange={(e) => setSenioridade(e.target.value as Senioridade)}
          size="small"
          fullWidth
        >
          {SENIORIDADES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
      </fieldset>

      <TextField
        label="Descrição da posição (opcional)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        multiline
        minRows={3}
        size="small"
        fullWidth
        helperText="Contexto adicional sobre o que esse colaborador vai fazer. Ajuda a IA a personalizar a trilha."
      />

      {error && <Alert severity="error">{error}</Alert>}

      <div className="flex justify-end pt-2 border-t border-border">
        <Button
          type="submit"
          variant="contained"
          disabled={busy}
          startIcon={<Sparkles className="size-4" />}
        >
          {busy ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
