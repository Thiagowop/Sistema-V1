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
            console.warn('Failed to load filter state from localStorage:', error);
            return this.createDefaultFilterState();
        }
    }

    /**
     * Save filter state to localStorage
     */
    static saveFilterState(state: FilterState): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save filter state to localStorage:', error);
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
            console.warn(`Filter group ${groupId} not found`);
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
}
