# Migrations

Todas as tabelas da app vivem no schema `pmo` (apenas `auth.*` fica no schema gerenciado pelo Supabase).

Rode no SQL Editor do Supabase, **em ordem**:

| Arquivo | Descrição | Obrigatório? |
| --- | --- | --- |
| `001_initial.sql` | Cria schema `pmo` + tabelas `playbooks`, `playbooks_historico` | Sim |
| `002_seed.sql` | 2 playbooks de exemplo (sem owner) | Não — pule se for usar só com auth |
| `003_auth_ownership.sql` | `owner_id` + RLS por usuário | Sim |
| `004_onboardings.sql` | Tabela `onboardings` para trilhas de contratação | Sim |
| `005_catalogo.sql` | Tabelas `ferramentas` e `cursos` + seed por setor | Sim |
| `006_hierarquia.sql` | `fornecedores`, `setores`, `cargos` + FKs em `onboardings` | Sim |
| `007_alocacoes.sql` | Alocação em cascata de ferramentas/cursos pelos 4 níveis | Sim |
| `008_perfis.sql` | Papéis (RH/líder) + vínculo a setor | Sim |
| `009_expor_pmo.sql` | Grants no schema `pmo` para o PostgREST | Sim |
| `010_admin_e_atribuicoes.sql` | Papel `admin` (singleton) + tabela `onboarding_atribuicoes` | Sim |
| `011_fornecedor_como_lider.sql` | Fornecedor vira usuário (líder); escopo `global` no catálogo | Sim |
| `012_progresso_onboarding.sql` | Coluna `progresso` (JSONB) para acompanhar status dos módulos | Sim |

## Passo extra obrigatório no Painel do Supabase

Depois de rodar a migration `009`, abra **Project Settings → API → Exposed schemas** e adicione `pmo` à lista (separado por vírgula: `public, pmo`). Sem isso, a REST API devolve 404 ao tentar acessar as tabelas, mesmo com os grants corretos.

## Notas

- Depois da `003`, todo playbook precisa ter `owner_id`. O backend grava sempre com o `owner_id` preenchido a partir do JWT do usuário.
- Se você rodou o `002_seed.sql` e quer associar os playbooks de exemplo a um usuário existente:

```sql
update pmo.playbooks
   set owner_id = '<uuid-do-usuario>'
 where owner_id is null;
```

## Migrando dados existentes em `public` para `pmo`

Se você já tinha rodado as migrations anteriores em `public` e quer **preservar os dados existentes**, rode este SQL **antes** das migrations novas (ou em vez delas, se o schema antigo estiver completo):

```sql
create schema if not exists pmo;

alter table public.playbooks            set schema pmo;
alter table public.playbooks_historico  set schema pmo;
alter table public.onboardings          set schema pmo;
alter table public.ferramentas          set schema pmo;
alter table public.cursos               set schema pmo;
alter table public.ferramenta_alocacoes set schema pmo;
alter table public.curso_alocacoes      set schema pmo;
alter table public.fornecedores         set schema pmo;
alter table public.setores              set schema pmo;
alter table public.cargos               set schema pmo;
alter table public.perfis_usuario       set schema pmo;

alter function public.handle_novo_usuario() set schema pmo;

-- Re-cria o trigger apontando para a função no schema novo.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function pmo.handle_novo_usuario();
```

Depois rode a `009_expor_pmo.sql` para corrigir grants e adicione `pmo` aos schemas expostos no painel.

## Promover usuário a RH (admin master)

Substitua o email e rode no SQL Editor:

```sql
insert into pmo.perfis_usuario (user_id, role, updated_at)
select id, 'rh', now()
  from auth.users
 where email = 'seu@email.com'
on conflict (user_id) do update
  set role = 'rh',
      updated_at = now();
```
