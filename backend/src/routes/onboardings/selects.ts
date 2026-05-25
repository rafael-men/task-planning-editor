
export const SELECT_LIST = `
  id, nome, senioridade, data_inicio, versao, updated_at, fornecedor_user_id,
  setor:setores(id, slug, nome),
  cargo:cargos(id, nome)
`;

export const SELECT_DETALHE = `
  *,
  setor:setores(id, slug, nome, descricao),
  cargo:cargos(id, nome, descricao, setor_id)
`;
