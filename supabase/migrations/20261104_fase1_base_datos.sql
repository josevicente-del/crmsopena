-- =====================================================================
-- Fase 1 · Base de datos – CRM Aluminio (Supabase / PostgreSQL)
-- Migración IDEMPOTENTE: se puede ejecutar varias veces sin romper nada.
-- Adapta la tabla `public.prospects` ya existente (no la recrea) y
-- crea `tasks` e `history` normalizadas + RLS.
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. PROSPECTS: columnas nuevas (si no existen)
-- ---------------------------------------------------------------------
create table if not exists public.prospects (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columnas "base" que usa la app (por si la tabla se creó incompleta
-- o se ejecuta en un proyecto vacío). Si ya existen, no se tocan.
alter table public.prospects
  add column if not exists cif                 text,
  add column if not exists zone                text,
  add column if not exists department          text,
  add column if not exists address             text,
  add column if not exists revenue             numeric,
  add column if not exists tier                text,
  add column if not exists b2b_tier            text,
  add column if not exists sector              text,
  add column if not exists products            text,
  add column if not exists email               text,
  add column if not exists secondary_email     text,
  add column if not exists phone               text,
  add column if not exists web                 text,
  add column if not exists purchasing_manager  text,
  add column if not exists purchasing_phone    text,
  add column if not exists purchasing_linkedin text,
  add column if not exists pipeline_stage      text default 'Lead',
  add column if not exists contacted           boolean default false,
  add column if not exists contact_date        timestamptz,
  add column if not exists location            jsonb,
  add column if not exists notes               text,
  add column if not exists tasks               jsonb,
  add column if not exists history             jsonb;

alter table public.prospects
  add column if not exists city            text,
  add column if not exists website         text,
  add column if not exists profile_type    text,
  add column if not exists alloy           text,
  add column if not exists finish          text,
  add column if not exists certamen        text,
  add column if not exists email_verified  boolean default false,
  add column if not exists email_status    text,
  add column if not exists response        text,
  add column if not exists extra           jsonb not null default '{}'::jsonb, -- campos no mapeados
  add column if not exists version         integer not null default 1,          -- concurrencia optimista (Fase 3)
  add column if not exists updated_by      uuid,
  add column if not exists deleted_at      timestamptz,                         -- borrado lógico
  add column if not exists source          text default 'ui';                   -- origen del alta

-- Dominio normalizado (sin http, www ni ruta) para deduplicar
alter table public.prospects
  add column if not exists domain text generated always as (
    nullif(lower(regexp_replace(regexp_replace(coalesce(web, ''), '^https?://(www\.)?', ''), '/.*$', '')), '')
  ) stored;

-- Un dominio = una empresa (ignora vacíos y borrados lógicos)
create unique index if not exists prospects_domain_uq
  on public.prospects (domain) where domain is not null and deleted_at is null;

create index if not exists prospects_zone_idx     on public.prospects (zone);
create index if not exists prospects_pipeline_idx on public.prospects (pipeline_stage);
create index if not exists prospects_updated_idx  on public.prospects (updated_at desc);

-- Validación ligera de email (NOT VALID: no bloquea datos antiguos)
do $$ begin
  alter table public.prospects
    add constraint prospects_email_chk
    check (email is null or email = '' or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2. Secuencia para IDs globales (evita colisiones tipo 0602/0603)
-- ---------------------------------------------------------------------
create sequence if not exists public.prospect_id_seq start 1000;

create or replace function public.next_prospect_id()
returns text language sql volatile as $$
  select 'PROP-LEAD26-' || lpad(nextval('public.prospect_id_seq')::text, 4, '0');
$$;

alter table public.prospects alter column id set default public.next_prospect_id();

-- ---------------------------------------------------------------------
-- 3. TASKS (normalizada)
-- ---------------------------------------------------------------------
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  text not null references public.prospects(id) on delete cascade,
  title        text not null,
  description  text,
  due_date     date,
  done         boolean not null default false,
  priority     text check (priority in ('low','medium','high')) default 'medium',
  version      integer not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid,
  deleted_at   timestamptz
);
create index if not exists tasks_prospect_idx on public.tasks (prospect_id);
create index if not exists tasks_due_idx      on public.tasks (due_date) where done = false;

-- ---------------------------------------------------------------------
-- 4. HISTORY (interacciones comerciales: emails, llamadas, cartas…)
-- ---------------------------------------------------------------------
create table if not exists public.prospect_history (
  id           uuid primary key default gen_random_uuid(),
  prospect_id  text not null references public.prospects(id) on delete cascade,
  event_type   text not null,          -- email, call, letter, meeting, note…
  description  text,
  event_date   timestamptz not null default now(),
  created_by   uuid,
  created_at   timestamptz not null default now()
);
create index if not exists history_prospect_idx on public.prospect_history (prospect_id, event_date desc);

-- ---------------------------------------------------------------------
-- 5. updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.fn_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_touch_prospects on public.prospects;
create trigger trg_touch_prospects before update on public.prospects
  for each row execute function public.fn_touch_updated_at();

drop trigger if exists trg_touch_tasks on public.tasks;
create trigger trg_touch_tasks before update on public.tasks
  for each row execute function public.fn_touch_updated_at();

-- ---------------------------------------------------------------------
-- 6. RLS – Row Level Security
--    Transición: la app hoy usa la clave ANON sin login, así que se
--    permite lectura/escritura a anon+authenticated (como ahora) pero
--    se PROHÍBE el DELETE físico (solo borrado lógico vía deleted_at).
--    En Fase 2/3 se restringirá a `authenticated` cuando haya login.
-- ---------------------------------------------------------------------
alter table public.prospects        enable row level security;
alter table public.tasks            enable row level security;
alter table public.prospect_history enable row level security;

do $$
declare t text;
begin
  foreach t in array array['prospects','tasks','prospect_history'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('create policy "%1$s_select" on public.%1$s for select to anon, authenticated using (true)', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert to anon, authenticated with check (true)', t);
    execute format('create policy "%1$s_update" on public.%1$s for update to anon, authenticated using (true) with check (true)', t);
    -- Sin política DELETE ⇒ DELETE denegado para anon/authenticated
  end loop;
end $$;

commit;

-- Verificación rápida
select 'prospects' as tabla, count(*) from public.prospects
union all select 'tasks', count(*) from public.tasks
union all select 'prospect_history', count(*) from public.prospect_history;

