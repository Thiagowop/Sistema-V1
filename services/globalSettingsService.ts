/**
 * @id SERV-GLOBAL-001
 * @name GlobalSettingsService
 * @description Serviço para configurações GLOBAIS - todos veem igual
 * @dependencies supabaseService
 * @status active
 * @version 1.0.0
 *
 * PROPÓSITO:
 * Admin configura UMA VEZ → todos os usuários veem a mesma configuração.
 * Sem device_id, sem user_id - simplesmente GLOBAL.
 */

import { getSupabase } from './supabaseService';

// ============================================
// CONSTANTES
// ============================================

const SUPABASE_TABLE = 'global_settings';
const SETTINGS_KEY = 'global';

// ============================================
// TIPOS
// ============================================

export interface GlobalSettings {
  // Configurações do Daily Dashboard (armazenado como JSONB flexível)
  // Inclui todos os campos de DailySettings: customBoxesByMember, combinedOrderByMember, etc.
  dailySettings: Record<string, any>;

  // Ordem dos boxes por membro (DEPRECATED - agora está dentro de dailySettings.combinedOrderByMember)
  boxOrder: Record<string, string[]>;

  // Nomes customizados de projetos
  projectNames: Record<string, string>;

  // Preferências de UI
  uiPreferences: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    defaultTab: string;
  };

  // Metadata
  updatedAt: string;
  updatedBy: string;
}

// ============================================
// DEFAULTS
// ============================================

const DEFAULT_SETTINGS: GlobalSettings = {
  // dailySettings será populado com o objeto completo de DailySettings
  dailySettings: {},
  boxOrder: {},
  projectNames: {},
  uiPreferences: {
    theme: 'dark',
    sidebarCollapsed: false,
    defaultTab: 'daily'
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system'
};

// ============================================
// CLASSE PRINCIPAL
// ============================================

class GlobalSettingsService {
  private settings: GlobalSettings | null = null;
  private initialized: boolean = false;

  // ----------------------------------------
  // INICIALIZAÇÃO
  // ----------------------------------------

  async initialize(): Promise<GlobalSettings> {
    if (this.initialized && this.settings) {
      return this.settings;
    }

    console.log('[SERV-GLOBAL-001] 🚀 Carregando configurações globais...');

    // Carregar do Supabase
    const loaded = await this.loadFromSupabase();

    if (loaded) {
      this.settings = loaded;
      console.log('[SERV-GLOBAL-001] ✅ Configurações globais carregadas');
    } else {
      this.settings = { ...DEFAULT_SETTINGS };
      console.log('[SERV-GLOBAL-001] ℹ️ Usando configurações padrão');
    }

    this.initialized = true;
    return this.settings;
  }

  // ----------------------------------------
  // GETTERS
  // ----------------------------------------

  get(): GlobalSettings {
    return this.settings || DEFAULT_SETTINGS;
  }

  getDailySettings(): GlobalSettings['dailySettings'] {
    return this.get().dailySettings;
  }

  getBoxOrder(): Record<string, string[]> {
    return this.get().boxOrder;
  }

  getProjectNames(): Record<string, string> {
    return this.get().projectNames;
  }

  getUiPreferences(): GlobalSettings['uiPreferences'] {
    return this.get().uiPreferences;
  }

  // ----------------------------------------
  // SETTERS (Admin only - salva globalmente)
  // ----------------------------------------

  async updateDailySettings(
    settings: Partial<GlobalSettings['dailySettings']>,
    updatedBy: string
  ): Promise<boolean> {
    if (!this.settings) await this.initialize();

    this.settings = {
      ...this.settings!,
      dailySettings: { ...this.settings!.dailySettings, ...settings },
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    return await this.saveToSupabase();
  }

  async updateBoxOrder(
    boxOrder: Record<string, string[]>,
    updatedBy: string
  ): Promise<boolean> {
    if (!this.settings) await this.initialize();

    this.settings = {
      ...this.settings!,
      boxOrder,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    return await this.saveToSupabase();
  }

  async updateProjectNames(
    projectNames: Record<string, string>,
    updatedBy: string
  ): Promise<boolean> {
    if (!this.settings) await this.initialize();

    this.settings = {
      ...this.settings!,
      projectNames,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    return await this.saveToSupabase();
  }

  async updateAll(
    updates: Partial<GlobalSettings>,
    updatedBy: string
  ): Promise<boolean> {
    if (!this.settings) await this.initialize();

    this.settings = {
      ...this.settings!,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy
    };

    return await this.saveToSupabase();
  }

  // ----------------------------------------
  // PERSISTÊNCIA SUPABASE (GLOBAL)
  // ----------------------------------------

  private async loadFromSupabase(): Promise<GlobalSettings | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('*')
        .eq('settings_key', SETTINGS_KEY)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('[SERV-GLOBAL-001] ℹ️ Nenhuma configuração global encontrada');
          return null;
        }
        console.error('[SERV-GLOBAL-001] Erro ao carregar:', error);
        return null;
      }

      if (!data) return null;

      // Montar objeto de settings a partir das colunas
      const settings: GlobalSettings = {
        dailySettings: data.daily_settings || DEFAULT_SETTINGS.dailySettings,
        boxOrder: data.box_order || {},
        projectNames: data.project_names || {},
        uiPreferences: data.ui_preferences || DEFAULT_SETTINGS.uiPreferences,
        updatedAt: data.updated_at || new Date().toISOString(),
        updatedBy: data.created_by || 'system'
      };

      return settings;
    } catch (e) {
      console.error('[SERV-GLOBAL-001] Erro ao carregar:', e);
      return null;
    }
  }

  private async saveToSupabase(): Promise<boolean> {
    if (!this.settings) return false;

    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({
          settings_key: SETTINGS_KEY,
          daily_settings: this.settings.dailySettings,
          box_order: this.settings.boxOrder,
          project_names: this.settings.projectNames,
          ui_preferences: this.settings.uiPreferences,
          created_by: this.settings.updatedBy,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'settings_key'
        });

      if (error) {
        console.error('[SERV-GLOBAL-001] Erro ao salvar:', error);
        return false;
      }

      console.log('[SERV-GLOBAL-001] ☁️ Configurações globais salvas');
      return true;
    } catch (e) {
      console.error('[SERV-GLOBAL-001] Erro ao salvar:', e);
      return false;
    }
  }

  // ----------------------------------------
  // RESET
  // ----------------------------------------

  async reset(updatedBy: string): Promise<boolean> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      updatedAt: new Date().toISOString(),
      updatedBy
    };
    return await this.saveToSupabase();
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const globalSettings = new GlobalSettingsService();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

export const initializeGlobalSettings = () => globalSettings.initialize();
export const getGlobalSettings = () => globalSettings.get();
export const getGlobalDailySettings = () => globalSettings.getDailySettings();
export const getGlobalBoxOrder = () => globalSettings.getBoxOrder();
export const getGlobalProjectNames = () => globalSettings.getProjectNames();

export const saveGlobalDailySettings = (
  settings: Partial<GlobalSettings['dailySettings']>,
  updatedBy: string
) => globalSettings.updateDailySettings(settings, updatedBy);

export const saveGlobalBoxOrder = (
  boxOrder: Record<string, string[]>,
  updatedBy: string
) => globalSettings.updateBoxOrder(boxOrder, updatedBy);

export const saveGlobalProjectNames = (
  projectNames: Record<string, string>,
  updatedBy: string
) => globalSettings.updateProjectNames(projectNames, updatedBy);

export default globalSettings;
