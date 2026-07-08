-- ===========================================================================
-- SHAF NEXUS AI PRO - COMPLETE SUPABASE DATABASE SCHEMA
-- ===========================================================================
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- to initialize all required tables, configure Row Level Security (RLS) policies,
-- register automatic triggers, and set up storage configurations.

-- 1. Create profiles table (User Profiles, settings, and workspace preferences)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
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

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-access to profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow individual update of own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow individual insert of own profile"
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 2. Create user_api_keys table (stores secure credentials for LLM providers)
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

-- Enable RLS for user_api_keys
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own API keys" 
    ON public.user_api_keys FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own API keys" 
    ON public.user_api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own API keys" 
    ON public.user_api_keys FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own API keys" 
    ON public.user_api_keys FOR DELETE USING (auth.uid() = user_id);


-- 3. Create ai_provider_settings table (tracks active models and usage)
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
    user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    active_provider TEXT NOT NULL DEFAULT 'gemini', -- 'gemini', 'openai', 'openrouter', 'anthropic', 'deepseek'
    model_selection TEXT,
    connection_status TEXT DEFAULT 'active',
    usage_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for ai_provider_settings
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own provider settings" 
    ON public.ai_provider_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own provider settings" 
    ON public.ai_provider_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own provider settings" 
    ON public.ai_provider_settings FOR UPDATE USING (auth.uid() = user_id);


-- 4. Create user_integrations table (GitHub, Vercel, Netlify, Cloudflare, etc.)
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    integration_name TEXT NOT NULL, -- 'github', 'vercel', 'netlify', 'cloudflare'
    token TEXT, -- securely stored integration credential
    repo_name TEXT, -- e.g. "user-account/example-repo"
    branch_name TEXT DEFAULT 'main',
    config JSONB DEFAULT '{}'::jsonb, -- custom configuration metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, integration_name)
);

-- Enable RLS for user_integrations
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own integrations" 
    ON public.user_integrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own integrations" 
    ON public.user_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own integrations" 
    ON public.user_integrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own integrations" 
    ON public.user_integrations FOR DELETE USING (auth.uid() = user_id);


-- 5. Create chat_sessions table (Chat Sessions manager)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT DEFAULT 'New Engineering Session' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own chat sessions" 
    ON public.chat_sessions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own chat sessions" 
    ON public.chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own chat sessions" 
    ON public.chat_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own chat sessions" 
    ON public.chat_sessions FOR DELETE USING (auth.uid() = user_id);


-- 6. Create chat_history table (tracks individual chat messages)
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.chat_sessions ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TEXT NOT NULL, -- formatted string e.g. "12:04"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for chat_history
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own chats" 
    ON public.chat_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own chats" 
    ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own chats" 
    ON public.chat_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own chats" 
    ON public.chat_history FOR DELETE USING (auth.uid() = user_id);


-- 7. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    is_favorited BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own projects" 
    ON public.projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own projects" 
    ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own projects" 
    ON public.projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own projects" 
    ON public.projects FOR DELETE USING (auth.uid() = user_id);


-- 8. Create project_files table (stores code files, metadata, and generated folders)
CREATE TABLE IF NOT EXISTS public.project_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL, -- E.g., "/src/components/Card.tsx"
    content TEXT,
    size INTEGER DEFAULT 0,
    mime_type TEXT DEFAULT 'text/plain',
    version INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (project_id, path)
);

-- Enable RLS for project_files
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own project files" 
    ON public.project_files FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own project files" 
    ON public.project_files FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own project files" 
    ON public.project_files FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own project files" 
    ON public.project_files FOR DELETE USING (auth.uid() = user_id);


-- 9. Create project_versions table (tracks code snapshots / releases)
CREATE TABLE IF NOT EXISTS public.project_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    version_num INTEGER NOT NULL,
    name TEXT,
    description TEXT,
    file_snapshot_json JSONB DEFAULT '[]'::jsonb NOT NULL, -- complete directory tree backup
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for project_versions
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own project versions" 
    ON public.project_versions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own project versions" 
    ON public.project_versions FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 10. Create project_history table (compat fallback for legacy local project sync)
CREATE TABLE IF NOT EXISTS public.project_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    files JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for project_history
ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own legacy project histories" 
    ON public.project_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own legacy project histories" 
    ON public.project_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own legacy project histories" 
    ON public.project_history FOR DELETE USING (auth.uid() = user_id);


-- 11. Create saved_templates table (reusable engineering patterns & boilerplate)
CREATE TABLE IF NOT EXISTS public.saved_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    code_snippet TEXT NOT NULL,
    language TEXT DEFAULT 'typescript' NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for saved_templates
ALTER TABLE public.saved_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own saved templates" 
    ON public.saved_templates FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own saved templates" 
    ON public.saved_templates FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own saved templates" 
    ON public.saved_templates FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own saved templates" 
    ON public.saved_templates FOR DELETE USING (auth.uid() = user_id);


-- 12. Create activity_logs table (tracks developer operations)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL, -- 'git_clone', 'file_deploy', 'db_migration', etc.
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own activity logs" 
    ON public.activity_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own activity logs" 
    ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 13. Create notifications table (tracks project operations warnings)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own notifications" 
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update own notifications" 
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);


-- ===========================================================================
-- TRIGGERS & FUNCTIONS FOR AUTOMATIC PROFILE CREATION
-- ===========================================================================

-- Trigger function to automatically insert a profile row on auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, avatar)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'Lead Architect',
        '💻'
    );
    
    INSERT INTO public.ai_provider_settings (user_id, active_provider)
    VALUES (NEW.id, 'gemini');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ===========================================================================
-- 10. CREATE DEPLOYMENTS TABLE
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    project_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'Vercel', 'Netlify', 'Cloudflare Pages', 'GitHub Pages'
    deployment_id TEXT, -- remote deployment ID or hash
    status TEXT NOT NULL DEFAULT 'READY', -- 'READY', 'BUILDING', 'FAILED'
    url TEXT NOT NULL,
    project_name TEXT NOT NULL,
    logs TEXT[] DEFAULT '{}'::text[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for deployments
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own deployments" 
    ON public.deployments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own deployments" 
    ON public.deployments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own deployments" 
    ON public.deployments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete own deployments" 
    ON public.deployments FOR DELETE USING (auth.uid() = user_id);


-- ===========================================================================
-- SUPABASE STORAGE BUCKETS INITIALIZATION
-- ===========================================================================

-- Note: In Supabase, the buckets and objects are housed under the 'storage' schema.
-- We safely declare and initialize our custom workspace buckets.
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('uploads', 'uploads', true),
    ('assets', 'assets', true),
    ('images', 'images', true),
    ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Row Level Security (RLS) policies for secure file handling
CREATE POLICY "Allow authenticated users to insert files in storage" 
    ON storage.objects FOR INSERT WITH CHECK (
        bucket_id IN ('uploads', 'assets', 'images', 'documents') 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Allow public select access on storage files" 
    ON storage.objects FOR SELECT USING (
        bucket_id IN ('uploads', 'assets', 'images', 'documents')
    );

CREATE POLICY "Allow authenticated users to delete own files in storage" 
    ON storage.objects FOR DELETE USING (
        bucket_id IN ('uploads', 'assets', 'images', 'documents') 
        AND owner = auth.uid()
    );
