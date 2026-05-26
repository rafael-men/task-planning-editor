# Editor de Playbooks e Onboardings 

Painel web onde o time de RH gerencia:

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
- **Backend**: Node + Express 4 + TypeScript + Zod.
- **Banco**: Supabase (Postgres) — schema dedicado `pmo`.
- **Auth**: Supabase Auth (email/senha). JWT no header `Authorization: Bearer`.
- **LLM**: OpenAI (`gpt-4o-mini` por padrão), com `web_search_preview` para boas práticas atualizadas de onboarding.

## Setup

### 1. Supabase

1. Crie um projeto em <https://supabase.com>.
2. **No SQL Editor, rode em ordem** os arquivos de `backend/migrations/` (001 → 012). Detalhes em [`backend/migrations/README.md`](backend/migrations/README.md).
3. **Project Settings → API → Exposed schemas**: adicione `pmo` (fica `public, graphql_public, pmo`). Sem isso, a REST API retorna 404.
4. Copie `Project URL`, `anon key` e `service_role` key.

### 2. Backend

```bash
cd backend
cp .env.example .env
# preencha SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
npm install
npm run dev          # ou: npm run build && npm start
```

Sobe em `http://localhost:3001`.

### 3. Frontend

```bash
cd client
cp .env.example .env
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (mesmos do backend)
npm install
npm run dev
```

Sobe em `http://localhost:5173`. O Vite proxia `/api → backend`.

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
backend/
  migrations/            # SQL para rodar no Supabase (001..012)
  src/
    index.ts             # Express + helmet + cors + rotas
    middleware/
      auth.ts            # requireAuth, requireRH, requireAdmin
      rateLimit.ts       # llmRateLimit, authRateLimit
    routes/
      playbooks.ts
      prompt.ts          # POST /:id/prompt/preview
      me.ts              # GET/PATCH /me
      admin.ts           # GET/PATCH /admin/perfis (só admin)
      catalogo.ts        # GET /catalogo/{lideres,setores,cargos,ferramentas}
      onboardings/
        index.ts         # router
        listar.ts        # GET / e GET /:id (com enriquecimento do fornecedor)
        persistir.ts     # POST /, PATCH /:id
        preview.ts       # POST /preview, POST /:id/prompt/preview
        progresso.ts     # PATCH /:id/progresso
        acesso.ts        # aplicarEscopoOnboarding (admin/rh vê tudo, líder vê seus)
        selects.ts       # strings de SELECT do PostgREST
    services/
      supabase.ts        # service_role, anon, supabaseForUser(token)
      llm.ts             # edição de playbook
      catalogo/          # hierarquia, cascata (escopo global+setor+cargo+senioridade)
      llm-onboarding/    # cliente, prompts, pesquisa web, fluxo
    types.ts             # Zod schemas (conteúdo, progresso, onboarding etc.)

client/
  src/
    api/
      client.ts          # barrel: re-exporta types + api plana
      types.ts           # todos os types da API
      request.ts         # fetch wrapper (JWT, timeout 60s, erro JSON)
      endpoints/         # playbooks, onboardings, catalogo, me, admin
    auth/
      AuthProvider.tsx   # session + me (role) + isAdmin/isRH/isLider
      RequireAuth.tsx
      RequireRH.tsx      # exporta RequireAdmin também
    components/
      AppLayout.tsx      # header, menu (varia por papel)
      onboarding/
        OnboardingForm.tsx     # form principal (~140 linhas)
        form/
          IdentificacaoFieldset.tsx
          AlocacaoFieldset.tsx
          useCatalogos.ts      # hook de líderes/setores/cargos
        OnboardingEditor.tsx
        ModuloEditor.tsx       # composição de:
        modulo/
          CabecalhoModulo.tsx
          ListaAtividades.tsx
          ListaCursos.tsx
          AvaliacaoEditor.tsx
        OnboardingView.tsx
        OnboardingPromptReview.tsx
        ProgressoOnboarding.tsx  # barra + chips de status por módulo
      ui/                  # Card, PageHeader, EmptyState etc.
    pages/
      Home.tsx             # dashboard de atividade
      Playbooks.tsx        # lista + criar
      Playbook.tsx         # detail
      Onboardings.tsx      # lista
      OnboardingNew.tsx    # form → preview → aprovar
      OnboardingDetail.tsx # detail (usa onboarding-detail/*)
      onboarding-detail/
        OnboardingHeader.tsx
        useOnboardingDetail.ts   # estado e operações
      Perfil.tsx           # com badge de role
      AdminPerfis.tsx      # gestão de papéis (só admin)
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
| POST | `/api/playbooks/:id/prompt/preview` | Owner (com rate limit) |

### Onboardings

| Método | Rota | Quem |
| --- | --- | --- |
| GET | `/api/onboardings` | admin/rh: todos · líder: onde é fornecedor |
| GET | `/api/onboardings/:id` | idem (com filtro) |
| POST | `/api/onboardings/preview` | admin/rh (rate limit) |
| POST | `/api/onboardings` | admin/rh |
| PATCH | `/api/onboardings/:id` | admin/rh edita tudo · líder edita só conteúdo |
| DELETE | `/api/onboardings/:id` | admin/rh |
| POST | `/api/onboardings/:id/prompt/preview` | admin/rh ou fornecedor (rate limit) |
| PATCH | `/api/onboardings/:id/progresso` | admin/rh ou fornecedor |

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

1. Resolve a **hierarquia** (fornecedor = usuário líder; setor; cargo; senioridade).
2. Carrega o **catálogo aplicável** (cascata: ferramentas globais + do setor + do cargo + por senioridade), agrupando por nível de especificidade.
3. Faz **pesquisa web** (OpenAI `web_search_preview`) sobre boas práticas atuais para a combinação cargo + senioridade.
4. Chama o LLM (`gpt-4o-mini` com `response_format: json_object`) passando catálogo + briefing + dados do colaborador.
5. **Valida** o JSON contra schema Zod antes de devolver ao frontend.
6. Frontend mostra preview → usuário aprova, ajusta à mão ou pede pra regerar.

## Segurança

- `service_role` key **só no backend**. Frontend usa anon key + JWT do usuário.
- **Helmet** + body limit 1MB + CORS configurável.
- **Rate limit** nas rotas LLM (8 req/min por user) e auth (10 req/15min por IP).
- Validação **Zod dupla**: entrada do usuário e saída do LLM antes de gravar.
- RLS habilitada em todas as tabelas como defesa em profundidade (backend usa service_role e filtra manualmente por owner/escopo).
- Singleton de admin garantido por índice único parcial.

