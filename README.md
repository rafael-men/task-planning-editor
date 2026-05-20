# Editor de Playbooks via Prompt

MVP de painel web onde cada Playbook é uma linha no Supabase com conteúdo em JSONB.
O usuário escreve um prompt em linguagem natural e um LLM (OpenAI) aplica a edição
estruturada no conteúdo.

## Stack

- **Frontend**: React + TypeScript + Vite (`client/`)
- **Backend**: Node + Express + TypeScript (`backend/`)
- **Banco**: Supabase (Postgres)
- **LLM**: OpenAI (`gpt-4o-mini` por padrão, configurável)

## Estrutura

```text
backend/
  sql/                     # SQL para rodar no Supabase
    001_schema.sql
    002_seed.sql
  src/
    index.ts               # bootstrap Express
    routes/
      playbooks.ts         # CRUD
      prompt.ts            # edição via IA
    services/
      supabase.ts
      llm.ts
    types.ts               # Zod schemas
  .env.example
client/
  src/
    api/client.ts          # fetch wrapper
    components/            # PlaybookList, PlaybookView, PromptBox, DiffViewer
    pages/                 # Home, Playbook
    App.tsx, main.tsx
  .env.example
```

## Setup

### 1. Supabase

1. Crie um projeto em <https://supabase.com>.
2. No SQL Editor, rode `backend/sql/001_schema.sql` e depois `backend/sql/002_seed.sql`.
3. Em **Project Settings → API**, copie `Project URL` e `service_role` key.

### 2. Backend

```bash
cd backend
cp .env.example .env
# preencha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
npm install
npm run dev
```

Sobe em `http://localhost:3001`.

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

Sobe em `http://localhost:5173`. O Vite tem proxy `/api → backend`.

## Endpoints

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/playbooks` | Lista resumida |
| GET | `/api/playbooks/:id` | Playbook completo |
| POST | `/api/playbooks` | Cria `{ nome, descricao?, conteudo? }` |
| PATCH | `/api/playbooks/:id` | Edição manual (fallback) |
| DELETE | `/api/playbooks/:id` | Remove |
| POST | `/api/playbooks/:id/prompt` | Edita via LLM `{ prompt: string }` |

## Fluxo do `/prompt`

1. Carrega o registro atual no Supabase.
2. Monta o prompt com o JSON atual + instrução do usuário + regra de saída.
3. Chama OpenAI com `response_format: json_object`.
4. Valida o JSON retornado com Zod (mesmo schema do `conteudo`).
5. Salva o `conteudo` anterior em `playbooks_historico`.
6. Atualiza o registro, incrementando `versao` e `updated_at`.
7. Devolve `{ playbook, antes, depois }` para a UI mostrar diff.

## Segurança no MVP

- A `service_role` key fica **só no backend**. O frontend nunca recebe credenciais do Supabase.
- Validação Zod tanto na entrada (`prompt` máx 4000 chars) quanto na saída do LLM antes de gravar.
- Todo update do LLM grava o conteúdo anterior em `playbooks_historico` para permitir auditoria/desfazer.
- RLS pode ser ligado depois — no MVP o backend acessa via service role.

## Próximos passos (fora do MVP)

- Autenticação (Supabase Auth) + RLS por usuário.
- Tela de histórico com botão "desfazer para v{n}".
- Diff semântico (não só JSON cru).
- Validação extra: rejeitar mudança se o LLM removeu/criou seções não mencionadas.
