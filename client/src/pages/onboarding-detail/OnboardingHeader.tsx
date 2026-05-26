import { Button } from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import type { Onboarding, Senioridade } from "../../api/client";
import { PageHeader } from "../../components/ui/PageHeader";

const LABEL_SENIORIDADE: Record<Senioridade, string> = {
  estagio: "Estágio",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
};

type Props = {
  ob: Onboarding;
  editing: boolean;
  podeExcluir: boolean;
  onToggleEdit: () => void;
  onRemove: () => void;
};

export function OnboardingHeader({
  ob,
  editing,
  podeExcluir,
  onToggleEdit,
  onRemove,
}: Props) {
  return (
    <PageHeader
      title={ob.nome}
      subtitle={
        <>
          {ob.cargo?.nome ?? "—"} · {ob.setor?.nome ?? "—"} ·{" "}
          {LABEL_SENIORIDADE[ob.senioridade]}
          {ob.fornecedor && (
            <>
              {" "}· líder: {ob.fornecedor.nome ?? "(sem nome)"}{" "}
              {ob.fornecedor.email && (
                <span className="text-xs opacity-70">
                  ({ob.fornecedor.email})
                </span>
              )}
            </>
          )}
          {ob.lider && <> · líder direto: {ob.lider}</>}
          <span className="text-xs">
            {" "}· v{ob.versao} · início{" "}
            {new Date(ob.data_inicio).toLocaleDateString()}
          </span>
        </>
      }
      actions={
        <>
          <Button
            variant="outlined"
            onClick={onToggleEdit}
            startIcon={<Pencil className="size-4" />}
          >
            {editing ? "Sair da edição" : "Editar manualmente"}
          </Button>
          {podeExcluir && (
            <Button
              variant="outlined"
              color="error"
              onClick={onRemove}
              startIcon={<Trash2 className="size-4" />}
            >
              Excluir
            </Button>
          )}
        </>
      }
    />
  );
}
