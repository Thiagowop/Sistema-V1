/**
 * @id CTX-FILTER-001
 * @name GlobalFilterContext
 * @description Contexto global para gerenciamento de filtros compartilhados entre todas as views
 * @dependencies filterService, DataContext
 * @status active
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { FilterConfig, FilterMetadata } from '../types/FilterConfig';
import { getCachedMetadata, FilterService, loadSyncFilters, saveSyncFilters, SyncFilters } from '../services/filterService';

// ============================================
// TYPES
// ============================================

export interface GlobalFilters {
    tags: string[];           // Tags ativas para filtrar
    statuses: string[];       // Status ativos para filtrar
    projects: string[];       // Projetos ativos para filtrar
    assignees: string[];      // Membros ativos para filtrar
    excludeClosed: boolean;   // Excluir tarefas fechadas
    showSubtasks: boolean;    // Mostrar subtarefas
}

interface GlobalFilterContextValue {
    // Filtros ativos
    filters: GlobalFilters;

    // Opções disponíveis (do cache)
    availableOptions: FilterMetadata | null;

    // Setters
    setTagFilter: (tags: string[]) => void;
    setStatusFilter: (statuses: string[]) => void;
    setProjectFilter: (projects: string[]) => void;
    setAssigneeFilter: (assignees: string[]) => void;
    toggleExcludeClosed: () => void;
    toggleShowSubtasks: () => void;

    // Helpers
    clearAllFilters: () => void;
    hasActiveFilters: boolean;
    filterSummary: string[];

    // Sync filters (para API)
    syncFilters: SyncFilters;
    setSyncFilters: (filters: SyncFilters) => void;

    // Refresh available options from cache
    refreshOptions: () => void;
}

// ============================================
// DEFAULT VALUES
// ============================================

const defaultFilters: GlobalFilters = {
    tags: [],
    statuses: [],
    projects: [],
    assignees: [],
    excludeClosed: false,
    showSubtasks: true
};

const STORAGE_KEY = 'dailyFlow_globalFilters_v1';

// ============================================
// CONTEXT
// ============================================

const GlobalFilterContext = createContext<GlobalFilterContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

export const GlobalFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Estado dos filtros ativos
    const [filters, setFilters] = useState<GlobalFilters>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return { ...defaultFilters, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('[CTX-FILTER-001] Error loading saved filters:', e);
        }
        return defaultFilters;
    });

    // Opções disponíveis do cache
    const [availableOptions, setAvailableOptions] = useState<FilterMetadata | null>(null);

    // Sync filters (para API)
    const [syncFilters, setSyncFiltersState] = useState<SyncFilters>(loadSyncFilters);

    // Carregar opções disponíveis do cache
    const refreshOptions = useCallback(() => {
        const cached = getCachedMetadata();
        if (cached) {
            setAvailableOptions(cached);
        }
    }, []);

    // Carregar opções na inicialização
    useEffect(() => {
        refreshOptions();
    }, [refreshOptions]);

    // Persistir filtros quando mudam
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
        } catch (e) {
            console.error('[CTX-FILTER-001] Error saving filters:', e);
        }
    }, [filters]);

    // ============================================
    // SETTERS
    // ============================================

    const setTagFilter = useCallback((tags: string[]) => {
        setFilters(prev => ({ ...prev, tags }));
    }, []);

    const setStatusFilter = useCallback((statuses: string[]) => {
        setFilters(prev => ({ ...prev, statuses }));
    }, []);

    const setProjectFilter = useCallback((projects: string[]) => {
        setFilters(prev => ({ ...prev, projects }));
    }, []);

    const setAssigneeFilter = useCallback((assignees: string[]) => {
        setFilters(prev => ({ ...prev, assignees }));
    }, []);

    const toggleExcludeClosed = useCallback(() => {
        setFilters(prev => ({ ...prev, excludeClosed: !prev.excludeClosed }));
    }, []);

    const toggleShowSubtasks = useCallback(() => {
        setFilters(prev => ({ ...prev, showSubtasks: !prev.showSubtasks }));
    }, []);

    const clearAllFilters = useCallback(() => {
        setFilters(defaultFilters);
    }, []);

    const setSyncFilters = useCallback((newFilters: SyncFilters) => {
        setSyncFiltersState(newFilters);
        saveSyncFilters(newFilters);
    }, []);

    // ============================================
    // COMPUTED VALUES
    // ============================================

    const hasActiveFilters = useMemo(() => {
        return (
            filters.tags.length > 0 ||
            filters.statuses.length > 0 ||
            filters.projects.length > 0 ||
            filters.assignees.length > 0 ||
            filters.excludeClosed ||
            !filters.showSubtasks
        );
    }, [filters]);

    const filterSummary = useMemo(() => {
        const summary: string[] = [];

        if (filters.tags.length > 0) {
            summary.push(`Tags: ${filters.tags.join(', ')}`);
        }
        if (filters.statuses.length > 0) {
            summary.push(`Status: ${filters.statuses.join(', ')}`);
        }
        if (filters.projects.length > 0) {
            summary.push(`Projetos: ${filters.projects.join(', ')}`);
        }
        if (filters.assignees.length > 0) {
            summary.push(`Membros: ${filters.assignees.join(', ')}`);
        }
        if (filters.excludeClosed) {
            summary.push('Excluir fechadas');
        }
        if (!filters.showSubtasks) {
            summary.push('Ocultar subtarefas');
        }

        return summary;
    }, [filters]);

    // ============================================
    // CONTEXT VALUE
    // ============================================

    const value: GlobalFilterContextValue = {
        filters,
        availableOptions,
        setTagFilter,
        setStatusFilter,
        setProjectFilter,
        setAssigneeFilter,
        toggleExcludeClosed,
        toggleShowSubtasks,
        clearAllFilters,
        hasActiveFilters,
        filterSummary,
        syncFilters,
        setSyncFilters,
        refreshOptions
    };

    return (
        <GlobalFilterContext.Provider value={value}>
            {children}
        </GlobalFilterContext.Provider>
    );
};

// ============================================
// HOOK
// ============================================

export const useGlobalFilters = (): GlobalFilterContextValue => {
    const context = useContext(GlobalFilterContext);
    if (!context) {
        throw new Error('useGlobalFilters must be used within a GlobalFilterProvider');
    }
    return context;
};

// ============================================
// UTILITY: Apply filters to data
// ============================================

export const applyGlobalFilters = <T extends { tags?: any[]; status?: string; assignee?: string }>(
    data: T[],
    filters: GlobalFilters
): T[] => {
    return data.filter(item => {
        // Tag filter (OR logic - any matching tag passes)
        if (filters.tags.length > 0) {
            const itemTags = (item.tags || []).map((t: any) =>
                (typeof t === 'string' ? t : t.name || '').toLowerCase()
            );
            const hasMatchingTag = filters.tags.some(tag =>
                itemTags.includes(tag.toLowerCase())
            );
            if (!hasMatchingTag) return false;
        }

        // Status filter (OR logic)
        if (filters.statuses.length > 0) {
            const itemStatus = (item.status || '').toLowerCase();
            if (!filters.statuses.some(s => s.toLowerCase() === itemStatus)) {
                return false;
            }
        }

        // Assignee filter (OR logic)
        if (filters.assignees.length > 0) {
            const itemAssignee = (item.assignee || '').toLowerCase();
            if (!filters.assignees.some(a => a.toLowerCase() === itemAssignee)) {
                return false;
            }
        }

        return true;
    });
};

export default GlobalFilterContext;
