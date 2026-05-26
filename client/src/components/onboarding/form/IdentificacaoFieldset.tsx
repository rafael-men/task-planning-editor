import { TextField } from "@mui/material";

type Props = {
  nome: string;
  setNome: (v: string) => void;
  lider: string;
  setLider: (v: string) => void;
};

export function IdentificacaoFieldset({ nome, setNome, lider, setLider }: Props) {
  return (
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
  );
}
