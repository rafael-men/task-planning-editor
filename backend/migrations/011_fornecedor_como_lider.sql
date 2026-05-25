alter table pmo.onboardings
  add column if not exists fornecedor_user_id uuid references auth.users(id) on delete set null;

create index if not exists onboardings_fornecedor_user_idx
  on pmo.onboardings(fornecedor_user_id);


do $migra$
begin
  if exists (
    select 1 from information_schema.tables
     where table_schema = 'pmo' and table_name = 'onboarding_atribuicoes'
  ) then
    update pmo.onboardings o
       set fornecedor_user_id = sub.lider_user_id
      from (
        select distinct on (onboarding_id) onboarding_id, lider_user_id
          from pmo.onboarding_atribuicoes
          order by onboarding_id, created_at asc
      ) sub
     where sub.onboarding_id = o.id
       and o.fornecedor_user_id is null;
  end if;
end
$migra$;


drop table if exists pmo.onboarding_atribuicoes cascade;


alter table pmo.ferramenta_alocacoes
  drop constraint if exists ferramenta_alocacoes_escopo_check;
alter table pmo.ferramenta_alocacoes
  add constraint ferramenta_alocacoes_escopo_check
  check (escopo in ('global','fornecedor','setor','cargo','senioridade'));

alter table pmo.curso_alocacoes
  drop constraint if exists curso_alocacoes_escopo_check;
alter table pmo.curso_alocacoes
  add constraint curso_alocacoes_escopo_check
  check (escopo in ('global','fornecedor','setor','cargo','senioridade'));


update pmo.ferramenta_alocacoes
   set escopo = 'global', alvo_id = null, alvo_slug = null
 where escopo = 'fornecedor';

update pmo.curso_alocacoes
   set escopo = 'global', alvo_id = null, alvo_slug = null
 where escopo = 'fornecedor';

alter table pmo.onboardings
  drop column if exists fornecedor_id;
drop table if exists pmo.fornecedores cascade;

alter table pmo.ferramenta_alocacoes
  drop constraint if exists ferramenta_alocacoes_escopo_check;
alter table pmo.ferramenta_alocacoes
  add constraint ferramenta_alocacoes_escopo_check
  check (escopo in ('global','setor','cargo','senioridade'));

alter table pmo.curso_alocacoes
  drop constraint if exists curso_alocacoes_escopo_check;
alter table pmo.curso_alocacoes
  add constraint curso_alocacoes_escopo_check
  check (escopo in ('global','setor','cargo','senioridade'));
