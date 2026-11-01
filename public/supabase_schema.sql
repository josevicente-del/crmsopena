-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS GLOBAL SUPABASE / POSTGRESQL (GRUPO SOPENA B2B CRM)
-- ==============================================================================
-- Este script crea todas las tablas para persistencia en nube de:
-- 1. Empresas y Prospectos Industriales (prospects)
-- 2. Tareas Centralizadas Multi-Usuario (crm_tasks)
-- 3. Registro de Auditoría de Interacciones de Usuario en Tiempo Real (crm_audit_logs)
-- 4. Registro Permanente de Exclusiones y Competencia (excluded_companies)
-- ==============================================================================

-- 1. TABLA: crm_audit_logs (REGISTRO INDELEBLE DE TODA INTERACCIÓN DE USUARIO)
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    target_name TEXT,
    details TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.crm_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.crm_audit_logs(user_name);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.crm_audit_logs(action);

-- 2. TABLA: prospects (BASE DE DATOS GLOBAL DE PROSPECTOS INDUSTRIALES)
CREATE TABLE IF NOT EXISTS public.prospects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cif TEXT,
    zone TEXT NOT NULL,
    department TEXT,
    address TEXT,
    revenue NUMERIC,
    tier TEXT,
    b2b_tier TEXT,
    sector TEXT,
    products JSONB DEFAULT '[]'::jsonb,
    email TEXT,
    secondary_email TEXT,
    phone TEXT,
    web TEXT,
    purchasing_manager TEXT,
    purchasing_phone TEXT,
    purchasing_linkedin TEXT,
    pipeline_stage TEXT DEFAULT 'Prospección Inicial',
    contacted BOOLEAN DEFAULT FALSE,
    contact_date TIMESTAMPTZ,
    location JSONB DEFAULT '[0,0]'::jsonb,
    notes TEXT,
    tasks JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_zone ON public.prospects(zone);
CREATE INDEX IF NOT EXISTS idx_prospects_sector ON public.prospects(sector);
CREATE INDEX IF NOT EXISTS idx_prospects_cif ON public.prospects(cif);

-- 3. TABLA: crm_tasks (TAREAS CENTRALIZADAS PERSISTENTES)
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id TEXT PRIMARY KEY,
    prospect_id TEXT,
    prospect_name TEXT,
    zone TEXT DEFAULT 'ALL',
    assigned_to TEXT DEFAULT 'admin',
    assigned_to_name TEXT,
    created_by TEXT DEFAULT 'admin',
    text TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    due_date_formatted TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    priority TEXT DEFAULT 'Normal',
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.crm_tasks(completed);

-- 4. TABLA: excluded_companies (EMPRESAS EXCLUIDAS)
CREATE TABLE IF NOT EXISTS public.excluded_companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cif TEXT,
    reason TEXT,
    deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- HABILITAR ROW LEVEL SECURITY (RLS) CON PERMISO DE LECTURA/ESCRITURA ANÓNIMA AUTORIZADA
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.excluded_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica crm_audit_logs" ON public.crm_audit_logs FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica crm_audit_logs" ON public.crm_audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura publica prospects" ON public.prospects FOR SELECT USING (true);
CREATE POLICY "Permitir insercion y actualizacion prospects" ON public.prospects FOR ALL USING (true);

CREATE POLICY "Permitir lectura publica crm_tasks" ON public.crm_tasks FOR SELECT USING (true);
CREATE POLICY "Permitir insercion y actualizacion crm_tasks" ON public.crm_tasks FOR ALL USING (true);

CREATE POLICY "Permitir lectura y modificacion excluded_companies" ON public.excluded_companies FOR ALL USING (true);
