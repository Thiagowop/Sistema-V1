import React, { useState, useMemo, useEffect } from 'react';
import { GroupedData, AppConfig, Task, StandupEntry } from '../types';
import TaskTable from './TaskTable';
import { 
  User, 
  Layers, 
  CalendarRange, 
  Briefcase, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  BarChart3,
  Users,
  Target,
  ChevronRight,
  ChevronDown,
  MessageSquareText,
  ExternalLink,
  RefreshCw,
  LayoutDashboard,
  Activity,
  Download
} from 'lucide-react';
import { ClickUpApiTask, fetchTaskById } from '../services/clickup';

interface DashboardProps {
  data: GroupedData[];
  config: AppConfig;
  viewMode: 'projects' | 'alignment';
  rawData?: ClickUpApiTask[] | null;
  standupEntries?: StandupEntry[];
  standupFetched?: boolean;
  standupLoading?: boolean;
  onStandupSync?: () => void;
  onRefresh?: () => void;
}

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}> = ({ title, value, subtitle, icon, trend, color }) => {
  const colorClasses = {
    blue: 'from-sky-500 to-blue-600',
    green: 'from-emerald-500 to-green-600',
    orange: 'from-amber-500 to-orange-600',
    red: 'from-rose-500 to-red-600',
    purple: 'from-violet-500 to-purple-600',
  };

  const bgClasses = {
    blue: 'bg-sky-50',
    green: 'bg-emerald-50',
    orange: 'bg-amber-50',
    red: 'bg-rose-50',
    purple: 'bg-violet-50',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${bgClasses[color]}`}>
          <div className={`bg-gradient-to-br ${colorClasses[color]} bg-clip-text text-transparent`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.positive && 'rotate-180'}`} />
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

type StatusCategory = 'completed' | 'inProgress' | 'pending' | 'blocked';
type ManagementTabKey = 'overview' | 'team' | 'projects' | 'sprints' | 'deadlines';

const flattenTaskWithSubtasks = (task: Task): Task[] => {
  const tasks: Task[] = [task];
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach(sub => {
      tasks.push(...flattenTaskWithSubtasks(sub));
    });
  }
  return tasks;
};

const collectProjectTasks = (project: { tasks: Task[] }): Task[] => {
  const all: Task[] = [];
  project.tasks.forEach(task => {
    all.push(...flattenTaskWithSubtasks(task));
  });
  return all;
};

const categorizeStatus = (status: string): StatusCategory => {
  const normalized = status.toLowerCase();
  if (normalized.includes('conclu') || normalized.includes('done') || normalized.includes('complete') || normalized.includes('finaliz')) {
    return 'completed';
  }
  if (normalized.includes('atras') || normalized.includes('overdue') || normalized.includes('bloque') || normalized.includes('blocked')) {
    return 'blocked';
  }
  if (normalized.includes('andamento') || normalized.includes('progress') || normalized.includes('working')) {
    return 'inProgress';
  }
  return 'pending';
};

const getWeekStartIso = (date: Date): string => {
  const base = new Date(date);
  if (Number.isNaN(base.getTime())) return '';
  base.setHours(0, 0, 0, 0);
  const day = base.getDay();
  const diff = (day + 6) % 7;
  base.setDate(base.getDate() - diff);
  return base.toISOString().slice(0, 10);
};

const formatWeekLabel = (iso: string) => {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const formatDueDate = (value: Date | null) => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return 'Sem prazo';
  return value.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// Team Member Card for Management View
const TeamMemberCard: React.FC<{
  name: string;
  projects: { name: string; tasks: Task[] }[];
  isSelected: boolean;
  onClick: () => void;
}> = ({ name, projects, isSelected, onClick }) => {
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = projects.reduce((acc, p) => 
    acc + p.tasks.filter(t => 
      t.status.toLowerCase().includes('conclu') || 
      t.status.toLowerCase().includes('done') ||
      t.status.toLowerCase().includes('complete')
    ).length, 0
  );
  const totalHours = projects.reduce((acc, p) => 
    acc + p.tasks.reduce((sum, t) => sum + t.timeEstimate, 0), 0
  );
  const loggedHours = projects.reduce((acc, p) => 
    acc + p.tasks.reduce((sum, t) => sum + t.timeLogged, 0), 0
  );
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-2xl border-2 transition-all duration-200
        ${isSelected 
          ? 'border-sky-500 bg-sky-50 shadow-lg shadow-sky-500/10' 
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
          ${isSelected 
            ? 'bg-gradient-to-br from-sky-500 to-blue-600 text-white' 
            : 'bg-slate-100 text-slate-600'
          }
        `}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{name}</h3>
          <p className="text-xs text-slate-500">{projects.length} projetos • {totalTasks} tarefas</p>
        </div>
        <ChevronRight className={`w-5 h-5 ${isSelected ? 'text-sky-500' : 'text-slate-300'}`} />
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Progresso</span>
          <span className="font-medium text-slate-700">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-sky-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="bg-slate-50 rounded-lg px-2 py-1.5">
          <p className="text-[10px] text-slate-400 uppercase">Planejado</p>
          <p className="text-sm font-semibold text-slate-700">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-slate-50 rounded-lg px-2 py-1.5">
          <p className="text-[10px] text-slate-400 uppercase">Registrado</p>
          <p className="text-sm font-semibold text-slate-700">{loggedHours.toFixed(1)}h</p>
        </div>
      </div>
    </button>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ data, config, viewMode, rawData, standupEntries, standupFetched = false, standupLoading = false, onStandupSync, onRefresh }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showParentTasks, setShowParentTasks] = useState(true);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [selectedStandupId, setSelectedStandupId] = useState<string | null>(null);
  const [showStandupTasks, setShowStandupTasks] = useState(false);
  const [fetchedTasks, setFetchedTasks] = useState<Map<string, ClickUpApiTask>>(new Map());
  const [managementTab, setManagementTab] = useState<ManagementTabKey>('overview');
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  const standupSummaries = useMemo(() => {
    if (!Array.isArray(standupEntries) || standupEntries.length === 0) {
      return [] as StandupEntry[];
    }
    return [...standupEntries].sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
  }, [standupEntries]);

  useEffect(() => {
    if (standupSummaries.length === 0) {
      setSelectedStandupId(null);
      return;
    }

    setSelectedStandupId(prev => {
      if (prev && standupSummaries.some(entry => entry.id === prev)) {
        return prev;
      }
      return standupSummaries[0].id;
    });
  }, [standupSummaries]);

  const activeStandup = useMemo(() => {
    if (standupSummaries.length === 0) return null;
    if (selectedStandupId) {
      return standupSummaries.find(entry => entry.id === selectedStandupId) || standupSummaries[0];
    }
    return standupSummaries[0];
  }, [standupSummaries, selectedStandupId]);

  useEffect(() => {
    setShowStandupTasks(false);
  }, [activeStandup?.id]);

  useEffect(() => {
    if (viewMode === 'management2') {
      setManagementTab('overview');
    }
  }, [viewMode]);

  const taskNameLookup = useMemo(() => {
    const lookup = new Map<string, { name: string; parentName?: string }>();
    if (!rawData) return lookup;

    const teamPrefix = config.clickupTeamId?.trim();

    // Add tasks from rawData
    rawData.forEach(task => {
      const id = String(task.id || '').trim();
      if (!id) return;
      const name = String(task.name || '').trim();
      if (!name) return;
      const parentId = (task as any)?.parent ? String((task as any).parent).trim() : undefined;
      let parentName: string | undefined;
      if (parentId) {
        const parentTask = rawData.find(t => String(t.id) === parentId);
        if (parentTask?.name) {
          parentName = String(parentTask.name);
        }
      }

      const entry = { name, parentName };

      lookup.set(id.toLowerCase(), entry);
      if (teamPrefix) {
        lookup.set(`${teamPrefix}/${id}`.toLowerCase(), entry);
      }
      const customId = (task as any)?.custom_id;
      if (customId) {
        lookup.set(String(customId).toLowerCase(), entry);
      }
    });

    // Add fetched tasks
    fetchedTasks.forEach((task, taskId) => {
      const id = String(task.id || taskId).trim();
      const name = String(task.name || '').trim();
      if (!name) return;
      
      const entry = { name, parentName: undefined };
      lookup.set(id.toLowerCase(), entry);
      if (teamPrefix) {
        lookup.set(`${teamPrefix}/${id}`.toLowerCase(), entry);
      }
    });

    return lookup;
  }, [rawData, config.clickupTeamId, fetchedTasks]);

  // Fetch missing tasks when standup changes
  useEffect(() => {
    if (!activeStandup || !config.clickupApiToken) return;

    const missingTaskIds = new Set<string>();
    
    activeStandup.taskMentions.forEach(mention => {
      const taskId = mention.taskId;
      const slug = mention.slug;
      
      // Check if task is not in lookup
      if (!taskNameLookup.has(taskId.toLowerCase()) && 
          !taskNameLookup.has(slug.toLowerCase()) &&
          !fetchedTasks.has(taskId)) {
        // Extract clean ID
        const cleanId = taskId.includes('/') ? taskId.split('/').pop()! : taskId;
        missingTaskIds.add(cleanId);
      }
    });

    if (missingTaskIds.size === 0) return;

    console.log(`🔍 Fetching ${missingTaskIds.size} missing tasks...`);
    
    // Fetch all missing tasks
    Promise.all(
      Array.from(missingTaskIds).map(async (taskId) => {
        const task = await fetchTaskById(taskId, config);
        return { taskId, task };
      })
    ).then(results => {
      const newFetchedTasks = new Map(fetchedTasks);
      results.forEach(({ taskId, task }) => {
        if (task) {
          newFetchedTasks.set(taskId, task);
          console.log(`✅ Fetched task: ${task.name}`);
        }
      });
      setFetchedTasks(newFetchedTasks);
    });
  }, [activeStandup, taskNameLookup, config, fetchedTasks]);

  const mentionLookup = useMemo(() => {
    const map = new Map<string, {
      displayName: string;
      url: string;
      slug: string;
      original: string;
      parentName?: string;
    }>();

    if (!activeStandup) return map;

    const register = (token: string | null | undefined, payload: { displayName: string; url: string; slug: string; original: string; parentName?: string }) => {
      if (!token) return;
      map.set(token.toLowerCase(), payload);
    };

    activeStandup.taskMentions.forEach(mention => {
      const slug = mention.slug || mention.taskId;
      const lowerSlug = slug.toLowerCase();
      const labelLower = mention.label ? mention.label.toLowerCase() : null;

      const lookupEntry = taskNameLookup.get(lowerSlug)
        || taskNameLookup.get(mention.taskId.toLowerCase())
        || (labelLower ? taskNameLookup.get(labelLower) : undefined);

      let displayName = lookupEntry?.name;

      if (!displayName && labelLower) {
        displayName = Array.from(taskNameLookup.entries()).find(([key]) => key.includes(labelLower))?.[1].name;
      }

      if (!displayName) {
        const words = (mention.label || slug).split(/[\s\-_/]+/).filter(Boolean);
        if (words.some(word => taskNameLookup.has(word.toLowerCase()))) {
          const wordKey = words.map(word => word.toLowerCase()).find(word => taskNameLookup.has(word));
          if (wordKey) {
            displayName = taskNameLookup.get(wordKey)?.name;
          }
        }
      }

      displayName ||= mention.label || slug;

      const payload = {
        displayName,
        url: mention.url,
        slug,
        original: mention.taskId,
        parentName: lookupEntry?.parentName
      };

      register(mention.taskId, payload);
      register(mention.label, payload);
      register(mention.slug, payload);
      if (mention.taskId.includes('/')) {
        const shortId = mention.taskId.split('/').pop();
        register(shortId, payload);
        if (shortId) {
          register(shortId.replace(/[^a-zA-Z0-9]/g, ''), payload);
        }
      }
      register(slug.replace(/[^a-zA-Z0-9]/g, ''), payload);
    });

    return map;
  }, [activeStandup, taskNameLookup]);

  const mentionRegex = useMemo(() => {
    const tokens = Array.from(mentionLookup.keys()).filter((token): token is string => Boolean(token));
    if (tokens.length === 0) return null;
    tokens.sort((a, b) => b.length - a.length);

    const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  }, [mentionLookup]);

  const standupTaskDetails = useMemo(() => {
    if (!activeStandup) return [] as { key: string; name: string; url: string; parentName?: string }[];

    const seen = new Set<string>();
    return activeStandup.taskMentions.map(mention => {
      const candidateKeys = [mention.slug, mention.taskId, mention.label].filter(Boolean).map(token => token!.toLowerCase());
      const lookupKey = candidateKeys.find(key => mentionLookup.has(key));
      const data = lookupKey ? mentionLookup.get(lookupKey)! : null;
      const uniqueKey = (mention.slug || mention.taskId).toLowerCase();
      if (seen.has(uniqueKey)) return null;
      seen.add(uniqueKey);
      return {
        key: mention.taskId,
        name: data?.displayName || mention.label || mention.slug,
        url: mention.url,
        parentName: data?.parentName
      };
    }).filter(Boolean) as { key: string; name: string; url: string; parentName?: string }[];
  }, [activeStandup, mentionLookup]);

  // Calculate global metrics
  const metrics = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let totalHoursPlanned = 0;
    let totalHoursLogged = 0;
    let overdueTasks = 0;

    data.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          totalTasks++;
          totalHoursPlanned += task.timeEstimate;
          totalHoursLogged += task.timeLogged;
          
          const statusLower = task.status.toLowerCase();
          if (statusLower.includes('conclu') || statusLower.includes('done') || statusLower.includes('complete')) {
            completedTasks++;
          }
          if (task.isOverdue) overdueTasks++;

          task.subtasks?.forEach(sub => {
            totalTasks++;
            totalHoursPlanned += sub.timeEstimate;
            totalHoursLogged += sub.timeLogged;
            const subStatus = sub.status.toLowerCase();
            if (subStatus.includes('conclu') || subStatus.includes('done') || subStatus.includes('complete')) {
              completedTasks++;
            }
            if (sub.isOverdue) overdueTasks++;
          });
        });
      });
    });

    return {
      totalTasks,
      completedTasks,
      totalHoursPlanned,
      totalHoursLogged,
      overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-lg font-medium text-slate-600">Nenhuma tarefa encontrada</p>
        <p className="text-sm text-slate-400 mt-1">Ajuste os filtros ou sincronize novamente</p>
      </div>
    );
  }

  // Sort data according to config order or default
  const sortedData = useMemo(() => {
    const teamOrder = config.teamMemberOrder || ['Brozinga', 'Soares', 'Paresqui', 'Thiago', 'Alvaro', 'Rafael', 'Pedro'];
    const orderMap = new Map<string, number>(teamOrder.map((name, index) => [name, index]));
    
    return [...data].sort((a, b) => {
      const nameA = a.assignee.trim();
      const nameB = b.assignee.trim();
      
      let orderA: number | undefined = orderMap.get(nameA);
      if (orderA === undefined) {
        const keyA = Array.from(orderMap.keys()).find(k => nameA.includes(k) || k.includes(nameA));
        orderA = keyA !== undefined ? orderMap.get(keyA) : 999;
      }

      let orderB: number | undefined = orderMap.get(nameB);
      if (orderB === undefined) {
        const keyB = Array.from(orderMap.keys()).find(k => nameB.includes(k) || k.includes(nameB));
        orderB = keyB !== undefined ? orderMap.get(keyB) : 999;
      }

      return (orderA ?? 999) - (orderB ?? 999);
    });
  }, [data, config.teamMemberOrder]);

  const management2Aggregates = useMemo(() => {
    const teamMap = new Map<string, {
      member: string;
      total: number;
      completed: number;
      inProgress: number;
      blocked: number;
      overdue: number;
      planned: number;
      logged: number;
    }>();

    const projectMap = new Map<string, {
      name: string;
      assignees: Set<string>;
      total: number;
      completed: number;
      inProgress: number;
      blocked: number;
      pending: number;
      overdue: number;
      planned: number;
      logged: number;
    }>();

    const statusTotals: Record<StatusCategory, number> = {
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
    };

    const weeklyVelocityMap = new Map<string, { completed: number; inProgress: number; hours: number }>();
    const allTasks: Task[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);
    const threeDaysAhead = new Date(now);
    threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

    const upcoming: Task[] = [];
    const upcomingSet = new Set<string>();
    const critical: Task[] = [];
    const criticalSet = new Set<string>();
    const overdue: Task[] = [];
    const overdueSet = new Set<string>();

    let totalPlanned = 0;
    let totalLogged = 0;

    const pushUnique = (bucket: Task[], seen: Set<string>, task: Task) => {
      if (!seen.has(task.id)) {
        seen.add(task.id);
        bucket.push(task);
      }
    };

    sortedData.forEach(group => {
      group.projects.forEach(project => {
        const projectKey = project.name || 'Sem projeto';
        if (!projectMap.has(projectKey)) {
          projectMap.set(projectKey, {
            name: projectKey,
            assignees: new Set<string>(),
            total: 0,
            completed: 0,
            inProgress: 0,
            blocked: 0,
            pending: 0,
            overdue: 0,
            planned: 0,
            logged: 0,
          });
        }

        const projectEntry = projectMap.get(projectKey)!;
        const projectOwner = group.assignee?.trim() || 'Sem responsável';
        projectEntry.assignees.add(projectOwner);

        const flattenedTasks = collectProjectTasks(project);

        flattenedTasks.forEach(task => {
          const taskOwner = (task.assignee?.trim() || group.assignee || 'Sem responsável').trim();
          if (!teamMap.has(taskOwner)) {
            teamMap.set(taskOwner, {
              member: taskOwner,
              total: 0,
              completed: 0,
              inProgress: 0,
              blocked: 0,
              overdue: 0,
              planned: 0,
              logged: 0,
            });
          }

          const teamEntry = teamMap.get(taskOwner)!;

          const statusCategory = categorizeStatus(task.status);

          allTasks.push(task);
          totalPlanned += task.timeEstimate;
          totalLogged += task.timeLogged;

          projectEntry.total += 1;
          projectEntry.planned += task.timeEstimate;
          projectEntry.logged += task.timeLogged;

          teamEntry.total += 1;
          teamEntry.planned += task.timeEstimate;
          teamEntry.logged += task.timeLogged;

          statusTotals[statusCategory] += 1;

          switch (statusCategory) {
            case 'completed':
              projectEntry.completed += 1;
              teamEntry.completed += 1;
              break;
            case 'blocked':
              projectEntry.blocked += 1;
              teamEntry.blocked += 1;
              break;
            case 'inProgress':
              projectEntry.inProgress += 1;
              teamEntry.inProgress += 1;
              break;
            case 'pending':
              projectEntry.pending += 1;
              break;
            default:
              break;
          }

          if (task.isOverdue) {
            projectEntry.overdue += 1;
            teamEntry.overdue += 1;
            pushUnique(overdue, overdueSet, task);
          }

          if (task.dueDate instanceof Date) {
            const dueTime = task.dueDate.getTime();
            if (!Number.isNaN(dueTime) && statusCategory !== 'completed') {
              if (dueTime < now.getTime()) {
                pushUnique(overdue, overdueSet, task);
              } else if (dueTime <= threeDaysAhead.getTime()) {
                pushUnique(critical, criticalSet, task);
                pushUnique(upcoming, upcomingSet, task);
              } else if (dueTime <= weekAhead.getTime()) {
                pushUnique(upcoming, upcomingSet, task);
              }
            }
          }

          if (task.dateClosed instanceof Date && !Number.isNaN(task.dateClosed.getTime())) {
            const weekKey = getWeekStartIso(task.dateClosed);
            if (weekKey) {
              if (!weeklyVelocityMap.has(weekKey)) {
                weeklyVelocityMap.set(weekKey, { completed: 0, inProgress: 0, hours: 0 });
              }
              const weekEntry = weeklyVelocityMap.get(weekKey)!;
              weekEntry.completed += 1;
              weekEntry.hours += task.timeLogged;
            }
          } else if (task.startDate instanceof Date && !Number.isNaN(task.startDate.getTime())) {
            const weekKey = getWeekStartIso(task.startDate);
            if (weekKey) {
              if (!weeklyVelocityMap.has(weekKey)) {
                weeklyVelocityMap.set(weekKey, { completed: 0, inProgress: 0, hours: 0 });
              }
              const weekEntry = weeklyVelocityMap.get(weekKey)!;
              weekEntry.inProgress += 1;
            }
          }
        });
      });
    });

    const totalTasks = allTasks.length;
    const completedTasks = statusTotals.completed;

    const focusAreas = Object.entries(statusTotals)
      .filter(([status]) => status !== 'completed')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([status, count]) => ({
        status: status as StatusCategory,
        count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      }));

    const weeklyVelocity = Array.from(weeklyVelocityMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([weekKey, stats]) => ({
        weekKey,
        label: formatWeekLabel(weekKey),
        completed: stats.completed,
        inProgress: stats.inProgress,
        hours: stats.hours,
      }));

    const criticalIds = new Set(critical.map(task => task.id));
    const upcomingOnly = upcoming.filter(task => !criticalIds.has(task.id));

    return {
      overview: {
        activeProjects: projectMap.size,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        blockedTasks: statusTotals.blocked,
        inProgressTasks: statusTotals.inProgress,
        pendingTasks: statusTotals.pending,
        totalPlanned,
        totalLogged,
        focusAreas,
      },
      team: Array.from(teamMap.values()).map(entry => ({
        ...entry,
        completionRate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
        utilization: entry.planned > 0 ? Math.round((entry.logged / entry.planned) * 100) : 0,
      })).sort((a, b) => b.total - a.total),
      projects: Array.from(projectMap.values()).map(entry => ({
        name: entry.name,
        assignees: Array.from(entry.assignees),
        totalTasks: entry.total,
        completed: entry.completed,
        inProgress: entry.inProgress,
        blocked: entry.blocked,
        pending: entry.pending,
        overdue: entry.overdue,
        planned: entry.planned,
        logged: entry.logged,
        completionRate: entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0,
        burn: entry.planned > 0 ? Math.round((entry.logged / entry.planned) * 100) : 0,
      })).sort((a, b) => b.totalTasks - a.totalTasks),
      weeklyVelocity,
      deadlineWatchlist: {
        upcoming: upcomingOnly.sort((a, b) => {
          const timeA = a.dueDate instanceof Date ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
          const timeB = b.dueDate instanceof Date ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
          return timeA - timeB;
        }),
        critical: critical.sort((a, b) => {
          const timeA = a.dueDate instanceof Date ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
          const timeB = b.dueDate instanceof Date ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
          return timeA - timeB;
        }),
        overdue: overdue.sort((a, b) => {
          const timeA = a.dueDate instanceof Date ? a.dueDate.getTime() : Number.POSITIVE_INFINITY;
          const timeB = b.dueDate instanceof Date ? b.dueDate.getTime() : Number.POSITIVE_INFINITY;
          return timeA - timeB;
        }),
      },
    };
  }, [sortedData]);

  const getWeekTasks = (allProjects: { tasks: Task[] }[]): Task[] => {
    let weekTasks: Task[] = [];
    allProjects.forEach(proj => {
      proj.tasks.forEach(task => {
        weekTasks.push(task);
      });
    });
    return Array.from(new Set(weekTasks));
  };

  // Toggle Component
  const Toggle: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
    <button
      onClick={onChange}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors"
    >
      <div className={`w-8 h-5 rounded-full transition-colors relative ${checked ? 'bg-sky-500' : 'bg-slate-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </button>
  );

  // Daily View (Projects)
  const renderDailyView = () => {
    const selectedGroup = sortedData[selectedIndex];
    if (!selectedGroup) return null;

    return (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl text-white shadow-lg shadow-sky-500/25">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-lg">Alinhamento Diário</h2>
              </div>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="ml-2 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 transition-colors group"
                  title="Atualizar dados do ClickUp"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {sortedData.map((group, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`
                    whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${selectedIndex === idx
                      ? 'bg-slate-800 text-white shadow-lg'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }
                  `}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedIndex === idx ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  {group.assignee}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            <Toggle label="Tarefas" checked={showParentTasks} onChange={() => setShowParentTasks(!showParentTasks)} />
            <Toggle label="Subtarefas" checked={showSubtasks} onChange={() => setShowSubtasks(!showSubtasks)} />
            <Toggle label="Concluídas" checked={showCompleted} onChange={() => setShowCompleted(!showCompleted)} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-sky-500/25">
                {selectedGroup.assignee.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800">{selectedGroup.assignee}</h3>
                <p className="text-sm text-slate-500">{selectedGroup.projects.length} projetos ativos</p>
              </div>
            </div>

            {/* Projects Section FIRST */}
            {(() => {
              const taskGroups = config.taskGroups || [];
              const allTasks = selectedGroup.projects.flatMap(p => p.tasks);
              const usedTaskIds = new Set<string>();
              
              // Pre-calculate which tasks belong to groups
              taskGroups.forEach(group => {
                const groupTags = group.tags.map(t => t.toLowerCase());
                allTasks.forEach(task => {
                  if (usedTaskIds.has(task.id)) return;
                  const taskTags = (task.tags || []).map(t => t.toLowerCase());
                  if (taskTags.some(tag => groupTags.includes(tag))) {
                    usedTaskIds.add(task.id);
                  }
                });
              });
              
              return (
                <>
                  {/* Projects Section - only tasks NOT in any group */}
                  {selectedGroup.projects.map((project) => {
                    const projectSpecificTasks = project.tasks.filter(task => !usedTaskIds.has(task.id));
                    let filteredTasks = projectSpecificTasks.filter(task => {
                      const statusLower = task.status.toLowerCase();
                      const isCompleted = statusLower.includes('conclu') || statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('finalizado');
                      const isSubtask = task.isSubtask;
                      const isParentTask = !task.isSubtask;

                      if (isCompleted && !showCompleted) return false;
                      if (isParentTask && !showParentTasks) return false;
                      if (isSubtask && !showSubtasks) return false;

                      return true;
                    });

                    if (filteredTasks.length === 0) return null;

                    return (
                      <div key={project.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-6 overflow-hidden animate-fade-in-up">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-3 flex items-center justify-between">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-sky-400" />
                      {project.name}
                    </h4>
                    <span className="text-xs text-slate-300 bg-slate-600/50 px-2 py-1 rounded-full">
                      {filteredTasks.length} tarefas
                    </span>
                  </div>
                  <TaskTable
                    tasks={filteredTasks}
                    weekDates={selectedGroup.weekDates}
                    holidays={config.holidays}
                    showDailyGrid={false}
                    variant="default"
                    showCompleted={showCompleted}
                    showSubtasks={showSubtasks}
                    hideAdditionalColumns={true}
                  />
                </div>
                );
              })}

              {/* Task Groups Section - AFTER projects */}
              {taskGroups.map((group, idx) => {
                const groupTags = group.tags.map(t => t.toLowerCase());
                const groupTaskIds = new Set<string>();
                
                // Find tasks matching this group's tags (OR behavior)
                const groupTasks = allTasks.filter(task => {
                  const taskTags = (task.tags || []).map(t => t.toLowerCase());
                  const matches = taskTags.some(tag => groupTags.includes(tag));
                  if (matches && !groupTaskIds.has(task.id)) {
                    groupTaskIds.add(task.id);
                    return true;
                  }
                  return false;
                });
                
                // Apply filters
                const filteredGroupTasks = groupTasks.filter(task => {
                  const statusLower = task.status.toLowerCase();
                  const isCompleted = statusLower.includes('conclu') || statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('finalizado');
                  const isSubtask = task.isSubtask;
                  const isParentTask = !task.isSubtask;

                  if (isCompleted && !showCompleted) return false;
                  if (isParentTask && !showParentTasks) return false;
                  if (isSubtask && !showSubtasks) return false;

                  return true;
                });
                
                if (filteredGroupTasks.length === 0) return null;
                
                // Color mapping
                const colorMap: Record<string, any> = {
                  amber: { from: 'from-amber-500', to: 'to-orange-600', border: 'border-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', badge: 'bg-amber-100' },
                  emerald: { from: 'from-emerald-500', to: 'to-green-600', border: 'border-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', badge: 'bg-emerald-100' },
                  violet: { from: 'from-violet-500', to: 'to-purple-600', border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100' },
                  blue: { from: 'from-blue-500', to: 'to-indigo-600', border: 'border-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100' },
                  rose: { from: 'from-rose-500', to: 'to-red-600', border: 'border-rose-200', bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100' },
                  slate: { from: 'from-slate-500', to: 'to-slate-600', border: 'border-slate-200', bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100' },
                  sky: { from: 'from-sky-500', to: 'to-cyan-600', border: 'border-sky-200', bg: 'bg-sky-50', text: 'text-sky-700', badge: 'bg-sky-100' },
                  pink: { from: 'from-pink-500', to: 'to-rose-600', border: 'border-pink-200', bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100' },
                  indigo: { from: 'from-indigo-500', to: 'to-blue-700', border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100' },
                  purple: { from: 'from-purple-500', to: 'to-violet-700', border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100' },
                };
                
                const defaultColors = ['amber', 'emerald', 'violet', 'blue', 'rose', 'slate', 'sky', 'pink', 'indigo', 'purple'];
                const colorKey = group.color || defaultColors[idx % defaultColors.length];
                const color = colorMap[colorKey] || colorMap.amber;
                
                const isExpanded = expandedGroups[idx] || false;
                
                return (
                  <div key={`group-${idx}`} className={`bg-white rounded-2xl shadow-sm border ${color.border} mb-6 overflow-hidden animate-fade-in-up`}>
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className={`w-full bg-gradient-to-r ${color.from} ${color.to} px-5 py-3 flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity`}
                    >
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        {group.name}
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </h4>
                      <span className={`text-xs text-white bg-white/20 px-2 py-1 rounded-full`}>
                        {filteredGroupTasks.length} tarefas
                      </span>
                    </button>
                    {isExpanded && (
                      <TaskTable
                        tasks={filteredGroupTasks}
                        weekDates={selectedGroup.weekDates}
                        holidays={config.holidays}
                        showDailyGrid={false}
                        variant="default"
                        showCompleted={showCompleted}
                        showSubtasks={showSubtasks}
                        hideAdditionalColumns={true}
                      />
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}

            {selectedGroup.projects.flatMap(p => p.tasks).length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum projeto ativo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Alignment View
  const renderAlignmentView = () => {
    return (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Alinhamento Semanal</h2>
              <p className="text-xs text-slate-500">Visão consolidada de todas as equipes</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
          <div className="max-w-[1800px] mx-auto">
            {sortedData.map((group, idx) => {
              const weekTasks = getWeekTasks(group.projects);
              if (weekTasks.length === 0) return null;

              return (
                <div key={idx} className="mb-8 animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white">
                      {group.assignee.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{group.assignee}</h3>
                      <p className="text-xs text-slate-500">
                        {group.weekDates[0]} - {group.weekDates[group.weekDates.length - 1]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <TaskTable
                      tasks={weekTasks}
                      weekDates={group.weekDates}
                      holidays={config.holidays}
                      variant="week-summary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderManagementViewV2 = () => {
    const { overview, team, projects, weeklyVelocity, deadlineWatchlist } = management2Aggregates;

    const tabs: { key: ManagementTabKey; label: string; description: string; icon: React.ReactNode }[] = [
      { key: 'overview', label: 'Visão Geral', description: 'Resumo operacional da semana', icon: <LayoutDashboard className="w-4 h-4" /> },
      { key: 'team', label: 'Equipe', description: 'Distribuição de carga e desempenho', icon: <Users className="w-4 h-4" /> },
      { key: 'projects', label: 'Projetos', description: 'Andamento e burn de cada frente', icon: <Layers className="w-4 h-4" /> },
      { key: 'sprints', label: 'Sprints', description: 'Ritmo de entrega semanal', icon: <Activity className="w-4 h-4" /> },
      { key: 'deadlines', label: 'Prazos', description: 'Vencimentos críticos e próximos', icon: <CalendarRange className="w-4 h-4" /> },
    ];

    const focusLabels: Record<StatusCategory, string> = {
      completed: 'Concluídas',
      inProgress: 'Em andamento',
      pending: 'Pendentes',
      blocked: 'Bloqueadas',
    };

    const renderEmpty = (message: string) => (
      <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
        {message}
      </div>
    );

    const renderDeadlineItems = (items: Task[], tone: 'critical' | 'warning' | 'muted') => {
      if (items.length === 0) return renderEmpty('Nenhuma tarefa encontrada nesta faixa.');

      const toneClasses = {
        critical: 'bg-rose-50 border-rose-100 text-rose-600',
        warning: 'bg-amber-50 border-amber-100 text-amber-600',
        muted: 'bg-slate-50 border-slate-100 text-slate-600',
      } as const;

      return (
        <ul className="space-y-3">
          {items.slice(0, 12).map(task => (
            <li key={task.id} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate" title={task.name}>{task.name}</p>
                <p className="text-xs text-slate-500 truncate" title={`${task.projectName} • ${task.assignee || 'Sem responsável'}`}>
                  {task.projectName}
                  {task.assignee ? ` • ${task.assignee}` : ''}
                </p>
              </div>
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${toneClasses[tone]}`}>
                {formatDueDate(task.dueDate)}
              </div>
            </li>
          ))}
        </ul>
      );
    };

    return (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-sky-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Gestão 2 · Painel Executivo</h2>
              <p className="text-xs text-slate-500">Visão moderna inspirada no relatório de referência</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/60">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setManagementTab(tab.key)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    managementTab === tab.key
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`p-1.5 rounded-lg ${managementTab === tab.key ? 'bg-white text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:text-slate-600'}`}>
                    {tab.icon}
                  </span>
                  <span className="text-sm font-medium">{tab.label}</span>
                  <span className="text-[11px] text-slate-400 hidden sm:block">{tab.description}</span>
                </button>
              ))}
            </div>
          </div>

          {managementTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MetricCard
                  title="Projetos ativos"
                  value={overview.activeProjects}
                  subtitle={`Total de tarefas: ${overview.totalTasks}`}
                  icon={<Briefcase className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Taxa de conclusão"
                  value={`${overview.completionRate}%`}
                  subtitle="Percentual de tarefas finalizadas"
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Carga registrada"
                  value={`${overview.totalLogged.toFixed(1)}h`}
                  subtitle={`Planejado: ${overview.totalPlanned.toFixed(1)}h`}
                  icon={<Activity className="w-5 h-5" />}
                  color="purple"
                />
                <MetricCard
                  title="Bloqueios ativos"
                  value={overview.blockedTasks}
                  subtitle={`Pendentes: ${overview.pendingTasks}`}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color="red"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-700">Foco imediato</h3>
                    <span className="text-xs text-slate-400">Priorizar redução de gargalos</span>
                  </div>
                  {overview.focusAreas.length === 0 ? (
                    renderEmpty('Nenhum gargalo relevante identificado. Bom trabalho!')
                  ) : (
                    <div className="space-y-3">
                      {overview.focusAreas.map(item => (
                        <div key={item.status} className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                              {item.count}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-700">{focusLabels[item.status]}</p>
                              <p className="text-xs text-slate-500">{item.percentage}% da carga atual</p>
                            </div>
                          </div>
                          <div className="w-28 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.status === 'blocked' ? 'bg-rose-500' : item.status === 'pending' ? 'bg-amber-500' : 'bg-sky-500'}`} style={{ width: `${Math.min(item.percentage, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-slate-700">Deadlines críticos</h3>
                    <span className="text-xs text-rose-500 font-semibold">Atenção imediata</span>
                  </div>
                  {renderDeadlineItems(deadlineWatchlist.critical.slice(0, 6), 'critical')}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-700">Ritmo semanal</h3>
                    <p className="text-xs text-slate-500">Tarefas concluídas vs. em execução por semana</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-300" />
                </div>
                {weeklyVelocity.length === 0 ? (
                  renderEmpty('Sem histórico suficiente para exibir o ritmo semanal.')
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {weeklyVelocity.map(week => {
                      const total = week.completed + week.inProgress;
                      const progress = total > 0 ? Math.round((week.completed / total) * 100) : 0;
                      return (
                        <div key={week.weekKey} className="border border-slate-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-slate-400">Semana</p>
                              <p className="text-sm font-semibold text-slate-700">{week.label}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-700">{week.completed} entregas</p>
                              <p className="text-xs text-slate-400">{week.hours.toFixed(1)}h registradas</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-[11px] text-slate-500 mb-1">Conclusão</p>
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {week.inProgress} tarefas seguem em andamento
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {managementTab === 'team' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {team.length === 0 ? renderEmpty('Sem dados de equipe disponíveis.') : team.map(member => (
                  <div key={member.member} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{member.member}</p>
                        <p className="text-xs text-slate-400">{member.total} tarefas ativas</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${member.completionRate >= 80 ? 'bg-emerald-50 text-emerald-600' : member.completionRate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                        {member.completionRate}% concluído
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-slate-400 uppercase">Bloqueadas</p>
                        <p className="text-sm font-semibold text-slate-700">{member.blocked}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-slate-400 uppercase">Overdue</p>
                        <p className="text-sm font-semibold text-slate-700">{member.overdue}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-slate-400 uppercase">Planejado</p>
                        <p className="text-sm font-semibold text-slate-700">{member.planned.toFixed(1)}h</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl px-3 py-2">
                        <p className="text-[11px] text-slate-400 uppercase">Registrado</p>
                        <p className="text-sm font-semibold text-slate-700">{member.logged.toFixed(1)}h</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase mb-1">Utilização</p>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${Math.max(0, Math.min(member.utilization, 140))}%` }} />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{member.utilization}% do planejado registrado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {managementTab === 'projects' && (
            <div className="space-y-4">
              {projects.length === 0 ? renderEmpty('Nenhum projeto encontrado nos filtros atuais.') : (
                <div className="space-y-3">
                  {projects.slice(0, 12).map(project => (
                    <div key={project.name} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-700">{project.name}</h3>
                          <p className="text-xs text-slate-400">{project.assignees.length > 0 ? project.assignees.join(', ') : 'Equipe não definida'}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{project.totalTasks} tarefas</span>
                          <span className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">{project.completed} concluídas</span>
                          <span className="px-2 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600">{project.inProgress} em andamento</span>
                          <span className="px-2 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-600">{project.blocked} bloqueadas</span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[11px] text-slate-400 uppercase">Conclusão</p>
                          <p className="text-sm font-semibold text-slate-700">{project.completionRate}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[11px] text-slate-400 uppercase">Horas planejadas</p>
                          <p className="text-sm font-semibold text-slate-700">{project.planned.toFixed(1)}h</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[11px] text-slate-400 uppercase">Horas registradas</p>
                          <p className="text-sm font-semibold text-slate-700">{project.logged.toFixed(1)}h</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2">
                          <p className="text-[11px] text-slate-400 uppercase">Burn</p>
                          <p className={`text-sm font-semibold ${project.burn === null ? 'text-slate-400' : project.burn > 110 ? 'text-rose-600' : project.burn < 80 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {project.burn === null ? 'N/D' : `${project.burn}%`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {managementTab === 'sprints' && (
            <div className="space-y-4">
              {weeklyVelocity.length === 0 ? renderEmpty('Sem dados suficientes para compor a visão de sprint.') : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {weeklyVelocity.map(week => {
                    const total = week.completed + week.inProgress;
                    const completionRate = total > 0 ? Math.round((week.completed / total) * 100) : 0;
                    return (
                      <div key={week.weekKey} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-400">Sprint</p>
                            <p className="text-sm font-semibold text-slate-700">{week.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-700">{completionRate}%</p>
                            <p className="text-xs text-slate-400">{week.completed} concluídas</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-[11px] text-slate-400 uppercase mb-1">Entrega</p>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${Math.min(completionRate, 100)}%` }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                              <p className="text-[11px] text-slate-400 uppercase">Em andamento</p>
                              <p className="text-sm font-semibold text-slate-700">{week.inProgress}</p>
                            </div>
                            <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                              <p className="text-[11px] text-slate-400 uppercase">Horas</p>
                              <p className="text-sm font-semibold text-slate-700">{week.hours.toFixed(1)}h</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {managementTab === 'deadlines' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-700 mb-3">Críticos (≤ 3 dias)</h3>
                {renderDeadlineItems(deadlineWatchlist.critical, 'critical')}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-700 mb-3">Próximos 7 dias</h3>
                {renderDeadlineItems(deadlineWatchlist.upcoming, 'warning')}
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-700 mb-3">Atrasados</h3>
                {renderDeadlineItems(deadlineWatchlist.overdue, 'muted')}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (viewMode === 'projects') return renderDailyView();
  if (viewMode === 'alignment') return renderAlignmentView();

  return renderDailyView();
};

export default Dashboard;