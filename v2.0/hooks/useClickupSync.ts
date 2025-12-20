/**
 * @id HOOK-SYNC-001
 * @name useClickupSync
 * @description Hook para sincronização com ClickUp - wrapper sobre DataContext
 * @dependencies contexts/DataContext
 * @status active
 * @version 2.0.0
 */

import { useCallback, useEffect, useRef } from 'react';
import { useData, SyncStatus } from '../contexts/DataContext';

export interface UseSyncOptions {
  autoLoadCache?: boolean;      // Carregar cache ao montar (default: true)
  autoSyncOnMount?: boolean;    // Sync automático se cache vazio (default: false)
  syncInterval?: number;        // Intervalo de sync em ms (default: 0 = desabilitado)
}

export interface UseSyncReturn {
  // State
  status: SyncStatus;
  lastSync: string | null;
  taskCount: number;
  error: string | null;
  progress: number;
  isLoading: boolean;
  
  // Actions
  syncNow: () => Promise<void>;
  syncIncremental: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useClickupSync = (options: UseSyncOptions = {}): UseSyncReturn => {
  const {
    autoLoadCache = true,
    autoSyncOnMount = false,
    syncInterval = 0
  } = options;

  const { syncState, syncFull, syncIncremental, loadFromCache, config } = useData();
  const hasLoadedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-load cache on mount
  useEffect(() => {
    if (autoLoadCache && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      
      loadFromCache().then(hasData => {
        if (!hasData && autoSyncOnMount && config) {
          console.log('[HOOK-SYNC-001] No cache, starting auto sync...');
          syncFull();
        }
      });
    }
  }, [autoLoadCache, autoSyncOnMount, loadFromCache, syncFull, config]);

  // Auto-sync interval
  useEffect(() => {
    if (syncInterval > 0 && config) {
      console.log(`[HOOK-SYNC-001] Setting up sync interval: ${syncInterval}ms`);
      
      intervalRef.current = setInterval(() => {
        if (syncState.status !== 'syncing') {
          console.log('[HOOK-SYNC-001] Running scheduled sync...');
          syncIncremental();
        }
      }, syncInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [syncInterval, config, syncState.status, syncIncremental]);

  // Sync now (full)
  const syncNow = useCallback(async () => {
    console.log('[HOOK-SYNC-001] Manual sync triggered');
    await syncFull();
  }, [syncFull]);

  // Refresh (tries incremental first, falls back to full)
  const refresh = useCallback(async () => {
    console.log('[HOOK-SYNC-001] Refresh triggered');
    if (syncState.lastSync) {
      await syncIncremental();
    } else {
      await syncFull();
    }
  }, [syncState.lastSync, syncIncremental, syncFull]);

  return {
    status: syncState.status,
    lastSync: syncState.lastSync,
    taskCount: syncState.taskCount,
    error: syncState.error,
    progress: syncState.progress,
    isLoading: syncState.status === 'syncing',
    
    syncNow,
    syncIncremental,
    refresh
  };
};

export default useClickupSync;
