/**
 * @id SERV-PREF-001
 * @name UserPreferencesService
 * @description Serviço unificado para persistência de preferências do usuário
 * @dependencies supabaseService
 * @status active
 * @version 1.0.0
 *
 * PROPÓSITO:
 * Unifica TODA persistência de configurações do usuário em um só lugar.
 * Salva no localStorage (acesso rápido) e sincroniza com Supabase (backup/multi-device).
 *
 * DADOS PERSISTIDOS:
 * - Configurações do Daily Dashboard (boxes, filtros, membros)
 * - Estados de expansão (quais boxes estão abertos)
 * - Membro ativo selecionado
 * - Ordenação de boxes/projetos
 * - Nomes customizados de projetos
 * - Preferências de visualização (zoom, tema, etc.)
 */

import { getSupabase, getDeviceId } from './supabaseService';
import { DailySettings, createDefaultDailySettings } from '../components/DailySettingsPanel';

// ============================================
// CONSTANTES
// ============================================

const PREF_VERSION = '1.0.0';
const STORAGE_KEY = 'dailyFlow_userPreferences_v1';
const SUPABASE_TABLE = 'user_preferences';

// ============================================
// TIPOS
// ============================================

export interface UserPreferences {
  version: string;
  lastUpdated: string;
  deviceId: string;

  // === DAILY ALIGNMENT DASHBOARD ===
  daily: {
    // Configurações do painel (já existente no daily-settings-v3)
    settings: DailySettings;

    // Estados de UI que DEVEM persistir
    activeMemberId: string | null;
    expandedProjects: string[];     // IDs dos boxes expandidos
    expandedTaskIds: string[];      // IDs das tarefas expandidas

    // Ordenação de boxes por membro
    boxOrder: Record<string, string[]>;

    // Nomes customizados de projetos
    projectNames: Record<string, string>;

    // Modo apresentação
    isPresentationMode: boolean;
    presentationScale: number;
  };

  // === SYNC DASHBOARD ===
  sync: {
    autoSync: boolean;
    autoSyncInterval: number; // minutos
    lastSyncFilters: {
      tags: string[];
      assignees: string[];
      statuses: string[];
    };
  };

  // === GLOBAL APP ===
  global: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    lastVisitedPage: string;
    favoriteFilters: string[];
  };
}

// ============================================
// DEFAULTS
// ============================================

const createDefaultPreferences = (): UserPreferences => ({
  version: PREF_VERSION,
  lastUpdated: new Date().toISOString(),
  deviceId: getDeviceId(),

  daily: {
    settings: createDefaultDailySettings(),
    activeMemberId: null,
    expandedProjects: [],
    expandedTaskIds: [],
    boxOrder: {},
    projectNames: {},
    isPresentationMode: false,
    presentationScale: 1,
  },

  sync: {
    autoSync: false,
    autoSyncInterval: 30,
    lastSyncFilters: {
      tags: [],
      assignees: [],
      statuses: [],
    },
  },

  global: {
    theme: 'light',
    sidebarCollapsed: false,
    lastVisitedPage: '/',
    favoriteFilters: [],
  },
});

// ============================================
// CLASSE PRINCIPAL
// ============================================

class UserPreferencesService {
  private preferences: UserPreferences | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;
  private pendingChanges: boolean = false;

  // ----------------------------------------
  // INICIALIZAÇÃO
  // ----------------------------------------

  async initialize(): Promise<UserPreferences> {
    console.log('[SERV-PREF-001] 🚀 Inicializando UserPreferencesService...');

    // 1. Tentar carregar do localStorage
    const local = this.loadFromLocalStorage();

    if (local) {
      this.preferences = local;
      console.log('[SERV-PREF-001] ✅ Preferências carregadas do localStorage');
    } else {
      // 2. Se não houver local, tentar do Supabase
      const remote = await this.loadFromSupabase();

      if (remote) {
        this.preferences = remote;
        this.saveToLocalStorage(remote);
        console.log('[SERV-PREF-001] ✅ Preferências carregadas do Supabase');
      } else {
        // 3. Se não houver nada, criar defaults
        this.preferences = createDefaultPreferences();
        this.saveToLocalStorage(this.preferences);
        console.log('[SERV-PREF-001] ✅ Preferências padrão criadas');
      }
    }

    // 4. Migrar dados antigos se existirem
    await this.migrateOldData();

    return this.preferences;
  }

  // ----------------------------------------
  // MIGRAÇÃO DE DADOS ANTIGOS
  // ----------------------------------------

  private async migrateOldData(): Promise<void> {
    if (!this.preferences) return;

    let migrated = false;

    // Migrar daily-settings-v3
    const oldDailySettings = localStorage.getItem('daily-settings-v3');
    if (oldDailySettings) {
      try {
        const parsed = JSON.parse(oldDailySettings);
        this.preferences.daily.settings = {
          ...createDefaultDailySettings(),
          ...parsed
        };
        migrated = true;
        console.log('[SERV-PREF-001] 📦 Migrado daily-settings-v3');
      } catch (e) {
        console.warn('[SERV-PREF-001] Erro ao migrar daily-settings-v3:', e);
      }
    }

    // Migrar dailyAlignment_v2_persistence
    const oldAlignment = localStorage.getItem('dailyAlignment_v2_persistence');
    if (oldAlignment) {
      try {
        const parsed = JSON.parse(oldAlignment);
        if (parsed.boxOrder) this.preferences.daily.boxOrder = parsed.boxOrder;
        if (parsed.projectNames) this.preferences.daily.projectNames = parsed.projectNames;
        migrated = true;
        console.log('[SERV-PREF-001] 📦 Migrado dailyAlignment_v2_persistence');
      } catch (e) {
        console.warn('[SERV-PREF-001] Erro ao migrar dailyAlignment_v2_persistence:', e);
      }
    }

    // Migrar dailyFlow_syncFilters_v2
    const oldSyncFilters = localStorage.getItem('dailyFlow_syncFilters_v2');
    if (oldSyncFilters) {
      try {
        const parsed = JSON.parse(oldSyncFilters);
        this.preferences.sync.lastSyncFilters = {
          tags: parsed.tags || [],
          assignees: parsed.assignees || [],
          statuses: parsed.statuses || [],
        };
        migrated = true;
        console.log('[SERV-PREF-001] 📦 Migrado dailyFlow_syncFilters_v2');
      } catch (e) {
        console.warn('[SERV-PREF-001] Erro ao migrar sync filters:', e);
      }
    }

    // Migrar dailyFlow_autoSync_v2
    const oldAutoSync = localStorage.getItem('dailyFlow_autoSync_v2');
    if (oldAutoSync) {
      this.preferences.sync.autoSync = oldAutoSync === 'true';
      migrated = true;
      console.log('[SERV-PREF-001] 📦 Migrado dailyFlow_autoSync_v2');
    }

    if (migrated) {
      this.save();
      console.log('[SERV-PREF-001] ✅ Migração concluída');
    }
  }

  // ----------------------------------------
  // GETTERS
  // ----------------------------------------

  get(): UserPreferences {
    if (!this.preferences) {
      this.preferences = createDefaultPreferences();
    }
    return this.preferences;
  }

  getDaily(): UserPreferences['daily'] {
    return this.get().daily;
  }

  getSync(): UserPreferences['sync'] {
    return this.get().sync;
  }

  getGlobal(): UserPreferences['global'] {
    return this.get().global;
  }

  getDailySettings(): DailySettings {
    return this.getDaily().settings;
  }

  // ----------------------------------------
  // SETTERS (COM AUTO-SAVE)
  // ----------------------------------------

  updateDaily(updates: Partial<UserPreferences['daily']>): void {
    if (!this.preferences) return;

    this.preferences.daily = {
      ...this.preferences.daily,
      ...updates
    };

    this.scheduleSave();
  }

  updateDailySettings(settings: DailySettings): void {
    if (!this.preferences) return;

    this.preferences.daily.settings = settings;
    this.scheduleSave();
  }

  updateSync(updates: Partial<UserPreferences['sync']>): void {
    if (!this.preferences) return;

    this.preferences.sync = {
      ...this.preferences.sync,
      ...updates
    };

    this.scheduleSave();
  }

  updateGlobal(updates: Partial<UserPreferences['global']>): void {
    if (!this.preferences) return;

    this.preferences.global = {
      ...this.preferences.global,
      ...updates
    };

    this.scheduleSave();
  }

  // Métodos específicos para Daily Dashboard
  setActiveMember(memberId: string | null): void {
    this.updateDaily({ activeMemberId: memberId });
  }

  setExpandedProjects(projectIds: string[]): void {
    this.updateDaily({ expandedProjects: projectIds });
  }

  toggleProjectExpanded(projectId: string): void {
    const current = new Set(this.getDaily().expandedProjects);
    if (current.has(projectId)) {
      current.delete(projectId);
    } else {
      current.add(projectId);
    }
    this.setExpandedProjects(Array.from(current));
  }

  setExpandedTasks(taskIds: string[]): void {
    this.updateDaily({ expandedTaskIds: taskIds });
  }

  toggleTaskExpanded(taskId: string): void {
    const current = new Set(this.getDaily().expandedTaskIds);
    if (current.has(taskId)) {
      current.delete(taskId);
    } else {
      current.add(taskId);
    }
    this.setExpandedTasks(Array.from(current));
  }

  setBoxOrder(memberId: string, order: string[]): void {
    const current = this.getDaily().boxOrder;
    this.updateDaily({
      boxOrder: {
        ...current,
        [memberId]: order
      }
    });
  }

  setProjectName(originalName: string, customName: string): void {
    const current = this.getDaily().projectNames;
    this.updateDaily({
      projectNames: {
        ...current,
        [originalName]: customName
      }
    });
  }

  // ----------------------------------------
  // PERSISTÊNCIA LOCAL
  // ----------------------------------------

  private loadFromLocalStorage(): UserPreferences | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as UserPreferences;

      // Verificar versão
      if (parsed.version !== PREF_VERSION) {
        console.log('[SERV-PREF-001] Versão diferente, migrando...');
        // Merge com defaults para adicionar novos campos
        return {
          ...createDefaultPreferences(),
          ...parsed,
          version: PREF_VERSION
        };
      }

      return parsed;
    } catch (e) {
      console.error('[SERV-PREF-001] Erro ao carregar localStorage:', e);
      return null;
    }
  }

  private saveToLocalStorage(prefs: UserPreferences): void {
    try {
      prefs.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.error('[SERV-PREF-001] Erro ao salvar localStorage:', e);
    }
  }

  // ----------------------------------------
  // PERSISTÊNCIA SUPABASE
  // ----------------------------------------

  private async loadFromSupabase(): Promise<UserPreferences | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    // Tentar carregar por user_id primeiro (melhor para multi-device)
    // Fallback para device_id se não houver user_id
    const userId = this.getCurrentUserId();
    const deviceId = getDeviceId();

    try {
      // Primeiro tentar por user_id (preferências do usuário)
      if (userId) {
        const { data: userData, error: userError } = await supabase
          .from(SUPABASE_TABLE)
          .select('preferences')
          .eq('user_id', userId)
          .single();

        if (!userError && userData?.preferences) {
          console.log('[SERV-PREF-001] ✅ Preferências carregadas por user_id');
          return userData.preferences as UserPreferences;
        }
      }

      // Fallback: tentar por device_id
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('preferences')
        .eq('device_id', deviceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('[SERV-PREF-001] Erro ao carregar Supabase:', error);
        return null;
      }

      return data?.preferences as UserPreferences;
    } catch (e) {
      console.error('[SERV-PREF-001] Erro ao carregar Supabase:', e);
      return null;
    }
  }

  async saveToSupabase(): Promise<boolean> {
    if (!this.preferences) return false;

    const supabase = getSupabase();
    if (!supabase) return false;

    const userId = this.getCurrentUserId();
    const deviceId = getDeviceId();

    // Usar user_id se disponível, senão device_id
    const identifier = userId ? { user_id: userId } : { device_id: deviceId };
    const conflictColumn = userId ? 'user_id' : 'device_id';

    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({
          ...identifier,
          device_id: deviceId, // Sempre salvar device_id também
          preferences: this.preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: conflictColumn
        });

      if (error) {
        console.error('[SERV-PREF-001] Erro ao salvar Supabase:', error);
        return false;
      }

      console.log('[SERV-PREF-001] ☁️ Preferências salvas no Supabase' + (userId ? ' (por user_id)' : ' (por device_id)'));
      return true;
    } catch (e) {
      console.error('[SERV-PREF-001] Erro ao salvar Supabase:', e);
      return false;
    }
  }

  // Helper para obter user_id do localStorage
  private getCurrentUserId(): string | null {
    try {
      const session = localStorage.getItem('dailyFlow_userSession_v2');
      if (session) {
        const user = JSON.parse(session);
        return user.id || user.email || null;
      }
    } catch {
      // Ignorar erros
    }
    return null;
  }

  // ----------------------------------------
  // AUTO-SAVE DEBOUNCED
  // ----------------------------------------

  private scheduleSave(): void {
    this.pendingChanges = true;

    // Debounce: salvar após 500ms de inatividade
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
    }, 500);
  }

  save(): void {
    if (!this.preferences) return;

    this.saveToLocalStorage(this.preferences);
    this.pendingChanges = false;

    console.log('[SERV-PREF-001] 💾 Preferências salvas localmente');
  }

  async syncToCloud(): Promise<boolean> {
    this.save(); // Garantir que está salvo localmente primeiro
    return await this.saveToSupabase();
  }

  // ----------------------------------------
  // RESET
  // ----------------------------------------

  reset(): void {
    this.preferences = createDefaultPreferences();
    this.save();
    console.log('[SERV-PREF-001] 🔄 Preferências resetadas');
  }

  resetDaily(): void {
    if (!this.preferences) return;
    this.preferences.daily = createDefaultPreferences().daily;
    this.save();
  }

  // ----------------------------------------
  // COMPATIBILIDADE COM CÓDIGO EXISTENTE
  // ----------------------------------------

  /**
   * Para compatibilidade com DailySettingsPanel
   * Salva no formato antigo daily-settings-v3
   */
  saveDailySettingsLegacy(settings: DailySettings): void {
    try {
      localStorage.setItem('daily-settings-v3', JSON.stringify(settings));
    } catch (e) {
      console.warn('[SERV-PREF-001] Erro ao salvar legacy:', e);
    }
    this.updateDailySettings(settings);
  }

  /**
   * Para compatibilidade com DailyAlignmentDashboard
   */
  saveDailyAlignmentLegacy(data: { boxOrder?: Record<string, string[]>; projectNames?: Record<string, string> }): void {
    const existing = localStorage.getItem('dailyAlignment_v2_persistence');
    const current = existing ? JSON.parse(existing) : {};
    localStorage.setItem('dailyAlignment_v2_persistence', JSON.stringify({
      ...current,
      ...data
    }));

    if (data.boxOrder) this.updateDaily({ boxOrder: data.boxOrder });
    if (data.projectNames) this.updateDaily({ projectNames: data.projectNames });
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const userPreferences = new UserPreferencesService();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const initializePreferences = () => userPreferences.initialize();
export const getPreferences = () => userPreferences.get();
export const getDailyPreferences = () => userPreferences.getDaily();
export const getDailySettings = () => userPreferences.getDailySettings();

export const setActiveMember = (id: string | null) => userPreferences.setActiveMember(id);
export const toggleProjectExpanded = (id: string) => userPreferences.toggleProjectExpanded(id);
export const toggleTaskExpanded = (id: string) => userPreferences.toggleTaskExpanded(id);
export const setBoxOrder = (memberId: string, order: string[]) => userPreferences.setBoxOrder(memberId, order);
export const setProjectName = (original: string, custom: string) => userPreferences.setProjectName(original, custom);

export const syncPreferencesToCloud = () => userPreferences.syncToCloud();
export const resetPreferences = () => userPreferences.reset();

export default userPreferences;
