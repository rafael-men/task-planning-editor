# Editor de Planejamentos 

Painel web para times de RH e líderes gerenciarem **Playbooks operacionais** e **Onboardings** gerados por IA, com acompanhamento de progresso por módulo.

**Versão:** 1.2.0

---

## Funcionalidades

### Playbooks
- Criação com **geração automática por prompt** — descreva o playbook e o Groq gera o conteúdo estruturado na hora.
- Edição por **linguagem natural** — instrua o LLM para aplicar mudanças semânticas (ex: "troque Jira por Linear"), com pesquisa web via Tavily para garantir passos realistas.
- Edição manual por seções, com histórico versionado.
- Rate limit de 8 req/min por usuário nas rotas LLM.

### Onboardings
- **Geração por IA**: o RH preenche Setor + Cargo + Senioridade + Líder → o LLM monta a trilha com módulos, atividades, cursos e critérios de avaliação, enriquecida com pesquisa web de boas práticas.
- Preview antes de salvar — possibilidade de aprovar, descartar ou regenerar.
- Edição por prompt natural na trilha já criada.
- **Acompanhamento de progresso** por módulo: pendente / em andamento / concluído, com barra visual e observações.
- Catálogo hierárquico de ferramentas e cursos — alocação por escopo (global, setor, cargo, senioridade).

### Controle de acesso
- Três papéis: **admin**, **rh**, **lider** — menus, rotas e operações protegidos por role.
- Gestão de papéis de usuários pela tela de Acessos (admin).

### Performance
- Cache em memória de validação de JWT (60 s) e perfil (2 min) no auth guard — elimina round-trips ao Supabase por request.
- Queries de atualização unificadas via QueryBuilder (sem `save` + `update` + `findOne` sequenciais).
- Busca de usuários por ID específico em vez de carregar toda a lista.

---

## Papéis

| Papel | Pode |
|---|---|
| **admin** | Tudo: promover/rebaixar usuários, criar/editar/apagar qualquer playbook ou onboarding. |
| **rh** | Criar e gerenciar onboardings de qualquer setor. Atribuir líder responsável. |
| **lider** | Ver e editar onboardings em que é fornecedor. Gerenciar próprios playbooks. Acompanhar progresso. |

---

## Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite 8 + Tailwind v4 + MUI v9 + lucide-react |
| **Backend** | NestJS 11 + TypeScript + TypeORM + Zod |
| **Banco** | Supabase (PostgreSQL) — schema dedicado `pmo` |
| **Auth** | Supabase Auth (email/senha) — JWT validado no backend |
| **LLM** | Groq `llama-3.3-70b-versatile` + Tavily (web search) |
| **Tema** | Liquid Glass — dark blue → dark red, fonte Forum |

---

## Setup

### 1. Supabase

1. Crie um projeto em <https://supabase.com>.
2. **Project Settings → API → Exposed schemas**: adicione `pmo` (ex: `public, graphql_public, pmo`). Sem isso a REST API retorna 404.
3. Copie `Project URL`, `anon key`, `service_role key` e a **connection string** (Settings → Database → Connection string, modo Transaction ou Session).

> O schema `pmo`, todas as tabelas, índices, RLS, trigger e dados seed são criados automaticamente via TypeORM migrations na primeira inicialização. Nenhum SQL manual é necessário.

### 2. Backend

```bash
cd server
cp .env.example .env   # edite com suas credenciais
npm install
npm run start:dev      # ou: npm run build && npm run start:prod
```

Sobe em `http://localhost:3001`.

**Variáveis obrigatórias:**

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# PostgreSQL direto (TypeORM)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DATABASE_SSL=true

# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile   # opcional

# Tavily (web search na geração de onboardings e edição de playbooks)
TAVILY_API_KEY=tvly-...
ENABLE_WEB_SEARCH=true               # false para desabilitar e reduzir latência LLM

# Admin master (migration automática)
ADMIN_EMAIL=seu@email.com
```

### 3. Frontend

```bash
cd client
cp .env.example .env
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Sobe em `http://localhost:5173`. Vite proxia `/api → http://localhost:3001`.

### 4. Promover usuário a admin

Opção A — via migration automática: defina `ADMIN_EMAIL` no `.env` do servidor antes da primeira inicialização.

Opção B — via SQL Editor do Supabase:

```sql
update pmo.perfis_usuario
   set role = 'admin', updated_at = now()
 where user_id = (select id from auth.users where email = 'seu@email.com');
```

Logout e login → menu "Acessos" aparece no header.

---

## Estrutura

```
server/src/
  main.ts                        # Bootstrap: helmet, CORS, body limit 1 MB, trust proxy
  app.module.ts                  # Módulo raiz
  config/
    database.module.ts           # TypeORM forRootAsync com DATABASE_URL + migrationsRun
    data-source.ts               # DataSource para CLI (migration:run/revert/show)
  migrations/
    1700000000000-InitialSchema  # Schema pmo completo + seed
    1700000000001-AdminMaster    # Upsert da conta admin via ADMIN_EMAIL
  models/                        # Entidades TypeORM (schema pmo)
  lib/
    auth.guard.ts                # JWT cache (60 s) + perfil cache (2 min)
    roles.guard.ts               # @Roles('admin', 'rh')
    llm-throttler.guard.ts       # Rate limit por user ID
    schemas.ts                   # Todos os schemas Zod (fonte única de verdade)
  services/
    supabase.service.ts          # JWT validation + getUsersByIds + auth.admin.*
    llm.service.ts               # Groq + Tavily — gerarPlaybook / aplicarPrompt / gerarOnboarding
    catalogo.service.ts          # Hierarquia + cascata de ferramentas/cursos
    playbooks.service.ts         # CRUD + geração inicial por prompt + preview
    onboardings.service.ts       # CRUD + preview geração + preview prompt + progresso
  controller/                    # playbooks, onboardings, me, catalogo, admin

client/src/
  api/                           # client.ts, types.ts, request.ts, endpoints/
  auth/                          # AuthProvider, RequireAuth, RequireRH
  components/
    AppLayout.tsx                # Header glass + navegação por papel
    AppFooter.tsx                # Versão + ano
    onboarding/                  # Form, Editor, View, PromptReview, Progresso
    ui/                          # Card, PageHeader, EmptyState
  pages/                         # Home, Playbooks, Playbook, Onboardings, OnboardingNew,
                                 # OnboardingDetail, Perfil, AdminPerfis
  theme/ThemeProvider.tsx        # MUI dark theme — primary #c0392b / secondary #1a3a5c
  index.css                      # Liquid glass, variáveis CSS, fonte Forum
```

---

## Endpoints

### Playbooks

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/playbooks` | Qualquer logado (vê os próprios) |
| GET | `/api/playbooks/:id` | Owner |
| POST | `/api/playbooks` | Qualquer logado (prompt opcional gera conteúdo via LLM) |
| PATCH | `/api/playbooks/:id` | Owner |
| DELETE | `/api/playbooks/:id` | Owner |
| POST | `/api/playbooks/:id/prompt/preview` | Owner — rate limit 8/min por usuário |

### Onboardings

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/onboardings` | admin/rh: todos · líder: onde é fornecedor |
| GET | `/api/onboardings/:id` | idem (escopo aplicado) |
| POST | `/api/onboardings/preview` | admin/rh — rate limit 8/min |
| POST | `/api/onboardings` | admin/rh |
| PATCH | `/api/onboardings/:id` | admin/rh: tudo · líder: só conteúdo |
| DELETE | `/api/onboardings/:id` | admin/rh |
| POST | `/api/onboardings/:id/prompt/preview` | admin/rh ou fornecedor — rate limit 8/min |
| PATCH | `/api/onboardings/:id/progresso` | admin/rh ou fornecedor responsável |

### Catálogo

| Método | Rota |
|---|---|
| GET | `/api/catalogo/lideres` |
| GET | `/api/catalogo/setores` |
| GET | `/api/catalogo/cargos?setor_id=…` |
| GET | `/api/catalogo/ferramentas?setor=…` |

### Identidade / Admin

| Método | Rota | Quem |
|---|---|---|
| GET | `/api/me` | Qualquer logado |
| PATCH | `/api/me` | Qualquer logado (próprio nome/email) |
| GET | `/api/admin/perfis` | admin/rh |
| PATCH | `/api/admin/perfis/:user_id` | Apenas admin |

---

## Fluxo LLM — Geração de Onboarding

1. Resolve hierarquia via TypeORM (fornecedor, setor, cargo, senioridade).
2. Carrega catálogo aplicável com cascata de especificidade (global → setor → cargo → senioridade), deduplicando pela alocação mais específica.
3. Pesquisa web via Tavily sobre boas práticas para a combinação cargo + senioridade.
4. Chama Groq (`llama-3.3-70b-versatile`, `response_format: json_object`) com catálogo + briefing + dados.
5. Valida JSON contra schema Zod antes de devolver.
6. Frontend exibe preview → usuário aprova, ajusta manualmente ou regera via prompt.

---

## Segurança

- `service_role` key exclusiva do backend. Frontend usa apenas anon key + JWT do usuário.
- **Helmet** + body limit 1 MB + CORS configurável + `trust proxy`.
- Rate limit nas rotas LLM: 8 req/min por `user_id` (não por IP) via `LlmThrottlerGuard`.
- Validação Zod dupla: entrada do usuário **e** saída do LLM antes de gravar.
- RLS habilitada em todas as tabelas como defesa em profundidade. Backend usa `service_role` + filtro manual por `owner_id`/escopo.
- Singleton de admin garantido por índice único parcial no banco.
- `synchronize: false` + `migrationsRun: true` — schema criado via migrations versionadas, nunca por sync automático.
