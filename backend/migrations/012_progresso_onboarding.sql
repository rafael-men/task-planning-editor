-- Acompanhamento de progresso dos módulos do onboarding.
-- Estrutura: { "<indice_modulo>": { "status": ..., "atualizado_em": ..., "observacao": ... } }
-- Indexação pelo índice do módulo (string) é estável até a trilha ser reordenada;
-- quando o admin reordena módulos, o frontend reescreve o objeto de progresso.

alter table pmo.onboardings
  add column if not exists progresso jsonb not null default '{}'::jsonb;

-- Index GIN para filtros futuros (ex.: "onboardings com algum módulo em_andamento").
create index if not exists onboardings_progresso_idx
  on pmo.onboardings using gin (progresso);
