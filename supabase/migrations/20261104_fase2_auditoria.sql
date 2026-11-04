-- =====================================================================
-- Fase 2 · Auditoría automática (quién · qué · cuándo)
-- CRM Aluminio – Supabase / PostgreSQL. Migración IDEMPOTENTE.
--
-- Registra TODO INSERT/UPDATE/DELETE de prospects, tasks y
-- prospect_history en `audit.log`, venga de la app, de un script o del
-- SQL Editor. La tabla es append-only (no se puede editar ni borrar).
--
-- Identificación del autor (la app aún no tiene login):
--   · auth.uid()                → usuario de Supabase Auth (futuro)
--   · cabecera HTTP x-app-user  → nombre del usuario del CRM
--   · cabecera HTTP x-app-source→ 'ui', 'script:lead_finder', …
--   · si no hay nada            → rol de BD (p.ej. 'postgres' en SQL Editor)
--
-- Ejecutar en: https://supabase.com/dashboard/project/tnmwjeibuqeihdmdggus/sql/new
-- =====================================================================

begin;

create schema if not exists audit;

-- ---------------------------------------------------------------------
-- 1. Tabla de auditoría
-- ---------------------------------------------------------------------
create table if not exists audit.log (
  id              bigint generated always as identity primary key,
  table_name      text        not null,
  record_id       text        not null,
  operation       text        not null check (operation in ('INSERT','UPDATE','DELETE')),
  old_data        jsonb,
  new_data        jsonb,
  changed_fields  jsonb,                 -- { campo: {old, new} } solo en UPDATE
  actor_id        uuid,                  -- auth.uid()
  actor_name      text,                  -- x-app-user o rol de BD
  actor_role      text,                  -- anon / authenticated / service_role / postgres
  source          text,                  -- ui / script:* / sql
  txid            bigint      not null default txid_current(),
  created_at      timestamptz not null default now()
);

create index if not exists audit_log_record_idx on audit.log (table_name, record_id, created_at desc);
create index if not exists audit_log_created_idx on audit.log (created_at desc);

-- Append-only: nadie (salvo el propietario) puede modificar o borrar
revoke all on audit.log from public, anon, authenticated;
revoke usage on schema audit from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 2. Helper: lee una cabecera HTTP de la petición PostgREST (o null)
-- ---------------------------------------------------------------------
create or replace function audit.request_header(p_name text)
returns text language sql stable as $$
  select nullif(current_setting('request.headers', true), '')::jsonb ->> lower(p_name);
$$;

-- ---------------------------------------------------------------------
-- 3. Trigger genérico de auditoría
-- ---------------------------------------------------------------------
create or replace function audit.fn_log_change()
returns trigger
language plpgsql
security definer
set search_path = audit, public
as $$
declare
  v_old  jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  v_new  jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  v_diff jsonb;
  v_role text  := coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                           (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'),
                           current_user);
begin
  -- En UPDATE solo se guardan los campos realmente modificados
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(n.key, jsonb_build_object('old', v_old -> n.key, 'new', n.value))
      into v_diff
      from jsonb_each(v_new) n
     where (v_old -> n.key) is distinct from n.value
       and n.key not in ('updated_at', 'version', 'domain');
    if v_diff is null then
      return new;                         -- UPDATE sin cambios reales: no se registra
    end if;
  end if;

  insert into audit.log (table_name, record_id, operation, old_data, new_data,
                         changed_fields, actor_id, actor_name, actor_role, source)
  values (
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id'),
    tg_op,
    v_old,
    v_new,
    v_diff,
    auth.uid(),
    coalesce(audit.request_header('x-app-user'), current_user),
    v_role,
    coalesce(nullif(current_setting('app.source', true), ''),
             audit.request_header('x-app-source'),
             case when audit.request_header('x-client-info') is null then 'sql' else 'api' end)
  );

  return coalesce(new, old);
end $$;

-- ---------------------------------------------------------------------
-- 4. Enganchar el trigger a las tablas del CRM
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['prospects', 'tasks', 'prospect_history'] loop
    execute format('drop trigger if exists trg_audit_%1$s on public.%1$s', t);
    execute format('create trigger trg_audit_%1$s after insert or update or delete
                    on public.%1$s for each row execute function audit.fn_log_change()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 5. Lectura controlada desde la app (sin exponer el esquema audit)
--    Devuelve el historial de cambios de un registro concreto.
-- ---------------------------------------------------------------------
create or replace function public.get_record_audit(p_record_id text, p_limit int default 50)
returns table (
  created_at timestamptz, operation text, table_name text,
  changed_fields jsonb, actor_name text, source text
)
language sql stable security definer set search_path = audit, public as $$
  select l.created_at, l.operation, l.table_name, l.changed_fields, l.actor_name, l.source
    from audit.log l
   where l.record_id = p_record_id
   order by l.created_at desc
   limit least(p_limit, 500);
$$;

-- Actividad reciente global (para un panel "últimos cambios")
create or replace function public.get_recent_audit(p_limit int default 100)
returns table (
  created_at timestamptz, operation text, table_name text, record_id text,
  changed_fields jsonb, actor_name text, source text
)
language sql stable security definer set search_path = audit, public as $$
  select l.created_at, l.operation, l.table_name, l.record_id, l.changed_fields, l.actor_name, l.source
    from audit.log l
   order by l.created_at desc
   limit least(p_limit, 500);
$$;

revoke all on function public.get_record_audit(text, int) from public;
revoke all on function public.get_recent_audit(int)       from public;
grant execute on function public.get_record_audit(text, int) to anon, authenticated;
grant execute on function public.get_recent_audit(int)       to anon, authenticated;

commit;

-- Refrescar la caché de PostgREST para que vea las nuevas funciones
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Prueba rápida (opcional): descomenta, ejecuta y revisa el resultado
-- ---------------------------------------------------------------------
-- update public.prospects set notes = coalesce(notes,'') || ' ' where id = 'PROP-LEAD26-0001';
-- select * from public.get_record_audit('PROP-LEAD26-0001');

