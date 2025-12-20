/**
 * @id HOOK-FILT-001
 * @name useFilters
 * @description Hook para gerenciamento de filtros - estado local + persistência
 * @dependencies contexts/DataContext, services/filterService, types/FilterConfig
 * @status active
 * @version 2.0.0
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FilterConfig, FilterGroup, FilterState } from '../types/FilterConfig';
import { saveFilterGroup, loadFilterGroups, deleteFilterGroup, getActiveFilterGroup, setActiveFilterGroup } from '../services/filterService';
import { applyClientSideFilters, ClickUpApiTask } from '../services/clickup';

export interface UseFiltersReturn {
  // Current filter state
  filters: FilterConfig;
  setFilters: (filters: FilterConfig) => void;
  resetFilters: () => void;
  
  // Filter metadata (available options)
  availableTags: string[];
  availableStatuses: string[];
  availableProjects: string[];
  availableAssignees: string[];
  availablePriorities: string[];
  
  // Saved filter groups
  savedGroups: FilterGroup[];
  activeGroup: FilterGroup | null;
  saveCurrentAsGroup: (name: string, description?: string) => void;
  loadGroup: (groupId: string) => void;
  deleteGroup: (groupId: string) => void;
  
  // Filtered data
  filteredTasks: ClickUpApiTask[];
  filterCount: number;
  totalCount: number;
  
  // Quick filters
  setTagFilter: (tags: string[]) => void;
  setStatusFilter: (statuses: string[]) => void;
  setAssigneeFilter: (assignees: string[]) => void;
  setProjectFilter: (projects: string[]) => void;
  toggleExcludeClosed: () => void;
}

const defaultFilters: FilterConfig = {
  requiredTags: [],
  excludedTags: [],
  includedStatuses: [],
  includedPriorities: [],
  includedAssignees: [],
  includedProjects: [],
  excludeClosed: false,
  showSubtasks: true,
  showParentTasks: true,
  showArchivedTasks: false,
  includeUnassigned: true,
  dateRange: null
};

export const useFilters = (): UseFiltersReturn => {
  const { rawTasks, metadata } = useData();
  
  // State
  const [filters, setFiltersState] = useState<FilterConfig>(defaultFilters);
  const [savedGroups, setSavedGroups] = useState<FilterGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  // Load saved groups on mount
  useEffect(() => {
    const groups = loadFilterGroups();
    setSavedGroups(groups);
    
    const activeId = getActiveFilterGroup();
    if (activeId) {
      const active = groups.find(g => g.id === activeId);
      if (active) {
        setFiltersState(active.filters);
        setActiveGroupId(activeId);
      }
    }
  }, []);

  // Available options from metadata
  const availableTags = useMemo(() => metadata?.tags || [], [metadata]);
  const availableStatuses = useMemo(() => metadata?.statuses || [], [metadata]);
  const availableProjects = useMemo(() => metadata?.projects || [], [metadata]);
  const availableAssignees = useMemo(() => metadata?.assignees || [], [metadata]);
  const availablePriorities = useMemo(() => metadata?.priorities || [], [metadata]);

  // Active group
  const activeGroup = useMemo(() => {
    if (!activeGroupId) return null;
    return savedGroups.find(g => g.id === activeGroupId) || null;
  }, [activeGroupId, savedGroups]);

  // Apply filters to raw tasks
  const filteredTasks = useMemo(() => {
    if (!rawTasks.length) return [];
    return applyClientSideFilters(rawTasks, filters);
  }, [rawTasks, filters]);

  // Counts
  const filterCount = filteredTasks.length;
  const totalCount = rawTasks.length;

  // ============================================
  // ACTIONS
  // ============================================

  const setFilters = useCallback((newFilters: FilterConfig) => {
    console.log('[HOOK-FILT-001] Filters updated');
    setFiltersState(newFilters);
    // Clear active group since filters changed
    setActiveGroupId(null);
    setActiveFilterGroup(null);
  }, []);

  const resetFilters = useCallback(() => {
    console.log('[HOOK-FILT-001] Filters reset');
    setFiltersState(defaultFilters);
    setActiveGroupId(null);
    setActiveFilterGroup(null);
  }, []);

  // Quick filter setters
  const setTagFilter = useCallback((tags: string[]) => {
    setFiltersState(prev => ({ ...prev, requiredTags: tags }));
  }, []);

  const setStatusFilter = useCallback((statuses: string[]) => {
    setFiltersState(prev => ({ ...prev, includedStatuses: statuses }));
  }, []);

  const setAssigneeFilter = useCallback((assignees: string[]) => {
    setFiltersState(prev => ({ ...prev, includedAssignees: assignees }));
  }, []);

  const setProjectFilter = useCallback((projects: string[]) => {
    setFiltersState(prev => ({ ...prev, includedProjects: projects }));
  }, []);

  const toggleExcludeClosed = useCallback(() => {
    setFiltersState(prev => ({ ...prev, excludeClosed: !prev.excludeClosed }));
  }, []);

  // ============================================
  // SAVED GROUPS
  // ============================================

  const saveCurrentAsGroup = useCallback((name: string, description?: string) => {
    const group: FilterGroup = {
      id: `filter_${Date.now()}`,
      name,
      description,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };

    saveFilterGroup(group);
    setSavedGroups(prev => [...prev, group]);
    setActiveGroupId(group.id);
    setActiveFilterGroup(group.id);
    
    console.log(`[HOOK-FILT-001] Saved filter group: ${name}`);
  }, [filters]);

  const loadGroup = useCallback((groupId: string) => {
    const group = savedGroups.find(g => g.id === groupId);
    if (group) {
      setFiltersState(group.filters);
      setActiveGroupId(groupId);
      setActiveFilterGroup(groupId);
      console.log(`[HOOK-FILT-001] Loaded filter group: ${group.name}`);
    }
  }, [savedGroups]);

  const deleteGroupAction = useCallback((groupId: string) => {
    deleteFilterGroup(groupId);
    setSavedGroups(prev => prev.filter(g => g.id !== groupId));
    
    if (activeGroupId === groupId) {
      setActiveGroupId(null);
      setActiveFilterGroup(null);
    }
    
    console.log(`[HOOK-FILT-001] Deleted filter group: ${groupId}`);
  }, [activeGroupId]);

  return {
    // Current filter state
    filters,
    setFilters,
    resetFilters,
    
    // Filter metadata
    availableTags,
    availableStatuses,
    availableProjects,
    availableAssignees,
    availablePriorities,
    
    // Saved groups
    savedGroups,
    activeGroup,
    saveCurrentAsGroup,
    loadGroup,
    deleteGroup: deleteGroupAction,
    
    // Filtered data
    filteredTasks,
    filterCount,
    totalCount,
    
    // Quick filters
    setTagFilter,
    setStatusFilter,
    setAssigneeFilter,
    setProjectFilter,
    toggleExcludeClosed
  };
};

export default useFilters;
