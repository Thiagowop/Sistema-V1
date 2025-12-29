/**
 * @id CTX-INDEX-001
 * @name contexts/index
 * @description Barrel export de todos os contexts
 * @version 2.0.0
 */

export { DataProvider, useData } from './DataContext';
export type { DataContextValue, SyncState, SyncStatus } from './DataContext';

export { AuthProvider, useAuth } from './AuthContext';
export type { AuthContextValue, AuthState } from './AuthContext';
