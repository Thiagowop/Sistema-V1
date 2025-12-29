/**
 * @id SERV-SHARED-001
 * @name SharedCacheService
 * @description Serviço de cache compartilhado no Supabase para acesso da equipe
 * @dependencies supabaseService
 * @status active
 * @version 1.0.0
 *
 * PROPÓSITO:
 * Este serviço gerencia o cache compartilhado de dados sincronizados.
 * - Admin faz sync → dados são salvos no Supabase
 * - Team/Viewers carregam dados do Supabase (sem precisar fazer sync)
 *
 * TABELA SUPABASE:
 * shared_tasks_cache (
 *   id UUID PRIMARY KEY,
 *   cache_key TEXT NOT NULL,
 *   data JSONB NOT NULL,
 *   metadata JSONB,
 *   created_by TEXT,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   updated_at TIMESTAMPTZ DEFAULT NOW()
 * )
 */

import { getSupabase } from './supabaseService';
import type { ClickUpApiTask } from './clickup';
import type { GroupedData } from '../types';
import type { FilterMetadata } from '../types/FilterConfig';

// ============================================
// CONSTANTES
// ============================================

const SHARED_CACHE_TABLE = 'shared_tasks_cache';
const CACHE_KEY_RAW_TASKS = 'raw_tasks';
const CACHE_KEY_PROCESSED_DATA = 'processed_data';
const CACHE_KEY_METADATA = 'filter_metadata';

// ============================================
// TIPOS
// ============================================

export interface SharedCacheMetadata {
  lastSync: string;
  taskCount: number;
  syncedBy: string;
  version: string;
}

export interface SharedCacheEntry<T = unknown> {
  id?: string;
  cache_key: string;
  data: T;
  metadata: SharedCacheMetadata;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

class SharedCacheService {
  private cacheVersion = '1.0.0';

  // ----------------------------------------
  // SAVE METHODS (Admin only)
  // ----------------------------------------

  /**
   * Salva todas as tarefas raw no cache compartilhado
   * Chamado pelo admin após sync bem-sucedido
   */
  async saveRawTasks(
    tasks: ClickUpApiTask[],
    syncedBy: string
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[SERV-SHARED-001] Supabase não disponível');
      return false;
    }

    const metadata: SharedCacheMetadata = {
      lastSync: new Date().toISOString(),
      taskCount: tasks.length,
      syncedBy,
      version: this.cacheVersion
    };

    try {
      console.log(`[SERV-SHARED-001] 💾 Salvando ${tasks.length} tasks no cache compartilhado...`);

      const { error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .upsert({
          cache_key: CACHE_KEY_RAW_TASKS,
          data: tasks,
          metadata,
          created_by: syncedBy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('[SERV-SHARED-001] ❌ Erro ao salvar raw tasks:', error.message);
        return false;
      }

      console.log('[SERV-SHARED-001] ✅ Raw tasks salvas no cache compartilhado');
      return true;
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao salvar raw tasks:', e.message);
      return false;
    }
  }

  /**
   * Salva dados processados (GroupedData) no cache compartilhado
   */
  async saveProcessedData(
    data: GroupedData[],
    syncedBy: string,
    taskCount: number
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const metadata: SharedCacheMetadata = {
      lastSync: new Date().toISOString(),
      taskCount,
      syncedBy,
      version: this.cacheVersion
    };

    try {
      console.log(`[SERV-SHARED-001] 💾 Salvando dados processados no cache compartilhado...`);

      const { error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .upsert({
          cache_key: CACHE_KEY_PROCESSED_DATA,
          data,
          metadata,
          created_by: syncedBy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('[SERV-SHARED-001] ❌ Erro ao salvar processed data:', error.message);
        return false;
      }

      console.log('[SERV-SHARED-001] ✅ Processed data salvo no cache compartilhado');
      return true;
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao salvar processed data:', e.message);
      return false;
    }
  }

  /**
   * Salva metadata de filtros no cache compartilhado
   */
  async saveFilterMetadata(
    filterMetadata: FilterMetadata,
    syncedBy: string,
    taskCount: number
  ): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const metadata: SharedCacheMetadata = {
      lastSync: new Date().toISOString(),
      taskCount,
      syncedBy,
      version: this.cacheVersion
    };

    try {
      const { error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .upsert({
          cache_key: CACHE_KEY_METADATA,
          data: filterMetadata,
          metadata,
          created_by: syncedBy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'cache_key'
        });

      if (error) {
        console.error('[SERV-SHARED-001] ❌ Erro ao salvar metadata:', error.message);
        return false;
      }

      console.log('[SERV-SHARED-001] ✅ Metadata salvo no cache compartilhado');
      return true;
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao salvar metadata:', e.message);
      return false;
    }
  }

  /**
   * Salva tudo de uma vez (raw, processed, metadata)
   */
  async saveAll(
    rawTasks: ClickUpApiTask[],
    processedData: GroupedData[],
    filterMetadata: FilterMetadata,
    syncedBy: string
  ): Promise<boolean> {
    console.log('[SERV-SHARED-001] 📦 Salvando todos os dados no cache compartilhado...');

    const results = await Promise.all([
      this.saveRawTasks(rawTasks, syncedBy),
      this.saveProcessedData(processedData, syncedBy, rawTasks.length),
      this.saveFilterMetadata(filterMetadata, syncedBy, rawTasks.length)
    ]);

    const allSuccess = results.every(r => r);

    if (allSuccess) {
      console.log('[SERV-SHARED-001] ✅ Todos os dados salvos com sucesso!');
    } else {
      console.warn('[SERV-SHARED-001] ⚠️ Alguns dados não foram salvos');
    }

    return allSuccess;
  }

  // ----------------------------------------
  // LOAD METHODS (Team/Viewers)
  // ----------------------------------------

  /**
   * Carrega tarefas raw do cache compartilhado
   */
  async loadRawTasks(): Promise<{
    tasks: ClickUpApiTask[] | null;
    metadata: SharedCacheMetadata | null;
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { tasks: null, metadata: null };
    }

    try {
      console.log('[SERV-SHARED-001] 📥 Carregando raw tasks do cache compartilhado...');

      const { data, error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .select('data, metadata')
        .eq('cache_key', CACHE_KEY_RAW_TASKS)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[SERV-SHARED-001] ℹ️ Nenhum cache compartilhado encontrado');
          return { tasks: null, metadata: null };
        }
        console.error('[SERV-SHARED-001] ❌ Erro ao carregar raw tasks:', error.message);
        return { tasks: null, metadata: null };
      }

      if (!data) {
        return { tasks: null, metadata: null };
      }

      const tasks = data.data as ClickUpApiTask[];
      const metadata = data.metadata as SharedCacheMetadata;

      console.log(`[SERV-SHARED-001] ✅ ${tasks.length} tasks carregadas do cache compartilhado`);
      console.log(`[SERV-SHARED-001] ℹ️ Último sync: ${metadata.lastSync} por ${metadata.syncedBy}`);

      return { tasks, metadata };
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao carregar raw tasks:', e.message);
      return { tasks: null, metadata: null };
    }
  }

  /**
   * Carrega dados processados do cache compartilhado
   */
  async loadProcessedData(): Promise<{
    data: GroupedData[] | null;
    metadata: SharedCacheMetadata | null;
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { data: null, metadata: null };
    }

    try {
      console.log('[SERV-SHARED-001] 📥 Carregando dados processados do cache compartilhado...');

      const { data, error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .select('data, metadata')
        .eq('cache_key', CACHE_KEY_PROCESSED_DATA)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, metadata: null };
        }
        console.error('[SERV-SHARED-001] ❌ Erro ao carregar processed data:', error.message);
        return { data: null, metadata: null };
      }

      if (!data) {
        return { data: null, metadata: null };
      }

      const processedData = data.data as GroupedData[];
      const metadata = data.metadata as SharedCacheMetadata;

      console.log(`[SERV-SHARED-001] ✅ ${processedData.length} grupos carregados do cache compartilhado`);

      return { data: processedData, metadata };
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao carregar processed data:', e.message);
      return { data: null, metadata: null };
    }
  }

  /**
   * Carrega metadata de filtros do cache compartilhado
   */
  async loadFilterMetadata(): Promise<{
    filterMetadata: FilterMetadata | null;
    metadata: SharedCacheMetadata | null;
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { filterMetadata: null, metadata: null };
    }

    try {
      const { data, error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .select('data, metadata')
        .eq('cache_key', CACHE_KEY_METADATA)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { filterMetadata: null, metadata: null };
        }
        console.error('[SERV-SHARED-001] ❌ Erro ao carregar metadata:', error.message);
        return { filterMetadata: null, metadata: null };
      }

      if (!data) {
        return { filterMetadata: null, metadata: null };
      }

      return {
        filterMetadata: data.data as FilterMetadata,
        metadata: data.metadata as SharedCacheMetadata
      };
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao carregar metadata:', e.message);
      return { filterMetadata: null, metadata: null };
    }
  }

  /**
   * Carrega tudo do cache compartilhado
   */
  async loadAll(): Promise<{
    rawTasks: ClickUpApiTask[] | null;
    processedData: GroupedData[] | null;
    filterMetadata: FilterMetadata | null;
    cacheMetadata: SharedCacheMetadata | null;
  }> {
    console.log('[SERV-SHARED-001] 📦 Carregando todos os dados do cache compartilhado...');

    const [rawResult, processedResult, metaResult] = await Promise.all([
      this.loadRawTasks(),
      this.loadProcessedData(),
      this.loadFilterMetadata()
    ]);

    const hasData = rawResult.tasks !== null || processedResult.data !== null;

    if (hasData) {
      console.log('[SERV-SHARED-001] ✅ Dados carregados do cache compartilhado');
    } else {
      console.log('[SERV-SHARED-001] ℹ️ Nenhum dado no cache compartilhado');
    }

    return {
      rawTasks: rawResult.tasks,
      processedData: processedResult.data,
      filterMetadata: metaResult.filterMetadata,
      cacheMetadata: rawResult.metadata || processedResult.metadata || metaResult.metadata
    };
  }

  // ----------------------------------------
  // STATUS & UTILS
  // ----------------------------------------

  /**
   * Verifica status do cache compartilhado
   */
  async getCacheStatus(): Promise<{
    hasData: boolean;
    lastSync: string | null;
    syncedBy: string | null;
    taskCount: number;
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { hasData: false, lastSync: null, syncedBy: null, taskCount: 0 };
    }

    try {
      const { data, error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .select('metadata')
        .eq('cache_key', CACHE_KEY_RAW_TASKS)
        .single();

      if (error || !data) {
        return { hasData: false, lastSync: null, syncedBy: null, taskCount: 0 };
      }

      const metadata = data.metadata as SharedCacheMetadata;

      return {
        hasData: true,
        lastSync: metadata.lastSync,
        syncedBy: metadata.syncedBy,
        taskCount: metadata.taskCount
      };
    } catch {
      return { hasData: false, lastSync: null, syncedBy: null, taskCount: 0 };
    }
  }

  /**
   * Limpa o cache compartilhado (Admin only)
   */
  async clearCache(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      console.log('[SERV-SHARED-001] 🗑️ Limpando cache compartilhado...');

      const { error } = await supabase
        .from(SHARED_CACHE_TABLE)
        .delete()
        .in('cache_key', [
          CACHE_KEY_RAW_TASKS,
          CACHE_KEY_PROCESSED_DATA,
          CACHE_KEY_METADATA
        ]);

      if (error) {
        console.error('[SERV-SHARED-001] ❌ Erro ao limpar cache:', error.message);
        return false;
      }

      console.log('[SERV-SHARED-001] ✅ Cache compartilhado limpo');
      return true;
    } catch (e: any) {
      console.error('[SERV-SHARED-001] ❌ Erro ao limpar cache:', e.message);
      return false;
    }
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const sharedCache = new SharedCacheService();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const saveToSharedCache = (
  rawTasks: ClickUpApiTask[],
  processedData: GroupedData[],
  filterMetadata: FilterMetadata,
  syncedBy: string
) => sharedCache.saveAll(rawTasks, processedData, filterMetadata, syncedBy);

export const loadFromSharedCache = () => sharedCache.loadAll();

export const getSharedCacheStatus = () => sharedCache.getCacheStatus();

export const clearSharedCache = () => sharedCache.clearCache();

export default sharedCache;
