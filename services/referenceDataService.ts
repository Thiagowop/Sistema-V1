/**
 * @id SERV-REF-001
 * @name ReferenceDataService
 * @description Serviço para armazenamento isolado e persistente de dados de referência
 * @dependencies idb-keyval, supabaseService
 * @status active
 * @version 1.0.0
 *
 * PROPÓSITO:
 * Este serviço gerencia dados de referência que NÃO devem ser perdidos ao limpar cache.
 * Inclui: tags de equip, membros da equipe, projetos, e outras informações fixas.
 *
 * CAMADAS DE ARMAZENAMENTO:
 * 1. IndexedDB (local persistente) - Fonte primária, nunca limpa automaticamente
 * 2. Supabase (remoto) - Backup e sincronização entre dispositivos
 * 3. localStorage (fallback rápido) - Apenas para acesso instantâneo
 *
 * FLUXO:
 * - Dados são extraídos incrementalmente durante syncs
 * - Novos valores são ADICIONADOS, nunca substituídos
 * - Limpeza é MANUAL e requer confirmação
 * - Supabase sincroniza entre dispositivos
 */

import { set, get, del, keys } from 'idb-keyval';
import { getSupabase } from './supabaseService';

// ============================================
// CONSTANTES
// ============================================

const REF_VERSION = '1.0.0';
const IDB_PREFIX = 'dailyFlow_ref_';
const LS_PREFIX = 'dailyFlow_ref_';
const SUPABASE_TABLE = 'reference_data';

// Chaves de dados de referência
export type ReferenceDataKey =
  | 'equip_tags'        // Tags de equipamento
  | 'team_members'      // Membros da equipe
  | 'projects'          // Projetos
  | 'custom_tags'       // Tags customizadas importantes
  | 'status_list'       // Lista de status
  | 'priority_list'     // Lista de prioridades
  | 'folders'           // Folders/Spaces do ClickUp
  | 'lists';            // Listas do ClickUp

// ============================================
// TIPOS
// ============================================

export interface ReferenceItem {
  id: string;
  name: string;
  displayName?: string;
  color?: string;
  category?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  source: 'sync' | 'manual' | 'import';
}

export interface ReferenceDataStore {
  version: string;
  key: ReferenceDataKey;
  items: ReferenceItem[];
  lastUpdated: string;
  lastSyncedToSupabase?: string;
}

export interface TeamMember extends ReferenceItem {
  email: string;
  username?: string;
  initials?: string;
  profilePicture?: string;
  role?: string;
  department?: string;
  active: boolean;
}

export interface EquipTag extends ReferenceItem {
  tagType: 'equip' | 'project' | 'area' | 'priority' | 'custom';
  isEquipment: boolean;
  equipmentType?: string; // tipo de equipamento
  location?: string;      // localização
  responsible?: string;   // responsável
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

class ReferenceDataService {
  private cache: Map<ReferenceDataKey, ReferenceDataStore> = new Map();
  private initialized: boolean = false;

  // ----------------------------------------
  // INICIALIZAÇÃO
  // ----------------------------------------

  /**
   * Inicializa o serviço carregando dados do IndexedDB
   * Deve ser chamado ANTES de qualquer sync
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('[SERV-REF-001] 🚀 Inicializando ReferenceDataService...');

    const allKeys: ReferenceDataKey[] = [
      'equip_tags',
      'team_members',
      'projects',
      'custom_tags',
      'status_list',
      'priority_list',
      'folders',
      'lists'
    ];

    for (const key of allKeys) {
      await this.loadFromStorage(key);
    }

    this.initialized = true;
    console.log('[SERV-REF-001] ✅ ReferenceDataService inicializado');
  }

  /**
   * Carrega dados do IndexedDB para memória
   */
  private async loadFromStorage(key: ReferenceDataKey): Promise<ReferenceDataStore | null> {
    try {
      // Tentar IndexedDB primeiro
      const stored = await get<ReferenceDataStore>(IDB_PREFIX + key);

      if (stored && stored.version === REF_VERSION) {
        this.cache.set(key, stored);
        console.log(`[SERV-REF-001] 📦 Loaded ${key}: ${stored.items.length} items`);
        return stored;
      }

      // Fallback para localStorage
      const lsData = localStorage.getItem(LS_PREFIX + key);
      if (lsData) {
        const parsed = JSON.parse(lsData) as ReferenceDataStore;
        if (parsed.version === REF_VERSION) {
          this.cache.set(key, parsed);
          // Migrar para IndexedDB
          await set(IDB_PREFIX + key, parsed);
          console.log(`[SERV-REF-001] 📦 Migrated ${key} from localStorage`);
          return parsed;
        }
      }

      return null;
    } catch (error) {
      console.error(`[SERV-REF-001] ❌ Error loading ${key}:`, error);
      return null;
    }
  }

  // ----------------------------------------
  // OPERAÇÕES DE LEITURA
  // ----------------------------------------

  /**
   * Obtém todos os items de uma categoria
   */
  getItems<T extends ReferenceItem = ReferenceItem>(key: ReferenceDataKey): T[] {
    const store = this.cache.get(key);
    return (store?.items || []) as T[];
  }

  /**
   * Obtém item por ID
   */
  getItemById<T extends ReferenceItem = ReferenceItem>(
    key: ReferenceDataKey,
    id: string
  ): T | undefined {
    const items = this.getItems<T>(key);
    return items.find(item => item.id === id);
  }

  /**
   * Obtém item por nome (case-insensitive)
   */
  getItemByName<T extends ReferenceItem = ReferenceItem>(
    key: ReferenceDataKey,
    name: string
  ): T | undefined {
    const items = this.getItems<T>(key);
    return items.find(item => item.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Busca items por texto
   */
  searchItems<T extends ReferenceItem = ReferenceItem>(
    key: ReferenceDataKey,
    query: string
  ): T[] {
    const items = this.getItems<T>(key);
    const lowerQuery = query.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.displayName?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Obtém apenas os nomes (para dropdowns)
   */
  getNames(key: ReferenceDataKey): string[] {
    return this.getItems(key).map(item => item.name);
  }

  /**
   * Verifica se um item existe
   */
  hasItem(key: ReferenceDataKey, nameOrId: string): boolean {
    return !!this.getItemById(key, nameOrId) || !!this.getItemByName(key, nameOrId);
  }

  // ----------------------------------------
  // OPERAÇÕES DE ESCRITA (INCREMENTAIS)
  // ----------------------------------------

  /**
   * Adiciona ou atualiza items (merge incremental)
   * Novos items são adicionados, existentes são atualizados
   */
  async mergeItems<T extends ReferenceItem = ReferenceItem>(
    key: ReferenceDataKey,
    newItems: Partial<T>[],
    source: 'sync' | 'manual' | 'import' = 'sync'
  ): Promise<{ added: number; updated: number }> {
    let store = this.cache.get(key);

    if (!store) {
      store = {
        version: REF_VERSION,
        key,
        items: [],
        lastUpdated: new Date().toISOString()
      };
    }

    const existingMap = new Map(store.items.map(item => [item.id, item]));
    const nameMap = new Map(store.items.map(item => [item.name.toLowerCase(), item]));

    let added = 0;
    let updated = 0;
    const now = new Date().toISOString();

    for (const newItem of newItems) {
      // Gerar ID se não existir
      const id = newItem.id || this.generateId(newItem.name || 'item');
      const name = newItem.name || '';

      // Verificar se já existe (por ID ou nome)
      const existingById = existingMap.get(id);
      const existingByName = nameMap.get(name.toLowerCase());
      const existing = existingById || existingByName;

      if (existing) {
        // Atualizar existente (merge)
        const merged: ReferenceItem = {
          ...existing,
          ...newItem,
          id: existing.id, // Manter ID original
          updatedAt: now,
          createdAt: existing.createdAt // Manter data de criação
        };
        existingMap.set(existing.id, merged);
        updated++;
      } else {
        // Adicionar novo
        const item: ReferenceItem = {
          id,
          name,
          displayName: newItem.displayName,
          color: newItem.color,
          category: newItem.category,
          metadata: newItem.metadata,
          createdAt: now,
          updatedAt: now,
          source,
          ...newItem
        };
        existingMap.set(id, item);
        added++;
      }
    }

    // Atualizar store
    store.items = Array.from(existingMap.values());
    store.lastUpdated = now;
    this.cache.set(key, store);

    // Persistir
    await this.saveToStorage(key, store);

    console.log(`[SERV-REF-001] 📝 ${key}: +${added} added, ~${updated} updated`);

    return { added, updated };
  }

  /**
   * Adiciona um único item
   */
  async addItem<T extends ReferenceItem = ReferenceItem>(
    key: ReferenceDataKey,
    item: Partial<T>,
    source: 'sync' | 'manual' | 'import' = 'manual'
  ): Promise<T> {
    await this.mergeItems(key, [item], source);
    return this.getItemByName(key, item.name || '') as T;
  }

  /**
   * Remove um item por ID
   */
  async removeItem(key: ReferenceDataKey, id: string): Promise<boolean> {
    const store = this.cache.get(key);
    if (!store) return false;

    const initialLength = store.items.length;
    store.items = store.items.filter(item => item.id !== id);

    if (store.items.length < initialLength) {
      store.lastUpdated = new Date().toISOString();
      this.cache.set(key, store);
      await this.saveToStorage(key, store);
      console.log(`[SERV-REF-001] 🗑️ Removed item ${id} from ${key}`);
      return true;
    }

    return false;
  }

  // ----------------------------------------
  // PERSISTÊNCIA
  // ----------------------------------------

  /**
   * Salva no IndexedDB e localStorage (fallback)
   */
  private async saveToStorage(key: ReferenceDataKey, store: ReferenceDataStore): Promise<void> {
    try {
      // IndexedDB (principal)
      await set(IDB_PREFIX + key, store);

      // localStorage (fallback para acesso rápido)
      try {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify(store));
      } catch (e) {
        // localStorage pode estar cheio - não é crítico
        console.warn(`[SERV-REF-001] localStorage full, skipping ${key}`);
      }

      console.log(`[SERV-REF-001] 💾 Saved ${key}: ${store.items.length} items`);
    } catch (error) {
      console.error(`[SERV-REF-001] ❌ Error saving ${key}:`, error);
    }
  }

  /**
   * Sincroniza com Supabase (GLOBAL - todos veem igual)
   */
  async syncToSupabase(key?: ReferenceDataKey, syncedBy?: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('[SERV-REF-001] Supabase not available');
      return false;
    }

    const keysToSync = key ? [key] : Array.from(this.cache.keys());

    try {
      for (const k of keysToSync) {
        const store = this.cache.get(k);
        if (!store) continue;

        const { error } = await supabase
          .from(SUPABASE_TABLE)
          .upsert({
            data_key: k,  // GLOBAL - sem device_id
            data: store,
            created_by: syncedBy || 'system',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'data_key'  // Único por chave (global)
          });

        if (error) {
          console.error(`[SERV-REF-001] Supabase sync error for ${k}:`, error);
          continue;
        }

        store.lastSyncedToSupabase = new Date().toISOString();
        this.cache.set(k, store);
      }

      console.log('[SERV-REF-001] ☁️ Dados de referência sincronizados (GLOBAL)');
      return true;
    } catch (error) {
      console.error('[SERV-REF-001] Supabase sync failed:', error);
      return false;
    }
  }

  /**
   * Carrega do Supabase (GLOBAL - mesmos dados para todos)
   */
  async loadFromSupabase(key?: ReferenceDataKey): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      let query = supabase
        .from(SUPABASE_TABLE)
        .select('*');  // GLOBAL - sem filtro de device_id

      if (key) {
        query = query.eq('data_key', key);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SERV-REF-001] Supabase load error:', error);
        return false;
      }

      let loadedCount = 0;
      for (const row of data || []) {
        const store = row.data as ReferenceDataStore;
        if (store && store.version === REF_VERSION) {
          this.cache.set(row.data_key as ReferenceDataKey, store);
          await this.saveToStorage(row.data_key as ReferenceDataKey, store);
          loadedCount++;
          console.log(`[SERV-REF-001] ✅ Loaded ${row.data_key}: ${store.items?.length || 0} items`);
        }
      }

      console.log(`[SERV-REF-001] ☁️ Carregados ${loadedCount} conjuntos de dados GLOBAIS`);
      return loadedCount > 0;
    } catch (error) {
      console.error('[SERV-REF-001] Supabase load failed:', error);
      return false;
    }
  }

  // ----------------------------------------
  // MÉTODOS ESPECÍFICOS PARA EQUIP TAGS
  // ----------------------------------------

  /**
   * Extrai e salva tags de equipamento de tasks
   */
  async extractEquipTagsFromTasks(tasks: any[]): Promise<number> {
    const equipTags: Partial<EquipTag>[] = [];

    for (const task of tasks) {
      if (!task.tags) continue;

      for (const tag of task.tags) {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        if (!tagName) continue;

        // Identificar se é tag de equipamento
        const isEquip = this.isEquipmentTag(tagName);

        equipTags.push({
          id: `tag_${tagName.toLowerCase().replace(/\s+/g, '_')}`,
          name: tagName,
          displayName: tagName,
          color: typeof tag === 'object' ? tag.tag_fg : undefined,
          tagType: isEquip ? 'equip' : 'custom',
          isEquipment: isEquip,
          category: this.categorizeTag(tagName)
        });
      }
    }

    const result = await this.mergeItems('equip_tags', equipTags, 'sync');
    return result.added;
  }

  /**
   * Identifica se uma tag é de equipamento
   * Customize esta lógica conforme sua nomenclatura
   */
  private isEquipmentTag(tagName: string): boolean {
    const lower = tagName.toLowerCase();
    const equipKeywords = [
      'equip', 'equipamento', 'equipment',
      'máquina', 'maquina', 'machine',
      'ferramenta', 'tool',
      'veículo', 'veiculo', 'vehicle',
      'computador', 'computer', 'pc', 'notebook',
      'impressora', 'printer',
      'servidor', 'server'
    ];

    return equipKeywords.some(kw => lower.includes(kw));
  }

  /**
   * Categoriza uma tag automaticamente
   */
  private categorizeTag(tagName: string): string {
    const lower = tagName.toLowerCase();

    if (lower.includes('projeto') || lower.includes('project')) return 'project';
    if (lower.includes('rotina') || lower.includes('routine')) return 'routine';
    if (lower.includes('equip') || lower.includes('maq')) return 'equipment';
    if (lower.includes('urgent') || lower.includes('prior')) return 'priority';
    if (lower.includes('area') || lower.includes('setor')) return 'area';

    return 'general';
  }

  /**
   * Extrai e salva membros da equipe de tasks
   */
  async extractTeamMembersFromTasks(tasks: any[]): Promise<number> {
    const members: Partial<TeamMember>[] = [];

    for (const task of tasks) {
      if (!task.assignees) continue;

      for (const assignee of task.assignees) {
        if (!assignee.email && !assignee.username) continue;

        members.push({
          id: assignee.id || `member_${assignee.email || assignee.username}`,
          name: assignee.username || assignee.email?.split('@')[0] || 'Unknown',
          displayName: assignee.username,
          email: assignee.email,
          username: assignee.username,
          initials: assignee.initials,
          profilePicture: assignee.profilePicture,
          active: true
        });
      }
    }

    const result = await this.mergeItems('team_members', members, 'sync');
    return result.added;
  }

  /**
   * Extrai e salva projetos de tasks
   */
  async extractProjectsFromTasks(tasks: any[]): Promise<number> {
    const projects: Partial<ReferenceItem>[] = [];
    const seen = new Set<string>();

    for (const task of tasks) {
      const projectName = task.list?.name || task.folder?.name;
      if (!projectName || seen.has(projectName)) continue;
      seen.add(projectName);

      projects.push({
        id: task.list?.id || task.folder?.id || `project_${projectName}`,
        name: projectName,
        displayName: projectName,
        category: task.folder?.name || 'General',
        metadata: {
          listId: task.list?.id,
          folderId: task.folder?.id,
          spaceId: task.space?.id
        }
      });
    }

    const result = await this.mergeItems('projects', projects, 'sync');
    return result.added;
  }

  // ----------------------------------------
  // LIMPEZA (MANUAL E CONTROLADA)
  // ----------------------------------------

  /**
   * Limpa dados de uma categoria específica
   * ATENÇÃO: Usar com cuidado!
   */
  async clearData(key: ReferenceDataKey): Promise<void> {
    this.cache.delete(key);
    await del(IDB_PREFIX + key);
    localStorage.removeItem(LS_PREFIX + key);
    console.log(`[SERV-REF-001] 🗑️ Cleared ${key}`);
  }

  /**
   * Limpa TODOS os dados de referência
   * ATENÇÃO: Requer confirmação explícita!
   */
  async clearAllData(confirm: boolean = false): Promise<void> {
    if (!confirm) {
      console.warn('[SERV-REF-001] ⚠️ clearAllData requires explicit confirmation');
      return;
    }

    for (const key of this.cache.keys()) {
      await this.clearData(key);
    }

    this.cache.clear();
    console.log('[SERV-REF-001] 🗑️ All reference data cleared');
  }

  // ----------------------------------------
  // UTILITÁRIOS
  // ----------------------------------------

  /**
   * Gera um ID único
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estatísticas do armazenamento
   */
  async getStats(): Promise<Record<ReferenceDataKey, { count: number; lastUpdated: string | null }>> {
    const stats: Record<string, { count: number; lastUpdated: string | null }> = {};

    for (const [key, store] of this.cache.entries()) {
      stats[key] = {
        count: store.items.length,
        lastUpdated: store.lastUpdated
      };
    }

    return stats as Record<ReferenceDataKey, { count: number; lastUpdated: string | null }>;
  }

  /**
   * Exporta todos os dados para backup
   */
  async exportAll(): Promise<Record<ReferenceDataKey, ReferenceDataStore>> {
    const result: Record<string, ReferenceDataStore> = {};

    for (const [key, store] of this.cache.entries()) {
      result[key] = store;
    }

    return result as Record<ReferenceDataKey, ReferenceDataStore>;
  }

  /**
   * Importa dados de backup
   */
  async importAll(data: Record<ReferenceDataKey, ReferenceDataStore>): Promise<void> {
    for (const [key, store] of Object.entries(data)) {
      if (store.version === REF_VERSION) {
        this.cache.set(key as ReferenceDataKey, store);
        await this.saveToStorage(key as ReferenceDataKey, store);
      }
    }
    console.log('[SERV-REF-001] 📥 Data imported');
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const referenceData = new ReferenceDataService();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

// Equip Tags
export const getEquipTags = (): EquipTag[] => referenceData.getItems<EquipTag>('equip_tags');
export const getEquipTagNames = (): string[] => referenceData.getNames('equip_tags');
export const hasEquipTag = (name: string): boolean => referenceData.hasItem('equip_tags', name);

// Team Members
export const getTeamMembers = (): TeamMember[] => referenceData.getItems<TeamMember>('team_members');
export const getTeamMemberNames = (): string[] => referenceData.getNames('team_members');
export const getMemberByEmail = (email: string): TeamMember | undefined =>
  referenceData.getItems<TeamMember>('team_members').find(m => m.email === email);

// Projects
export const getProjects = (): ReferenceItem[] => referenceData.getItems('projects');
export const getProjectNames = (): string[] => referenceData.getNames('projects');

// All Tags (for filters)
export const getAllTags = (): string[] => referenceData.getNames('equip_tags');
export const getAllCustomTags = (): string[] => referenceData.getNames('custom_tags');

// Initialize
export const initializeReferenceData = () => referenceData.initialize();

export default referenceData;
