// Strings de SELECT do Supabase para reuso pelos handlers.

export const SELECT_LIST = `
  id, nome, senioridade, data_inicio, versao, updated_at,
  fornecedor:fornecedores(id, nome),
  setor:setores(id, slug, nome),
  cargo:cargos(id, nome)
`;

export const SELECT_DETALHE = `
  *,
  fornecedor:fornecedores(id, nome, descricao),
  setor:setores(id, slug, nome, descricao),
  cargo:cargos(id, nome, descricao, setor_id)
`;
