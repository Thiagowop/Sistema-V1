/**
 * @id SERV-CLICK-001
 * @name ClickUpService
 * @description Serviço completo de integração com API ClickUp
 *              - Fetch paginado de tasks (List, Team/Space)
 *              - Sync incremental via date_updated_gt
 *              - Standup summaries
 *              - Client-side filters
 *              - Extract metadata for dropdowns
 * @dependencies types, processor, FilterConfig
 * @status active
 * @version 2.0.0
 * 
 * ============================================================================
 * GUIA DE USO
 * ============================================================================
 * 
 * import { fetchClickUpData, fetchRawClickUpData, fetchStandupSummaries } from './services/clickup';
 * 
 * const config = {
 *   clickupApiToken: "pk_...",
 *   clickupTeamId: "9012345678", // Space/Team ID para fetch completo
 *   clickupListIds: "123,456",   // OU lista de List IDs
 *   teamMembers: ["Nome 1", "Nome 2"],
 *   nameMappings: { "Nome Completo": "Apelido" },
 *   holidays: [],
 *   corsProxy: "https://corsproxy.io/?" 
 * };
 * 
 * // Fetch full
 * const data = await fetchClickUpData(config);
 * 
 * // Fetch raw (for caching)
 * const rawTasks = await fetchRawClickUpData(config);
 * 
 * // Incremental sync
 * const newTasks = await fetchRawClickUpData(config, lastSyncTimestamp);
 * 
 * // Standups
 * const standups = await fetchStandupSummaries(config, { limit: 10 });
 * ============================================================================
 */

import { Task, AppConfig, GroupedData, TeamMemberData, StandupEntry } from '../types';
import { FilterConfig, FilterMetadata } from '../types/FilterConfig';

// --- HELPER FUNCTIONS ---

const formatHours = (hours: number): string => {
  if (hours === 0) return '-';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return '0';
};

const getWeekFromDate = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  let cursorDate = new Date(startDate);
  cursorDate.setHours(12, 0, 0, 0); 

  let safetyLoop = 0;
  while (dates.length < 10 && safetyLoop < 30) {
    const day = cursorDate.getDay();
    if (day !== 0 && day !== 6) {
        dates.push(new Date(cursorDate));
    }
    cursorDate.setDate(cursorDate.getDate() + 1);
    safetyLoop++;
  }
  return dates;
};

const getDynamicWeekRange = (tasks: Task[]): Date[] => {
  let minDate = new Date(8640000000000000); 
  let hasValidDates = false;

  tasks.forEach(t => {
      const start = t.startDate ? new Date(t.startDate) : null;
      const due = t.dueDate ? new Date(t.dueDate) : null;
      
      if (start && start < minDate) { minDate = start; hasValidDates = true; }
      if (due && due < minDate) { minDate = due; hasValidDates = true; }
  });

  const today = new Date();
  today.setHours(0,0,0,0);
  
  let anchorDate = today;

  if (hasValidDates) {
      const diffTime = Math.abs(today.getTime() - minDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays > 30) {
          anchorDate = minDate;
          if (anchorDate.getDay() === 0) anchorDate.setDate(anchorDate.getDate() + 1);
          if (anchorDate.getDay() === 6) anchorDate.setDate(anchorDate.getDate() + 2);
      }
  }

  return getWeekFromDate(anchorDate);
};

const calculateWeeklyDistribution = (
  task: Task, 
  weekDates: Date[], 
  holidays: string[] = [] 
): Record<string, string> => {
  const distribution: Record<string, string> = {};

  const hoursTotal = (task.timeEstimate || 0) > 0 ? (task.timeEstimate || 0) : (task.timeLogged || 0);
  if (hoursTotal <= 0) return distribution;

  if (!task.startDate && !task.dueDate) return distribution;

  const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
  const end = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);

  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  let workingDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    const dateStr = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const isHoliday = holidays.includes(dateStr);

    if (day !== 0 && day !== 6 && !isHoliday) { 
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  if (workingDays === 0) workingDays = 1; 

  const hoursPerDay = hoursTotal / workingDays;
  const hoursStr = formatHours(hoursPerDay);

  weekDates.forEach(date => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    
    if (d >= start && d <= end) {
       const day = d.getDay();
       const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
       const isHoliday = holidays.includes(key);

       if (day !== 0 && day !== 6 && !isHoliday) {
         distribution[key] = hoursStr;
       }
    }
  });

  return distribution;
};


// --- API TYPES & LOGIC ---

export interface ClickUpApiTask {
  id: string;
  name: string;
  status: { status: string; color: string } | string;
  priority: { priority: string; color: string } | null;
  assignees: { username: string; email: string }[];
  start_date: string | null;
  due_date: string | null;
  date_closed: string | null; 
  time_estimate: number | null; 
  time_spent: number | null; 
  list: { name: string };
  project: { name: string };
  folder: { name: string };
  parent?: string | null;
  description?: string;
  tags?: { name: string }[];
}

// Optimized list of proxies.
const FALLBACK_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://cors-anywhere.herokuapp.com/', 
];

const fetchWithFallback = async (targetUrl: string, token: string, configuredProxy?: string): Promise<any> => {
  let proxiesToTry = configuredProxy ? [configuredProxy] : [];
  proxiesToTry = [...new Set([...proxiesToTry, ...FALLBACK_PROXIES])].filter(Boolean);

  let lastError: any = null;

  for (const proxyBase of proxiesToTry) {
    try {
      const prefix = proxyBase; 
      const url = `${prefix}${encodeURIComponent(targetUrl)}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
            'Authorization': token,
            'Accept': 'application/json'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            if (response.status === 401) throw new Error(`Authentication Failed: ClickUp recusou o Token.`);
            if (response.status === 403 || response.status === 404) throw new Error(`ClickUp API Error (${response.status}): Recurso não encontrado.`);
            throw new Error(`API Error (${response.status}): ${errText.substring(0, 100)}...`);
        }

        const data = await response.json();
        return data;

      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        throw fetchErr;
      }

    } catch (err: any) {
      console.warn(`⚠️ Proxy ${proxyBase} failed:`, err.message);
      lastError = err;
      if (err.message.includes('Authentication Failed')) throw err;
      continue;
    }
  }

  throw new Error(`All connection attempts failed. Last error: ${lastError?.message || 'Unknown Network Error'}.`);
};

// --- PAGINATION HELPER ---
// Fetches ALL pages until empty
const fetchAllPages = async (baseUrl: string, token: string, proxyUrl?: string): Promise<ClickUpApiTask[]> => {
  let page = 0;
  let allTasks: ClickUpApiTask[] = [];
  let keepFetching = true;

  while (keepFetching) {
    // Append pagination params
    const separator = baseUrl.includes('?') ? '&' : '?';
    const pagedUrl = `${baseUrl}${separator}page=${page}`;
    
    // console.log(`Fetching page ${page}...`);
    const data = await fetchWithFallback(pagedUrl, token, proxyUrl);
    
    if (data.tasks && data.tasks.length > 0) {
      allTasks = [...allTasks, ...data.tasks];
      page++;
      // Safety break to prevent infinite loops in weird scenarios (e.g. max 50 pages = 5000 tasks)
      if (page > 50) keepFetching = false; 
    } else {
      keepFetching = false;
    }
  }
  
  return allTasks;
};

const fetchTasksFromList = async (listId: string, token: string, proxyUrl?: string): Promise<ClickUpApiTask[]> => {
  const targetUrl = `https://api.clickup.com/api/v2/list/${listId}/task?subtasks=true&include_closed=true&archived=false`;
  return await fetchAllPages(targetUrl, token, proxyUrl);
};

const fetchTasksFromView = async (viewId: string, token: string, proxyUrl?: string): Promise<ClickUpApiTask[]> => {
  const targetUrl = `https://api.clickup.com/api/v2/view/${viewId}/task?subtasks=true`;
  return await fetchAllPages(targetUrl, token, proxyUrl);
};

const fetchTasksFromTeam = async (teamId: string, token: string, proxyUrl?: string): Promise<ClickUpApiTask[]> => {
  const targetUrl = `https://api.clickup.com/api/v2/team/${teamId}/task?subtasks=true&include_closed=true`;
  return await fetchAllPages(targetUrl, token, proxyUrl);
};

const normalizeName = (name: string, mappings: Record<string, string>): string => {
  if (!name) return "";
  const s = name.trim();
  for (const [full, short] of Object.entries(mappings)) {
    if (s.toLowerCase().includes(full.toLowerCase())) {
      return short;
    }
  }
  return s;
};

const isCompleted = (status: string): boolean => {
  const s = status.toUpperCase().trim();
  return ['COMPLETE', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(s);
};

const isAssignedToMember = (rawAssigneeString: string, memberName: string): boolean => {
  if (!rawAssigneeString) return false;
  const assignees = rawAssigneeString.split(',').map(s => s.trim().toLowerCase());
  const memberLower = memberName.toLowerCase();
  return assignees.some(a => {
    if (a.length < 2) return false;
    return memberLower.includes(a) || a.includes(memberLower);
  });
};

// --- EXPORTED FUNCTIONS ---

export const getClickUpConfig = (): AppConfig => {
  return {
    clickupApiToken: localStorage.getItem('clickup_api_key') || '',
    clickupTeamId: localStorage.getItem('clickup_team_id') || '9015049902', // Default Team ID
    clickupListIds: localStorage.getItem('clickup_list_ids') || '',
    clickupViewId: localStorage.getItem('clickup_view_id') || '',
    corsProxy: localStorage.getItem('clickup_cors_proxy') || '',
    teamMembers: [],
    nameMappings: {},
    holidays: []
  };
};

export const fetchClickUpData = async (config: AppConfig, onLog?: (msg: string) => void): Promise<{ grouped: GroupedData[], members: TeamMemberData[] }> => {
  const log = (msg: string) => onLog && onLog(msg);
  log('Iniciando sincronização com ClickUp API...');
  
  const token = config.clickupApiToken ? config.clickupApiToken.replace(/\s/g, '') : '';
  
  if (!token) {
    log("⚠️ Aviso: Token não encontrado. Usando dados de demonstração (Mock Data).");
    return { grouped: MOCK_LEGACY_DATA, members: MOCK_TEAM_DATA };
  }

  // Placeholder check
  if (token.includes("INSERT_YOUR_KEY")) {
    log("⚠️ Aviso: Token de exemplo detectado. Usando dados de demonstração.");
    return { grouped: MOCK_LEGACY_DATA, members: MOCK_TEAM_DATA };
  }
  
  const proxy = config.corsProxy?.trim();
  let allApiTasks: ClickUpApiTask[] = [];

  try {
      if (config.clickupViewId) {
        log(`Buscando View ID: ${config.clickupViewId} com paginação...`);
        const viewIds = config.clickupViewId.split(',').map(s => s.trim()).filter(Boolean);
        const results = await Promise.allSettled(viewIds.map(id => fetchTasksFromView(id, token, proxy)));
        
        results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                allApiTasks = [...allApiTasks, ...result.value];
                log(`✅ View ${viewIds[idx]}: ${result.value.length} tarefas baixadas.`);
            } else {
                log(`❌ Erro na View ${viewIds[idx]}: ${result.reason?.message}`);
            }
        });
      }
      else if (config.clickupListIds) {
        log(`Buscando List IDs: ${config.clickupListIds} com paginação...`);
        const listIds = config.clickupListIds.split(',').map(s => s.trim()).filter(Boolean);
        const results = await Promise.allSettled(listIds.map(id => fetchTasksFromList(id, token, proxy)));
        
        results.forEach((result, idx) => {
            if (result.status === 'fulfilled') {
                allApiTasks = [...allApiTasks, ...result.value];
                log(`✅ Lista ${listIds[idx]}: ${result.value.length} tarefas baixadas.`);
            } else {
                log(`❌ Erro na Lista ${listIds[idx]}: ${result.reason?.message}`);
            }
        });
      }
      else if (config.clickupTeamId) {
         log(`Buscando todas as tarefas do Time ${config.clickupTeamId} (pode demorar)...`);
         allApiTasks = await fetchTasksFromTeam(config.clickupTeamId.trim(), token, proxy);
         log(`✅ Total de tarefas brutas: ${allApiTasks.length}`);
      }
  } catch (e: any) {
    throw new Error(`Erro na API: ${e.message}`);
  }
  
  log(`Processando ${allApiTasks.length} tarefas...`);

  // Transform and Normalize
  const tasks: Task[] = [];
  const taskMap = new Map<string, Task>();
  const parentMap = new Map<string, Task[]>();
  const detectedMembers = new Set<string>();

  allApiTasks.forEach(apiTask => {
    const timeEstHours = apiTask.time_estimate ? apiTask.time_estimate / 3600000 : 0;
    const timeLogHours = apiTask.time_spent ? apiTask.time_spent / 3600000 : 0;
    const startDate = apiTask.start_date ? new Date(parseInt(apiTask.start_date)) : null;
    const dueTime = apiTask.due_date ? parseInt(apiTask.due_date) : null;
    const dueDate = dueTime ? new Date(dueTime) : null;
    const dateClosed = apiTask.date_closed ? new Date(parseInt(apiTask.date_closed)) : null;
    
    apiTask.assignees.forEach(a => detectedMembers.add(a.username));
    
    const rawAssignee = apiTask.assignees.map(a => a.username).join(', ');
    const assignee = apiTask.assignees.map(a => normalizeName(a.username, config.nameMappings)).join(' / ');
    
    let status = 'NOVO';
    if (apiTask.status) {
        if (typeof apiTask.status === 'string') status = apiTask.status.toUpperCase();
        else if (typeof apiTask.status === 'object' && (apiTask.status as any).status) status = (apiTask.status as any).status.toUpperCase();
    }
    
    const remaining = timeEstHours - timeLogHours;
    const isOverdue = dueDate ? (dueDate < new Date() && !isCompleted(status)) : false;
    const hasNegativeBudget = remaining < 0 && !isCompleted(status);

    const task: Task = {
      id: apiTask.id,
      name: apiTask.name,
      description: apiTask.description || '',
      status: status,
      priority: apiTask.priority ? (apiTask.priority as any).priority : 'none',
      assignee: assignee || 'Sem Responsável',
      rawAssignee: rawAssignee,
      startDate: startDate,
      dueDate: dueDate,
      dateClosed: dateClosed,
      timeEstimate: timeEstHours,
      timeLogged: timeLogHours,
      remaining: remaining,
      projectName: apiTask.list?.name || 'Geral',
      isSubtask: false,
      subtasks: [],
      tags: apiTask.tags ? apiTask.tags.map(t => t.name) : [],
      isOverdue,
      hasNegativeBudget,
      weeklyDistribution: {}
    };

    if (apiTask.parent) {
      task.isSubtask = true;
      if (!parentMap.has(apiTask.parent)) parentMap.set(apiTask.parent, []);
      parentMap.get(apiTask.parent)?.push(task);
    } else {
      taskMap.set(task.id, task);
      tasks.push(task);
    }
  });

  // Link Subtasks
  parentMap.forEach((subtasks, parentId) => {
    const parent = taskMap.get(parentId);
    if (parent) {
      parent.subtasks = subtasks;
       if (parent.subtasks.length > 0) {
          const subTotalEst = subtasks.reduce((acc, t) => acc + (t.timeEstimate || 0), 0);
          const subTotalLog = subtasks.reduce((acc, t) => acc + (t.timeLogged || 0), 0);
          
          if (!parent.timeEstimate || parent.timeEstimate === 0) parent.timeEstimate = subTotalEst;
          parent.timeLogged = Math.max(parent.timeLogged || 0, subTotalLog);
          parent.remaining = (parent.timeEstimate || 0) - (parent.timeLogged || 0);
          parent.hasNegativeBudget = (parent.remaining || 0) < 0 && !isCompleted(parent.status);
       }
    } else {
      subtasks.forEach(t => { t.isSubtask = false; tasks.push(t); });
    }
  });

  const weekRangeDates = getDynamicWeekRange(tasks);
  const weekStart = weekRangeDates[0];
  const weekEnd = new Date(weekRangeDates[weekRangeDates.length - 1]);
  weekEnd.setHours(23, 59, 59, 999);

  const activeTasks = tasks.filter(t => {
    const isActive = !isCompleted(t.status);
    const isRecentlyCompleted = t.dateClosed && t.dateClosed >= weekStart && t.dateClosed <= weekEnd;
    const hasRelevantSubtasks = t.subtasks?.some(s => {
       const subActive = !isCompleted(s.status);
       const subRecent = s.dateClosed && s.dateClosed >= weekStart && s.dateClosed <= weekEnd;
       return subActive || subRecent;
    });
    return isActive || isRecentlyCompleted || hasRelevantSubtasks;
  });

  const weekDatesStr = weekRangeDates.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

  activeTasks.forEach(t => {
    t.weeklyDistribution = calculateWeeklyDistribution(t, weekRangeDates, config.holidays);
    t.subtasks?.forEach(s => {
        s.weeklyDistribution = calculateWeeklyDistribution(s, weekRangeDates, config.holidays);
    });
  });

  const groupedData: GroupedData[] = [];
  const memberList = config.teamMembers.length > 0 ? config.teamMembers : Array.from(detectedMembers);
  
  memberList.forEach(member => {
    const memberNameDisplay = normalizeName(member, config.nameMappings);
    
    const memberTasks = activeTasks.filter(t => {
      const pCheck = isAssignedToMember(t.rawAssignee || '', member) || isAssignedToMember(t.assignee || '', memberNameDisplay);
      const sCheck = t.subtasks?.some(s => isAssignedToMember(s.rawAssignee || '', member) || isAssignedToMember(s.assignee || '', memberNameDisplay));
      return pCheck || sCheck;
    });

    if (memberTasks.length === 0) return;

    const projectGroups: Record<string, Task[]> = {};
    memberTasks.forEach(t => {
      const pName = t.projectName || 'Geral';
      if (!projectGroups[pName]) projectGroups[pName] = [];
      projectGroups[pName].push(t);
    });

    const projects = Object.keys(projectGroups).map(pName => {
      return {
        name: pName,
        tasks: projectGroups[pName],
        stats: { planned: 0, logged: 0 }
      };
    });

    projects.sort((a, b) => a.name.localeCompare(b.name));

    groupedData.push({
      assignee: memberNameDisplay,
      projects,
      weekDates: weekDatesStr
    });
  });

  const teamMemberMap = new Map<string, TeamMemberData>();
  
  tasks.forEach(t => {
     const assignedTo = t.assignee; 
     const firstAssignee = assignedTo.split(' / ')[0]; 
     
     if (!firstAssignee || firstAssignee === 'Sem Responsável') return;

     if (!teamMemberMap.has(firstAssignee)) {
        teamMemberMap.set(firstAssignee, {
            name: firstAssignee,
            weeklyCapacity: 40,
            urgent: 0, urgentTasks: 0,
            high: 0, highTasks: 0,
            normal: 0, normalTasks: 0,
            low: 0, lowTasks: 0,
            none: 0, noneTasks: 0,
            urgentLogged: 0,
            highLogged: 0,
            normalLogged: 0,
            lowLogged: 0,
            noneLogged: 0,
            totalHours: 0
        });
     }

     const stats = teamMemberMap.get(firstAssignee)!;
     const hours = t.timeEstimate || 0;
     const logged = t.timeLogged || 0;
     
     if (!isCompleted(t.status)) {
        stats.totalHours += hours;
        const p = (t.priority || '').toLowerCase();
        if (p.includes('urgent') || p.includes('0')) { 
            stats.urgent += hours; 
            stats.urgentTasks++; 
            stats.urgentLogged += logged;
        }
        else if (p.includes('high') || p.includes('alta') || p.includes('1')) { 
            stats.high += hours; 
            stats.highTasks++; 
            stats.highLogged += logged;
        }
        else if (p.includes('normal') || p.includes('2')) { 
            stats.normal += hours; 
            stats.normalTasks++; 
            stats.normalLogged += logged;
        }
        else if (p.includes('low') || p.includes('baixa') || p.includes('3')) { 
            stats.low += hours; 
            stats.lowTasks++; 
            stats.lowLogged += logged;
        }
        else { 
            stats.none += hours; 
            stats.noneTasks++; 
            stats.noneLogged += logged;
        }
     }
  });

  const membersData: TeamMemberData[] = Array.from(teamMemberMap.values());

  log('[SERV-CLICK-001] Sincronização concluída com sucesso.');
  return { grouped: groupedData, members: membersData };
};

export const fetchClickUpTasks = async () => { return []; } 
export const transformClickUpData = (tasks: any[]) => { return { grouped: [], members: [] }; }

// ============================================
// V2.0 - NOVAS FUNCIONALIDADES
// ============================================

// --- EXTRACT FILTER METADATA ---
/**
 * @id SERV-CLICK-001.META
 * Extrai metadados únicos das tarefas para popular dropdowns de filtro
 */
export const extractFilterMetadata = (
  rawTasks: ClickUpApiTask[], 
  nameMappings: Record<string, string> = {}
): FilterMetadata => {
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

    // Extract project
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

  console.log(`[SERV-CLICK-001.META] Metadata extracted - Tags: ${tags.size}, Statuses: ${statuses.size}, Projects: ${projects.size}, Assignees: ${assignees.size}`);

  return {
    tags: Array.from(tags).sort(),
    statuses: Array.from(statuses).sort(),
    projects: Array.from(projects).sort(),
    assignees: Array.from(assignees).sort(),
    priorities: Array.from(priorities).sort()
  };
};

// --- CLIENT-SIDE FILTERS ---
/**
 * @id SERV-CLICK-001.FILTER
 * Aplica filtros client-side nas tarefas
 */
const hasTag = (task: ClickUpApiTask, tagName: string): boolean => {
  if (!task.tags || !Array.isArray(task.tags)) return false;
  return task.tags.some(tag => tag.name && tag.name.toLowerCase() === tagName.toLowerCase());
};

export const applyClientSideFilters = (
  rawTasks: ClickUpApiTask[],
  filterConfig: FilterConfig
): ClickUpApiTask[] => {
  const taskPassesFilters = (task: ClickUpApiTask): boolean => {
    // Filter by required tags (OR logic)
    if (filterConfig.requiredTags && filterConfig.requiredTags.length > 0) {
      const hasAtLeastOneTag = filterConfig.requiredTags.some(requiredTag =>
        hasTag(task, requiredTag)
      );
      if (!hasAtLeastOneTag) return false;
    }

    // Filter by excluded tags
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
      const relevantDate = taskDueDate || taskStartDate || taskClosedDate;

      if (relevantDate) {
        if (start && relevantDate < start) return false;
        if (end && relevantDate > end) return false;
      } else {
        if (start || end) return false;
      }
    }

    // Filter by assignees
    if (filterConfig.includedAssignees && filterConfig.includedAssignees.length > 0) {
      const taskAssignees = task.assignees?.map(a => a.username) || [];
      const hasMatchingAssignee = taskAssignees.some(assignee =>
        filterConfig.includedAssignees!.includes(assignee)
      );
      const isUnassigned = taskAssignees.length === 0;
      const allowUnassigned = filterConfig.includeUnassigned && isUnassigned;
      if (!hasMatchingAssignee && !allowUnassigned) return false;
    }

    // Filter by projects
    if (filterConfig.includedProjects && filterConfig.includedProjects.length > 0) {
      const taskProject = task.list?.name || '';
      if (!filterConfig.includedProjects.includes(taskProject)) return false;
    }

    return true;
  };

  const filtered = rawTasks.filter(taskPassesFilters);
  console.log(`[SERV-CLICK-001.FILTER] Applied filters: ${rawTasks.length} -> ${filtered.length} tasks`);
  return filtered;
};

// --- RAW DATA FETCHER WITH INCREMENTAL SUPPORT ---
/**
 * @id SERV-CLICK-001.RAW
 * Busca dados brutos da API com suporte a sync incremental
 */
export const fetchRawClickUpData = async (
  config: AppConfig, 
  incrementalSince?: string
): Promise<ClickUpApiTask[]> => {
  if (!config.clickupApiToken) {
    throw new Error("Missing ClickUp API Token");
  }

  const token = config.clickupApiToken.replace(/\s/g, '');
  const proxy = config.corsProxy?.trim();

  // OPTION 1: Fetch from Team/Space (preferred)
  if (config.clickupTeamId && config.clickupTeamId.trim()) {
    console.log(`🌐 [SERV-CLICK-001.RAW] Fetching from Team/Space: ${config.clickupTeamId}`);
    
    if (incrementalSince) {
      console.log(`🔄 [SERV-CLICK-001.RAW] Incremental sync - only tasks updated after ${incrementalSince}`);
    }
    
    return await fetchTasksFromTeamIncremental(
      config.clickupTeamId.trim(), 
      token, 
      proxy, 
      incrementalSince
    );
  }

  // OPTION 2: Fetch from View
  if (config.clickupViewId && config.clickupViewId.trim()) {
    console.log(`📋 [SERV-CLICK-001.RAW] Fetching from View: ${config.clickupViewId}`);
    return await fetchTasksFromView(config.clickupViewId, token, proxy);
  }

  // OPTION 3: Fetch from individual Lists
  if (config.clickupListIds) {
    console.log(`📋 [SERV-CLICK-001.RAW] Fetching from Lists: ${config.clickupListIds}`);
    const listIds = config.clickupListIds.split(',').map(s => s.trim()).filter(Boolean);
    let allApiTasks: ClickUpApiTask[] = [];
    
    for (const listId of listIds) {
      const tasks = await fetchTasksFromList(listId, token, proxy);
      allApiTasks = [...allApiTasks, ...tasks];
    }
    
    console.log(`✅ [SERV-CLICK-001.RAW] Total tasks fetched: ${allApiTasks.length}`);
    return allApiTasks;
  }

  throw new Error("Missing ClickUp Team ID, View ID or List IDs");
};

// --- TEAM FETCH WITH INCREMENTAL SUPPORT ---
const fetchTasksFromTeamIncremental = async (
  teamId: string,
  token: string,
  proxyUrl?: string,
  dateUpdatedAfter?: string
): Promise<ClickUpApiTask[]> => {
  let page = 0;
  let allTasks: ClickUpApiTask[] = [];
  let keepFetching = true;
  const MAX_PAGES = 50;

  while (keepFetching && page < MAX_PAGES) {
    let baseUrl = `https://api.clickup.com/api/v2/team/${teamId}/task?subtasks=true&include_closed=true&page=${page}`;
    
    // Add incremental filter
    if (dateUpdatedAfter) {
      const timestamp = new Date(dateUpdatedAfter).getTime();
      baseUrl += `&date_updated_gt=${timestamp}`;
    }

    console.log(`   [SERV-CLICK-001.RAW] Fetching page ${page}${dateUpdatedAfter ? ' (incremental)' : ''}...`);
    
    const data = await fetchWithFallback(baseUrl, token, proxyUrl);
    
    if (data.tasks && data.tasks.length > 0) {
      allTasks = [...allTasks, ...data.tasks];
      page++;
    } else {
      keepFetching = false;
    }
  }

  if (page >= MAX_PAGES) {
    console.warn(`⚠️ [SERV-CLICK-001.RAW] Reached maximum page limit (${MAX_PAGES})`);
  }

  console.log(`✅ [SERV-CLICK-001.RAW] Total tasks from Team: ${allTasks.length}`);
  return allTasks;
};

// --- STANDUP SUMMARIES ---
/**
 * @id SERV-CLICK-001.STANDUP
 * Busca resumos de standup da view de comentários
 */
interface StandupFetchOptions {
  limit?: number;
  forDate?: Date;
  startDate?: Date;
  endDate?: Date;
}

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10);

export const fetchStandupSummaries = async (
  config: AppConfig,
  options: StandupFetchOptions = {}
): Promise<StandupEntry[]> => {
  if (!config.clickupApiToken) {
    throw new Error('Missing ClickUp API Token');
  }

  if (!config.clickupStandupViewId) {
    console.warn('[SERV-CLICK-001.STANDUP] No Standup View ID configured');
    return [];
  }

  const token = config.clickupApiToken.replace(/\s/g, '');
  const viewId = config.clickupStandupViewId.trim();
  const proxy = config.corsProxy?.trim();

  console.log(`📝 [SERV-CLICK-001.STANDUP] Fetching standups from view ${viewId}...`);

  const url = `https://api.clickup.com/api/v2/view/${viewId}/comment`;
  const data = await fetchWithFallback(url, token, proxy);

  const rawComments = Array.isArray(data?.comments) ? data.comments : [];
  let entries = rawComments
    .map((comment: any) => parseStandupComment(comment, config))
    .filter((entry: StandupEntry | null): entry is StandupEntry => Boolean(entry));

  entries.sort((a: StandupEntry, b: StandupEntry) => 
    new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()
  );

  if (options.forDate) {
    const key = toDateKey(options.forDate);
    entries = entries.filter((entry: StandupEntry) => entry.dateKey === key);
  } else {
    if (options.startDate) {
      const startMs = options.startDate.setHours(0, 0, 0, 0);
      entries = entries.filter((entry: StandupEntry) => new Date(entry.dateIso).getTime() >= startMs);
    }
    if (options.endDate) {
      const endMs = options.endDate.setHours(23, 59, 59, 999);
      entries = entries.filter((entry: StandupEntry) => new Date(entry.dateIso).getTime() <= endMs);
    }
  }

  if (options.limit && options.limit > 0) {
    entries = entries.slice(0, options.limit);
  }

  console.log(`✅ [SERV-CLICK-001.STANDUP] Found ${entries.length} standup entries`);
  return entries;
};

// --- STANDUP COMMENT PARSER ---
const parseStandupComment = (comment: any, config: AppConfig): StandupEntry | null => {
  if (!comment || !comment.id || !comment.date) return null;

  const timestamp = Number(comment.date);
  if (!Number.isFinite(timestamp)) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  let content = '';
  if (typeof comment.comment_text === 'string' && comment.comment_text.trim().length > 0) {
    content = comment.comment_text.replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ').trim();
  } else if (Array.isArray(comment.comment)) {
    content = comment.comment
      .map((block: any) => (typeof block?.text === 'string' ? block.text : ''))
      .join('')
      .replace(/\r\n/g, '\n')
      .replace(/\u00A0/g, ' ')
      .trim();
  }

  if (!content) return null;

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

  return {
    id: String(comment.id),
    dateIso: date.toISOString(),
    dateKey: toDateKey(date),
    title: title.trim(),
    content,
    author,
    taskMentions,
    sections: []
  };
};

// --- FETCH SINGLE TASK ---
/**
 * @id SERV-CLICK-001.SINGLE
 * Busca uma tarefa específica pelo ID
 */
export const fetchTaskById = async (taskId: string, config: AppConfig): Promise<ClickUpApiTask | null> => {
  if (!config.clickupApiToken) {
    console.warn('[SERV-CLICK-001.SINGLE] No API token configured');
    return null;
  }

  const token = config.clickupApiToken.replace(/\s/g, '');
  const proxy = config.corsProxy?.trim();
  
  const cleanTaskId = taskId.includes('/') ? taskId.split('/').pop()! : taskId;
  
  try {
    const targetUrl = `https://api.clickup.com/api/v2/task/${cleanTaskId}`;
    console.log(`🔍 [SERV-CLICK-001.SINGLE] Fetching task ${cleanTaskId}...`);
    
    const data = await fetchWithFallback(targetUrl, token, proxy);
    return data as ClickUpApiTask;
  } catch (error) {
    console.warn(`[SERV-CLICK-001.SINGLE] Failed to fetch task ${cleanTaskId}:`, error);
    return null;
  }
};

// --- CHECK FULL COMPLETION ---
/**
 * @id SERV-CLICK-001.COMPLETE
 * Verifica se uma tarefa está completamente concluída (incluindo subtarefas)
 */
export function isTaskFullyCompleted(task: Task): boolean {
  const taskCompleted = task.status.toUpperCase().includes('CONCLU') ||
    task.status.toUpperCase().includes('COMPLETE') ||
    task.status.toUpperCase().includes('DONE') ||
    task.status.toUpperCase().includes('FECHADO');

  if (!taskCompleted) return false;

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