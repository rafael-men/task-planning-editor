import { request } from "../request";
import type { Cargo, Fornecedor, Setor } from "../types";

export const catalogoApi = {
  listLideres: () => request<Fornecedor[]>("/catalogo/lideres"),
  listSetores: () => request<Setor[]>("/catalogo/setores"),
  listCargos: (setorId?: string) =>
    request<Cargo[]>(
      `/catalogo/cargos${setorId ? `?setor_id=${encodeURIComponent(setorId)}` : ""}`
    ),
};
