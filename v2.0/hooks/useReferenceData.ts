/**
 * @id HOOK-REF-001
 * @name useReferenceData
 * @description Hook para acessar e gerenciar dados de referência persistentes
 * @dependencies contexts/DataContext, services/referenceDataService
 * @status active
 * @version 1.0.0
 *
 * PROPÓSITO:
 * Este hook fornece acesso fácil aos dados de referência (equip tags, team members, etc)
 * que são persistentes e não são limpos quando o cache de tarefas é limpo.
 *
 * USO:
 * const { equipTags, teamMembers, projects, isReady, preloadFromSupabase } = useReferenceData();
 */

import { useCallback, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
  referenceData,
  EquipTag,
  TeamMember,
  ReferenceItem,
  ReferenceDataKey
} from '../services/referenceDataService';

export interface UseReferenceDataReturn {
  // Data
  equipTags: EquipTag[];
  teamMembers: TeamMember[];
  projects: ReferenceItem[];
  customTags: ReferenceItem[];

  // State
  isReady: boolean;

  // Helpers
  getEquipTagByName: (name: string) => EquipTag | undefined;
  getMemberByEmail: (email: string) => TeamMember | undefined;
  getProjectByName: (name: string) => ReferenceItem | undefined;

  // Search
  searchEquipTags: (query: string) => EquipTag[];
  searchMembers: (query: string) => TeamMember[];
  searchProjects: (query: string) => ReferenceItem[];

  // Filter helpers (para usar em dropdowns)
  getEquipTagNames: () => string[];
  getMemberNames: () => string[];
  getProjectNames: () => string[];
  getEquipmentTypes: () => string[];

  // Actions
  preloadFromSupabase: () => Promise<boolean>;
  syncToSupabase: () => Promise<boolean>;
  addCustomTag: (name: string, category?: string) => Promise<void>;
  refresh: () => Promise<void>;

  // Stats
  getStats: () => Promise<Record<ReferenceDataKey, { count: number; lastUpdated: string | null }>>;
}

export const useReferenceData = (): UseReferenceDataReturn => {
  const { referenceData: contextData, refreshReferenceData, syncReferenceToSupabase } = useData();

  // ============================================
  // DATA ACCESS
  // ============================================

  const equipTags = useMemo(() => contextData.equipTags || [], [contextData.equipTags]);
  const teamMembers = useMemo(() => contextData.teamMembers || [], [contextData.teamMembers]);
  const projects = useMemo(() => contextData.projects || [], [contextData.projects]);
  const customTags = useMemo(() => referenceData.getItems('custom_tags'), [contextData.isReady]);

  // ============================================
  // HELPERS
  // ============================================

  const getEquipTagByName = useCallback((name: string): EquipTag | undefined => {
    return equipTags.find(t => t.name.toLowerCase() === name.toLowerCase());
  }, [equipTags]);

  const getMemberByEmail = useCallback((email: string): TeamMember | undefined => {
    return teamMembers.find(m => m.email?.toLowerCase() === email.toLowerCase());
  }, [teamMembers]);

  const getProjectByName = useCallback((name: string): ReferenceItem | undefined => {
    return projects.find(p => p.name.toLowerCase() === name.toLowerCase());
  }, [projects]);

  // ============================================
  // SEARCH
  // ============================================

  const searchEquipTags = useCallback((query: string): EquipTag[] => {
    if (!query) return equipTags;
    const lower = query.toLowerCase();
    return equipTags.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.displayName?.toLowerCase().includes(lower) ||
      t.equipmentType?.toLowerCase().includes(lower)
    );
  }, [equipTags]);

  const searchMembers = useCallback((query: string): TeamMember[] => {
    if (!query) return teamMembers;
    const lower = query.toLowerCase();
    return teamMembers.filter(m =>
      m.name.toLowerCase().includes(lower) ||
      m.displayName?.toLowerCase().includes(lower) ||
      m.email?.toLowerCase().includes(lower)
    );
  }, [teamMembers]);

  const searchProjects = useCallback((query: string): ReferenceItem[] => {
    if (!query) return projects;
    const lower = query.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(lower) ||
      p.displayName?.toLowerCase().includes(lower)
    );
  }, [projects]);

  // ============================================
  // FILTER HELPERS
  // ============================================

  const getEquipTagNames = useCallback((): string[] => {
    return equipTags.map(t => t.name);
  }, [equipTags]);

  const getMemberNames = useCallback((): string[] => {
    return teamMembers.map(m => m.name);
  }, [teamMembers]);

  const getProjectNames = useCallback((): string[] => {
    return projects.map(p => p.name);
  }, [projects]);

  const getEquipmentTypes = useCallback((): string[] => {
    const types = new Set<string>();
    equipTags.forEach(t => {
      if (t.equipmentType) types.add(t.equipmentType);
    });
    return Array.from(types).sort();
  }, [equipTags]);

  // ============================================
  // ACTIONS
  // ============================================

  const preloadFromSupabase = useCallback(async (): Promise<boolean> => {
    console.log('[HOOK-REF-001] Preloading reference data from Supabase...');
    const success = await referenceData.loadFromSupabase();
    if (success) {
      await refreshReferenceData();
    }
    return success;
  }, [refreshReferenceData]);

  const syncToSupabase = useCallback(async (): Promise<boolean> => {
    return await syncReferenceToSupabase();
  }, [syncReferenceToSupabase]);

  const addCustomTag = useCallback(async (name: string, category?: string): Promise<void> => {
    await referenceData.addItem('custom_tags', {
      name,
      displayName: name,
      category: category || 'custom'
    }, 'manual');
    await refreshReferenceData();
  }, [refreshReferenceData]);

  const refresh = useCallback(async (): Promise<void> => {
    await refreshReferenceData();
  }, [refreshReferenceData]);

  const getStats = useCallback(async () => {
    return await referenceData.getStats();
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Data
    equipTags,
    teamMembers,
    projects,
    customTags,

    // State
    isReady: contextData.isReady,

    // Helpers
    getEquipTagByName,
    getMemberByEmail,
    getProjectByName,

    // Search
    searchEquipTags,
    searchMembers,
    searchProjects,

    // Filter helpers
    getEquipTagNames,
    getMemberNames,
    getProjectNames,
    getEquipmentTypes,

    // Actions
    preloadFromSupabase,
    syncToSupabase,
    addCustomTag,
    refresh,

    // Stats
    getStats
  };
};

export default useReferenceData;

// ============================================
// CONVENIENCE EXPORTS
// ============================================

/**
 * Hook simplificado para apenas obter nomes de tags (para dropdowns)
 */
export const useEquipTagNames = (): string[] => {
  const { getEquipTagNames } = useReferenceData();
  return getEquipTagNames();
};

/**
 * Hook simplificado para apenas obter nomes de membros (para dropdowns)
 */
export const useMemberNames = (): string[] => {
  const { getMemberNames } = useReferenceData();
  return getMemberNames();
};

/**
 * Hook simplificado para apenas obter nomes de projetos (para dropdowns)
 */
export const useProjectNames = (): string[] => {
  const { getProjectNames } = useReferenceData();
  return getProjectNames();
};
