/**
 * @id SERV-FILT-001
 * @name FilterService
 * @description Serviço de gerenciamento de filtros com persistência em localStorage
 * @dependencies types/FilterConfig
 * @status active
 * @version 2.0.0
 */

import { FilterConfig, FilterState, FilterGroup } from '../types/FilterConfig';

export class FilterService {
    private static STORAGE_KEY = 'dailyflow_filters';

    /**
     * Load filter state from localStorage
     */
    static loadFilterState(): FilterState {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) {
                return this.createDefaultFilterState();
            }

            const parsed = JSON.parse(stored);
            // Ensure we have all required properties even if storage is outdated
            return {
                currentFilters: parsed.currentFilters || this.createDefaultFilters(),
                savedGroups: parsed.savedGroups || [],
                activeGroupId: parsed.activeGroupId || null
            };
        } catch (error) {
            console.warn('[SERV-FILT-001] Failed to load filter state from localStorage:', error);
            return this.createDefaultFilterState();
        }
    }

    /**
     * Save filter state to localStorage
     */
    static saveFilterState(state: FilterState): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
            console.log('[SERV-FILT-001] Filter state saved');
        } catch (error) {
            console.error('[SERV-FILT-001] Failed to save filter state to localStorage:', error);
        }
    }

    /**
     * Create default filter configuration
     */
    static createDefaultFilters(): FilterConfig {
        return {
            requiredTags: [],  // Empty by default - user chooses what to filter
            excludedTags: [],
            includedStatuses: [],
            excludeClosed: false,
            includedPriorities: [],
            dateRange: null,
            includedAssignees: [],
            includeUnassigned: true,
            showParentTasks: true,
            showSubtasks: true,
            showArchivedTasks: false,
            includedProjects: []
        };
    }

    /**
     * Create default filter state
     */
    static createDefaultFilterState(): FilterState {
        return {
            currentFilters: this.createDefaultFilters(),
            savedGroups: [],
            activeGroupId: null
        };
    }

    /**
     * Create a new filter group
     */
    static createFilterGroup(name: string, filters: FilterConfig, description?: string): FilterGroup {
        const now = new Date().toISOString();
        return {
            id: `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            filters: JSON.parse(JSON.stringify(filters)), // Deep clone
            createdAt: now,
            lastUsed: now
        };
    }

    /**
     * Add a filter group to state
     */
    static addFilterGroup(state: FilterState, group: FilterGroup): FilterState {
        return {
            ...state,
            savedGroups: [...state.savedGroups, group]
        };
    }

    /**
     * Delete a filter group from state
     */
    static deleteFilterGroup(state: FilterState, groupId: string): FilterState {
        return {
            ...state,
            savedGroups: state.savedGroups.filter(g => g.id !== groupId),
            activeGroupId: state.activeGroupId === groupId ? null : state.activeGroupId
        };
    }

    /**
     * Load a filter group (apply its filters to current state)
     */
    static loadFilterGroup(state: FilterState, groupId: string): FilterState {
        const group = state.savedGroups.find(g => g.id === groupId);
        if (!group) {
            console.warn(`[SERV-FILT-001] Filter group ${groupId} not found`);
            return state;
        }

        // Update last used timestamp
        const updatedGroups = state.savedGroups.map(g =>
            g.id === groupId
                ? { ...g, lastUsed: new Date().toISOString() }
                : g
        );

        return {
            ...state,
            currentFilters: JSON.parse(JSON.stringify(group.filters)), // Deep clone
            savedGroups: updatedGroups,
            activeGroupId: groupId
        };
    }

    /**
     * Update current filters (deactivates any active group)
     */
    static updateCurrentFilters(state: FilterState, filters: FilterConfig): FilterState {
        return {
            ...state,
            currentFilters: filters,
            activeGroupId: null // Changing filters manually deactivates groups
        };
    }

    /**
     * Reset filters to default
     */
    static resetFilters(state: FilterState): FilterState {
        return {
            ...state,
            currentFilters: this.createDefaultFilters(),
            activeGroupId: null
        };
    }

    /**
     * Check if any filter is active
     */
    static hasActiveFilters(filters: FilterConfig): boolean {
        return (
            filters.requiredTags.length > 0 ||
            filters.excludedTags.length > 0 ||
            filters.includedStatuses.length > 0 ||
            filters.excludeClosed ||
            filters.includedPriorities.length > 0 ||
            filters.dateRange !== null ||
            filters.includedAssignees.length > 0 ||
            !filters.includeUnassigned ||
            !filters.showParentTasks ||
            !filters.showSubtasks ||
            filters.showArchivedTasks ||
            filters.includedProjects.length > 0
        );
    }

    /**
     * Get a summary of active filters for display
     */
    static getFilterSummary(filters: FilterConfig): string[] {
        const summary: string[] = [];

        if (filters.requiredTags.length > 0) {
            summary.push(`Tags: ${filters.requiredTags.join(', ')}`);
        }
        if (filters.excludedTags.length > 0) {
            summary.push(`Excluídas: ${filters.excludedTags.join(', ')}`);
        }
        if (filters.includedStatuses.length > 0) {
            summary.push(`Status: ${filters.includedStatuses.join(', ')}`);
        }
        if (filters.excludeClosed) {
            summary.push('Excluir concluídas');
        }
        if (filters.includedPriorities.length > 0) {
            summary.push(`Prioridades: ${filters.includedPriorities.join(', ')}`);
        }
        if (filters.includedAssignees.length > 0) {
            summary.push(`Responsáveis: ${filters.includedAssignees.join(', ')}`);
        }
        if (filters.includedProjects.length > 0) {
            summary.push(`Projetos: ${filters.includedProjects.join(', ')}`);
        }

        return summary;
    }
}

// ============================================
// CONVENIENCE EXPORTS (localStorage wrappers)
// ============================================

const FILTER_GROUPS_KEY = 'dailyFlow_filterGroups_v2';
const ACTIVE_GROUP_KEY = 'dailyFlow_activeFilterGroup_v2';

export const saveFilterGroup = (group: FilterGroup): void => {
    try {
        const existing = loadFilterGroups();
        const updated = existing.filter(g => g.id !== group.id);
        updated.push(group);
        localStorage.setItem(FILTER_GROUPS_KEY, JSON.stringify(updated));
        console.log(`[SERV-FILT-001] Saved filter group: ${group.name}`);
    } catch (e) {
        console.error('[SERV-FILT-001] Error saving filter group:', e);
    }
};

export const loadFilterGroups = (): FilterGroup[] => {
    try {
        const saved = localStorage.getItem(FILTER_GROUPS_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('[SERV-FILT-001] Error loading filter groups:', e);
    }
    return [];
};

export const deleteFilterGroup = (groupId: string): void => {
    try {
        const existing = loadFilterGroups();
        const updated = existing.filter(g => g.id !== groupId);
        localStorage.setItem(FILTER_GROUPS_KEY, JSON.stringify(updated));
        console.log(`[SERV-FILT-001] Deleted filter group: ${groupId}`);
    } catch (e) {
        console.error('[SERV-FILT-001] Error deleting filter group:', e);
    }
};

export const getActiveFilterGroup = (): string | null => {
    return localStorage.getItem(ACTIVE_GROUP_KEY);
};

export const setActiveFilterGroup = (groupId: string | null): void => {
    if (groupId) {
        localStorage.setItem(ACTIVE_GROUP_KEY, groupId);
    } else {
        localStorage.removeItem(ACTIVE_GROUP_KEY);
    }
};
