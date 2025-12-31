/**
 * @id SERV-SUPA-001
 * @name SupabaseService
 * @description Serviço de integração com Supabase para persistência de dados
 * @dependencies @supabase/supabase-js
 * @status active
 * @version 1.0.0
 *
 * FUNCIONALIDADES:
 * - Persistir configurações do usuário (filtros, autoSync, etc)
 * - Cache compartilhado de tasks (opcional)
 * - Histórico de sincronizações
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURAÇÃO
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão configuradas
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[SERV-SUPA-001] ⚠️ Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env');
}

// Cliente Supabase (singleton)
let supabaseClient: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  // Verificação robusta - garantir que variáveis existem e não são vazias
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.trim() === '' || SUPABASE_ANON_KEY.trim() === '') {
    // Não logar aqui para evitar spam no console
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      console.log('[SERV-SUPA-001] ✅ Supabase client inicializado');
    } catch (error) {
      console.error('[SERV-SUPA-001] ❌ Erro ao criar Supabase client:', error);
      return null;
    }
  }

  return supabaseClient;
};

// ============================================
// TIPOS
// ============================================

export interface UserSettings {
  id?: string;
  user_id: string; // Pode ser email ou ID do dispositivo
  auto_sync: boolean;
  filters: Record<string, any>;
  preferences: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CacheEntry {
  id?: string;
  user_id: string;
  cache_key: string;
  data: any;
  compressed: boolean;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SyncLog {
  id?: string;
  user_id: string;
  sync_type: 'full' | 'incremental';
  task_count: number;
  status: 'success' | 'error';
  error_message?: string;
  duration_ms: number;
  created_at?: string;
}

// Tipo para usuário autorizado
export interface AuthorizedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  active: boolean;
  last_login?: string;
}

// ============================================
// HELPER: Lembrar Email
// ============================================

const REMEMBERED_EMAIL_KEY = 'dailyFlow_rememberedEmail';

export const saveRememberedEmail = (email: string): void => {
  localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
};

export const getRememberedEmail = (): string | null => {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY);
};

export const clearRememberedEmail = (): void => {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
};

// ============================================
// HELPER: Device ID (identificador único do dispositivo)
// ============================================

const DEVICE_ID_KEY = 'dailyFlow_deviceId';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Gerar ID único baseado em timestamp + random
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('[SERV-SUPA-001] 🆔 Novo Device ID gerado:', deviceId);
  }

  return deviceId;
};

// ============================================
// CONFIGURAÇÕES DO USUÁRIO
// ============================================

/**
 * Salvar configurações do usuário no Supabase
 */
export const saveUserSettings = async (settings: Partial<UserSettings>): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('[SERV-SUPA-001] Supabase não disponível, salvando apenas localmente');
    return false;
  }

  const userId = getDeviceId();

  try {
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('[SERV-SUPA-001] ❌ Erro ao salvar settings:', error.message);
      return false;
    }

    console.log('[SERV-SUPA-001] ✅ Settings salvos no Supabase');
    return true;
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro ao salvar settings:', err.message);
    return false;
  }
};

/**
 * Carregar configurações do usuário do Supabase
 */
export const loadUserSettings = async (): Promise<UserSettings | null> => {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const userId = getDeviceId();

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado - normal para novos usuários
        console.log('[SERV-SUPA-001] ℹ️ Nenhuma configuração encontrada para este dispositivo');
        return null;
      }
      console.error('[SERV-SUPA-001] ❌ Erro ao carregar settings:', error.message);
      return null;
    }

    console.log('[SERV-SUPA-001] ✅ Settings carregados do Supabase');
    return data as UserSettings;
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro ao carregar settings:', err.message);
    return null;
  }
};

// ============================================
// CACHE NO SUPABASE (opcional - para dados grandes)
// ============================================

/**
 * Salvar cache no Supabase (para sincronização entre dispositivos)
 */
export const saveCacheToSupabase = async (
  cacheKey: string,
  data: any,
  expiresInHours: number = 24
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    return false;
  }

  const userId = getDeviceId();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  try {
    const { error } = await supabase
      .from('cache_entries')
      .upsert({
        user_id: userId,
        cache_key: cacheKey,
        data: data,
        compressed: false,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,cache_key',
      });

    if (error) {
      console.error('[SERV-SUPA-001] ❌ Erro ao salvar cache:', error.message);
      return false;
    }

    console.log(`[SERV-SUPA-001] ✅ Cache "${cacheKey}" salvo no Supabase`);
    return true;
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro ao salvar cache:', err.message);
    return false;
  }
};

/**
 * Carregar cache do Supabase
 */
export const loadCacheFromSupabase = async (cacheKey: string): Promise<any | null> => {
  const supabase = getSupabase();
  if (!supabase) {
    return null;
  }

  const userId = getDeviceId();

  try {
    const { data, error } = await supabase
      .from('cache_entries')
      .select('data, expires_at')
      .eq('user_id', userId)
      .eq('cache_key', cacheKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Cache não existe
      }
      console.error('[SERV-SUPA-001] ❌ Erro ao carregar cache:', error.message);
      return null;
    }

    // Verificar se expirou
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log(`[SERV-SUPA-001] ⏰ Cache "${cacheKey}" expirado`);
      return null;
    }

    console.log(`[SERV-SUPA-001] ✅ Cache "${cacheKey}" carregado do Supabase`);
    return data.data;
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro ao carregar cache:', err.message);
    return null;
  }
};

// ============================================
// LOG DE SINCRONIZAÇÕES
// ============================================

/**
 * Registrar log de sincronização
 */
export const logSync = async (log: Omit<SyncLog, 'id' | 'user_id' | 'created_at'>): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    return false;
  }

  const userId = getDeviceId();

  try {
    const { error } = await supabase
      .from('sync_logs')
      .insert({
        user_id: userId,
        ...log,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[SERV-SUPA-001] ❌ Erro ao registrar sync log:', error.message);
      return false;
    }

    console.log('[SERV-SUPA-001] 📝 Sync log registrado');
    return true;
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro ao registrar sync log:', err.message);
    return false;
  }
};

/**
 * Obter histórico de sincronizações
 */
export const getSyncHistory = async (limit: number = 10): Promise<SyncLog[]> => {
  const supabase = getSupabase();
  if (!supabase) {
    return [];
  }

  const userId = getDeviceId();

  try {
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[SERV-SUPA-001] ❌ Erro ao obter sync history:', error.message);
      return [];
    }

    return data as SyncLog[];
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro ao obter sync history:', err.message);
    return [];
  }
};

// ============================================
// VERIFICAÇÃO DE CONEXÃO
// ============================================

/**
 * Verificar se o Supabase está disponível e funcionando
 */
export const checkSupabaseConnection = async (): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) {
    return false;
  }

  try {
    // Tentar fazer uma query simples
    const { error } = await supabase
      .from('user_settings')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      console.error('[SERV-SUPA-001] ❌ Supabase não está acessível:', error.message);
      return false;
    }

    console.log('[SERV-SUPA-001] ✅ Conexão com Supabase OK');
    return true;
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro de conexão:', err.message);
    return false;
  }
};

// ============================================
// AUTENTICAÇÃO DE USUÁRIOS
// ============================================

/**
 * Autenticar usuário por email e senha
 */
export const authenticateUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthorizedUser; error?: string }> => {
  const supabase = getSupabase();

  if (!supabase) {
    return { success: false, error: 'Supabase não configurado' };
  }

  try {
    console.log('[SERV-SUPA-001] 🔐 Autenticando usuário:', email);

    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('password_hash', password)
      .eq('active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[SERV-SUPA-001] ❌ Credenciais inválidas');
        return { success: false, error: 'E-mail ou senha incorretos' };
      }
      console.error('[SERV-SUPA-001] ❌ Erro na autenticação:', error.message);
      return { success: false, error: 'Erro ao autenticar. Tente novamente.' };
    }

    if (!data) {
      return { success: false, error: 'E-mail ou senha incorretos' };
    }

    // Atualizar last_login
    await supabase
      .from('authorized_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.id);

    const user: AuthorizedUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      active: data.active,
      last_login: new Date().toISOString(),
    };

    console.log('[SERV-SUPA-001] ✅ Autenticação bem-sucedida:', user.name);
    return { success: true, user };
  } catch (err: any) {
    console.error('[SERV-SUPA-001] ❌ Erro na autenticação:', err.message);
    return { success: false, error: 'Erro de conexão. Verifique sua internet.' };
  }
};

/**
 * Obter usuário por email (para verificar se existe)
 */
export const getUserByEmail = async (email: string): Promise<AuthorizedUser | null> => {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      active: data.active,
      last_login: data.last_login,
    };
  } catch {
    return null;
  }
};

/**
 * Listar todos os usuários (para admin)
 */
export const listAllUsers = async (): Promise<AuthorizedUser[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*')
      .order('name');

    if (error || !data) return [];

    return data.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      active: u.active,
      last_login: u.last_login,
    }));
  } catch {
    return [];
  }
};

// ============================================
// EXPORTS
// ============================================

export default {
  getSupabase,
  getDeviceId,
  saveUserSettings,
  loadUserSettings,
  saveCacheToSupabase,
  loadCacheFromSupabase,
  logSync,
  getSyncHistory,
  checkSupabaseConnection,
  // Auth
  authenticateUser,
  getUserByEmail,
  listAllUsers,
  // Remember email
  saveRememberedEmail,
  getRememberedEmail,
  clearRememberedEmail,
};
