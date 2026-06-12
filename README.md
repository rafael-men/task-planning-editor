# Criador e Editor de Processos Operacionais de Acompanhamento de Contratações

A aplicação consiste em um painel web onde o time de RH gerencia:

- **Playbooks** — processos operacionais (ex.: "Desenvolvimento de LP") editáveis por linguagem natural.
- **Onboardings** — trilhas de treinamento personalizadas para cada nova contratação, geradas por IA a partir de Setor + Cargo + Senioridade + Fornecedor (líder responsável).
- **Acompanhamento** — status por módulo (pendente / em andamento / concluído), com barra de progresso.

## Papéis

| Papel | Pode |
| --- | --- |
| **admin** (singleton) | Tudo: promover/rebaixar usuários, gerenciar catálogo, criar/editar/apagar qualquer playbook ou onboarding. |
| **rh** | Criar, editar e apagar onboardings de qualquer setor. Atribui um líder (fornecedor) a cada onboarding. |
| **lider** | Vê e edita apenas onboardings em que ele é o fornecedor responsável. Tem seus próprios playbooks. Acompanha progresso dos seus colaboradores. |

## Stack

- **Frontend**: React 19 + TypeScript + Vite 8 + Tailwind v4 + MUI v7 + lucide-react.
- **Backend**: NestJS 11 + TypeScript + TypeORM + Zod — schema dedicado `pmo` via PostgreSQL direto.
- **Banco**: Supabase (Postgres) — schema dedicado `pmo`.
- **Auth**: Supabase Auth (email/senha). JWT validado no backend via Supabase anon key. `service_role` key usada apenas para operações admin (listar usuários, atualizar metadados).
- **LLM**: Groq (`llama-3.3-70b-versatile` por padrão), com pesquisa web via **Tavily** para boas práticas atualizadas de onboarding.

## Setup

### 1. Supabase

1. Crie um projeto em <https://supabase.com>.
2. **Project Settings → API → Exposed schemas**: adicione `pmo` (fica `public, graphql_public, pmo`). Sem isso, a REST API retorna 404.
3. Copie `Project URL`, `anon key`, `service_role` key e a **connection string** (Settings → Database → Connection string, modo Transaction ou Session).

> O schema `pmo`, todas as tabelas, índices, RLS, trigger e dados seed são criados automaticamente pelo NestJS na primeira inicialização via TypeORM migrations. Nenhum SQL manual é necessário.

### 2. Backend (NestJS)

```bash
cd server
cp .env.example .env   # ou edite .env diretamente
# preencha as variáveis abaixo
npm install
npm run start:dev      # ou: npm run build && npm run start:prod
```

Sobe em `http://localhost:3001`.

**Variáveis obrigatórias:**

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Supabase — para validação de JWT e operações admin
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# TypeORM — PostgreSQL direto (Settings → Database → Connection string)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
DATABASE_SSL=true

# Groq
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile   # opcional

# Tavily (web search para geração de onboarding)
TAVILY_API_KEY=tvly-...
ENABLE_WEB_SEARCH=true
```

### 3. Frontend

```bash
cd client
cp .env.example .env
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (mesmos do backend)
npm install
npm run dev
```

Sobe em `http://localhost:5173`. O Vite proxia `/api → http://localhost:3001`.

### 4. Promover seu usuário a admin

Cadastre-se via tela de signup, depois no SQL Editor:

```sql
update pmo.perfis_usuario
   set role = 'admin', updated_at = now()
 where user_id = (select id from auth.users where email = 'seu@email.com');
```

Logout e login → menu "Acessos" passa a aparecer no header.

## Estrutura

```text
server/
  src/
    main.ts                  # Bootstrap: helmet, CORS, body limit 1mb, trust proxy
    app.module.ts            # Módulo raiz: importa todos os módulos e providers
    config/
      database.module.ts     # TypeORM forRootAsync com DATABASE_URL + migrationsRun
      data-source.ts         # DataSource standalone para CLI (migration:run/revert/show)
    migrations/
      1700000000000-InitialSchema.ts  # Schema pmo completo + seed (gerado a partir dos 12 SQLs)
    models/                  # Entidades TypeORM (schema pmo)
      playbook.entity.ts
      playbook-historico.entity.ts
      onboarding.entity.ts
      perfil-usuario.entity.ts
      setor.entity.ts
      cargo.entity.ts
      ferramenta.entity.ts
      curso.entity.ts
      ferramenta-alocacao.entity.ts
      curso-alocacao.entity.ts
    lib/                     # Guards, decorators e schemas compartilhados
      auth.guard.ts          # Valida JWT via Supabase, carrega perfil via TypeORM
      roles.guard.ts         # @Roles('admin', 'rh') — verifica role do usuário
      llm-throttler.guard.ts # Rate limit por user ID (não por IP)
      current-user.decorator.ts
      roles.decorator.ts
      user-ctx.ts            # Tipo UserCtx + helpers ehRHouAdmin/ehAdmin
      schemas.ts             # Todos os schemas Zod (fonte única de verdade)
    services/
      supabase.service.ts    # JWT validation + auth.admin.* (service_role)
      llm.service.ts         # Groq (llama-3.3-70b) + Tavily web search
      catalogo.service.ts    # Hierarquia + cascata via TypeORM
      playbooks.service.ts   # CRUD de playbooks + preview prompt
      onboardings.service.ts # CRUD + preview geração + preview prompt + progresso
    controller/
      playbooks.controller.ts
      onboardings.controller.ts
      me.controller.ts
      catalogo.controller.ts
      admin.controller.ts
    utils/
      catalogo-prompts.ts    # System prompts e formatadores para o LLM

client/
  src/
    api/
      client.ts              # barrel: re-exporta types + api plana
      types.ts               # todos os types da API
      request.ts             # fetch wrapper (JWT, timeout 60s, erro JSON)
      endpoints/             # playbooks, onboardings, catalogo, me, admin
    auth/
      AuthProvider.tsx       # session + me (role) + isAdmin/isRH/isLider
      RequireAuth.tsx
      RequireRH.tsx          # exporta RequireAdmin também
    components/
      AppLayout.tsx          # header, menu (varia por papel)
      onboarding/
        OnboardingForm.tsx
        form/
          IdentificacaoFieldset.tsx
          AlocacaoFieldset.tsx
          useCatalogos.ts
        OnboardingEditor.tsx
        ModuloEditor.tsx
        modulo/
          CabecalhoModulo.tsx
          ListaAtividades.tsx
          ListaCursos.tsx
          AvaliacaoEditor.tsx
        OnboardingView.tsx
        OnboardingPromptReview.tsx
        ProgressoOnboarding.tsx
      ui/                    # Card, PageHeader, EmptyState etc.
    pages/
      Home.tsx               # dashboard de atividade
      Playbooks.tsx
      Playbook.tsx
      Onboardings.tsx
      OnboardingNew.tsx      # form → preview → aprovar
      OnboardingDetail.tsx
      onboarding-detail/
        OnboardingHeader.tsx
        useOnboardingDetail.ts
      Perfil.tsx
      AdminPerfis.tsx        # gestão de papéis (só admin)
```

## Endpoints principais

### Playbooks

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/api/playbooks` | Qualquer logado (vê os próprios) |
| GET | `/api/playbooks/:id` | Owner |
| POST | `/api/playbooks` | Qualquer logado |
| PATCH | `/api/playbooks/:id` | Owner |
| DELETE | `/api/playbooks/:id` | Owner |
| POST | `/api/playbooks/:id/prompt/preview` | Owner (rate limit: 8/min por usuário) |

### Onboardings

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/api/onboardings` | admin/rh: todos · líder: onde é fornecedor |
| GET | `/api/onboardings/:id` | idem (com filtro de escopo) |
| POST | `/api/onboardings/preview` | admin/rh (rate limit: 8/min por usuário) |
| POST | `/api/onboardings` | admin/rh |
| PATCH | `/api/onboardings/:id` | admin/rh edita tudo · líder edita só conteúdo |
| DELETE | `/api/onboardings/:id` | admin/rh |
| POST | `/api/onboardings/:id/prompt/preview` | admin/rh ou fornecedor (rate limit: 8/min) |
| PATCH | `/api/onboardings/:id/progresso` | admin/rh ou fornecedor responsável |

### Catálogo

| Método | Rota |
| --- | --- |
| GET | `/api/catalogo/lideres` |
| GET | `/api/catalogo/setores` |
| GET | `/api/catalogo/cargos?setor_id=…` |
| GET | `/api/catalogo/ferramentas?setor=…` |

### Identidade

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/api/me` | Qualquer logado |
| PATCH | `/api/me` | Qualquer logado (próprio nome/email) |
| GET | `/api/admin/perfis` | admin/rh |
| PATCH | `/api/admin/perfis/:user_id` | Apenas admin |

## Geração de trilha (LLM)

Para cada onboarding novo, o backend:

1. Resolve a **hierarquia** via TypeORM (fornecedor = usuário líder; setor; cargo; senioridade).
2. Carrega o **catálogo aplicável** (cascata: ferramentas globais + do setor + do cargo + por senioridade), agrupando por nível de especificidade e deduplicando pela alocação mais específica.
3. Faz **pesquisa web** via Tavily sobre boas práticas atuais para a combinação cargo + senioridade.
4. Chama o LLM (Groq `llama-3.3-70b-versatile` com `response_format: json_object`) passando catálogo + briefing + dados do colaborador.
5. **Valida** o JSON contra schema Zod antes de devolver ao frontend.
6. Frontend mostra preview → usuário aprova, ajusta à mão ou pede pra regerar via prompt.

O mesmo fluxo de pesquisa web + LLM é usado para **edição de playbooks** (substituição semântica de ferramentas com briefing de migração).

## Segurança

- `service_role` key **só no backend**. Frontend usa anon key + JWT do usuário.
- **Helmet** (headers de segurança) + body limit 1MB + CORS configurável + `trust proxy` para rate limit correto atrás de proxy.
- **Rate limit** nas rotas LLM: 8 req/min **por user ID** (não por IP), via `LlmThrottlerGuard` customizado.
- Validação **Zod dupla**: entrada do usuário e saída do LLM antes de gravar. Schemas centralizados em `lib/schemas.ts`.
- RLS habilitada em todas as tabelas como defesa em profundidade. Backend usa `service_role` + filtro manual por `owner_id`/escopo para garantir isolamento mesmo sem RLS.
- Singleton de admin garantido por índice único parcial no banco.
- **TypeORM** com `synchronize: false` e `migrationsRun: true` — o schema é criado/atualizado via migrations versionadas ao iniciar. Nunca usa `synchronize: true`.
