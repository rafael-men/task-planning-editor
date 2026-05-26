import { useState } from "react";
import { Alert, Button, TextField } from "@mui/material";
import { Sparkles } from "lucide-react";
import type { OnboardingDados, Senioridade } from "../../api/client";
import { IdentificacaoFieldset } from "./form/IdentificacaoFieldset";
import { AlocacaoFieldset } from "./form/AlocacaoFieldset";
import { useCatalogos } from "./form/useCatalogos";

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
  const [setorId, setSetorId] = useState(initial?.setor_id ?? "");
  const [cargoId, setCargoId] = useState(initial?.cargo_id ?? "");
  const [fornecedorUserId, setFornecedorUserId] = useState(
    initial?.fornecedor_user_id ?? ""
  );
  const [senioridade, setSenioridade] = useState<Senioridade>(
    initial?.senioridade ?? "pleno"
  );
  const [lider, setLider] = useState(initial?.lider ?? "");
  const [descricao, setDescricao] = useState(initial?.descricao ?? "");
  const [dataInicio, setDataInicio] = useState(
    initial?.data_inicio ?? new Date().toISOString().slice(0, 10)
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    lideres,
    setores,
    cargos,
    loadingCatalog,
    loadingCargos,
    catalogError,
  } = useCatalogos(setorId, () => {
    setCargoId((prev) => (cargos.find((c) => c.id === prev) ? prev : ""));
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        nome: nome.trim(),
        fornecedor_user_id: fornecedorUserId,
        setor_id: setorId,
        cargo_id: cargoId,
        senioridade,
        lider: lider.trim() || undefined,
        descricao: descricao.trim() || undefined,
        data_inicio: dataInicio,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const podeEnviar =
    nome.trim() && fornecedorUserId && setorId && cargoId && dataInicio && !busy;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      {catalogError && <Alert severity="error">{catalogError}</Alert>}

      <IdentificacaoFieldset
        nome={nome}
        setNome={setNome}
        lider={lider}
        setLider={setLider}
      />

      <AlocacaoFieldset
        setores={setores}
        cargos={cargos}
        lideres={lideres}
        loadingCatalog={loadingCatalog}
        loadingCargos={loadingCargos}
        setorId={setorId}
        setSetorId={setSetorId}
        cargoId={cargoId}
        setCargoId={setCargoId}
        fornecedorUserId={fornecedorUserId}
        setFornecedorUserId={setFornecedorUserId}
        senioridade={senioridade}
        setSenioridade={setSenioridade}
      />

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="text-xs uppercase tracking-wide text-text-muted mb-1 col-span-full">
          Cronograma
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
          disabled={!podeEnviar}
          startIcon={<Sparkles className="size-4" />}
        >
          {busy ? submittingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
