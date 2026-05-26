import { useEffect, useState } from "react";
import { api, type Cargo, type Fornecedor, type Setor } from "../../../api/client";


export function useCatalogos(setorId: string, onResetCargo: () => void) {
  const [lideres, setLideres] = useState<Fornecedor[]>([]);
  const [setores, setSetores] = useState<Setor[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingCargos, setLoadingCargos] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listLideres(), api.listSetores()])
      .then(([ls, ss]) => {
        setLideres(ls);
        setSetores(ss);
      })
      .catch((e) => setCatalogError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingCatalog(false));
  }, []);

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
        // Se o cargo selecionado anteriormente não pertence ao novo setor,
        // o componente pai precisa resetar — chama o callback.
        onResetCargo();
      })
      .catch((e) => setCatalogError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingCargos(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setorId]);

  return { lideres, setores, cargos, loadingCatalog, loadingCargos, catalogError };
}
