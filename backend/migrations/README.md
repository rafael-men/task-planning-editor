# Migrations

Rode no SQL Editor do Supabase, **em ordem**:

| Arquivo | Descrição | Obrigatório? |
| --- | --- | --- |
| `001_initial.sql` | Tabelas `playbooks` e `playbooks_historico` | Sim |
| `002_seed.sql` | 2 playbooks de exemplo (sem owner) | Não — pule se for usar só com auth |
| `003_auth_ownership.sql` | `owner_id` + RLS por usuário | Sim |
| `004_onboardings.sql` | Tabela `onboardings` para trilhas de contratação | Sim |

Depois da `003`, todo playbook precisa ter `owner_id`. O backend (com `service_role`) ignora RLS, mas grava sempre com `owner_id` preenchido a partir do JWT do usuário.

Se você rodou o `002_seed.sql` e quer associar os playbooks de exemplo a um usuário existente, rode:

```sql
update public.playbooks
   set owner_id = '<uuid-do-usuario>'
 where owner_id is null;
```
