import type { Modulo } from "../../api/client";
import { CabecalhoModulo } from "./modulo/CabecalhoModulo";
import { ListaAtividades } from "./modulo/ListaAtividades";
import { ListaCursos } from "./modulo/ListaCursos";
import { AvaliacaoEditor } from "./modulo/AvaliacaoEditor";

type Props = {
  index: number;
  total: number;
  modulo: Modulo;
  onChange: (patch: Partial<Modulo>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
};

export function ModuloEditor({
  index,
  total,
  modulo,
  onChange,
  onMove,
  onRemove,
}: Props) {
  return (
    <div className="border border-border rounded-lg p-4 bg-surface-2 space-y-3">
      <CabecalhoModulo
        modulo={modulo}
        index={index}
        total={total}
        onChange={onChange}
        onMove={onMove}
        onRemove={onRemove}
      />

      <ListaAtividades
        atividades={modulo.atividades}
        onChange={(atividades) => onChange({ atividades })}
      />

      <ListaCursos
        cursos={modulo.cursos}
        onChange={(cursos) => onChange({ cursos })}
      />

      <AvaliacaoEditor
        avaliacao={modulo.avaliacao}
        onChange={(avaliacao) => onChange({ avaliacao })}
      />
    </div>
  );
}
