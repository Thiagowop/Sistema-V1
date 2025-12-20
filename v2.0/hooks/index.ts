/**
 * @id HOOK-INDEX-001
 * @name hooks/index
 * @description Barrel export de todos os hooks
 * @version 2.0.0
 */

export { useClickupSync } from './useClickupSync';
export type { UseSyncOptions, UseSyncReturn } from './useClickupSync';

export { useFilters } from './useFilters';
export type { UseFiltersReturn } from './useFilters';

export { useTasks } from './useTasks';
export type { TaskStats, UseTasksReturn } from './useTasks';

export { useCache } from './useCache';
export type { CacheInfo, UseCacheReturn } from './useCache';
