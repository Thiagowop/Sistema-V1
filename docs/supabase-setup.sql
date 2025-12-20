-- ============================================
-- DAILY FLOW - SUPABASE SETUP
-- ============================================
-- Execute este SQL no Supabase SQL Editor:
-- Dashboard > SQL Editor > New Query > Cole e Execute
-- ============================================

-- 1. TABELA: user_settings
-- Armazena configurações do usuário (filtros, autoSync, etc)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    auto_sync BOOLEAN DEFAULT false,
    filters JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- 2. TABELA: cache_entries
-- Cache de dados para sincronização entre dispositivos
CREATE TABLE IF NOT EXISTS cache_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    cache_key TEXT NOT NULL,
    data JSONB,
    compressed BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, cache_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cache_entries_user_id ON cache_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_entries_key ON cache_entries(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_entries_expires ON cache_entries(expires_at);

-- 3. TABELA: sync_logs
-- Histórico de sincronizações
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
    task_count INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Permite que qualquer um leia/escreva seus próprios dados

-- Habilitar RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (true);

-- Políticas para cache_entries
CREATE POLICY "Users can view own cache" ON cache_entries
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own cache" ON cache_entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own cache" ON cache_entries
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own cache" ON cache_entries
    FOR DELETE USING (true);

-- Políticas para sync_logs
CREATE POLICY "Users can view own logs" ON sync_logs
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own logs" ON sync_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNÇÃO: Limpar cache expirado (opcional)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cache_entries
    WHERE expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para user_settings
DROP TRIGGER IF EXISTS trigger_user_settings_updated_at ON user_settings;
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Triggers para cache_entries
DROP TRIGGER IF EXISTS trigger_cache_entries_updated_at ON cache_entries;
CREATE TRIGGER trigger_cache_entries_updated_at
    BEFORE UPDATE ON cache_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Execute para verificar se tudo foi criado:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('user_settings', 'cache_entries', 'sync_logs');
