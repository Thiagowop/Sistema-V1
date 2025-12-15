import { compress, decompress } from 'lz-string';
import { set, get, del } from 'idb-keyval';
import { GroupedData } from '../types';
import { ClickUpApiTask } from './clickup';
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
      console.log('✅ Metadata saved:', {
        tags: cache.tags.length,
        statuses: cache.statuses.length,
        assignees: cache.assignees.length
      });
    } catch (error) {
      console.error('❌ Failed to save metadata:', error);
    }
  }

  loadMetadata(): MetadataCache | null {
    try {
      const cached = localStorage.getItem(METADATA_KEY);
      if (!cached) return null;

      const metadata: MetadataCache = JSON.parse(cached);
      
      // Validar versão
      if (metadata.version !== CACHE_VERSION) {
        console.log('🔄 Metadata version mismatch, clearing...');
        this.clearMetadata();
        return null;
      }

      console.log('✅ Metadata loaded:', {
        tags: metadata.tags.length,
        lastSync: metadata.lastSync
      });
      
      return metadata;
    } catch (error) {
      console.error('❌ Failed to load metadata:', error);
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
      
      console.log('✅ Processed data saved:', {
        original: `${originalSize}KB`,
        compressed: `${compressedSize}KB`,
        ratio: `${ratio}% reduction`,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });
    } catch (error) {
      console.error('❌ Failed to save processed data:', error);
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
        console.log('🔄 Processed data version mismatch, clearing...');
        this.clearProcessedData();
        return null;
      }

      // Carregar dados comprimidos
      const compressedData = localStorage.getItem(PROCESSED_KEY + '_data');
      if (!compressedData) return null;

      const decompressed = decompress(compressedData);
      if (!decompressed) {
        console.error('❌ Failed to decompress data');
        this.clearProcessedData();
        return null;
      }

      const data: GroupedData[] = JSON.parse(decompressed);
      const endTime = performance.now();
      
      console.log('✅ Processed data loaded:', {
        groups: data.length,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });
      
      return data;
    } catch (error) {
      console.error('❌ Failed to load processed data:', error);
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
      
      console.log('✅ Raw data saved to IndexedDB:', {
        tasks: tasks.length,
        size: `~${sizeEstimate}MB`,
        time: `${(endTime - startTime).toFixed(0)}ms`
      });
    } catch (error) {
      console.error('❌ Failed to save raw data to IndexedDB:', error);
      // IndexedDB pode falhar, mas não é crítico
    }
  }

  async loadRawData(): Promise<ClickUpApiTask[] | null> {
    try {
      const startTime = performance.now();
      const cached = await get(RAW_DATA_IDB_KEY);
      
      if (!cached) {
        console.log('ℹ️  No raw data in IndexedDB');
        return null;
      }

      // Validar estrutura
      if (!cached.tasks || !Array.isArray(cached.tasks)) {
        console.error('❌ Invalid raw data structure');
        await this.clearRawData();
        return null;
      }

      // Validar versão
      if (cached.version !== CACHE_VERSION) {
        console.log('🔄 Raw data version mismatch, clearing...');
        await this.clearRawData();
        return null;
      }

      const endTime = performance.now();
      console.log('✅ Raw data loaded from IndexedDB:', {
        tasks: cached.tasks.length,
        time: `${(endTime - startTime).toFixed(0)}ms`,
        age: this.getAgeString(cached.timestamp)
      });
      
      return cached.tasks;
    } catch (error) {
      console.error('❌ Failed to load raw data from IndexedDB:', error);
      return null;
    }
  }

  async clearRawData(): Promise<void> {
    try {
      await del(RAW_DATA_IDB_KEY);
      console.log('🗑️  Raw data cleared from IndexedDB');
    } catch (error) {
      console.error('❌ Failed to clear raw data:', error);
    }
  }

  /**
   * Limpar todos os caches
   */
  async clearAll(): Promise<void> {
    console.log('🗑️  Clearing all caches...');
    this.clearMetadata();
    this.clearProcessedData();
    await this.clearRawData();
    
    // Limpar caches antigos também
    localStorage.removeItem('dailyFlowCachedData');
    localStorage.removeItem('dailyFlowCacheMeta');
    
    console.log('✅ All caches cleared');
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
   * Merge incremental - Atualiza apenas tarefas modificadas
   * Compara por ID e date_updated
   */
  async mergeIncrementalUpdate(newTasks: ClickUpApiTask[]): Promise<ClickUpApiTask[]> {
    try {
      const cached = await this.loadRawData();
      
      if (!cached || cached.length === 0) {
        console.log('📥 No cache found, using full sync');
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
      let unchanged = 0;

      // Atualizar ou adicionar novas tarefas
      newTasks.forEach(newTask => {
        const cachedTask = cachedMap.get(newTask.id);
        
        if (!cachedTask) {
          // Tarefa nova
          cachedMap.set(newTask.id, newTask);
          added++;
        } else {
          // Verificar se foi modificada (comparar date_updated ou outros campos)
          const isModified = this.hasTaskChanged(cachedTask, newTask);
          
          if (isModified) {
            cachedMap.set(newTask.id, newTask);
            updated++;
          } else {
            unchanged++;
          }
        }
      });

      const mergedTasks = Array.from(cachedMap.values());
      const endTime = performance.now();

      console.log('🔄 Incremental merge completed:', {
        total: mergedTasks.length,
        added,
        updated,
        unchanged,
        time: `${(endTime - startTime).toFixed(0)}ms`,
        cacheHitRatio: `${((unchanged / mergedTasks.length) * 100).toFixed(1)}%`
      });

      return mergedTasks;
    } catch (error) {
      console.error('❌ Merge failed, using full sync:', error);
      return newTasks;
    }
  }

  /**
   * Verifica se uma tarefa mudou comparando campos chave
   */
  private hasTaskChanged(oldTask: ClickUpApiTask, newTask: ClickUpApiTask): boolean {
    // Campos que indicam mudança
    const compareFields = [
      'name',
      'status',
      'time_estimate',
      'time_spent',
      'due_date',
      'date_closed'
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
   * Tenta recuperar dados do localStorage antigo (versões anteriores)
   */
  async tryRecoverFromOldCache(): Promise<{ data: GroupedData[] | null, config: any | null }> {
    console.log('🔧 Tentando recuperar cache antigo...');
    
    let recoveredData: GroupedData[] | null = null;
    let recoveredConfig: any | null = null;

    // Tentar carregar configurações
    try {
      const configStr = localStorage.getItem('dailyPresenterConfig');
      if (configStr) {
        recoveredConfig = JSON.parse(configStr);
        console.log('✅ Configurações recuperadas:', {
          hasToken: !!recoveredConfig.clickupApiToken,
          hasListIds: !!recoveredConfig.clickupListIds
        });
      }
    } catch (e) {
      console.error('❌ Erro ao recuperar config:', e);
    }

    // Tentar carregar dados do cache antigo (sem versão)
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
          
          // Tentar diferentes estruturas
          if (Array.isArray(parsed)) {
            recoveredData = parsed;
            console.log(`✅ Dados recuperados de ${key}:`, parsed.length, 'grupos');
            break;
          } else if (parsed.data && Array.isArray(parsed.data)) {
            recoveredData = parsed.data;
            console.log(`✅ Dados recuperados de ${key}:`, parsed.data.length, 'grupos');
            break;
          }
        }
      }
    } catch (e) {
      console.error('❌ Erro ao recuperar dados antigos:', e);
    }

    return { data: recoveredData, config: recoveredConfig };
  }
}

// Export singleton
export const advancedCache = new AdvancedCacheService();
