/**
 * @id HOOK-CACHE-001
 * @name useCache
 * @description Hook para gerenciamento de cache - verificação, limpeza, stats
 * @dependencies contexts/DataContext, services/advancedCacheService
 * @status active
 * @version 2.0.0
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { getCacheStats, clearAllCache, clearLayerCache } from '../services/advancedCacheService';

export interface CacheInfo {
  layer1: {
    name: string;
    description: string;
    size: number;
    sizeFormatted: string;
    hasData: boolean;
  };
  layer2: {
    name: string;
    description: string;
    size: number;
    sizeFormatted: string;
    hasData: boolean;
  };
  layer3: {
    name: string;
    description: string;
    hasData: boolean;
    taskCount: number;
  };
  totalSize: number;
  totalSizeFormatted: string;
  lastSync: string | null;
  taskCount: number;
}

export interface UseCacheReturn {
  // Info
  cacheInfo: CacheInfo | null;
  isLoading: boolean;
  
  // Actions
  refreshInfo: () => Promise<void>;
  clearAll: () => Promise<void>;
  clearLayer: (layer: 1 | 2 | 3) => Promise<void>;
  
  // Status
  hasCache: boolean;
  cacheAge: string | null;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const formatTimeAgo = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  return `${days}d atrás`;
};

export const useCache = (): UseCacheReturn => {
  const { syncState, clearCache, loadFromCache, rawTasks } = useData();
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh cache info
  const refreshInfo = useCallback(async () => {
    console.log('[HOOK-CACHE-001] Refreshing cache info...');
    setIsLoading(true);

    try {
      const stats = await getCacheStats();
      
      const info: CacheInfo = {
        layer1: {
          name: 'localStorage',
          description: 'Metadados para filtros',
          size: stats.layer1Size,
          sizeFormatted: formatBytes(stats.layer1Size),
          hasData: stats.layer1Size > 0
        },
        layer2: {
          name: 'sessionStorage',
          description: 'Dados processados (comprimidos)',
          size: stats.layer2Size,
          sizeFormatted: formatBytes(stats.layer2Size),
          hasData: stats.layer2Size > 0
        },
        layer3: {
          name: 'IndexedDB',
          description: 'Dados brutos da API',
          hasData: stats.layer3HasData,
          taskCount: stats.layer3TaskCount
        },
        totalSize: stats.layer1Size + stats.layer2Size,
        totalSizeFormatted: formatBytes(stats.layer1Size + stats.layer2Size),
        lastSync: stats.lastSync,
        taskCount: stats.layer3TaskCount
      };

      setCacheInfo(info);
    } catch (error) {
      console.error('[HOOK-CACHE-001] Error getting cache info:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cache info on mount
  useEffect(() => {
    refreshInfo();
  }, [refreshInfo]);

  // Clear all cache
  const clearAll = useCallback(async () => {
    console.log('[HOOK-CACHE-001] Clearing all cache...');
    setIsLoading(true);
    
    try {
      await clearCache();
      await refreshInfo();
    } finally {
      setIsLoading(false);
    }
  }, [clearCache, refreshInfo]);

  // Clear specific layer
  const clearLayer = useCallback(async (layer: 1 | 2 | 3) => {
    console.log(`[HOOK-CACHE-001] Clearing layer ${layer}...`);
    setIsLoading(true);
    
    try {
      await clearLayerCache(layer);
      await refreshInfo();
    } finally {
      setIsLoading(false);
    }
  }, [refreshInfo]);

  // Computed values
  const hasCache = useMemo(() => {
    if (!cacheInfo) return rawTasks.length > 0;
    return cacheInfo.layer1.hasData || cacheInfo.layer2.hasData || cacheInfo.layer3.hasData;
  }, [cacheInfo, rawTasks]);

  const cacheAge = useMemo(() => {
    const lastSync = cacheInfo?.lastSync || syncState.lastSync;
    if (!lastSync) return null;
    return formatTimeAgo(lastSync);
  }, [cacheInfo?.lastSync, syncState.lastSync]);

  return {
    cacheInfo,
    isLoading,
    refreshInfo,
    clearAll,
    clearLayer,
    hasCache,
    cacheAge
  };
};

export default useCache;
