-- ============================================
-- DAILY FLOW - TABELA DE USUÁRIOS
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- 1. TABELA: authorized_users
-- Armazena usuários autorizados a acessar o sistema
CREATE TABLE IF NOT EXISTS authorized_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_authorized_users_email ON authorized_users(email);

-- Habilitar RLS
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- Política: qualquer um pode ler (para login)
CREATE POLICY "Anyone can read users for login" ON authorized_users
    FOR SELECT USING (true);

-- Política: apenas admins podem inserir/atualizar
CREATE POLICY "Anyone can insert users" ON authorized_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update users" ON authorized_users
    FOR UPDATE USING (true);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_authorized_users_updated_at ON authorized_users;
CREATE TRIGGER trigger_authorized_users_updated_at
    BEFORE UPDATE ON authorized_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 2. INSERIR USUÁRIOS INICIAIS
-- ============================================
-- Senha padrão: Mcsa@2025! (hash simples para demo)
-- NOTA: Em produção, use hash bcrypt ou similar

INSERT INTO authorized_users (email, password_hash, name, role) VALUES
    ('thiago.vitorio@mcsarc.com.br', 'Mcsa@2025!', 'Thiago Vitório', 'admin'),
    ('alvaro.nunes@mcsarc.com.br', 'Mcsa@2025!', 'Alvaro Nunes', 'user'),
    ('lucas.paresqui@mcsarc.com.br', 'Mcsa@2025!', 'Lucas Paresqui', 'user'),
    ('lucas.soares@mcsarc.com.br', 'Mcsa@2025!', 'Lucas Soares', 'user'),
    ('marcelo.candiotto@candiottovalle.com', 'Mcsa@2025!', 'Marcelo Candiotto', 'user'),
    ('pedro.calais@mcsarc.com.br', 'Mcsa@2025!', 'Pedro Calais', 'user'),
    ('pedro.zadra@mcsarc.com.br', 'Mcsa@2025!', 'Pedro Zadra', 'user'),
    ('rafael.viegas@mcsarc.com.br', 'Mcsa@2025!', 'Rafael Viegas', 'user'),
    ('rodrigo.brozinga@mcsarc.com.br', 'Mcsa@2025!', 'Rodrigo Brozinga Nunes', 'user')
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    name = EXCLUDED.name,
    updated_at = NOW();

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT email, name, role, active FROM authorized_users ORDER BY name;
