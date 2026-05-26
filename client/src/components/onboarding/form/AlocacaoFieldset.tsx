import { MenuItem, TextField } from "@mui/material";
import type {
  Cargo,
  Fornecedor,
  Senioridade,
  Setor,
} from "../../../api/client";

const SENIORIDADES: { value: Senioridade; label: string }[] = [
  { value: "estagio", label: "Estágio" },
  { value: "junior", label: "Júnior" },
  { value: "pleno", label: "Pleno" },
  { value: "senior", label: "Sênior" },
  { value: "especialista", label: "Especialista" },
];

function rotuloLider(f: Fornecedor): string {
  const nome = f.nome?.trim();
  return nome || "(sem nome)";
}

type Props = {
  setores: Setor[];
  cargos: Cargo[];
  lideres: Fornecedor[];
  loadingCatalog: boolean;
  loadingCargos: boolean;
  setorId: string;
  setSetorId: (v: string) => void;
  cargoId: string;
  setCargoId: (v: string) => void;
  fornecedorUserId: string;
  setFornecedorUserId: (v: string) => void;
  senioridade: Senioridade;
  setSenioridade: (v: Senioridade) => void;
};

export function AlocacaoFieldset({
  setores,
  cargos,
  lideres,
  loadingCatalog,
  loadingCargos,
  setorId,
  setSetorId,
  cargoId,
  setCargoId,
  fornecedorUserId,
  setFornecedorUserId,
  senioridade,
  setSenioridade,
}: Props) {
  return (
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
  );
}
