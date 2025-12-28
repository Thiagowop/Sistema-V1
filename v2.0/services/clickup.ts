import { Task, AppConfig, GroupedData, StandupEntry } from '../types';
import { FilterConfig, FilterMetadata } from '../types/FilterConfig';
import { calculateWeeklyDistribution, getDynamicWeekRange } from './processor';

// ============================================
// SYNC FILTER OPTIONS
// ============================================
export interface SyncFilterOptions {
  tags?: string[];           // Filtrar por tags na API (server-side)
  assignees?: string[];      // Filtrar client-side após busca
  includeArchived?: boolean;
  incrementalSince?: string; // ISO date para sync incremental
  signal?: AbortSignal;      // Signal para cancelar sync
  onProgress?: (current: number, total: number, message: string) => void;
}
// MOCK_DATA removed - not used in v2.0

// ClickUp API Types
export interface ClickUpApiTask {
  id: string;
  name: string;
  description?: string;
  status: { status: string; color: string } | string;
  assignees: { username: string; email: string }[];
  tags: { name: string }[]; // Added tags for filtering
  priority?: { priority?: string; id?: any; color?: string } | string | null;
  start_date: string | null;
  due_date: string | null;
  date_closed: string | null;
  time_estimate: number | null;
  time_spent: number | null;
  list: { name: string };
  parent?: string | null;
  orderindex?: number | string;
  orderIndex?: number | string;
  position?: number | string;
}

const FALLBACK_PROXIES = [
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/',
];

const fetchWithFallback = async (targetUrl: string, token: string, configuredProxy?: string): Promise<any> => {
  let lastError: any = null;

  // IMPORTANT: Try DIRECT connection FIRST (no proxy)
  // Backend testing shows API works perfectly without proxy
  // Proxies can corrupt authentication headers
  console.log('🔗 Attempting direct API connection (no proxy)...');
  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      if (response.status === 401) {
        throw new Error(`Authentication Failed: Invalid Token. Check your settings.`);
      }
      throw new Error(`ClickUp API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    console.log('✅ Direct connection successful!');
    return data;

  } catch (directErr: any) {
    console.warn('⚠️  Direct connection failed:', directErr.message);
    lastError = directErr;

    // If it's NOT a CORS error, don't try proxies
    if (!directErr.message.includes('CORS') && !directErr.message.includes('fetch')) {
      throw directErr;
    }

    console.log('🔄 Trying CORS proxies...');
  }

  // If direct connection failed with CORS, try proxies
  let proxiesToTry = configuredProxy ? [configuredProxy] : [];
  proxiesToTry = [...new Set([...proxiesToTry, ...FALLBACK_PROXIES])];

  for (const proxyBase of proxiesToTry) {
    try {
      const prefix = proxyBase;
      const url = `${prefix}${encodeURIComponent(targetUrl)}`;

      // Added cache: 'no-store' to ensure fresh data every time
      const response = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 401) {
          throw new Error(`Authentication Failed: Invalid Token. Check your settings.`);
        }
        throw new Error(`ClickUp API Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data;

    } catch (err: any) {
      console.warn(`⚠️ Proxy ${proxyBase} failed:`, err.message);
      lastError = err;
      if (err.message.includes('Authentication Failed')) throw err;
      continue;
    }
  }

  throw new Error(`All connection attempts failed. Last error: ${lastError?.message || 'Unknown Network Error'}`);
};

const fetchTasksFromList = async (listId: string, token: string, proxyUrl?: string, includeArchived: boolean = false): Promise<ClickUpApiTask[]> => {
  let allTasks: ClickUpApiTask[] = [];
  let page = 0;
  let hasMore = true;

  // Pagination Loop: Fetch all pages until API returns empty list
  while (hasMore) {
    console.log(`Fetching List ${listId} - Page ${page}...`);

    // USE LOCAL PROXY SERVER via Vite (configured in vite.config.ts)
    // This bypasses CORS restrictions
    const useProxy = import.meta.env.DEV; // Use proxy only in DEV mode (or always if you deploy behind a proxy)

    let targetUrl: string;
    if (useProxy) {
      // Relative path to be handled by Vite Proxy
      targetUrl = `/api-clickup/list/${listId}/task?subtasks=true&include_closed=true&archived=${includeArchived ? 'true' : 'false'}&page=${page}`;
      console.log(`🔗 Using local proxy: ${targetUrl}`);
    } else {
      // Direct ClickUp API (Production or if Proxy disabled)
      targetUrl = `https://api.clickup.com/api/v2/list/${listId}/task?subtasks=true&include_closed=true&archived=${includeArchived ? 'true' : 'false'}&page=${page}`;
    }

    try {
      // When using proxy, we don't need to pass token or use fetchWithFallback
      // The proxy server handles authentication
      let data: any;

      if (useProxy) {
        const response = await fetch(targetUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Proxy error: ${response.status}`);
        }

        data = await response.json();
      } else {
        data = await fetchWithFallback(targetUrl, token, proxyUrl);
      }

      const pageTasks = data.tasks || [];

      if (pageTasks.length === 0) {
        hasMore = false;
      } else {
        allTasks = [...allTasks, ...pageTasks];
        page++;
      }
    } catch (error: any) {
      throw error;
    }
  }

  return allTasks;
};

const normalizeName = (name: string, mappings: Record<string, string>): string => {
  if (!name) return "Não atribuído";
  const s = name.trim();
  if (!s) return "Não atribuído";

  const lowerInput = s.toLowerCase();

  // 1. Priority: Exact match (Case insensitive key)
  const exactKey = Object.keys(mappings).find(key => key.toLowerCase() === lowerInput);
  if (exactKey) return mappings[exactKey];

  // 2. Priority: Configuration Key is PART of the Input Name (e.g. Config="Alvaro" matches Input="Alvaro Nunes")
  const partOfInputKey = Object.keys(mappings).find(key => lowerInput.includes(key.toLowerCase()));
  if (partOfInputKey) return mappings[partOfInputKey];

  // 3. Priority: Input Name is PART of the Configuration Key (e.g. Config="Lucas Soares" matches Input="Soares")
  const containerKey = Object.keys(mappings).find(key => key.toLowerCase().includes(lowerInput));
  if (containerKey) return mappings[containerKey];

  // Fallback: Return the original name
  return s;
};

// Fetch individual task by ID
export const fetchTaskById = async (taskId: string, config: AppConfig): Promise<ClickUpApiTask | null> => {
  if (!config.clickupApiToken) {
    console.warn('No API token configured');
    return null;
  }

  const token = config.clickupApiToken.replace(/\s/g, '');
  const proxy = config.corsProxy?.trim();

  // Extract just the task ID if it's in format "teamId/taskId"
  const cleanTaskId = taskId.includes('/') ? taskId.split('/').pop()! : taskId;

  try {
    const targetUrl = `https://api.clickup.com/api/v2/task/${cleanTaskId}`;
    console.log(`🔍 Fetching task ${cleanTaskId}...`);

    const data = await fetchWithFallback(targetUrl, token, proxy);
    return data as ClickUpApiTask;
  } catch (error) {
    console.warn(`Failed to fetch task ${cleanTaskId}:`, error);
    return null;
  }
};

// --- Raw Data Fetcher ---
export const fetchRawClickUpData = async (
  config: AppConfig,
  syncOptions?: SyncFilterOptions
): Promise<ClickUpApiTask[]> => {
  if (!config.clickupApiToken) {
    throw new Error("Missing ClickUp API Token");
  }

  const token = config.clickupApiToken.replace(/\s/g, '');
  const proxy = config.corsProxy?.trim();
  const options = syncOptions || {};

  // OPTION 1: Fetch from Team/Space (with tag filtering and duplicate detection)
  if (config.clickupTeamId && config.clickupTeamId.trim()) {
    console.log(`🌐 Fetching from Team/Space: ${config.clickupTeamId}`);

    if (options.incrementalSince) {
      console.log(`🔄 Incremental sync - only tasks updated after ${options.incrementalSince}`);
    }

    // Merge tag filters: from config + from sync options
    const tagFilters = [...(config.apiTagFilters || []), ...(options.tags || [])];
    const uniqueTags = [...new Set(tagFilters)]; // Remove duplicates

    if (uniqueTags.length > 0) {
      console.log(`🏷️  API Tag Filters: ${uniqueTags.join(', ')}`);
    }

    const includeArchived = options.includeArchived ?? !!config.includeArchived;

    let tasks = await fetchTasksFromTeam(
      config.clickupTeamId.trim(),
      token,
      proxy,
      uniqueTags,
      includeArchived,
      options.incrementalSince,
      options.onProgress,
      options.signal
    );

    // Client-side assignee filter (API doesn't support assignee filter for team endpoint)
    if (options.assignees && options.assignees.length > 0) {
      const assigneeSet = new Set(options.assignees.map(a => a.toLowerCase()));
      const beforeCount = tasks.length;

      tasks = tasks.filter(task => {
        if (!task.assignees || task.assignees.length === 0) return false;
        return task.assignees.some(a =>
          assigneeSet.has(a.username?.toLowerCase() || '') ||
          assigneeSet.has(a.email?.toLowerCase() || '')
        );
      });

      console.log(`👥 Assignee filter: ${beforeCount} → ${tasks.length} tasks (filtered to: ${options.assignees.join(', ')})`);
    }

    return tasks;
  }

  // OPTION 2: Fetch from individual Lists (fallback)
  if (!config.clickupListIds) {
    throw new Error("Missing ClickUp List IDs or Team ID");
  }

  console.log(`📋 Fetching from Lists: ${config.clickupListIds}`);
  const listIds = config.clickupListIds.split(',').map(s => s.trim()).filter(Boolean);

  let allApiTasks: ClickUpApiTask[] = [];
  const results = await Promise.allSettled(listIds.map(id => fetchTasksFromList(id, token, proxy, !!config.includeArchived)));

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      allApiTasks = [...allApiTasks, ...result.value];
    }
  });

  console.log(`✅ Total tasks fetched: ${allApiTasks.length}`);
  return allApiTasks;
};

// Fetch all tasks from a Team/Space with duplicate detection
const fetchTasksFromTeam = async (
  teamId: string,
  token: string,
  proxyUrl?: string,
  tagFilters: string[] = [],
  includeArchived: boolean = false,
  dateUpdatedAfter?: string,
  onProgress?: (current: number, total: number, message: string) => void,
  signal?: AbortSignal
): Promise<ClickUpApiTask[]> => {
  const allTasks: ClickUpApiTask[] = [];
  const seenIds = new Set<string>(); // Track unique task IDs
  let page = 0;
  let hasMore = true;
  const MAX_PAGES = 300; // Safety limit (30000 tasks max) - ajustado para comportar 28k+ tarefas
  const useProxy = import.meta.env.DEV;

  while (hasMore && page < MAX_PAGES) {
    // Check if cancelled before each page fetch
    if (signal?.aborted) {
      console.log('⏹️ Sync cancelled by user');
      throw new DOMException('Sync cancelled', 'AbortError');
    }

    const message = `Fetching Team ${teamId} - Page ${page}${dateUpdatedAfter ? ' (incremental)' : ''}...`;
    console.log(message);
    onProgress?.(page, MAX_PAGES, message);

    // Build URL with tag filters
    let targetUrl: string;
    if (useProxy) {
      targetUrl = `/api-clickup/team/${teamId}/task?subtasks=true&include_closed=true&archived=${includeArchived ? 'true' : 'false'}&page=${page}`;
    } else {
      targetUrl = `https://api.clickup.com/api/v2/team/${teamId}/task?subtasks=true&include_closed=true&archived=${includeArchived ? 'true' : 'false'}&page=${page}`;
    }

    // Add incremental filter (only tasks updated after last sync)
    if (dateUpdatedAfter) {
      const timestamp = new Date(dateUpdatedAfter).getTime();
      targetUrl += `&date_updated_gt=${timestamp}`;
      console.log(`📅 [INCREMENTAL] Using date_updated_gt=${timestamp} (${new Date(timestamp).toLocaleString()})`);
    } else {
      console.log(`⚠️  [FULL SYNC] No dateUpdatedAfter - fetching ALL tasks`);
    }

    // Add tag filters
    tagFilters.forEach(tag => {
      targetUrl += `&tags[]=${encodeURIComponent(tag)}`;
    });

    // Delay between pages to avoid rate limiting (429 Too Many Requests)
    if (page > 0) {
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay
      console.log(`⏱️  Waiting 200ms to avoid rate limit...`);
    }

    try {
      let data: any;
      let retries = 0;
      const MAX_RETRIES = 3;

      // Retry loop with exponential backoff for rate limiting
      while (retries <= MAX_RETRIES) {
        try {
          if (useProxy) {
            const response = await fetch(targetUrl, {
              method: 'GET',
              cache: 'no-store',
              signal, // Pass abort signal to fetch
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
              }
            });

            if (!response.ok) {
              // Handle rate limiting (429)
              if (response.status === 429 && retries < MAX_RETRIES) {
                const waitTime = Math.pow(2, retries) * 1000; // Exponential backoff: 1s, 2s, 4s
                console.warn(`⚠️  Rate limit (429) - waiting ${waitTime / 1000}s before retry ${retries + 1}/${MAX_RETRIES}...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries++;
                continue; // Retry
              }

              const errorData = await response.json();
              throw new Error(errorData.error || `Proxy error: ${response.status}`);
            }

            data = await response.json();
            break; // Success!
          } else {
            data = await fetchWithFallback(targetUrl, token, proxyUrl);
            break; // Success!
          }
        } catch (err: any) {
          if (retries >= MAX_RETRIES) {
            throw err; // Give up after max retries
          }
          retries++;
        }
      }

      const pageTasks = data.tasks || [];

      if (pageTasks.length === 0) {
        console.log(`✅ No tasks on page ${page}, stopping`);
        hasMore = false;
        break;
      }

      // Filter out duplicates
      let newTasksCount = 0;
      for (const task of pageTasks) {
        if (!seenIds.has(task.id)) {
          seenIds.add(task.id);
          allTasks.push(task);
          newTasksCount++;
        }
      }

      const duplicatesCount = pageTasks.length - newTasksCount;
      console.log(`   Page ${page}: ${pageTasks.length} tasks, ${newTasksCount} new, ${duplicatesCount} duplicates`);

      // Notify progress with meaningful message
      onProgress?.(page + 1, MAX_PAGES, `Page ${page + 1}: +${newTasksCount} tasks (${allTasks.length} total)`);

      // If no new tasks, we're done (API is repeating)
      if (newTasksCount === 0) {
        console.log(`✅ No new tasks, stopping pagination`);
        hasMore = false;
      } else {
        page++;
      }
    } catch (error: any) {
      console.error(`❌ Error fetching page ${page}:`, error.message);
      throw error;
    }
  }

  if (page >= MAX_PAGES) {
    console.warn(`⚠️ Reached maximum page limit (${MAX_PAGES}) - ${allTasks.length} tasks loaded`);
    onProgress?.(MAX_PAGES, MAX_PAGES, `Limite de ${MAX_PAGES} páginas atingido`);
  }

  const finalMsg = `✅ Total unique tasks from Team: ${allTasks.length}`;
  console.log(finalMsg);
  onProgress?.(page, page, finalMsg);
  return allTasks;
};

const isCompleted = (status: string): boolean => {
  const s = status.toUpperCase().trim();
  return ['COMPLETE', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(s);
};

// Check if task has the 'projeto' tag
const hasProjectTag = (task: ClickUpApiTask): boolean => {
  if (!task.tags || !Array.isArray(task.tags)) return false;
  return task.tags.some(tag => tag.name && tag.name.toLowerCase() === 'projeto');
};

// Check if task has a specific tag
const hasTag = (task: ClickUpApiTask, tagName: string): boolean => {
  if (!task.tags || !Array.isArray(task.tags)) return false;
  return task.tags.some(tag => tag.name && tag.name.toLowerCase() === tagName.toLowerCase());
};

const parseOrderIndex = (value: unknown): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

// Extract all unique tags, statuses, projects, and assignees from raw tasks
export const extractFilterMetadata = (rawTasks: ClickUpApiTask[], nameMappings: Record<string, string> = {}): FilterMetadata => {
  const tags = new Set<string>();
  const statuses = new Set<string>();
  const projects = new Set<string>();
  const assignees = new Set<string>();
  const priorities = new Set<string>();

  rawTasks.forEach(task => {
    // Extract tags
    if (task.tags && Array.isArray(task.tags)) {
      task.tags.forEach(tag => {
        if (tag.name) tags.add(tag.name);
      });
    }

    // Extract status
    if (task.status) {
      const statusStr = typeof task.status === 'string'
        ? task.status
        : task.status.status;
      if (statusStr) statuses.add(statusStr.toUpperCase());
    }

    // Extract priority
    const prRaw: any = (task as any).priority;
    let prStr: string | null = null;
    if (typeof prRaw === 'string') prStr = prRaw;
    else if (prRaw && typeof prRaw === 'object') prStr = prRaw.priority || prRaw.name || null;
    if (prStr) priorities.add(prStr.toUpperCase());

    // Extract project (list name)
    if (task.list && task.list.name) {
      projects.add(task.list.name);
    }

    // Extract assignees
    if (task.assignees && Array.isArray(task.assignees)) {
      task.assignees.forEach(assignee => {
        if (assignee.username) {
          const normalized = normalizeName(assignee.username, nameMappings);
          assignees.add(normalized);
        }
      });
    }
  });

  return {
    tags: Array.from(tags).sort(),
    statuses: Array.from(statuses).sort(),
    projects: Array.from(projects).sort(),
    assignees: Array.from(assignees).sort(),
    priorities: Array.from(priorities).sort()
  };
};

// Apply client-side filters to raw ClickUp tasks
// IMPORTANT: This function ensures parent tasks are included if any of their subtasks pass the filter
export const applyClientSideFilters = (
  rawTasks: ClickUpApiTask[],
  filterConfig: FilterConfig
): ClickUpApiTask[] => {
  // Helper function to check if a task passes filters
  const taskPassesFilters = (task: ClickUpApiTask): boolean => {
    // Filter by required tags (task must have AT LEAST ONE required tag - OR logic)
    if (filterConfig.requiredTags && filterConfig.requiredTags.length > 0) {
      const hasAtLeastOneTag = filterConfig.requiredTags.some(requiredTag =>
        hasTag(task, requiredTag)
      );
      if (!hasAtLeastOneTag) return false;
    }

    // Filter by excluded tags (task must NOT have ANY excluded tags)
    if (filterConfig.excludedTags && filterConfig.excludedTags.length > 0) {
      const hasAnyExcludedTag = filterConfig.excludedTags.some(excludedTag =>
        hasTag(task, excludedTag)
      );
      if (hasAnyExcludedTag) return false;
    }

    // Filter by status
    if (filterConfig.includedStatuses && filterConfig.includedStatuses.length > 0) {
      const taskStatus = typeof task.status === 'string'
        ? task.status.toUpperCase()
        : task.status.status.toUpperCase();
      if (!filterConfig.includedStatuses.includes(taskStatus)) return false;
    }

    // Filter by priority
    if (filterConfig.includedPriorities && filterConfig.includedPriorities.length > 0) {
      const prRaw: any = (task as any).priority;
      let prStr: string = '';
      if (typeof prRaw === 'string') prStr = prRaw.toUpperCase();
      else if (prRaw && typeof prRaw === 'object') prStr = (prRaw.priority || prRaw.name || '').toUpperCase();
      if (!filterConfig.includedPriorities.includes(prStr)) return false;
    }

    // Exclude closed tasks
    if (filterConfig.excludeClosed) {
      const taskStatus = typeof task.status === 'string'
        ? task.status
        : task.status.status;
      if (isCompleted(taskStatus)) return false;
    }

    // Filter by date range
    if (filterConfig.dateRange) {
      const { start, end } = filterConfig.dateRange;
      const taskDueDate = task.due_date ? new Date(parseInt(task.due_date)) : null;
      const taskStartDate = task.start_date ? new Date(parseInt(task.start_date)) : null;
      const taskClosedDate = task.date_closed ? new Date(parseInt(task.date_closed)) : null;

      // Check if task has any date within the range
      const relevantDate = taskDueDate || taskStartDate || taskClosedDate;

      if (relevantDate) {
        if (start && relevantDate < start) return false;
        if (end && relevantDate > end) return false;
      } else {
        // If task has no dates and we have a date filter, exclude it
        if (start || end) return false;
      }
    }

    // Filter by assignees
    if (filterConfig.includedAssignees && filterConfig.includedAssignees.length > 0) {
      const taskAssignees = task.assignees?.map(a => a.username) || [];
      const hasMatchingAssignee = taskAssignees.some(assignee =>
        filterConfig.includedAssignees.includes(assignee)
      );

      const isUnassigned = taskAssignees.length === 0;
      const allowUnassigned = filterConfig.includeUnassigned && isUnassigned;

      if (!hasMatchingAssignee && !allowUnassigned) return false;
    } else {
      // NO assignee filter is set - respect the includeUnassigned toggle globally
      const isUnassigned = (task.assignees?.length || 0) === 0;
      if (isUnassigned && !filterConfig.includeUnassigned) {
        return false; // Exclude unassigned tasks when toggle is OFF
      }
    }

    // Filter by task type (parent/subtask)
    const isSubtask = !!task.parent;
    if (isSubtask && !filterConfig.showSubtasks) return false;
    if (!isSubtask && !filterConfig.showParentTasks) return false;

    // Filter by projects (list names)
    if (filterConfig.includedProjects && filterConfig.includedProjects.length > 0) {
      const taskProject = task.list?.name || '';
      if (!filterConfig.includedProjects.includes(taskProject)) {
        return false;
      }
    }

    return true;
  };

  // Build a map of parent IDs to keep
  const parentIdsToKeep = new Set<string>();
  const filteredTasks = new Set<string>();

  // First pass: identify tasks that pass filters
  rawTasks.forEach(task => {
    if (taskPassesFilters(task)) {
      filteredTasks.add(task.id);
      // If it's a subtask, mark its parent for inclusion
      if (task.parent) {
        parentIdsToKeep.add(task.parent);
      }
    }
  });

  // Second pass: include tasks that either passed filters OR are parents of filtered subtasks
  return rawTasks.filter(task => {
    // Include if task passed filters
    if (filteredTasks.has(task.id)) return true;
    // Include if task is a parent of filtered subtasks
    if (parentIdsToKeep.has(task.id)) return true;
    return false;
  });
};

/**
 * Checks if a task is fully completed (100%)
 * A task is considered fully completed when:
 * 1. Its status is "completed" or similar
 * 2. ALL its subtasks (if any) are also completed
 */
export function isTaskFullyCompleted(task: Task): boolean {
  // Check if main task status is completed
  const taskCompleted = task.status.toUpperCase().includes('CONCLU') ||
    task.status.toUpperCase().includes('COMPLETE') ||
    task.status.toUpperCase().includes('DONE') ||
    task.status.toUpperCase().includes('FECHADO');

  if (!taskCompleted) return false;

  // If has subtasks, ALL must be completed
  if (task.subtasks && task.subtasks.length > 0) {
    return task.subtasks.every(sub =>
      sub.status.toUpperCase().includes('CONCLU') ||
      sub.status.toUpperCase().includes('COMPLETE') ||
      sub.status.toUpperCase().includes('DONE') ||
      sub.status.toUpperCase().includes('FECHADO')
    );
  }

  return true;
}

// --- CORE PROCESSOR: Converts Raw API Tasks to GroupedData ---
export function processApiTasks(filtered: ClickUpApiTask[], config: AppConfig): GroupedData[] {
  const tasks: Task[] = [];
  const taskMap = new Map<string, Task>();
  const parentMap = new Map<string, Task[]>();
  const fallbackOrder = Number.MAX_SAFE_INTEGER;
  const sortTasksByOrderIndex = (a: Task, b: Task) => {
    const idxA = a.orderIndex ?? fallbackOrder;
    const idxB = b.orderIndex ?? fallbackOrder;
    if (idxA !== idxB) return idxA - idxB;
    // Fallback to due date, then name to keep deterministic order
    if (a.dueDate && b.dueDate && a.dueDate.getTime() !== b.dueDate.getTime()) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    return a.name.localeCompare(b.name);
  };

  // 1. Convert and Build Structure
  // We filter PARENT tasks by tag "projeto". If a task is a subtask, we'll deal with it later.

  filtered.forEach(apiTask => {
    if (!apiTask || !apiTask.id) return;

    // --- FILTER: TAG 'PROJETO' ---
    // If the user wants to mimic the ClickUp view, we must respect the tag.
    // However, sometimes tags are only on parents.
    // Strategy: We keep everything for now, but mark if it has the tag.
    // Later we will filter the ROOTS.

    const timeEstHours = apiTask.time_estimate ? apiTask.time_estimate / 3600000 : 0;
    const timeLogHours = apiTask.time_spent ? apiTask.time_spent / 3600000 : 0;

    const startDate = apiTask.start_date ? new Date(parseInt(apiTask.start_date)) : null;
    const dueTime = apiTask.due_date ? parseInt(apiTask.due_date) : null;
    const dueDate = dueTime ? new Date(dueTime) : null;
    const dateClosed = apiTask.date_closed ? new Date(parseInt(apiTask.date_closed)) : null;

    // Process Assignees for Display
    let assigneeNames: string[] = [];
    if (apiTask.assignees && apiTask.assignees.length > 0) {
      assigneeNames = apiTask.assignees.map(a => normalizeName(a.username, config.nameMappings));
    } else {
      assigneeNames = ['Não atribuído'];
    }

    const assigneeDisplay = assigneeNames.join(' / ');

    let status = 'NOVO';
    if (apiTask.status) {
      if (typeof apiTask.status === 'string') {
        status = apiTask.status.toUpperCase();
      } else if (typeof apiTask.status === 'object' && apiTask.status.status) {
        status = apiTask.status.status.toUpperCase();
      }
    }

    const prRaw: any = (apiTask as any).priority;
    let priority: string | undefined;
    if (typeof prRaw === 'string') priority = prRaw.toUpperCase();
    else if (prRaw && typeof prRaw === 'object') {
      const val = prRaw.priority || prRaw.name || null;
      priority = val ? String(val).toUpperCase() : undefined;
    }

    const remaining = timeEstHours - timeLogHours;
    const additionalTime = timeLogHours > timeEstHours ? timeLogHours - timeEstHours : 0;
    const remainingFormula = remaining;
    const isOverdue = dueDate ? (dueDate < new Date() && !isCompleted(status)) : false;
    const hasNegativeBudget = remaining < 0 && !isCompleted(status);

    const level = priority ? (config.priorityOrder || []).findIndex(p => p.toUpperCase() === priority) : -1;

    const orderIndex = parseOrderIndex(
      (apiTask as any).orderindex ??
      (apiTask as any).orderIndex ??
      (apiTask as any).order_index ??
      (apiTask as any).position
    );

    // Extract tags from API task
    const tags = (apiTask.tags || []).map((t: any) => {
      if (typeof t === 'string') return t.toLowerCase();
      if (t && typeof t === 'object' && t.name) return t.name.toLowerCase();
      return '';
    }).filter(Boolean);

    const task: Task = {
      id: apiTask.id,
      name: apiTask.name,
      status: status,
      assignee: assigneeDisplay,
      rawAssignee: assigneeDisplay,
      startDate: startDate,
      dueDate: dueDate,
      dateClosed: dateClosed,
      description: apiTask.description,
      timeEstimate: timeEstHours,
      timeLogged: timeLogHours,
      remaining: remaining,
      additionalTime: additionalTime,
      remainingFormula: remainingFormula,
      projectName: apiTask.list ? apiTask.list.name : 'Unknown Project',
      orderIndex,
      priority,
      priorityLevel: level,
      isSubtask: false,
      subtasks: [],
      isOverdue,
      hasNegativeBudget,
      tags,
      weeklyDistribution: {}
    };

    const parentId = apiTask.parent;
    if (parentId) {
      task.isSubtask = true;
      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, []);
      }
      parentMap.get(parentId)?.push(task);
    } else {
      // Add all root tasks (filtering will be done client-side via applyClientSideFilters)
      taskMap.set(task.id, task);
      tasks.push(task);
    }
  });

  // 2. Link Subtasks
  parentMap.forEach((subtasks, parentId) => {
    const parent = taskMap.get(parentId);
    if (parent) {
      subtasks.sort(sortTasksByOrderIndex);
      parent.subtasks = subtasks;
      if (parent.subtasks.length > 0) {
        const subTotalEst = subtasks.reduce((acc, t) => acc + t.timeEstimate, 0);
        const subTotalLog = subtasks.reduce((acc, t) => acc + t.timeLogged, 0);

        if (parent.timeEstimate === 0) parent.timeEstimate = subTotalEst;
        parent.timeLogged = Math.max(parent.timeLogged, subTotalLog);
        parent.remaining = parent.timeEstimate - parent.timeLogged;
        parent.additionalTime = parent.timeLogged > parent.timeEstimate ? parent.timeLogged - parent.timeEstimate : 0;
        parent.remainingFormula = parent.remaining;
        parent.hasNegativeBudget = parent.remaining < 0 && !isCompleted(parent.status);
      }
    }
    // Se o parent não existe, não mostrar subtasks órfãs soltas
    // Elas devem aparecer apenas quando o parent existe
  });

  // 3. Active Tasks = The filtered Root Tasks
  const activeTasks = tasks;

  // Ensure deterministic ordering globally before grouping
  activeTasks.sort(sortTasksByOrderIndex);

  // Also keep subtasks arrays ordered in case any new ones were added later
  activeTasks.forEach(task => {
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.sort(sortTasksByOrderIndex);
    }
  });

  // 4. Determine Week Range
  const weekRangeDates = getDynamicWeekRange(tasks);
  const weekDatesStr = weekRangeDates.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

  // 5. Distribution Logic
  activeTasks.forEach(t => {
    t.weeklyDistribution = calculateWeeklyDistribution(t, weekRangeDates, config.holidays);
    t.subtasks.forEach(s => {
      s.weeklyDistribution = calculateWeeklyDistribution(s, weekRangeDates, config.holidays);
    });
  });

  // 6. DYNAMIC GROUPING (Create tabs based on data)
  const groupedData: GroupedData[] = [];
  const processedMembers = new Set<string>();

  // Helper to add task to a member's group
  const addTaskToMemberGroup = (memberKey: string, task: Task) => {
    let group = groupedData.find(g => g.assignee === memberKey);
    if (!group) {
      group = {
        assignee: memberKey,
        projects: [],
        weekDates: weekDatesStr
      };
      groupedData.push(group);
    }

    let project = group.projects.find(p => p.name === task.projectName);
    if (!project) {
      project = {
        name: task.projectName,
        tasks: [],
        stats: { planned: 0, logged: 0 }
      };
      group.projects.push(project);
    }
    project.tasks.push(task);
  };

  // Iterate all tasks and assign to tabs based on normalized assignees
  // NOTE: Completed tasks are now included - filtering is done in the dashboard via showCompleted toggle
  activeTasks.forEach(task => {
    // "Assignee" string is already "Name / Name". Split it.
    const names = task.assignee.split(' / ');
    names.forEach(name => {
      addTaskToMemberGroup(name, task);
    });
  });

  // Sort groups: "Não atribuído" first, then alphabetical
  groupedData.sort((a, b) => {
    if (a.assignee === 'Não atribuído') return -1;
    if (b.assignee === 'Não atribuído') return 1;
    return a.assignee.localeCompare(b.assignee);
  });

  // Sort projects inside groups
  groupedData.forEach(g => {
    g.projects.sort((a, b) => a.name.localeCompare(b.name));
    g.projects.forEach(project => {
      project.tasks.sort(sortTasksByOrderIndex);
    });
  });

  // Sort by custom order if defined
  if (config.teamMemberOrder && config.teamMemberOrder.length > 0) {
    const orderMap = new Map(config.teamMemberOrder.map((name, index) => [name, index]));
    groupedData.sort((a, b) => {
      const nameA = a.assignee.trim();
      const nameB = b.assignee.trim();

      let orderA = orderMap.get(nameA);
      if (orderA === undefined) {
        const keyA = Array.from(orderMap.keys()).find(k => nameA.includes(k) || k.includes(nameA));
        orderA = keyA !== undefined ? orderMap.get(keyA) : 999;
      }

      let orderB = orderMap.get(nameB);
      if (orderB === undefined) {
        const keyB = Array.from(orderMap.keys()).find(k => nameB.includes(k) || k.includes(nameB));
        orderB = keyB !== undefined ? orderMap.get(keyB) : 999;
      }

      // Ensure valid numbers
      const valA = orderA ?? 999;
      const valB = orderB ?? 999;

      return valA - valB;
    });
    console.log(`📊 Sorted by custom order: ${config.teamMemberOrder.join(' → ')}`);
  }

  return groupedData;
};


const sanitizeStandupContent = (value: string): string => {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\u00A0/g, ' ')
    .trim();
};

const normalizeKey = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const GENERAL_SECTION_PATTERNS = [
  /^(destaques?|bloqueios?|notas?|observac(?:oes|ões)|observacoes|resumo|resumos|principais entregas?|pr[oó]ximos passos|alertas?|prioridades?|foco)/i,
  /^(pend[eê]ncias?|status geral|alinhamento|atualiza[cç][oõ]es?)/i
];

const stripListPrefix = (value: string): string => {
  return value.replace(/^[-•●▪︎➤▶︎*]+\s*/, '').trim();
};

const parseStandupComment = (comment: any, config: AppConfig): StandupEntry | null => {
  if (!comment || !comment.id || !comment.date) return null;

  const timestamp = Number(comment.date);
  if (!Number.isFinite(timestamp)) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  let content = '';
  if (typeof comment.comment_text === 'string' && comment.comment_text.trim().length > 0) {
    content = sanitizeStandupContent(comment.comment_text);
  } else if (Array.isArray(comment.comment)) {
    content = sanitizeStandupContent(
      comment.comment
        .map((block: any) => (typeof block?.text === 'string' ? block.text : ''))
        .join('')
    );
  }

  if (!content) {
    return null;
  }

  const title = content.split('\n').find(line => line.trim().length > 0) || 'StandUp Diário';

  const blocks = Array.isArray(comment.comment) ? comment.comment : [];
  const taskMentions = blocks
    .filter((block: any) => block?.type === 'task_mention' && block?.task_mention?.task_id)
    .map((block: any) => {
      const taskId = String(block.task_mention.task_id);
      const slug = taskId.includes('/') ? (taskId.split('/').pop() || taskId) : taskId;
      const label = typeof block.text === 'string' && block.text.trim().length > 0
        ? block.text.trim()
        : slug;
      return {
        taskId,
        slug,
        label,
        url: `https://app.clickup.com/t/${slug}`
      };
    });

  const author = comment.user?.username || comment.user?.email || undefined;

  const normalizedTitle = normalizeKey(title);
  const knownHeadings = new Set<string>();

  const registerHeading = (value?: string) => {
    if (!value) return;
    const key = normalizeKey(value);
    if (key) knownHeadings.add(key);
  };

  (config.teamMembers || []).forEach(registerHeading);
  Object.keys(config.nameMappings || {}).forEach(registerHeading);
  Object.values(config.nameMappings || {}).forEach(registerHeading);

  const lines = content
    .split('\n')
    .map(stripListPrefix)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const sections: { heading: string; items: string[] }[] = [];
  let currentSection: { heading: string; items: string[] } | null = null;

  const isHeadingLine = (line: string): boolean => {
    const cleaned = line.replace(/[:：]\s*$/, '').trim();
    const normalized = normalizeKey(cleaned);
    if (!normalized || normalized === normalizedTitle) return false;
    if (knownHeadings.has(normalized)) return true;
    return GENERAL_SECTION_PATTERNS.some(pattern => pattern.test(cleaned));
  };

  lines.forEach(line => {
    if (normalizeKey(line) === normalizedTitle) {
      return;
    }

    if (isHeadingLine(line)) {
      const heading = line.replace(/[:：]\s*$/, '').trim();
      currentSection = { heading: heading || line, items: [] };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      currentSection = { heading: 'Notas gerais', items: [] };
      sections.push(currentSection);
    }

    currentSection.items.push(line);
  });

  const cleanedSections = sections
    .map(section => ({
      heading: section.heading,
      items: section.items.filter(item => item.trim().length > 0)
    }))
    .filter(section => section.items.length > 0);

  return {
    id: String(comment.id),
    dateIso: date.toISOString(),
    dateKey: toDateKey(date),
    title: title.trim(),
    content,
    author,
    taskMentions,
    sections: cleanedSections
  };
};

interface StandupFetchOptions {
  limit?: number;
  forDate?: Date;
  startDate?: Date;
  endDate?: Date;
}

const normalizeStartOfDay = (date: Date): number => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

const normalizeEndOfDay = (date: Date): number => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
};

export const fetchStandupSummaries = async (
  config: AppConfig,
  options: StandupFetchOptions = {}
): Promise<StandupEntry[]> => {
  if (!config.clickupApiToken) {
    throw new Error('Missing ClickUp API Token');
  }

  if (!config.clickupStandupViewId) {
    throw new Error('Missing Standup View ID');
  }

  const token = config.clickupApiToken.replace(/\s/g, '');
  const viewId = config.clickupStandupViewId.trim();
  const proxy = config.corsProxy?.trim();
  const useProxy = import.meta.env.DEV;

  let data: any;

  if (useProxy) {
    const response = await fetch(`/api-clickup/view/${viewId}/comment`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Authorization': token,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Proxy error: ${response.status}`);
    }

    data = await response.json();
  } else {
    const url = `https://api.clickup.com/api/v2/view/${viewId}/comment`;
    data = await fetchWithFallback(url, token, proxy);
  }

  const rawComments = Array.isArray(data?.comments) ? data.comments : [];
  let entries = rawComments
    .map((comment: any) => parseStandupComment(comment, config))
    .filter((entry): entry is StandupEntry => Boolean(entry));

  entries.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());

  if (options.forDate) {
    const key = toDateKey(options.forDate);
    entries = entries.filter(entry => entry.dateKey === key);
  } else {
    if (options.startDate) {
      const startMs = normalizeStartOfDay(options.startDate);
      entries = entries.filter(entry => new Date(entry.dateIso).getTime() >= startMs);
    }
    if (options.endDate) {
      const endMs = normalizeEndOfDay(options.endDate);
      entries = entries.filter(entry => new Date(entry.dateIso).getTime() <= endMs);
    }
  }

  if (options.limit && options.limit > 0) {
    entries = entries.slice(0, options.limit);
  }

  return entries;
};


// --- API Sync Function ---
export const fetchClickUpData = async (config: AppConfig): Promise<GroupedData[]> => {
  if (!config.clickupApiToken || !config.clickupListIds) {
    throw new Error("Missing ClickUp API Token or List IDs in settings.");
  }
  const rawTasks = await fetchRawClickUpData(config);
  return processApiTasks(rawTasks, config);
};


// --- Mock Data Loader ---
// MOCK DATA FUNCTION REMOVED - Not used in v2.0
// V2.0 uses fetchRawClickUpData + processApiTasks instead
/*
export const loadMockData = (config: AppConfig = getDefaultConfig()): { grouped: GroupedData[], members: any[] } => {
  console.log("Loading Mock Data...", MOCK_DATA);
  if (!MOCK_DATA || MOCK_DATA.length === 0) {
    throw new Error("Mock Data is empty. Please paste the JSON in services/mockData.ts");
  }

  console.log("[MOCK] Processing data...");

  let tasksToProcess: any[] = MOCK_DATA;
  if (Array.isArray(MOCK_DATA[0])) {
    tasksToProcess = MOCK_DATA.flat();
  }

*/
