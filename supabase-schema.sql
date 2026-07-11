-- ===========================================================================
-- SHAF NEXUS AI PRO - COMPLETE PRODUCTION SUPABASE DATABASE SCHEMA
-- ===========================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to initialize all 10 required tables, configure Row Level Security (RLS) policies,
-- register automatic triggers, create performance indexes, and set up storage configurations.

-- Disable RLS warning on table creation helper
SET client_min_messages = warning;

-- ===========================================================================
-- 1. PROFILES TABLE (User profiles and preferences)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT, -- Nullable to prevent NOT NULL check failures on standard upserts
    full_name TEXT,
    role TEXT DEFAULT 'Lead Architect',
    avatar TEXT DEFAULT '💻',
    active_theme TEXT DEFAULT 'dark',
    active_db_provider TEXT DEFAULT 'supabase',
    postgres_conn_string TEXT,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    supabase_secret_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read-access to profiles" ON public.profiles;
CREATE POLICY "Allow public read-access to profiles" 
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow individual update of own profile" ON public.profiles;
CREATE POLICY "Allow individual update of own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual insert of own profile" ON public.profiles;
CREATE POLICY "Allow individual insert of own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Allow individual delete of own profile" ON public.profiles;
CREATE POLICY "Allow individual delete of own profile"
    ON public.profiles FOR DELETE USING (auth.uid() = id);


-- ===========================================================================
-- 2. PROJECTS TABLE (Stores workspace project metadata)
-- ===========================================================================
-- Note: project ID is stored as TEXT so that standard local strings like 'default' 
-- are fully supported alongside standard generated random UUIDs.
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    is_favorited BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    framework TEXT DEFAULT 'react',
    language TEXT DEFAULT 'typescript',
    last_opened TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    project_icon TEXT DEFAULT '💻',
    color TEXT DEFAULT 'teal',
    tags JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own projects" ON public.projects;
CREATE POLICY "Allow users to view own projects" 
    ON public.projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own projects" ON public.projects;
CREATE POLICY "Allow users to insert own projects" 
    ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own projects" ON public.projects;
CREATE POLICY "Allow users to update own projects" 
    ON public.projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own projects" ON public.projects;
CREATE POLICY "Allow users to delete own projects" 
    ON public.projects FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 3. PROJECT_FILES TABLE (Stores code files, contents, paths)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id TEXT REFERENCES public.projects ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL, -- e.g. "/src/components/Card.tsx"
    content TEXT,
    size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'text/plain',
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, path)
);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own project files" ON public.project_files;
CREATE POLICY "Allow users to view own project files" 
    ON public.project_files FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own project files" ON public.project_files;
CREATE POLICY "Allow users to insert own project files" 
    ON public.project_files FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own project files" ON public.project_files;
CREATE POLICY "Allow users to update own project files" 
    ON public.project_files FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own project files" ON public.project_files;
CREATE POLICY "Allow users to delete own project files" 
    ON public.project_files FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 4. CHAT_SESSIONS TABLE (Chat session management)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Engineering Session' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own chat sessions" ON public.chat_sessions;
CREATE POLICY "Allow users to view own chat sessions" 
    ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own chat sessions" ON public.chat_sessions;
CREATE POLICY "Allow users to insert own chat sessions" 
    ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own chat sessions" ON public.chat_sessions;
CREATE POLICY "Allow users to update own chat sessions" 
    ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own chat sessions" ON public.chat_sessions;
CREATE POLICY "Allow users to delete own chat sessions" 
    ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 5. CHAT_HISTORY TABLE (Individual messaging loops)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.chat_sessions ON DELETE CASCADE,
    project_id TEXT REFERENCES public.projects ON DELETE CASCADE, -- Text reference to support 'default' or UUIDs
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL, -- e.g. "12:04 PM"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own chats" ON public.chat_history;
CREATE POLICY "Allow users to view own chats" 
    ON public.chat_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own chats" ON public.chat_history;
CREATE POLICY "Allow users to insert own chats" 
    ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own chats" ON public.chat_history;
CREATE POLICY "Allow users to update own chats" 
    ON public.chat_history FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own chats" ON public.chat_history;
CREATE POLICY "Allow users to delete own chats" 
    ON public.chat_history FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 6. USER_API_KEYS TABLE (API Keys configuration manager)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.user_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL, -- 'gemini', 'openai', 'openrouter', 'anthropic', 'deepseek'
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own API keys" ON public.user_api_keys;
CREATE POLICY "Allow users to view own API keys" 
    ON public.user_api_keys FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own API keys" ON public.user_api_keys;
CREATE POLICY "Allow users to insert own API keys" 
    ON public.user_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own API keys" ON public.user_api_keys;
CREATE POLICY "Allow users to update own API keys" 
    ON public.user_api_keys FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own API keys" ON public.user_api_keys;
CREATE POLICY "Allow users to delete own API keys" 
    ON public.user_api_keys FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 7. USER_INTEGRATIONS TABLE (GitHub, Vercel tokens and configurations)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    integration_name TEXT NOT NULL, -- 'github', 'vercel', etc.
    token TEXT,
    repo_name TEXT,
    branch_name TEXT DEFAULT 'main',
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, integration_name)
);

-- Enable RLS
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own integrations" ON public.user_integrations;
CREATE POLICY "Allow users to view own integrations" 
    ON public.user_integrations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own integrations" ON public.user_integrations;
CREATE POLICY "Allow users to insert own integrations" 
    ON public.user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own integrations" ON public.user_integrations;
CREATE POLICY "Allow users to update own integrations" 
    ON public.user_integrations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own integrations" ON public.user_integrations;
CREATE POLICY "Allow users to delete own integrations" 
    ON public.user_integrations FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 8. AI_PROVIDER_SETTINGS TABLE (Tracks selected provider model selection)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    active_provider TEXT NOT NULL DEFAULT 'gemini',
    model_selection TEXT,
    connection_status TEXT DEFAULT 'active',
    usage_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own provider settings" ON public.ai_provider_settings;
CREATE POLICY "Allow users to view own provider settings" 
    ON public.ai_provider_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own provider settings" ON public.ai_provider_settings;
CREATE POLICY "Allow users to insert own provider settings" 
    ON public.ai_provider_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own provider settings" ON public.ai_provider_settings;
CREATE POLICY "Allow users to update own provider settings" 
    ON public.ai_provider_settings FOR UPDATE USING (auth.uid() = user_id);


-- ===========================================================================
-- 9. DEPLOYMENTS TABLE (Vercel, Netlify builds and releases status tracker)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    project_id TEXT NOT NULL, -- Text reference to project id
    provider TEXT NOT NULL, -- 'Vercel', 'Netlify', etc.
    deployment_id TEXT,
    status TEXT NOT NULL DEFAULT 'READY', -- 'READY', 'BUILDING', 'FAILED'
    url TEXT NOT NULL,
    project_name TEXT NOT NULL,
    logs TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own deployments" ON public.deployments;
CREATE POLICY "Allow users to view own deployments" 
    ON public.deployments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own deployments" ON public.deployments;
CREATE POLICY "Allow users to insert own deployments" 
    ON public.deployments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own deployments" ON public.deployments;
CREATE POLICY "Allow users to update own deployments" 
    ON public.deployments FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own deployments" ON public.deployments;
CREATE POLICY "Allow users to delete own deployments" 
    ON public.deployments FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- 10. ACTIVITY_LOGS TABLE (Developer telemetry trails)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL, -- 'git_clone', 'file_deploy', 'db_migration', etc.
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own activity logs" ON public.activity_logs;
CREATE POLICY "Allow users to view own activity logs" 
    ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own activity logs" ON public.activity_logs;
CREATE POLICY "Allow users to insert own activity logs" 
    ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ===========================================================================
-- SAVED_TEMPLATES TABLE (Reusable developer patterns & boilerplate)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.saved_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code_snippet TEXT NOT NULL,
    language TEXT DEFAULT 'typescript' NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow users to view own saved templates" ON public.saved_templates;
CREATE POLICY "Allow users to view own saved templates" 
    ON public.saved_templates FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to insert own saved templates" ON public.saved_templates;
CREATE POLICY "Allow users to insert own saved templates" 
    ON public.saved_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update own saved templates" ON public.saved_templates;
CREATE POLICY "Allow users to update own saved templates" 
    ON public.saved_templates FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete own saved templates" ON public.saved_templates;
CREATE POLICY "Allow users to delete own saved templates" 
    ON public.saved_templates FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- PERFORMANCE BOOSTING INDEXES (Maintains near-instant query speeds)
-- ===========================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_project_id ON public.chat_history(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON public.deployments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);


-- ===========================================================================
-- TRIGGERS & FUNCTIONS FOR ROBUST AUTOMATIC PROFILE CREATION
-- ===========================================================================

-- Trigger function to automatically insert a profile row on auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Wrap insertions in safety sub-blocks to prevent transient failures 
    -- from blocking the registration flow.
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role, avatar)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            'Lead Architect',
            '💻'
        );
    EXCEPTION WHEN OTHERS THEN
        -- Silently continue if profiles table isn't ready or insertion fails
    END;
    
    BEGIN
        INSERT INTO public.ai_provider_settings (user_id, active_provider)
        VALUES (NEW.id, 'gemini');
    EXCEPTION WHEN OTHERS THEN
        -- Silently continue
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ===========================================================================
-- STORAGE BUCKETS AND SECURITY POLICIES INITIALIZATION
-- ===========================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('uploads', 'uploads', true),
    ('assets', 'assets', true),
    ('images', 'images', true),
    ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Row Level Security policies
DROP POLICY IF EXISTS "Allow authenticated users to insert files in storage" ON storage.objects;
CREATE POLICY "Allow authenticated users to insert files in storage" 
    ON storage.objects FOR INSERT WITH CHECK (
        bucket_id IN ('uploads', 'assets', 'images', 'documents') 
        AND auth.role() = 'authenticated'
    );

DROP POLICY IF EXISTS "Allow public select access on storage files" ON storage.objects;
CREATE POLICY "Allow public select access on storage files" 
    ON storage.objects FOR SELECT USING (
        bucket_id IN ('uploads', 'assets', 'images', 'documents')
    );

DROP POLICY IF EXISTS "Allow authenticated users to delete own files in storage" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete own files in storage" 
    ON storage.objects FOR DELETE USING (
        bucket_id IN ('uploads', 'assets', 'images', 'documents') 
        AND owner = auth.uid()
    );
