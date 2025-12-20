/**
 * @id CTX-DATA-001
 * @name DataContext
 * @description Context global para dados do ClickUp - tasks, metadata, sync status
 * @dependencies services/clickup, services/advancedCacheService
 * @status active
 * @version 2.0.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { GroupedData, AppConfig, Task, StandupEntry, TeamMemberData } from '../types';
import { FilterMetadata } from '../types/FilterConfig';
import { ClickUpApiTask, fetchRawClickUpData, processApiTasks, extractFilterMetadata, fetchStandupSummaries } from '../services/clickup';
import { saveRawData, loadRawData, saveMetadata, loadMetadata, saveProcessedData, loadProcessedData, clearAllCache, mergeIncrementalData } from '../services/advancedCacheService';

// ============================================
// TYPES
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSync: string | null;
  taskCount: number;
  error: string | null;
  progress: number; // 0-100
}

export interface DataContextValue {
  // Data
  rawTasks: ClickUpApiTask[];
  groupedData: GroupedData[];
  metadata: FilterMetadata | null;
  standups: StandupEntry[];
  
  // Sync State
  syncState: SyncState;
  
  // Config
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;
  
  // Actions
  syncFull: () => Promise<void>;
  syncIncremental: () => Promise<void>;
  loadFromCache: () => Promise<boolean>;
  clearCache: () => Promise<void>;
  fetchStandups: (options?: { limit?: number; forDate?: Date }) => Promise<void>;
  
  // Helpers
  getTaskById: (id: string) => Task | null;
  getTasksByAssignee: (assignee: string) => Task[];
  getTasksByProject: (project: string) => Task[];
}

const defaultSyncState: SyncState = {
  status: 'idle',
  lastSync: null,
  taskCount: 0,
  error: null,
  progress: 0
};

// ============================================
// CONTEXT
// ============================================

const DataContext = createContext<DataContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface DataProviderProps {
  children: ReactNode;
  initialConfig?: AppConfig;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children, initialConfig }) => {
  // State
  const [rawTasks, setRawTasks] = useState<ClickUpApiTask[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [metadata, setMetadata] = useState<FilterMetadata | null>(null);
  const [standups, setStandups] = useState<StandupEntry[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(defaultSyncState);
  const [config, setConfigState] = useState<AppConfig | null>(initialConfig || null);

  // ============================================
  // CONFIG
  // ============================================
  
  const setConfig = useCallback((newConfig: AppConfig) => {
    console.log('[CTX-DATA-001] Config updated');
    setConfigState(newConfig);
    // Persist to localStorage
    localStorage.setItem('dailyFlow_config_v2', JSON.stringify(newConfig));
  }, []);

  // Load config on mount
  useEffect(() => {
    if (!initialConfig) {
      const saved = localStorage.getItem('dailyFlow_config_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConfigState(parsed);
          console.log('[CTX-DATA-001] Config loaded from storage');
        } catch (e) {
          console.warn('[CTX-DATA-001] Failed to parse saved config');
        }
      }
    }
  }, [initialConfig]);

  // ============================================
  // LOAD FROM CACHE
  // ============================================
  
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    console.log('[CTX-DATA-001] Loading from cache...');
    
    try {
      // Load metadata first (fastest)
      const cachedMeta = loadMetadata();
      if (cachedMeta) {
        // Convert MetadataCache to FilterMetadata format
        const filterMeta: FilterMetadata = {
          tags: cachedMeta.tags,
          statuses: cachedMeta.statuses,
          assignees: cachedMeta.assignees,
          projects: cachedMeta.projects,
          priorities: cachedMeta.priorities,
        };
        setMetadata(filterMeta);
        setSyncState(prev => ({
          ...prev,
          lastSync: cachedMeta.lastSync,
          taskCount: cachedMeta.taskCount
        }));
      }

      // Load processed data
      const cachedProcessed = loadProcessedData();
      if (cachedProcessed) {
        setGroupedData(cachedProcessed);
        console.log('[CTX-DATA-001] Loaded processed data from cache');
      }

      // Load raw data from IndexedDB (slower)
      const cachedRaw = await loadRawData();
      if (cachedRaw && cachedRaw.length > 0) {
        setRawTasks(cachedRaw);
        console.log(`[CTX-DATA-001] Loaded ${cachedRaw.length} raw tasks from cache`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[CTX-DATA-001] Error loading cache:', error);
      return false;
    }
  }, []);

  // ============================================
  // FULL SYNC
  // ============================================
  
  const syncFull = useCallback(async () => {
    if (!config) {
      console.error('[CTX-DATA-001] No config available for sync');
      setSyncState(prev => ({ ...prev, status: 'error', error: 'Configuração não disponível' }));
      return;
    }

    console.log('[CTX-DATA-001] Starting FULL sync...');
    setSyncState(prev => ({ ...prev, status: 'syncing', error: null, progress: 0 }));

    try {
      // Step 1: Fetch raw data (0-50%)
      setSyncState(prev => ({ ...prev, progress: 10 }));
      const raw = await fetchRawClickUpData(config);
      setRawTasks(raw);
      setSyncState(prev => ({ ...prev, progress: 50 }));

      // Step 2: Extract metadata (50-60%)
      const meta = extractFilterMetadata(raw, config.nameMappings);
      setMetadata(meta);
      setSyncState(prev => ({ ...prev, progress: 60 }));

      // Step 3: Process tasks locally (60-80%) - SEM busca duplicada!
      const processed = processApiTasks(raw, config);
      setGroupedData(processed);
      setSyncState(prev => ({ ...prev, progress: 80 }));

      // Step 4: Save to cache (80-100%)
      const now = new Date().toISOString();
      await saveRawData(raw);
      saveMetadata({
        filterMetadata: meta,
        lastSync: now,
        taskCount: raw.length,
        version: '2.0.0'
      });
      saveProcessedData(processed);
      
      setSyncState({
        status: 'success',
        lastSync: now,
        taskCount: raw.length,
        error: null,
        progress: 100
      });

      console.log(`[CTX-DATA-001] FULL sync complete: ${raw.length} tasks`);

    } catch (error: any) {
      console.error('[CTX-DATA-001] Sync error:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Erro desconhecido na sincronização',
        progress: 0
      }));
    }
  }, [config]);

  // ============================================
  // INCREMENTAL SYNC
  // ============================================
  
  const syncIncremental = useCallback(async () => {
    if (!config) {
      console.error('[CTX-DATA-001] No config available for sync');
      return;
    }

    if (!syncState.lastSync) {
      console.log('[CTX-DATA-001] No previous sync, doing full sync instead');
      return syncFull();
    }

    console.log(`[CTX-DATA-001] Starting INCREMENTAL sync since ${syncState.lastSync}...`);
    setSyncState(prev => ({ ...prev, status: 'syncing', error: null, progress: 0 }));

    try {
      // Fetch only updated tasks
      setSyncState(prev => ({ ...prev, progress: 20 }));
      const updatedTasks = await fetchRawClickUpData(config, syncState.lastSync);
      
      if (updatedTasks.length === 0) {
        console.log('[CTX-DATA-001] No updates found');
        setSyncState(prev => ({
          ...prev,
          status: 'success',
          progress: 100
        }));
        return;
      }

      // Merge with existing data
      setSyncState(prev => ({ ...prev, progress: 50 }));
      const merged = mergeIncrementalData(rawTasks, updatedTasks);
      setRawTasks(merged);

      // Re-extract metadata
      const meta = extractFilterMetadata(merged, config.nameMappings);
      setMetadata(meta);
      setSyncState(prev => ({ ...prev, progress: 70 }));

      // Re-process locally - SEM busca duplicada!
      const processed = processApiTasks(merged, config);
      setGroupedData(processed);
      setSyncState(prev => ({ ...prev, progress: 85 }));

      // Save to cache
      const now = new Date().toISOString();
      await saveRawData(merged);
      saveMetadata({
        filterMetadata: meta,
        lastSync: now,
        taskCount: merged.length,
        version: '2.0.0'
      });
      saveProcessedData(processed);

      setSyncState({
        status: 'success',
        lastSync: now,
        taskCount: merged.length,
        error: null,
        progress: 100
      });

      console.log(`[CTX-DATA-001] INCREMENTAL sync complete: ${updatedTasks.length} updated, ${merged.length} total`);

    } catch (error: any) {
      console.error('[CTX-DATA-001] Incremental sync error:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error.message || 'Erro na sincronização incremental',
        progress: 0
      }));
    }
  }, [config, syncState.lastSync, rawTasks, syncFull]);

  // ============================================
  // CLEAR CACHE
  // ============================================
  
  const clearCache = useCallback(async () => {
    console.log('[CTX-DATA-001] Clearing all cache...');
    await clearAllCache();
    setRawTasks([]);
    setGroupedData([]);
    setMetadata(null);
    setSyncState(defaultSyncState);
    console.log('[CTX-DATA-001] Cache cleared');
  }, []);

  // ============================================
  // FETCH STANDUPS
  // ============================================
  
  const fetchStandups = useCallback(async (options?: { limit?: number; forDate?: Date }) => {
    if (!config) return;

    try {
      console.log('[CTX-DATA-001] Fetching standups...');
      const entries = await fetchStandupSummaries(config, options);
      setStandups(entries);
      console.log(`[CTX-DATA-001] Loaded ${entries.length} standups`);
    } catch (error: any) {
      console.error('[CTX-DATA-001] Error fetching standups:', error);
    }
  }, [config]);

  // ============================================
  // HELPERS
  // ============================================
  
  const getTaskById = useCallback((id: string): Task | null => {
    for (const group of groupedData) {
      for (const project of group.projects) {
        const task = project.tasks.find(t => t.id === id);
        if (task) return task;
        
        // Check subtasks
        for (const t of project.tasks) {
          const sub = t.subtasks?.find(s => s.id === id);
          if (sub) return sub;
        }
      }
    }
    return null;
  }, [groupedData]);

  const getTasksByAssignee = useCallback((assignee: string): Task[] => {
    const group = groupedData.find(g => g.assignee === assignee);
    if (!group) return [];
    return group.projects.flatMap(p => p.tasks);
  }, [groupedData]);

  const getTasksByProject = useCallback((project: string): Task[] => {
    const tasks: Task[] = [];
    for (const group of groupedData) {
      const proj = group.projects.find(p => p.name === project);
      if (proj) tasks.push(...proj.tasks);
    }
    return tasks;
  }, [groupedData]);

  // ============================================
  // CONTEXT VALUE
  // ============================================
  
  const value: DataContextValue = {
    // Data
    rawTasks,
    groupedData,
    metadata,
    standups,
    
    // Sync State
    syncState,
    
    // Config
    config,
    setConfig,
    
    // Actions
    syncFull,
    syncIncremental,
    loadFromCache,
    clearCache,
    fetchStandups,
    
    // Helpers
    getTaskById,
    getTasksByAssignee,
    getTasksByProject
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

// ============================================
// HOOK
// ============================================

export const useData = (): DataContextValue => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('[CTX-DATA-001] useData must be used within DataProvider');
  }
  return context;
};

export default DataContext;
