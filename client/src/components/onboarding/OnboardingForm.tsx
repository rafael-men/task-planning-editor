import { useEffect, useState } from "react";
import { Alert, Button, MenuItem, TextField } from "@mui/material";
import { Sparkles } from "lucide-react";
import {
  api,
  type Cargo,
  type Fornecedor,
  type OnboardingDados,
  type Senioridade,
  type Setor,
} from "../../api/client";

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

/** Exibição de um líder: nome se houver, "(sem nome)" caso contrário. */
function rotuloLider(f: Fornecedor): string {
  const nome = f.nome?.trim();
  if (nome) return nome;
  return "(sem nome)";
}

export function OnboardingForm({
  initial,
  onSubmit,
  submitLabel = "Gerar trilha",
  submittingLabel = "Gerando...",
}: Props) {
  // Catálogos
  const [lideres, setLideres] = useState<Fornecedor[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Campos
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

  // Carrega líderes + setores no mount.
  useEffect(() => {
    Promise.all([api.listLideres(), api.listSetores()])
      .then(([ls, ss]) => {
        setLideres(ls);
        setSetores(ss);
      })
      .catch((e) => setCatalogError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingCatalog(false));
  }, []);

  // Quando setor muda, recarrega cargos.
  useEffect(() => {
    if (!setorId) {
      setCargos([]);
      return;
    }
    setLoadingCargos(true);
    api
      .listCargos(setorId)
      .then((cs) => {
        setCargos(cs);
        if (cargoId && !cs.find((c) => c.id === cargoId)) {
          setCargoId("");
        }
      })
      .catch((e) => setCatalogError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingCargos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setorId]);

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
          label="Líder direto (texto)"
          value={lider}
          onChange={(e) => setLider(e.target.value)}
          size="small"
          fullWidth
          helperText="Nome livre — não confunda com o fornecedor (usuário do sistema)"
        />
      </fieldset>

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="text-xs uppercase tracking-wide text-text-muted mb-1 col-span-full">
          Alocação hierárquica
        </legend>

        <TextField
          select
          label="Setor"
          value={setorId}
          onChange={(e) => setSetorId(e.target.value)}
          required
          size="small"
          fullWidth
          disabled={loadingCatalog || setores.length === 0}
        >
          {setores.map((s) => (
            <MenuItem key={s.id} value={s.id}>
              {s.nome}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Cargo"
          value={cargoId}
          onChange={(e) => setCargoId(e.target.value)}
          required
          size="small"
          fullWidth
          disabled={!setorId || loadingCargos || cargos.length === 0}
          helperText={
            !setorId
              ? "Selecione um setor primeiro"
              : loadingCargos
                ? "Carregando..."
                : cargos.length === 0
                  ? "Nenhum cargo cadastrado neste setor"
                  : undefined
          }
        >
          {cargos.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.nome}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Fornecedor (líder responsável)"
          value={fornecedorUserId}
          onChange={(e) => setFornecedorUserId(e.target.value)}
          required
          size="small"
          fullWidth
          disabled={loadingCatalog || lideres.length === 0}
          helperText={
            loadingCatalog
              ? "Carregando..."
              : lideres.length === 0
                ? "Nenhum líder cadastrado no sistema ainda."
                : "Esse usuário poderá ver e editar este onboarding."
          }
        >
          {lideres.map((f) => (
            <MenuItem key={f.id} value={f.id}>
              {rotuloLider(f)}
              {f.email && (
                <span className="text-xs text-text-muted ml-2">{f.email}</span>
              )}
            </MenuItem>
          ))}
        </TextField>

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
