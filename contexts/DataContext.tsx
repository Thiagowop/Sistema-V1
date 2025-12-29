/**
 * @id CTX-DATA-001
 * @name DataContext
 * @description Context global para dados do ClickUp - tasks, metadata, sync status
 * @dependencies services/clickup, services/advancedCacheService
 * @status active
 * @version 2.0.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';
import { GroupedData, AppConfig, Task, StandupEntry, TeamMemberData } from '../types';
import { FilterMetadata } from '../types/FilterConfig';
import { ClickUpApiTask, fetchRawClickUpData, processApiTasks, extractFilterMetadata, fetchStandupSummaries, SyncFilterOptions } from '../services/clickup';
import { saveRawData, loadRawData, saveMetadata, loadMetadata, saveProcessedData, loadProcessedData, clearAllCache, mergeIncrementalData } from '../services/advancedCacheService';
import { SyncFilters, loadSyncFilters, saveSyncFilters, createDefaultSyncFilters } from '../services/filterService';
import { referenceData, getEquipTags, getTeamMembers, getProjects, EquipTag, TeamMember, ReferenceItem } from '../services/referenceDataService';
import { saveToSharedCache, loadFromSharedCache, getSharedCacheStatus } from '../services/sharedCacheService';

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
  isInitialized: boolean;  // True quando o cache foi carregado
  hasCacheData: boolean;   // True se tem dados no cache
  isReferenceDataReady: boolean; // True quando dados de referência estão prontos

  // Config
  config: AppConfig | null;
  setConfig: (config: AppConfig) => void;

  // Sync Filters
  syncFilters: SyncFilters;
  setSyncFilters: (filters: SyncFilters) => void;

  // Actions
  syncFull: (customFilters?: SyncFilters) => Promise<void>;
  syncIncremental: (customFilters?: SyncFilters) => Promise<void>;
  cancelSync: () => void;
  loadFromCache: () => Promise<boolean>;
  clearCache: () => Promise<void>;
  fetchStandups: (options?: { limit?: number; forDate?: Date }) => Promise<void>;

  // Reference Data (dados persistentes que não são limpos com o cache)
  referenceData: {
    equipTags: EquipTag[];
    teamMembers: TeamMember[];
    projects: ReferenceItem[];
    isReady: boolean;
  };
  refreshReferenceData: () => Promise<void>;
  syncReferenceToSupabase: () => Promise<boolean>;

  // Shared Cache (Supabase - for team access)
  loadFromSharedCache: () => Promise<boolean>;
  saveToSharedCache: (syncedBy: string) => Promise<boolean>;
  sharedCacheStatus: {
    hasData: boolean;
    lastSync: string | null;
    syncedBy: string | null;
    taskCount: number;
  } | null;

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
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasCacheData, setHasCacheData] = useState(false);
  const [syncFilters, setSyncFiltersState] = useState<SyncFilters>(loadSyncFilters);

  // Reference Data State (dados persistentes)
  const [isReferenceDataReady, setIsReferenceDataReady] = useState(false);
  const [refDataVersion, setRefDataVersion] = useState(0); // Para forçar re-render

  // Shared Cache Status (Supabase)
  const [sharedCacheStatus, setSharedCacheStatus] = useState<{
    hasData: boolean;
    lastSync: string | null;
    syncedBy: string | null;
    taskCount: number;
  } | null>(null);

  // Abort controller for cancellable sync
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================
  // SYNC FILTERS
  // ============================================

  const setSyncFilters = useCallback((filters: SyncFilters) => {
    console.log('[CTX-DATA-001] Sync filters updated:', filters);
    setSyncFiltersState(filters);
    saveSyncFilters(filters);
  }, []);

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
  // REFERENCE DATA FUNCTIONS
  // ============================================

  const refreshReferenceData = useCallback(async () => {
    console.log('[CTX-DATA-001] 🔄 Refreshing reference data...');
    setRefDataVersion(v => v + 1); // Force re-render
  }, []);

  const syncReferenceToSupabase = useCallback(async (): Promise<boolean> => {
    console.log('[CTX-DATA-001] ☁️ Syncing reference data to Supabase...');
    return await referenceData.syncToSupabase();
  }, []);

  /**
   * Extrai dados de referência de raw tasks após sync
   */
  const extractReferenceDataFromTasks = useCallback(async (tasks: ClickUpApiTask[]) => {
    console.log('[CTX-DATA-001] 📊 Extracting reference data from tasks...');

    try {
      const equipAdded = await referenceData.extractEquipTagsFromTasks(tasks);
      const membersAdded = await referenceData.extractTeamMembersFromTasks(tasks);
      const projectsAdded = await referenceData.extractProjectsFromTasks(tasks);

      console.log(`[CTX-DATA-001] ✅ Reference data extracted: +${equipAdded} tags, +${membersAdded} members, +${projectsAdded} projects`);

      // Forçar re-render para componentes que usam referenceData
      setRefDataVersion(v => v + 1);
    } catch (error) {
      console.error('[CTX-DATA-001] ❌ Error extracting reference data:', error);
    }
  }, []);

  // ============================================
  // AUTO-LOAD CACHE ON MOUNT
  // ============================================

  useEffect(() => {
    const initializeFromCache = async () => {
      if (isInitialized) return;

      console.log('[CTX-DATA-001] 🚀 Initializing...');

      // 1. Inicializar Reference Data PRIMEIRO (dados persistentes)
      console.log('[CTX-DATA-001] 📦 Loading reference data (persistent)...');
      await referenceData.initialize();
      setIsReferenceDataReady(true);

      // 2. Carregar cache de tarefas
      console.log('[CTX-DATA-001] 📦 Loading task cache...');
      const hasCache = await loadFromCache();

      if (hasCache) {
        console.log('[CTX-DATA-001] ✅ App ready with cached data!');
      } else {
        console.log('[CTX-DATA-001] ℹ️ No cache found - waiting for sync');
      }

      setIsInitialized(true);
    };

    initializeFromCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // LOAD FROM CACHE
  // ============================================

  const loadFromCache = useCallback(async (): Promise<boolean> => {
    console.log('[CTX-DATA-001] 📦 Loading from cache...');

    try {
      let hasData = false;

      // Load metadata first (fastest) - Layer 1
      const cachedMeta = loadMetadata();
      if (cachedMeta) {
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
          taskCount: cachedMeta.taskCount,
          status: 'success' // Marcar como success se tem cache
        }));
        console.log('[CTX-DATA-001] ✅ Layer 1 (metadata) loaded');
      }

      // Load processed data - Layer 2 (fastest for display)
      const cachedProcessed = loadProcessedData();
      if (cachedProcessed && cachedProcessed.length > 0) {
        setGroupedData(cachedProcessed);
        hasData = true;
        console.log(`[CTX-DATA-001] ✅ Layer 2 (processed) loaded: ${cachedProcessed.length} groups`);
      }

      // Load raw data from IndexedDB - Layer 3 (slower but complete)
      const cachedRaw = await loadRawData();
      if (cachedRaw && cachedRaw.length > 0) {
        setRawTasks(cachedRaw);
        hasData = true;
        console.log(`[CTX-DATA-001] ✅ Layer 3 (raw) loaded: ${cachedRaw.length} tasks`);
      }

      setHasCacheData(hasData);
      return hasData;
    } catch (error) {
      console.error('[CTX-DATA-001] ❌ Error loading cache:', error);
      return false;
    }
  }, []);

  // ============================================
  // FULL SYNC
  // ============================================

  const syncFull = useCallback(async (customFilters?: SyncFilters) => {
    if (!config) {
      console.error('[CTX-DATA-001] No config available for sync');
      setSyncState(prev => ({ ...prev, status: 'error', error: 'Configuração não disponível' }));
      return;
    }

    // Use custom filters or saved filters
    const filters = customFilters || syncFilters;
    const hasFilters = filters.tags.length > 0 || filters.assignees.length > 0;

    console.log('[CTX-DATA-001] Starting FULL sync...', hasFilters ? `with filters: ${JSON.stringify(filters)}` : '(no filters)');
    setSyncState(prev => ({ ...prev, status: 'syncing', error: null, progress: 0 }));

    // Create abort controller for this sync
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Step 1: Fetch raw data with filters (0-50%)
      setSyncState(prev => ({ ...prev, progress: 10 }));

      const syncOptions: SyncFilterOptions = {
        tags: filters.tags,
        assignees: filters.assignees,
        includeArchived: filters.includeArchived,
        signal, // Pass abort signal
        onProgress: (current, total, message) => {
          // Check if cancelled
          if (signal.aborted) return;
          // Calculate progress: pages are 10-50% of total
          const pageProgress = Math.min(40, (current / Math.max(total, 1)) * 40);
          setSyncState(prev => ({ ...prev, progress: Math.round(10 + pageProgress) }));
        }
      };

      const raw = await fetchRawClickUpData(config, syncOptions);
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

      // Step 4: Save to cache (80-95%)
      const now = new Date().toISOString();
      await saveRawData(raw);
      saveMetadata({
        filterMetadata: meta,
        lastSync: now,
        taskCount: raw.length,
        version: '2.0.0'
      });
      saveProcessedData(processed);
      setSyncState(prev => ({ ...prev, progress: 90 }));

      // Step 5: Extract reference data (95-100%)
      // Dados de referência são armazenados separadamente e NÃO são limpos com clearCache
      await extractReferenceDataFromTasks(raw);

      setSyncState({
        status: 'success',
        lastSync: now,
        taskCount: raw.length,
        error: null,
        progress: 100
      });

      console.log(`[CTX-DATA-001] FULL sync complete: ${raw.length} tasks`);

    } catch (error: any) {
      // Check if it was a cancellation
      if (error.name === 'AbortError' || signal.aborted) {
        console.log('[CTX-DATA-001] ⏹️ Sync cancelled by user');
        setSyncState(prev => ({
          ...prev,
          status: 'idle',
          error: null,
          progress: 0
        }));
        return;
      }

      console.error('[CTX-DATA-001] ❌ Sync error:', error);

      // FALLBACK: Se tiver dados no cache, manter e mostrar aviso
      if (hasCacheData && groupedData.length > 0) {
        console.log('[CTX-DATA-001] ⚠️ Sync failed but using cached data');
        setSyncState(prev => ({
          ...prev,
          status: 'error',
          error: `Erro na sincronização: ${error.message}. Usando dados do cache.`,
          // Manter lastSync e taskCount anteriores
        }));
      } else {
        setSyncState(prev => ({
          ...prev,
          status: 'error',
          error: error.message || 'Erro desconhecido na sincronização',
          progress: 0
        }));
      }
    }
  }, [config, syncFilters, hasCacheData, groupedData.length]);

  // ============================================
  // INCREMENTAL SYNC
  // ============================================

  const syncIncremental = useCallback(async (customFilters?: SyncFilters) => {
    if (!config) {
      console.error('[CTX-DATA-001] No config available for sync');
      return;
    }

    if (!syncState.lastSync) {
      console.log('[CTX-DATA-001] No previous sync, doing full sync instead');
      return syncFull(customFilters);
    }

    // Use custom filters or saved filters
    const filters = customFilters || syncFilters;

    console.log(`[CTX-DATA-001] Starting INCREMENTAL sync since ${syncState.lastSync}...`);
    console.log(`[CTX-DATA-001] Current rawTasks in state: ${rawTasks.length}`);
    setSyncState(prev => ({ ...prev, status: 'syncing', error: null, progress: 0 }));

    // Create abort controller for this sync
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Fetch only updated tasks with filters
      setSyncState(prev => ({ ...prev, progress: 20 }));

      const syncOptions: SyncFilterOptions = {
        tags: filters.tags,
        assignees: filters.assignees,
        includeArchived: filters.includeArchived,
        incrementalSince: syncState.lastSync,
        signal // Pass abort signal
      };

      console.log(`[CTX-DATA-001] Calling API with options:`, syncOptions);
      const updatedTasks = await fetchRawClickUpData(config, syncOptions);

      console.log(`[CTX-DATA-001] API returned ${updatedTasks.length} updated tasks:`);
      updatedTasks.slice(0, 10).forEach(t => {
        console.log(`  - "${t.name}" (ID: ${t.id}, parent: ${t.parent || 'root'})`);
      });
      if (updatedTasks.length > 10) {
        console.log(`  ... and ${updatedTasks.length - 10} more`);
      }

      if (updatedTasks.length === 0) {
        console.log('[CTX-DATA-001] No updates found from API');
        setSyncState(prev => ({
          ...prev,
          status: 'success',
          progress: 100
        }));
        return;
      }

      // Merge with existing data
      setSyncState(prev => ({ ...prev, progress: 50 }));
      console.log(`[CTX-DATA-001] Merging ${updatedTasks.length} new tasks with ${rawTasks.length} cached tasks...`);
      const merged = await mergeIncrementalData(rawTasks, updatedTasks);
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
      setSyncState(prev => ({ ...prev, progress: 95 }));

      // Extract reference data from updated tasks (incremental)
      await extractReferenceDataFromTasks(updatedTasks);

      setSyncState({
        status: 'success',
        lastSync: now,
        taskCount: merged.length,
        error: null,
        progress: 100
      });

      console.log(`[CTX-DATA-001] INCREMENTAL sync complete: ${updatedTasks.length} updated, ${merged.length} total`);

    } catch (error: any) {
      // Check if it was a cancellation
      if (error.name === 'AbortError') {
        console.log('[CTX-DATA-001] ⏹️ Incremental sync cancelled by user');
        setSyncState(prev => ({
          ...prev,
          status: 'idle',
          error: null,
          progress: 0
        }));
        return;
      }

      console.error('[CTX-DATA-001] ❌ Incremental sync error:', error);

      // FALLBACK: Se tiver dados no cache, manter e mostrar aviso
      if (hasCacheData && groupedData.length > 0) {
        console.log('[CTX-DATA-001] ⚠️ Incremental sync failed but using cached data');
        setSyncState(prev => ({
          ...prev,
          status: 'error',
          error: `Erro na sincronização: ${error.message}. Usando dados do cache.`,
        }));
      } else {
        setSyncState(prev => ({
          ...prev,
          status: 'error',
          error: error.message || 'Erro na sincronização incremental',
          progress: 0
        }));
      }
    }
  }, [config, syncFilters, syncState.lastSync, rawTasks, syncFull, hasCacheData, groupedData.length]);

  // ============================================
  // CANCEL SYNC
  // ============================================

  const cancelSync = useCallback(() => {
    if (abortControllerRef.current) {
      console.log('[CTX-DATA-001] ⏹️ Cancelling sync...');
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // ============================================
  // CLEAR CACHE
  // ============================================

  const clearCache = useCallback(async () => {
    console.log('[CTX-DATA-001] Clearing task cache (preserving reference data)...');
    await clearAllCache();
    setRawTasks([]);
    setGroupedData([]);
    setSyncState(defaultSyncState);

    // Repopulate metadata from persistent reference data
    // This ensures tags/team members are still available after cache clear
    const equipTags = getEquipTags();
    const teamMembers = getTeamMembers();
    const projects = getProjects();

    if (equipTags.length > 0 || teamMembers.length > 0 || projects.length > 0) {
      const refMetadata: FilterMetadata = {
        tags: equipTags.map(t => t.name),
        statuses: [], // Statuses are not persisted in reference data
        assignees: teamMembers.map(m => m.name),
        projects: projects.map(p => p.name),
        priorities: []
      };
      setMetadata(refMetadata);
      console.log('[CTX-DATA-001] ✅ Metadata restored from reference data:', {
        tags: refMetadata.tags.length,
        assignees: refMetadata.assignees.length,
        projects: refMetadata.projects.length
      });
    } else {
      setMetadata(null);
      console.log('[CTX-DATA-001] ℹ️ No reference data available');
    }

    console.log('[CTX-DATA-001] ✅ Task cache cleared (reference data preserved)');
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
  // SHARED CACHE (Supabase - for team access)
  // ============================================

  /**
   * Load data from Supabase shared cache (for team/viewers who can't sync)
   */
  const loadFromSharedCacheHandler = useCallback(async (): Promise<boolean> => {
    console.log('[CTX-DATA-001] 📥 Loading from shared cache (Supabase)...');

    try {
      const result = await loadFromSharedCache();

      if (!result.rawTasks && !result.processedData) {
        console.log('[CTX-DATA-001] ℹ️ No data in shared cache');
        return false;
      }

      // Load raw tasks if available
      if (result.rawTasks && result.rawTasks.length > 0) {
        setRawTasks(result.rawTasks);
        console.log(`[CTX-DATA-001] ✅ Loaded ${result.rawTasks.length} raw tasks from shared cache`);
      }

      // Load processed data if available
      if (result.processedData && result.processedData.length > 0) {
        setGroupedData(result.processedData);
        console.log(`[CTX-DATA-001] ✅ Loaded ${result.processedData.length} groups from shared cache`);
      }

      // Load filter metadata if available
      if (result.filterMetadata) {
        setMetadata(result.filterMetadata);
      }

      // Update sync state with cache metadata
      if (result.cacheMetadata) {
        setSyncState(prev => ({
          ...prev,
          status: 'success',
          lastSync: result.cacheMetadata!.lastSync,
          taskCount: result.cacheMetadata!.taskCount,
          error: null
        }));

        setSharedCacheStatus({
          hasData: true,
          lastSync: result.cacheMetadata.lastSync,
          syncedBy: result.cacheMetadata.syncedBy,
          taskCount: result.cacheMetadata.taskCount
        });
      }

      setHasCacheData(true);
      console.log('[CTX-DATA-001] ✅ Data loaded from shared cache successfully');
      return true;

    } catch (error: any) {
      console.error('[CTX-DATA-001] ❌ Error loading from shared cache:', error);
      return false;
    }
  }, []);

  /**
   * Save current data to Supabase shared cache (admin only, called after sync)
   */
  const saveToSharedCacheHandler = useCallback(async (syncedBy: string): Promise<boolean> => {
    console.log('[CTX-DATA-001] 💾 Saving to shared cache (Supabase)...');

    try {
      if (rawTasks.length === 0) {
        console.warn('[CTX-DATA-001] ⚠️ No raw tasks to save');
        return false;
      }

      const success = await saveToSharedCache(
        rawTasks,
        groupedData,
        metadata || { tags: [], statuses: [], assignees: [], projects: [], priorities: [] },
        syncedBy
      );

      if (success) {
        console.log('[CTX-DATA-001] ✅ Data saved to shared cache');

        // Update shared cache status
        setSharedCacheStatus({
          hasData: true,
          lastSync: new Date().toISOString(),
          syncedBy,
          taskCount: rawTasks.length
        });
      }

      return success;
    } catch (error: any) {
      console.error('[CTX-DATA-001] ❌ Error saving to shared cache:', error);
      return false;
    }
  }, [rawTasks, groupedData, metadata]);

  /**
   * Check shared cache status on mount
   */
  useEffect(() => {
    const checkSharedCacheStatus = async () => {
      try {
        const status = await getSharedCacheStatus();
        setSharedCacheStatus(status);
        console.log('[CTX-DATA-001] 📊 Shared cache status:', status);
      } catch (error) {
        console.error('[CTX-DATA-001] Error checking shared cache status:', error);
      }
    };

    checkSharedCacheStatus();
  }, []);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const referenceDataValue = React.useMemo(() => ({
    equipTags: getEquipTags(),
    teamMembers: getTeamMembers(),
    projects: getProjects(),
    isReady: isReferenceDataReady
  }), [isReferenceDataReady, refDataVersion]);

  const value: DataContextValue = {
    // Data
    rawTasks,
    groupedData,
    metadata,
    standups,

    // Sync State
    syncState,
    isInitialized,
    hasCacheData,
    isReferenceDataReady,

    // Config
    config,
    setConfig,

    // Sync Filters
    syncFilters,
    setSyncFilters,

    // Actions
    syncFull,
    syncIncremental,
    cancelSync,
    loadFromCache,
    clearCache,
    fetchStandups,

    // Reference Data
    referenceData: referenceDataValue,
    refreshReferenceData,
    syncReferenceToSupabase,

    // Shared Cache (Supabase - for team access)
    loadFromSharedCache: loadFromSharedCacheHandler,
    saveToSharedCache: saveToSharedCacheHandler,
    sharedCacheStatus,

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
