import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`create extension if not exists pgcrypto`);
    await queryRunner.query(`create schema if not exists pmo`);

  
    await queryRunner.query(`
      create table if not exists pmo.playbooks (
        id          uuid primary key default gen_random_uuid(),
        nome        text not null,
        descricao   text,
        conteudo    jsonb not null default '{}'::jsonb,
        owner_id    uuid references auth.users(id) on delete cascade,
        versao      int  not null default 1,
        created_at  timestamptz not null default now(),
        updated_at  timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create unique index if not exists playbooks_owner_nome_idx
        on pmo.playbooks(owner_id, nome)
    `);
    await queryRunner.query(`
      create index if not exists playbooks_owner_id_idx
        on pmo.playbooks(owner_id)
    `);

    await queryRunner.query(`
      create table if not exists pmo.playbooks_historico (
        id           uuid primary key default gen_random_uuid(),
        playbook_id  uuid not null references pmo.playbooks(id) on delete cascade,
        conteudo     jsonb not null,
        versao       int  not null,
        prompt       text,
        created_at   timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create index if not exists playbooks_historico_playbook_id_idx
        on pmo.playbooks_historico(playbook_id, versao desc)
    `);

   
    await queryRunner.query(`
      create table if not exists pmo.setores (
        id          uuid primary key default gen_random_uuid(),
        slug        text not null unique,
        nome        text not null,
        descricao   text,
        created_at  timestamptz not null default now()
      )
    `);

    await queryRunner.query(`
      create table if not exists pmo.cargos (
        id          uuid primary key default gen_random_uuid(),
        setor_id    uuid not null references pmo.setores(id) on delete restrict,
        nome        text not null,
        descricao   text,
        created_at  timestamptz not null default now(),
        unique (setor_id, nome)
      )
    `);
    await queryRunner.query(`
      create index if not exists cargos_setor_idx on pmo.cargos(setor_id)
    `);

    
    await queryRunner.query(`
      create table if not exists pmo.ferramentas (
        id            uuid primary key default gen_random_uuid(),
        nome          text not null unique,
        descricao     text not null,
        setores       text[] not null default '{}',
        nivel_minimo  text not null default 'junior'
                      check (nivel_minimo in ('estagio','junior','pleno','senior','especialista')),
        created_at    timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create index if not exists ferramentas_setores_idx
        on pmo.ferramentas using gin(setores)
    `);

    await queryRunner.query(`
      create table if not exists pmo.cursos (
        id            uuid primary key default gen_random_uuid(),
        nome          text not null,
        link          text,
        ferramenta_id uuid references pmo.ferramentas(id) on delete set null,
        setores       text[] not null default '{}',
        duracao_horas int,
        formato       text check (formato in ('video','livro','workshop','documentacao','curso_online','mentoria')),
        created_at    timestamptz not null default now()
      )
    `);
    await queryRunner.query(`create index if not exists cursos_ferramenta_idx on pmo.cursos(ferramenta_id)`);
    await queryRunner.query(`create index if not exists cursos_setores_idx on pmo.cursos using gin(setores)`);

  
    await queryRunner.query(`
      create table if not exists pmo.ferramenta_alocacoes (
        id              uuid primary key default gen_random_uuid(),
        ferramenta_id   uuid not null references pmo.ferramentas(id) on delete cascade,
        escopo          text not null check (escopo in ('global','setor','cargo','senioridade')),
        alvo_id         uuid,
        alvo_slug       text,
        obrigatoriedade text not null default 'obrigatoria'
                        check (obrigatoriedade in ('obrigatoria','sugerida')),
        created_at      timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create index if not exists ferramenta_alocacoes_lookup
        on pmo.ferramenta_alocacoes(escopo, alvo_id, alvo_slug)
    `);
    await queryRunner.query(`
      create index if not exists ferramenta_alocacoes_ferramenta_idx
        on pmo.ferramenta_alocacoes(ferramenta_id)
    `);

    await queryRunner.query(`
      create table if not exists pmo.curso_alocacoes (
        id              uuid primary key default gen_random_uuid(),
        curso_id        uuid not null references pmo.cursos(id) on delete cascade,
        escopo          text not null check (escopo in ('global','setor','cargo','senioridade')),
        alvo_id         uuid,
        alvo_slug       text,
        obrigatoriedade text not null default 'obrigatoria'
                        check (obrigatoriedade in ('obrigatoria','sugerida')),
        created_at      timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create index if not exists curso_alocacoes_lookup
        on pmo.curso_alocacoes(escopo, alvo_id, alvo_slug)
    `);
    await queryRunner.query(`
      create index if not exists curso_alocacoes_curso_idx
        on pmo.curso_alocacoes(curso_id)
    `);

    
    await queryRunner.query(`
      create table if not exists pmo.perfis_usuario (
        user_id    uuid primary key references auth.users(id) on delete cascade,
        role       text not null default 'lider'
                   check (role in ('admin','rh','lider')),
        setor_id   uuid references pmo.setores(id) on delete set null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create index if not exists perfis_setor_idx on pmo.perfis_usuario(setor_id)
    `);
    await queryRunner.query(`
      create unique index if not exists perfis_admin_singleton_idx
        on pmo.perfis_usuario((1)) where role = 'admin'
    `);

    
    await queryRunner.query(`
      create table if not exists pmo.onboardings (
        id                 uuid primary key default gen_random_uuid(),
        owner_id           uuid references auth.users(id) on delete cascade,
        nome               text not null,
        setor              text,
        lider              text,
        cargo              text,
        descricao          text,
        data_inicio        date,
        senioridade        text check (senioridade in ('estagio','junior','pleno','senior','especialista')),
        conteudo           jsonb not null default '{}'::jsonb,
        progresso          jsonb not null default '{}'::jsonb,
        versao             int  not null default 1,
        fornecedor_user_id uuid references auth.users(id) on delete set null,
        setor_id           uuid references pmo.setores(id) on delete set null,
        cargo_id           uuid references pmo.cargos(id) on delete set null,
        created_at         timestamptz not null default now(),
        updated_at         timestamptz not null default now()
      )
    `);
    await queryRunner.query(`
      create index if not exists onboardings_owner_id_idx
        on pmo.onboardings(owner_id, updated_at desc)
    `);
    await queryRunner.query(`
      create index if not exists onboardings_fornecedor_user_idx
        on pmo.onboardings(fornecedor_user_id)
    `);
    await queryRunner.query(`
      create index if not exists onboardings_setor_idx on pmo.onboardings(setor_id)
    `);
    await queryRunner.query(`
      create index if not exists onboardings_cargo_idx on pmo.onboardings(cargo_id)
    `);
    await queryRunner.query(`
      create index if not exists onboardings_progresso_idx
        on pmo.onboardings using gin(progresso)
    `);

  
    await queryRunner.query(`
      create or replace function pmo.handle_novo_usuario()
      returns trigger
      language plpgsql
      security definer
      set search_path = pmo, public
      as $$
      begin
        insert into pmo.perfis_usuario (user_id, role)
        values (new.id, 'lider')
        on conflict (user_id) do nothing;
        return new;
      end;
      $$
    `);
    await queryRunner.query(`
      drop trigger if exists on_auth_user_created on auth.users
    `);
    await queryRunner.query(`
      create trigger on_auth_user_created
        after insert on auth.users
        for each row execute function pmo.handle_novo_usuario()
    `);

  
    await queryRunner.query(`alter table pmo.playbooks enable row level security`);
    await queryRunner.query(`alter table pmo.playbooks_historico enable row level security`);
    await queryRunner.query(`alter table pmo.onboardings enable row level security`);
    await queryRunner.query(`alter table pmo.ferramentas enable row level security`);
    await queryRunner.query(`alter table pmo.cursos enable row level security`);
    await queryRunner.query(`alter table pmo.setores enable row level security`);
    await queryRunner.query(`alter table pmo.cargos enable row level security`);
    await queryRunner.query(`alter table pmo.ferramenta_alocacoes enable row level security`);
    await queryRunner.query(`alter table pmo.curso_alocacoes enable row level security`);
    await queryRunner.query(`alter table pmo.perfis_usuario enable row level security`);

    await queryRunner.query(`
      drop policy if exists "playbooks owner select" on pmo.playbooks;
      create policy "playbooks owner select" on pmo.playbooks
        for select using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "playbooks owner insert" on pmo.playbooks;
      create policy "playbooks owner insert" on pmo.playbooks
        for insert with check (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "playbooks owner update" on pmo.playbooks;
      create policy "playbooks owner update" on pmo.playbooks
        for update using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "playbooks owner delete" on pmo.playbooks;
      create policy "playbooks owner delete" on pmo.playbooks
        for delete using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "historico owner select" on pmo.playbooks_historico;
      create policy "historico owner select" on pmo.playbooks_historico
        for select using (
          exists (select 1 from pmo.playbooks p
                  where p.id = playbook_id and p.owner_id = auth.uid())
        )
    `);
    await queryRunner.query(`
      drop policy if exists "onboardings owner select" on pmo.onboardings;
      create policy "onboardings owner select" on pmo.onboardings
        for select using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "onboardings owner insert" on pmo.onboardings;
      create policy "onboardings owner insert" on pmo.onboardings
        for insert with check (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "onboardings owner update" on pmo.onboardings;
      create policy "onboardings owner update" on pmo.onboardings
        for update using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "onboardings owner delete" on pmo.onboardings;
      create policy "onboardings owner delete" on pmo.onboardings
        for delete using (auth.uid() = owner_id)
    `);
    await queryRunner.query(`
      drop policy if exists "ferramentas read" on pmo.ferramentas;
      create policy "ferramentas read" on pmo.ferramentas
        for select to authenticated using (true)
    `);
    await queryRunner.query(`
      drop policy if exists "cursos read" on pmo.cursos;
      create policy "cursos read" on pmo.cursos
        for select to authenticated using (true)
    `);
    await queryRunner.query(`
      drop policy if exists "setores read" on pmo.setores;
      create policy "setores read" on pmo.setores
        for select to authenticated using (true)
    `);
    await queryRunner.query(`
      drop policy if exists "cargos read" on pmo.cargos;
      create policy "cargos read" on pmo.cargos
        for select to authenticated using (true)
    `);
    await queryRunner.query(`
      drop policy if exists "ferramenta_alocacoes read" on pmo.ferramenta_alocacoes;
      create policy "ferramenta_alocacoes read" on pmo.ferramenta_alocacoes
        for select to authenticated using (true)
    `);
    await queryRunner.query(`
      drop policy if exists "curso_alocacoes read" on pmo.curso_alocacoes;
      create policy "curso_alocacoes read" on pmo.curso_alocacoes
        for select to authenticated using (true)
    `);
    await queryRunner.query(`
      drop policy if exists "perfis read self" on pmo.perfis_usuario;
      create policy "perfis read self" on pmo.perfis_usuario
        for select using (auth.uid() = user_id)
    `);
    await queryRunner.query(`
      drop policy if exists "perfis rh+ read all" on pmo.perfis_usuario;
      create policy "perfis rh+ read all" on pmo.perfis_usuario
        for select using (
          exists (select 1 from pmo.perfis_usuario p
                  where p.user_id = auth.uid() and p.role in ('admin','rh'))
        )
    `);
    await queryRunner.query(`
      drop policy if exists "perfis admin write all" on pmo.perfis_usuario;
      create policy "perfis admin write all" on pmo.perfis_usuario
        for update using (
          exists (select 1 from pmo.perfis_usuario p
                  where p.user_id = auth.uid() and p.role = 'admin')
        )
    `);

  
    await queryRunner.query(`grant usage on schema pmo to anon, authenticated, service_role`);
    await queryRunner.query(`
      grant select, insert, update, delete on all tables in schema pmo
        to anon, authenticated, service_role
    `);
    await queryRunner.query(`
      grant usage, select on all sequences in schema pmo
        to anon, authenticated, service_role
    `);
    await queryRunner.query(`
      grant execute on all functions in schema pmo
        to anon, authenticated, service_role
    `);
    await queryRunner.query(`
      alter default privileges in schema pmo
        grant select, insert, update, delete on tables
        to anon, authenticated, service_role
    `);
    await queryRunner.query(`
      alter default privileges in schema pmo
        grant usage, select on sequences
        to anon, authenticated, service_role
    `);
    await queryRunner.query(`
      alter default privileges in schema pmo
        grant execute on functions
        to anon, authenticated, service_role
    `);


    await queryRunner.query(`
      insert into pmo.setores (slug, nome, descricao) values
        ('tecnologia', 'Tecnologia',  'Engenharia de software, dados e infra.'),
        ('design',     'Design',      'UI/UX, motion, identidade visual.'),
        ('social',     'Social',      'Mídias sociais, marketing de conteúdo, criação.'),
        ('vendas',     'Vendas',      'Comercial, SDR, account management.'),
        ('bi',         'BI/Dados',    'Business intelligence, analytics, data engineering.'),
        ('operacoes',  'Operações',   'RH, financeiro, administrativo, processos internos.')
      on conflict (slug) do nothing
    `);

 
    await queryRunner.query(`
      insert into pmo.cargos (setor_id, nome, descricao)
      select s.id, v.nome, v.descricao
      from pmo.setores s
      join (values
        ('tecnologia', 'Desenvolvedor(a) Backend',   'Construção de APIs, serviços e integrações.'),
        ('tecnologia', 'Desenvolvedor(a) Frontend',  'Interfaces web, SPAs, integrações com APIs.'),
        ('tecnologia', 'Desenvolvedor(a) Fullstack', 'Backend + frontend, com responsabilidade ponta a ponta.'),
        ('tecnologia', 'Engenheiro(a) de IA',        'Agentes RAG/LLM, pipelines de inferência, prompt engineering.'),
        ('tecnologia', 'Automação (n8n / RPA)',      'Automação de processos internos via low-code.'),
        ('tecnologia', 'DevOps / SRE',               'Infraestrutura, CI/CD, observabilidade.'),
        ('design', 'Designer UI/UX',           'Pesquisa, wireframes, telas e protótipos.'),
        ('design', 'Designer Gráfico',         'Identidade visual, artes para campanhas.'),
        ('design', 'Motion Designer',          'Animações para social, vídeos e UI motion.'),
        ('social', 'Social Media',             'Planejamento e execução de conteúdo em redes sociais.'),
        ('social', 'Redator(a) / Copywriter',  'Texto para social, blog, anúncios.'),
        ('social', 'Gestor(a) de Tráfego Pago','Campanhas de mídia paga (Meta, Google, TikTok).'),
        ('social', 'Editor(a) de Vídeo',       'Edição vertical para Reels/Shorts/TikTok.'),
        ('vendas', 'SDR / BDR',                 'Prospecção ativa, qualificação de leads.'),
        ('vendas', 'Executivo(a) de Vendas',    'Fechamento de contratos, follow-up, propostas.'),
        ('vendas', 'Customer Success',          'Pós-venda, retenção, expansão de conta.'),
        ('bi', 'Analista de BI',           'Dashboards, relatórios, modelagem analítica.'),
        ('bi', 'Engenheiro(a) de Dados',   'Pipelines, data warehouse, ETL/ELT.'),
        ('bi', 'Analista de Dados',        'Análise exploratória, SQL, storytelling com dados.'),
        ('operacoes', 'Analista de RH / People',     'Recrutamento, onboarding, cultura.'),
        ('operacoes', 'Analista Financeiro',         'Conciliações, fluxo de caixa, relatórios.'),
        ('operacoes', 'Coordenador(a) de Operações', 'Processos internos, gestão de projetos.')
      ) as v(setor_slug, nome, descricao)
        on s.slug = v.setor_slug
      on conflict (setor_id, nome) do nothing
    `);

    
    await queryRunner.query(`
      insert into pmo.ferramentas (nome, descricao, setores, nivel_minimo) values
        ('n8n', 'Automação de fluxos low-code, integrações via nós, webhooks, automação de processos internos.', '{tecnologia,operacoes}', 'junior'),
        ('Nest.js', 'Framework Node para backend modular: controllers, providers, DI, integração com Postgres/Supabase.', '{tecnologia}', 'junior'),
        ('API Rest', 'Design de endpoints, status codes, autenticação, versionamento, OpenAPI/Swagger.', '{tecnologia}', 'junior'),
        ('React.js', 'SPA, componentes, hooks, gerenciamento de estado, formulários, integração com APIs.', '{tecnologia}', 'junior'),
        ('Next.js', 'SSR/ISR, app router, server actions, deploy em Vercel, otimizações de performance.', '{tecnologia}', 'pleno'),
        ('Agentes RAG e LLM', 'Prompt engineering, retrieval augmented generation, embeddings, vector stores, tool use, eval.', '{tecnologia,bi}', 'pleno'),
        ('PostgreSQL', 'SQL avançado, índices, EXPLAIN, RLS, materialized views, JSONB.', '{tecnologia,bi}', 'junior'),
        ('Docker', 'Containers, Dockerfile, docker-compose, registries, ambientes reproduzíveis.', '{tecnologia}', 'junior'),
        ('Git e GitHub', 'Branching, PRs, code review, conventional commits, GitHub Actions.', '{tecnologia,design}', 'estagio'),
        ('Figma', 'UI/UX, design system, auto layout, variants, prototipagem, handoff para dev.', '{design,tecnologia}', 'estagio'),
        ('Adobe Illustrator', 'Vetorização, identidade visual, ilustração, exportação para diferentes mídias.', '{design,social}', 'estagio'),
        ('Adobe Photoshop', 'Edição de imagens, fotomontagem, retoque, exportação web.', '{design,social}', 'estagio'),
        ('Adobe After Effects', 'Motion design, animação para social, lower thirds, sound design básico.', '{design,social}', 'junior'),
        ('Meta Business Suite', 'Gestão de páginas, agendamento, monitoramento de métricas Instagram/Facebook.', '{social,vendas}', 'estagio'),
        ('TikTok Ads Manager', 'Campanhas, criativos, públicos, otimização de funil para TikTok.', '{social,vendas}', 'junior'),
        ('Google Ads', 'Campanhas de search/display/PMax, palavras-chave, conversões, otimização de lances.', '{social,vendas}', 'junior'),
        ('CapCut', 'Edição rápida de vídeo vertical para Reels/Shorts/TikTok com templates e legendas.', '{social,design}', 'estagio'),
        ('Notion', 'Documentação, wikis internas, gestão de tarefas leves, briefings.', '{social,design,operacoes,vendas}', 'estagio'),
        ('HubSpot', 'CRM, pipeline, sequência de emails, automações de vendas, relatórios.', '{vendas,operacoes}', 'estagio'),
        ('RD Station', 'CRM e marketing automation focados em mercado BR, lead scoring, fluxos.', '{vendas,social}', 'junior'),
        ('Pipedrive', 'CRM visual por pipeline, atividades, previsões, integrações via API.', '{vendas}', 'junior'),
        ('LinkedIn Sales Navigator', 'Prospecção B2B, filtros avançados, InMail, listas de leads.', '{vendas}', 'junior'),
        ('Looker Studio', 'Dashboards web gratuitos, conectores nativos, compartilhamento por link.', '{bi,social,vendas}', 'estagio'),
        ('Metabase', 'BI open source self-service, queries SQL, dashboards, alertas.', '{bi,tecnologia}', 'junior'),
        ('Power BI', 'Modelagem semântica, DAX, dataflows, relatórios corporativos.', '{bi,operacoes}', 'junior'),
        ('BigQuery', 'Data warehouse serverless, SQL, particionamento, custos por query.', '{bi,tecnologia}', 'pleno'),
        ('dbt', 'Modelagem analítica versionada, testes, documentação, materializações.', '{bi}', 'pleno'),
        ('Jira', 'Gestão ágil, sprints, epics, workflows customizados, integrações.', '{operacoes,tecnologia}', 'estagio'),
        ('Trello', 'Kanban leve para times pequenos, automações via Butler.', '{operacoes,social}', 'estagio'),
        ('Google Workspace', 'Docs, Sheets, Drive, Calendar, Meet — colaboração e arquivos.', '{operacoes,social,vendas,design,tecnologia,bi}', 'estagio'),
        ('Slack', 'Comunicação assíncrona, canais, threads, integrações, slash commands.', '{operacoes,social,vendas,design,tecnologia,bi}', 'estagio'),
        ('Runrunit', 'Gestão de tarefas e cronograma usada por todos os times da Macfor.', '{}', 'estagio'),
        ('Cultura Macfor', 'Manual de cultura, valores, processos e rituais internos.', '{}', 'estagio'),
        ('Hyperlink CRM', 'CRM interno da Macfor para acompanhamento de clientes e contas.', '{}', 'junior'),
        ('Code Review e Mentoria', 'Prática de revisar PRs, dar feedback construtivo, mentorar juniores.', '{}', 'pleno'),
        ('Comunicação com stakeholders', 'Apresentar resultados para liderança, alinhamento com PM/cliente, gestão de expectativas.', '{}', 'pleno'),
        ('Liderança técnica', 'Definição de arquitetura, roadmap técnico, gestão de squad.', '{}', 'senior')
      on conflict (nome) do nothing
    `);

   
    await queryRunner.query(`
      insert into pmo.cursos (nome, link, ferramenta_id, setores, duracao_horas, formato)
      select v.nome, v.link, f.id, v.setores, v.duracao_horas, v.formato
      from pmo.ferramentas f
      join (values
        ('n8n', 'Curso completo de n8n - automações práticas', 'https://docs.n8n.io/courses/', '{tecnologia,operacoes}'::text[], 12, 'curso_online'),
        ('Nest.js', 'NestJS Fundamentals (oficial)', 'https://learn.nestjs.com/', '{tecnologia}'::text[], 20, 'curso_online'),
        ('Nest.js', 'Construindo APIs com NestJS e Prisma', null, '{tecnologia}'::text[], 16, 'workshop'),
        ('API Rest', 'REST API Design - Best Practices', 'https://restfulapi.net/', '{tecnologia}'::text[], 6, 'documentacao'),
        ('React.js', 'React Docs oficial (beta)', 'https://react.dev/learn', '{tecnologia}'::text[], 10, 'documentacao'),
        ('React.js', 'Epic React por Kent C. Dodds', 'https://epicreact.dev/', '{tecnologia}'::text[], 40, 'curso_online'),
        ('Next.js', 'Next.js Learn (oficial)', 'https://nextjs.org/learn', '{tecnologia}'::text[], 8, 'curso_online'),
        ('Agentes RAG e LLM', 'DeepLearning.AI - LangChain & Vector DBs', 'https://www.deeplearning.ai/short-courses/', '{tecnologia}'::text[], 6, 'curso_online'),
        ('Agentes RAG e LLM', 'Anthropic Cookbook - Tool use & RAG patterns', 'https://github.com/anthropics/anthropic-cookbook', '{tecnologia}'::text[], 8, 'documentacao'),
        ('PostgreSQL', 'PostgreSQL Tutorial (oficial)', 'https://www.postgresql.org/docs/current/tutorial.html', '{tecnologia,bi}'::text[], 10, 'documentacao'),
        ('Docker', 'Docker - Get Started (oficial)', 'https://docs.docker.com/get-started/', '{tecnologia}'::text[], 6, 'documentacao'),
        ('Git e GitHub', 'Pro Git book (gratuito)', 'https://git-scm.com/book/en/v2', '{tecnologia,design}'::text[], 8, 'livro'),
        ('Figma', 'Figma Academy (oficial)', 'https://www.figma.com/academy/', '{design,tecnologia}'::text[], 12, 'curso_online'),
        ('Adobe Illustrator', 'Adobe Illustrator Learn & Support', 'https://helpx.adobe.com/illustrator/tutorials.html', '{design,social}'::text[], 14, 'video'),
        ('Adobe Photoshop', 'Photoshop tutoriais oficiais', 'https://helpx.adobe.com/photoshop/tutorials.html', '{design,social}'::text[], 16, 'video'),
        ('Adobe After Effects', 'School of Motion - Animation Bootcamp', 'https://www.schoolofmotion.com/', '{design,social}'::text[], 30, 'curso_online'),
        ('Meta Business Suite', 'Meta Blueprint - certificações gratuitas', 'https://www.facebook.com/business/learn', '{social,vendas}'::text[], 10, 'curso_online'),
        ('TikTok Ads Manager', 'TikTok Academy', 'https://academy.tiktok.com/', '{social,vendas}'::text[], 6, 'curso_online'),
        ('Google Ads', 'Google Skillshop - Google Ads', 'https://skillshop.exceedlms.com/student/catalog', '{social,vendas}'::text[], 12, 'curso_online'),
        ('CapCut', 'CapCut Academy - edição vertical', 'https://www.capcut.com/learn', '{social,design}'::text[], 4, 'video'),
        ('Notion', 'Notion Academy', 'https://www.notion.so/academy', '{social,design,operacoes,vendas}'::text[], 3, 'curso_online'),
        ('HubSpot', 'HubSpot Academy - certificação Sales Hub', 'https://academy.hubspot.com/', '{vendas,operacoes}'::text[], 8, 'curso_online'),
        ('RD Station', 'RD University', 'https://www.rdstation.com/rd-university/', '{vendas,social}'::text[], 6, 'curso_online'),
        ('Pipedrive', 'Pipedrive Academy', 'https://www.pipedrive.com/en/academy', '{vendas}'::text[], 4, 'curso_online'),
        ('LinkedIn Sales Navigator', 'LinkedIn Sales Insider', 'https://business.linkedin.com/sales-solutions/sales-navigator', '{vendas}'::text[], 4, 'documentacao'),
        ('Looker Studio', 'Looker Studio Help - tutoriais', 'https://support.google.com/looker-studio/', '{bi,social,vendas}'::text[], 5, 'documentacao'),
        ('Metabase', 'Metabase Learn', 'https://www.metabase.com/learn', '{bi,tecnologia}'::text[], 8, 'curso_online'),
        ('Power BI', 'Microsoft Learn - Power BI', 'https://learn.microsoft.com/training/powerplatform/power-bi', '{bi,operacoes}'::text[], 20, 'curso_online'),
        ('BigQuery', 'Google Cloud Skills Boost - BigQuery', 'https://www.cloudskillsboost.google/paths/16', '{bi,tecnologia}'::text[], 16, 'curso_online'),
        ('dbt', 'dbt Fundamentals (oficial)', 'https://courses.getdbt.com/courses/fundamentals', '{bi}'::text[], 10, 'curso_online'),
        ('Jira', 'Atlassian University - Jira Fundamentals', 'https://university.atlassian.com/student/catalog', '{operacoes,tecnologia}'::text[], 6, 'curso_online'),
        ('Trello', 'Trello 101 - guia rápido', 'https://trello.com/guide', '{operacoes,social}'::text[], 2, 'documentacao'),
        ('Google Workspace', 'Google Workspace Learning Center', 'https://support.google.com/a/users', '{operacoes,social,vendas,design,tecnologia,bi}'::text[], 4, 'documentacao'),
        ('Slack', 'Slack 101 - introdução', 'https://slack.com/intl/pt-br/help/articles/218080037-Tour-do-Slack', '{operacoes,social,vendas,design,tecnologia,bi}'::text[], 2, 'documentacao')
      ) as v(ferramenta_nome, nome, link, setores, duracao_horas, formato)
        on f.nome = v.ferramenta_nome
      on conflict do nothing
    `);

   
    await queryRunner.query(`
      insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
      select f.id, 'setor', s.id, 'obrigatoria'
      from pmo.ferramentas f
      cross join lateral unnest(f.setores) as fs(slug)
      join pmo.setores s on s.slug = fs.slug
      on conflict do nothing
    `);
    await queryRunner.query(`
      insert into pmo.curso_alocacoes (curso_id, escopo, alvo_id, obrigatoriedade)
      select c.id, 'setor', s.id, 'sugerida'
      from pmo.cursos c
      cross join lateral unnest(c.setores) as cs(slug)
      join pmo.setores s on s.slug = cs.slug
      on conflict do nothing
    `);

   
    await queryRunner.query(`
      insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
      select f.id, 'global', null, 'obrigatoria'
      from pmo.ferramentas f
      where f.nome in ('Runrunit', 'Cultura Macfor', 'Google Workspace', 'Slack', 'Notion')
      on conflict do nothing
    `);
    await queryRunner.query(`
      insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
      select f.id, 'global', null, 'sugerida'
      from pmo.ferramentas f
      where f.nome = 'Hyperlink CRM'
      on conflict do nothing
    `);

   
    await queryRunner.query(`
      insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_id, obrigatoriedade)
      select f.id, 'cargo', c.id, 'obrigatoria'
      from (values
        ('Desenvolvedor(a) Backend',   'Nest.js'),
        ('Desenvolvedor(a) Backend',   'API Rest'),
        ('Desenvolvedor(a) Backend',   'PostgreSQL'),
        ('Desenvolvedor(a) Backend',   'Git e GitHub'),
        ('Desenvolvedor(a) Backend',   'Docker'),
        ('Desenvolvedor(a) Frontend',  'React.js'),
        ('Desenvolvedor(a) Frontend',  'Git e GitHub'),
        ('Desenvolvedor(a) Fullstack', 'Nest.js'),
        ('Desenvolvedor(a) Fullstack', 'React.js'),
        ('Desenvolvedor(a) Fullstack', 'PostgreSQL'),
        ('Desenvolvedor(a) Fullstack', 'Git e GitHub'),
        ('Engenheiro(a) de IA',        'Agentes RAG e LLM'),
        ('Engenheiro(a) de IA',        'API Rest'),
        ('Engenheiro(a) de IA',        'Git e GitHub'),
        ('Automação (n8n / RPA)',      'n8n'),
        ('Automação (n8n / RPA)',      'API Rest'),
        ('DevOps / SRE',               'Docker'),
        ('DevOps / SRE',               'PostgreSQL'),
        ('DevOps / SRE',               'Git e GitHub'),
        ('Designer UI/UX',     'Figma'),
        ('Designer Gráfico',   'Adobe Illustrator'),
        ('Designer Gráfico',   'Adobe Photoshop'),
        ('Motion Designer',    'Adobe After Effects'),
        ('Motion Designer',    'CapCut'),
        ('Social Media',                 'Meta Business Suite'),
        ('Social Media',                 'CapCut'),
        ('Redator(a) / Copywriter',      'Notion'),
        ('Gestor(a) de Tráfego Pago',    'Meta Business Suite'),
        ('Gestor(a) de Tráfego Pago',    'Google Ads'),
        ('Gestor(a) de Tráfego Pago',    'TikTok Ads Manager'),
        ('Editor(a) de Vídeo',           'CapCut'),
        ('Editor(a) de Vídeo',           'Adobe After Effects'),
        ('SDR / BDR',                  'LinkedIn Sales Navigator'),
        ('SDR / BDR',                  'HubSpot'),
        ('Executivo(a) de Vendas',     'HubSpot'),
        ('Executivo(a) de Vendas',     'Pipedrive'),
        ('Customer Success',           'HubSpot'),
        ('Analista de BI',            'Metabase'),
        ('Analista de BI',            'PostgreSQL'),
        ('Engenheiro(a) de Dados',    'BigQuery'),
        ('Engenheiro(a) de Dados',    'dbt'),
        ('Engenheiro(a) de Dados',    'PostgreSQL'),
        ('Analista de Dados',         'PostgreSQL'),
        ('Analista de Dados',         'Looker Studio'),
        ('Analista de RH / People',          'Notion'),
        ('Analista Financeiro',              'Google Workspace'),
        ('Coordenador(a) de Operações',      'Jira')
      ) as v(cargo_nome, ferramenta_nome)
      join pmo.cargos c on c.nome = v.cargo_nome
      join pmo.ferramentas f on f.nome = v.ferramenta_nome
      on conflict do nothing
    `);

  
    await queryRunner.query(`
      insert into pmo.ferramenta_alocacoes (ferramenta_id, escopo, alvo_slug, obrigatoriedade)
      select f.id, 'senioridade', v.alvo, v.obriga
      from pmo.ferramentas f
      join (values
        ('Code Review e Mentoria',       'pleno',        'obrigatoria'),
        ('Code Review e Mentoria',       'senior',       'obrigatoria'),
        ('Code Review e Mentoria',       'especialista', 'obrigatoria'),
        ('Comunicação com stakeholders', 'pleno',        'sugerida'),
        ('Comunicação com stakeholders', 'senior',       'obrigatoria'),
        ('Comunicação com stakeholders', 'especialista', 'obrigatoria'),
        ('Liderança técnica',            'senior',       'sugerida'),
        ('Liderança técnica',            'especialista', 'obrigatoria')
      ) as v(nome, alvo, obriga)
        on f.nome = v.nome
      on conflict do nothing
    `);

    await queryRunner.query(`select pg_notify('pgrst', 'reload schema')`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`drop schema if exists pmo cascade`);
  }
}
