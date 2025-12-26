/**
 * @id SERV-CACHE-001
 * @name AdvancedCacheService
 * @description Sistema de cache em 3 camadas com compressão LZ-String
 * @dependencies lz-string, idb-keyval
 * @status active
 * @version 2.0.0
 * 
 * CAMADAS:
 * - Layer 1: Metadata (localStorage) - Instantâneo
 * - Layer 2: Processed Data (localStorage + LZ-String compression)
 * - Layer 3: Raw Data (IndexedDB) - Dados grandes
 */

import { compress, decompress } from 'lz-string';
import { set, get, del } from 'idb-keyval';
import { GroupedData } from '../types';
import type { ClickUpApiTask } from './clickup';
import { FilterMetadata } from '../types/FilterConfig';

const CACHE_VERSION = '3.0.0';
const METADATA_KEY = 'dailyFlow_metadata_v3';
const PROCESSED_KEY = 'dailyFlow_processed_v3';
const RAW_DATA_IDB_KEY = 'dailyFlow_rawData_v3';

export interface MetadataCache {
  version: string;
  lastSync: string;
  taskCount: number;
  tags: string[];
  statuses: string[];
  assignees: string[];
  projects: string[];
  priorities: string[];
}

export interface ProcessedCache {
  data: GroupedData[];
  compressed: boolean;
  timestamp: string;
  version: string;
}

class AdvancedCacheService {
  /**
   * CAMADA 1: Metadata Cache (localStorage - instantâneo)
   * Usado para popular filtros e dropdowns imediatamente
   */
  saveMetadata(metadata: FilterMetadata, taskCount: number): void {
    try {
      const cache: MetadataCache = {
        version: CACHE_VERSION,
        lastSync: new Date().toISOString(),
        taskCount,
        tags: metadata.tags,
        statuses: metadata.statuses,
        assignees: metadata.assignees,
        projects: metadata.projects,
        priorities: metadata.priorities
      };

      localStorage.setItem(METADATA_KEY, JSON.stringify(cache));
      console.log('✅ [SERV-CACHE-001] Metadata saved:', {
        tags: cache.tags.length,
        statuses: cache.statuses.length,
        assignees: cache.assignees.length
      });
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to save metadata:', error);
    }
  }

  loadMetadata(): MetadataCache | null {
    try {
      const cached = localStorage.getItem(METADATA_KEY);
      if (!cached) return null;

      const metadata: MetadataCache = JSON.parse(cached);

      // Validar versão
      if (metadata.version !== CACHE_VERSION) {
        this.clearMetadata();
        return null;
      }

      return metadata;
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to load metadata:', error);
      return null;
    }
  }

  clearMetadata(): void {
    localStorage.removeItem(METADATA_KEY);
  }

  /**
   * CAMADA 2: Processed Data Cache (localStorage com compressão)
   * Usado para mostrar dashboard rapidamente
   */
  saveProcessedData(data: GroupedData[]): void {
    try {
      const startTime = performance.now();
      const json = JSON.stringify(data);
      const compressed = compress(json);

      const cache: ProcessedCache = {
        data: [], // Não salvar descomprimido
        compressed: true,
        timestamp: new Date().toISOString(),
        version: CACHE_VERSION
      };

      // Salvar comprimido separadamente
      localStorage.setItem(PROCESSED_KEY, JSON.stringify(cache));
      localStorage.setItem(PROCESSED_KEY + '_data', compressed);

      const endTime = performance.now();
      const originalSize = (json.length / 1024).toFixed(2);
      const compressedSize = (compressed.length / 1024).toFixed(2);
      const ratio = ((1 - compressed.length / json.length) * 100).toFixed(1);

      console.log('✅ [SERV-CACHE-001] Processed data saved:', {
        original: `${originalSize}KB`,
        compressed: `${compressedSize}KB`,
        ratio: `${ratio}% reduction`,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to save processed data:', error);
      // Se falhar, limpar cache corrompido
      this.clearProcessedData();
    }
  }

  loadProcessedData(): GroupedData[] | null {
    try {
      const startTime = performance.now();
      const cacheInfo = localStorage.getItem(PROCESSED_KEY);
      if (!cacheInfo) return null;

      const cache: ProcessedCache = JSON.parse(cacheInfo);

      // Validar versão
      if (cache.version !== CACHE_VERSION) {
        console.log('🔄 [SERV-CACHE-001] Processed data version mismatch, clearing...');
        this.clearProcessedData();
        return null;
      }

      // Carregar dados comprimidos
      const compressedData = localStorage.getItem(PROCESSED_KEY + '_data');
      if (!compressedData) return null;

      const decompressed = decompress(compressedData);
      if (!decompressed) {
        console.error('❌ [SERV-CACHE-001] Failed to decompress data');
        this.clearProcessedData();
        return null;
      }

      const data: GroupedData[] = JSON.parse(decompressed);
      const endTime = performance.now();

      console.log('✅ [SERV-CACHE-001] Processed data loaded:', {
        groups: data.length,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });

      return data;
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to load processed data:', error);
      this.clearProcessedData();
      return null;
    }
  }

  clearProcessedData(): void {
    localStorage.removeItem(PROCESSED_KEY);
    localStorage.removeItem(PROCESSED_KEY + '_data');
  }

  /**
   * CAMADA 3: Raw Data Cache (IndexedDB - dados grandes)
   * Usado para reprocessar filtros sem fazer nova API call
   */
  async saveRawData(tasks: ClickUpApiTask[]): Promise<void> {
    try {
      const startTime = performance.now();
      const dataToStore = {
        tasks,
        timestamp: new Date().toISOString(),
        version: CACHE_VERSION,
        count: tasks.length
      };

      await set(RAW_DATA_IDB_KEY, dataToStore);

      const endTime = performance.now();
      const sizeEstimate = (JSON.stringify(tasks).length / 1024 / 1024).toFixed(2);

      console.log('✅ [SERV-CACHE-001] Raw data saved to IndexedDB:', {
        tasks: tasks.length,
        size: `~${sizeEstimate}MB`,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to save raw data to IndexedDB:', error);
    }
  }

  async loadRawData(): Promise<ClickUpApiTask[] | null> {
    try {
      const startTime = performance.now();
      const cached = await get(RAW_DATA_IDB_KEY);

      if (!cached) {
        console.log('ℹ️  [SERV-CACHE-001] No raw data in IndexedDB');
        return null;
      }

      // Validar estrutura
      if (!cached.tasks || !Array.isArray(cached.tasks)) {
        console.error('❌ [SERV-CACHE-001] Invalid raw data structure');
        await this.clearRawData();
        return null;
      }

      // Validar versão
      if (cached.version !== CACHE_VERSION) {
        console.log('🔄 [SERV-CACHE-001] Raw data version mismatch, clearing...');
        await this.clearRawData();
        return null;
      }

      const endTime = performance.now();
      console.log('✅ [SERV-CACHE-001] Raw data loaded from IndexedDB:', {
        tasks: cached.tasks.length,
        time: `${(endTime - startTime).toFixed(0)}ms`,
        age: this.getAgeString(cached.timestamp)
      });

      return cached.tasks;
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to load raw data from IndexedDB:', error);
      return null;
    }
  }

  async clearRawData(): Promise<void> {
    try {
      await del(RAW_DATA_IDB_KEY);
      console.log('🗑️  [SERV-CACHE-001] Raw data cleared from IndexedDB');
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Failed to clear raw data:', error);
    }
  }

  /**
   * Limpar todos os caches
   */
  async clearAll(): Promise<void> {
    console.log('🗑️  [SERV-CACHE-001] Clearing all caches...');
    this.clearMetadata();
    this.clearProcessedData();
    await this.clearRawData();

    // Limpar caches antigos também
    localStorage.removeItem('dailyFlowCachedData');
    localStorage.removeItem('dailyFlowCacheMeta');

    console.log('✅ [SERV-CACHE-001] All caches cleared');
  }

  /**
   * Verificar status do cache
   */
  async getCacheStatus() {
    const metadata = this.loadMetadata();
    const processedExists = !!localStorage.getItem(PROCESSED_KEY);
    const rawData = await this.loadRawData();

    return {
      hasMetadata: !!metadata,
      hasProcessedData: processedExists,
      hasRawData: !!rawData,
      lastSync: metadata?.lastSync || null,
      taskCount: metadata?.taskCount || 0,
      version: CACHE_VERSION
    };
  }

  /**
   * Merge incremental - Atualiza tarefas retornadas pela API
   * IMPORTANTE: Se a API retornou com date_updated_gt, a tarefa JÁ foi modificada - sempre atualizar
   */
  async mergeIncrementalUpdate(newTasks: ClickUpApiTask[]): Promise<ClickUpApiTask[]> {
    try {
      const cached = await this.loadRawData();

      if (!cached || cached.length === 0) {
        console.log('📥 [SERV-CACHE-001] No cache found, using new tasks directly');
        return newTasks;
      }

      const startTime = performance.now();

      // Criar mapa de tarefas cacheadas por ID
      const cachedMap = new Map<string, ClickUpApiTask>();
      cached.forEach(task => {
        cachedMap.set(task.id, task);
      });

      // Estatísticas
      let added = 0;
      let updated = 0;

      // IMPORTANTE: Toda tarefa retornada pela API incremental foi modificada
      // O filtro date_updated_gt do ClickUp já garantiu isso - NÃO precisamos verificar de novo
      newTasks.forEach(newTask => {
        const wasInCache = cachedMap.has(newTask.id);

        // SEMPRE substituir - a API já filtrou tarefas modificadas
        cachedMap.set(newTask.id, newTask);

        if (wasInCache) {
          updated++;
          console.log(`🔄 [SERV-CACHE-001] Updated task: "${newTask.name}" (ID: ${newTask.id})`);
        } else {
          added++;
          console.log(`➕ [SERV-CACHE-001] Added new task: "${newTask.name}" (ID: ${newTask.id})`);
        }
      });

      const mergedTasks = Array.from(cachedMap.values());
      const endTime = performance.now();

      console.log('🔄 [SERV-CACHE-001] Incremental merge completed:', {
        fromAPI: newTasks.length,
        added,
        updated,
        totalInCache: mergedTasks.length,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });

      return mergedTasks;
    } catch (error) {
      console.error('❌ [SERV-CACHE-001] Merge failed, using new tasks:', error);
      return newTasks;
    }
  }

  /**
   * Verifica se uma tarefa mudou comparando campos chave
   */
  private hasTaskChanged(oldTask: ClickUpApiTask, newTask: ClickUpApiTask): boolean {
    const compareFields = [
      'name',
      'status',
      'time_estimate',
      'time_spent',
      'due_date',
      'date_closed',
      'date_updated'  // Important for detecting any change
    ];

    for (const field of compareFields) {
      const oldValue = JSON.stringify((oldTask as any)[field]);
      const newValue = JSON.stringify((newTask as any)[field]);

      if (oldValue !== newValue) {
        return true;
      }
    }

    // Comparar tags
    const oldTags = (oldTask.tags || []).map(t => t.name).sort().join(',');
    const newTags = (newTask.tags || []).map(t => t.name).sort().join(',');
    if (oldTags !== newTags) return true;

    // Comparar assignees
    const oldAssignees = (oldTask.assignees || []).map(a => a.email).sort().join(',');
    const newAssignees = (newTask.assignees || []).map(a => a.email).sort().join(',');
    if (oldAssignees !== newAssignees) return true;

    // CRITICAL: Comparar subtasks (missing in original implementation!)
    const oldSubtasks = JSON.stringify(oldTask.subtasks || []);
    const newSubtasks = JSON.stringify(newTask.subtasks || []);
    if (oldSubtasks !== newSubtasks) {
      console.log(`🔄 [SERV-CACHE-001] Task "${oldTask.name}" has subtask changes`);
      return true;
    }

    return false;
  }

  /**
   * Helpers
   */
  private getAgeString(timestamp: string): string {
    const age = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(age / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  /**
   * RECUPERAÇÃO DE EMERGÊNCIA
   */
  async tryRecoverFromOldCache(): Promise<{ data: GroupedData[] | null, config: any | null }> {
    console.log('🔧 [SERV-CACHE-001] Tentando recuperar cache antigo...');

    let recoveredData: GroupedData[] | null = null;
    let recoveredConfig: any | null = null;

    try {
      const configStr = localStorage.getItem('dailyPresenterConfig');
      if (configStr) {
        recoveredConfig = JSON.parse(configStr);
        console.log('✅ [SERV-CACHE-001] Configurações recuperadas');
      }
    } catch (e) {
      console.error('❌ [SERV-CACHE-001] Erro ao recuperar config:', e);
    }

    try {
      const oldKeys = [
        'dailyFlowCachedData',
        'dailyFlow_processed_v3',
        'clickup_cache_data'
      ];

      for (const key of oldKeys) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached);

          if (Array.isArray(parsed)) {
            recoveredData = parsed;
            console.log(`✅ [SERV-CACHE-001] Dados recuperados de ${key}`);
            break;
          } else if (parsed.data && Array.isArray(parsed.data)) {
            recoveredData = parsed.data;
            console.log(`✅ [SERV-CACHE-001] Dados recuperados de ${key}`);
            break;
          }
        }
      }
    } catch (e) {
      console.error('❌ [SERV-CACHE-001] Erro ao recuperar dados antigos:', e);
    }

    return { data: recoveredData, config: recoveredConfig };
  }

  /**
   * Get cache statistics for all layers
   */
  async getCacheStats(): Promise<{
    layer1Size: number;
    layer2Size: number;
    layer3HasData: boolean;
    layer3TaskCount: number;
    lastSync: string | null;
  }> {
    let layer1Size = 0;
    let layer2Size = 0;
    let layer3HasData = false;
    let layer3TaskCount = 0;
    let lastSync: string | null = null;

    // Layer 1
    const metaStr = localStorage.getItem(METADATA_KEY);
    if (metaStr) {
      layer1Size = metaStr.length * 2; // UTF-16
      try {
        const meta = JSON.parse(metaStr);
        lastSync = meta.lastSync || null;
      } catch { }
    }

    // Layer 2
    const processedStr = localStorage.getItem(PROCESSED_KEY);
    if (processedStr) {
      layer2Size = processedStr.length * 2;
    }

    // Layer 3
    try {
      const raw = await get<ClickUpApiTask[]>(RAW_DATA_IDB_KEY);
      if (raw && Array.isArray(raw)) {
        layer3HasData = true;
        layer3TaskCount = raw.length;
      }
    } catch { }

    return { layer1Size, layer2Size, layer3HasData, layer3TaskCount, lastSync };
  }

  /**
   * Clear a specific cache layer
   */
  async clearLayer(layer: 1 | 2 | 3): Promise<void> {
    switch (layer) {
      case 1:
        localStorage.removeItem(METADATA_KEY);
        console.log('[SERV-CACHE-001] Layer 1 (metadata) cleared');
        break;
      case 2:
        localStorage.removeItem(PROCESSED_KEY);
        console.log('[SERV-CACHE-001] Layer 2 (processed) cleared');
        break;
      case 3:
        await del(RAW_DATA_IDB_KEY);
        console.log('[SERV-CACHE-001] Layer 3 (raw data) cleared');
        break;
    }
  }
}

// Export singleton
export const advancedCache = new AdvancedCacheService();

// ============================================
// CONVENIENCE EXPORTS
// ============================================

export const getCacheStats = () => advancedCache.getCacheStats();
export const clearLayerCache = (layer: 1 | 2 | 3) => advancedCache.clearLayer(layer);

// Cache operations
export const saveRawData = (data: ClickUpApiTask[]) => advancedCache.saveRawData(data);
export const loadRawData = () => advancedCache.loadRawData();
export const saveMetadata = (meta: { filterMetadata: FilterMetadata; lastSync: string; taskCount: number; version: string }) =>
  advancedCache.saveMetadata(meta.filterMetadata, meta.taskCount);
export const loadMetadata = () => advancedCache.loadMetadata();
export const saveProcessedData = (data: GroupedData[]) => advancedCache.saveProcessedData(data);
export const loadProcessedData = () => advancedCache.loadProcessedData();
export const clearAllCache = () => advancedCache.clearAll();
export const mergeIncrementalData = async (existing: ClickUpApiTask[], updated: ClickUpApiTask[]): Promise<ClickUpApiTask[]> =>
  await advancedCache.mergeIncrementalUpdate(updated);
