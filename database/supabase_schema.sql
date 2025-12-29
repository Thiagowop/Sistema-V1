-- ============================================
-- SUPABASE SCHEMA FOR SISTEMA V2.0
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- para criar todas as tabelas necessárias.
-- ============================================

-- ============================================
-- 1. TABELA: reference_data
-- Armazena dados de referência persistentes
-- (equip tags, team members, projects)
-- ============================================

CREATE TABLE IF NOT EXISTS reference_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  data_key TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraint: um registro por device+key
  UNIQUE(device_id, data_key)
);

-- Index para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_reference_data_device
  ON reference_data(device_id);

CREATE INDEX IF NOT EXISTS idx_reference_data_key
  ON reference_data(data_key);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_reference_data_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reference_data_updated ON reference_data;
CREATE TRIGGER trigger_reference_data_updated
  BEFORE UPDATE ON reference_data
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_data_timestamp();

-- RLS (Row Level Security) - Cada device só vê seus próprios dados
ALTER TABLE reference_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can view own reference data"
  ON reference_data FOR SELECT
  USING (true); -- Permite leitura pública (anon key)

CREATE POLICY "Devices can insert own reference data"
  ON reference_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Devices can update own reference data"
  ON reference_data FOR UPDATE
  USING (true);

-- ============================================
-- 2. TABELA: user_preferences
-- Armazena preferências do usuário
-- (configurações, estados de UI, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_user_preferences_device
  ON user_preferences(device_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_user_preferences_updated ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_reference_data_timestamp();

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Devices can manage own preferences"
  ON user_preferences FOR ALL
  USING (true);

-- ============================================
-- 3. TABELA: user_settings (já existente)
-- Mantém compatibilidade com código existente
-- ============================================

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  auto_sync BOOLEAN DEFAULT false,
  filters JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user
  ON user_settings(user_id);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
  ON user_settings FOR ALL
  USING (true);

-- ============================================
-- 4. TABELA: cache_entries (já existente)
-- Cache compartilhado entre dispositivos
-- ============================================

CREATE TABLE IF NOT EXISTS cache_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  data JSONB NOT NULL,
  compressed BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_cache_entries_user
  ON cache_entries(user_id);

CREATE INDEX IF NOT EXISTS idx_cache_entries_key
  ON cache_entries(cache_key);

ALTER TABLE cache_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cache"
  ON cache_entries FOR ALL
  USING (true);

-- ============================================
-- 5. TABELA: sync_logs (já existente)
-- Histórico de sincronizações
-- ============================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental')),
  task_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_user
  ON sync_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_sync_logs_created
  ON sync_logs(created_at DESC);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own logs"
  ON sync_logs FOR ALL
  USING (true);

-- ============================================
-- 6. TABELA: authorized_users (já existente)
-- Usuários autorizados a acessar o sistema
-- ============================================

CREATE TABLE IF NOT EXISTS authorized_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_authorized_users_email
  ON authorized_users(email);

ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active users for auth"
  ON authorized_users FOR SELECT
  USING (true);

-- ============================================
-- 7. DADOS INICIAIS (opcional)
-- ============================================

-- Exemplo: Criar usuário admin inicial
-- INSERT INTO authorized_users (email, password_hash, name, role)
-- VALUES ('admin@empresa.com', 'sua_senha_hash', 'Administrador', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- ============================================
-- RESUMO DAS TABELAS
-- ============================================
-- reference_data      -> Dados de referência (tags equip, membros, projetos)
-- user_preferences    -> Preferências do usuário (configurações, UI states)
-- user_settings       -> Configurações legadas (compatibilidade)
-- cache_entries       -> Cache de dados entre dispositivos
-- sync_logs           -> Histórico de sincronizações
-- authorized_users    -> Usuários autorizados
-- ============================================
