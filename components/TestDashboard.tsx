import React, { useState, useMemo, useRef } from 'react';
import { GroupedData, AppConfig, Task } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Activity, 
  CalendarRange,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  Target,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Info,
  Play,
  ChevronLeft,
  Calendar,
  AlertCircle,
  MinusCircle
} from 'lucide-react';
import { ClickUpApiTask } from '../services/clickup';

interface TestDashboardProps {
  data: GroupedData[];
  config: AppConfig;
  rawData?: ClickUpApiTask[] | null;
}

type StatusCategory = 'completed' | 'inProgress' | 'pending' | 'blocked';
type TabKey = 'overview' | 'team' | 'projects' | 'sprints' | 'deadlines' | 'priorities' | 'taskControl' | 'timesheet' | 'timesheet2';

// Priority colors mapping
const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
  'urgente': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'urgent': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  '0': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  'alta': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'high': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '1': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  'normal': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'média': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '2': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'baixa': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  'low': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
  '3': { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

const getPriorityColor = (priority?: string | null) => {
  if (!priority) return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' };
  const key = priority.toLowerCase().trim();
  return priorityColors[key] || { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' };
};

const normalizePriorityLabel = (priority?: string | null): string => {
  if (!priority) return 'Sem prioridade';
  const p = priority.toLowerCase().trim();
  if (['urgente', 'urgent', '0'].includes(p)) return 'Urgente (P0)';
  if (['alta', 'high', '1'].includes(p)) return 'Alta (P1)';
  if (['normal', 'média', 'media', '2'].includes(p)) return 'Normal (P2)';
  if (['baixa', 'low', '3'].includes(p)) return 'Baixa (P3)';
  return priority;
};

// Flatten tasks including subtasks
const flattenTaskWithSubtasks = (task: Task): Task[] => {
  const tasks: Task[] = [task];
  if (task.subtasks && task.subtasks.length > 0) {
    task.subtasks.forEach(sub => {
      tasks.push(...flattenTaskWithSubtasks(sub));
    });
  }
  return tasks;
};

// Categorize status
const categorizeStatus = (status?: string | null): StatusCategory => {
  if (!status) return 'pending';
  const normalized = status.toLowerCase().trim();
  if (['concluído', 'concluida', 'concluído', 'complete', 'done', 'closed', 'finalizado', 'entregue', 'completo'].some(s => normalized.includes(s))) {
    return 'completed';
  }
  if (['bloqueado', 'blocked', 'impedido', 'parado', 'aguardando'].some(s => normalized.includes(s))) {
    return 'blocked';
  }
  if (['andamento', 'progress', 'desenvolvimento', 'execução', 'fazendo', 'doing', 'review', 'revisão'].some(s => normalized.includes(s))) {
    return 'inProgress';
  }
  return 'pending';
};

// Format due date
const formatDueDate = (dueDate?: Date | string | null): string => {
  if (!dueDate) return 'Sem prazo';
  const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  if (isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatDate = (dateInput?: Date | string | null, fallback = 'Sem data'): string => {
  if (!dateInput) return fallback;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

// Get week key for grouping
const getWeekKey = (dateInput?: Date | string | null): string | null => {
  if (!dateInput) return null;
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return null;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  return startOfWeek.toISOString().slice(0, 10);
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  size?: 'default' | 'large';
}> = ({ title, value, subtitle, icon, trend, color, size = 'default' }) => {
  const colorConfig = {
    blue: { bg: 'bg-sky-50', gradient: 'from-sky-500 to-blue-600', text: 'text-sky-600', border: 'border-sky-100' },
    green: { bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-green-600', text: 'text-emerald-600', border: 'border-emerald-100' },
    orange: { bg: 'bg-amber-50', gradient: 'from-amber-500 to-orange-600', text: 'text-amber-600', border: 'border-amber-100' },
    red: { bg: 'bg-rose-50', gradient: 'from-rose-500 to-red-600', text: 'text-rose-600', border: 'border-rose-100' },
    purple: { bg: 'bg-violet-50', gradient: 'from-violet-500 to-purple-600', text: 'text-violet-600', border: 'border-violet-100' },
  };

  const cfg = colorConfig[color];

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border ${cfg.border} hover:shadow-md transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${cfg.bg}`}>
          <div className={cfg.text}>{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className={`font-bold text-slate-800 ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>{value}</p>
        <p className="text-sm font-medium text-slate-600 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar: React.FC<{
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ value, max = 100, color = 'blue', showLabel = false, size = 'md' }) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const colorClasses = {
    blue: 'bg-sky-500',
    green: 'bg-emerald-500',
    orange: 'bg-amber-500',
    red: 'bg-rose-500',
    purple: 'bg-violet-500',
  };
  const sizeClasses = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-slate-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-slate-600 min-w-[3rem] text-right">{percentage}%</span>}
    </div>
  );
};

// Empty State Component
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-sm text-slate-400 text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
    {message}
  </div>
);

// Toggle Component (replica da Daily)
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

const TestDashboard: React.FC<TestDashboardProps> = ({ data, config, rawData }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [priorityShowParentTasks, setPriorityShowParentTasks] = useState(true);
  const [priorityShowSubtasks, setPriorityShowSubtasks] = useState(true);
  const [priorityShowCompleted, setPriorityShowCompleted] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>(['projeto']);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    data.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          const flat = flattenTaskWithSubtasks(task);
          flat.forEach(t => {
            if (t.tags && t.tags.length > 0) {
              t.tags.forEach(tag => tagSet.add(tag));
            }
          });
        });
      });
    });
    return Array.from(tagSet).sort();
  }, [data]);

  // Filter data by selected tags
  const filteredData = useMemo(() => {
    if (selectedTags.length === 0) return data;
    
    return data.map(group => ({
      ...group,
      projects: group.projects.map(project => ({
        ...project,
        tasks: project.tasks.filter(task => {
          const flat = flattenTaskWithSubtasks(task);
          return flat.some(t => 
            t.tags && t.tags.some(tag => 
              selectedTags.some(selected => tag.toLowerCase() === selected.toLowerCase())
            )
          );
        })
      })).filter(project => project.tasks.length > 0)
    })).filter(group => group.projects.length > 0);
  }, [data, selectedTags]);

  // Sort data by team member order
  const sortedData = useMemo(() => {
    if (!config.teamMemberOrder || config.teamMemberOrder.length === 0) {
      return filteredData;
    }
    const orderMap = new Map(config.teamMemberOrder.map((name, idx) => [name.toLowerCase(), idx]));
    return [...filteredData].sort((a, b) => {
      const aIdx = orderMap.get(a.assignee.toLowerCase()) ?? 999;
      const bIdx = orderMap.get(b.assignee.toLowerCase()) ?? 999;
      return (aIdx as number) - (bIdx as number);
    });
  }, [filteredData, config.teamMemberOrder]);

  // Compute aggregated metrics
  const aggregates = useMemo(() => {
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
      additional: number;
      remaining: number;
      tasks: Task[];
    }>();

    const statusTotals: Record<StatusCategory, number> = {
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
    };

    const weeklyVelocityMap = new Map<string, { completed: number; inProgress: number; hours: number }>();
    const allTasks: Task[] = [];

    // Task control - quality metrics
    const tasksWithoutAssignee: Task[] = [];
    const tasksWithoutEstimate: Task[] = [];
    const tasksWithoutDueDate: Task[] = [];
    const tasksWithoutStartDate: Task[] = [];
    const tasksWithoutPriority: Task[] = [];
    const tasksWithoutDescription: Task[] = [];

    // Priority distribution by person
    type PriorityBucket = 'urgente' | 'alta' | 'normal' | 'baixa' | 'sem_prioridade';
    const priorityDistribution = new Map<string, Map<PriorityBucket, { count: number; hours: number }>>();

    const getPriorityBucket = (priority?: string | null): PriorityBucket => {
      if (!priority) return 'sem_prioridade';
      const p = priority.toLowerCase().trim();
      if (['urgente', 'urgent', '0'].includes(p)) return 'urgente';
      if (['alta', 'high', '1'].includes(p)) return 'alta';
      if (['normal', 'média', 'media', '2'].includes(p)) return 'normal';
      if (['baixa', 'low', '3'].includes(p)) return 'baixa';
      return 'sem_prioridade';
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const weekAhead = new Date(now);
    weekAhead.setDate(weekAhead.getDate() + 7);
    const threeDaysAhead = new Date(now);
    threeDaysAhead.setDate(threeDaysAhead.getDate() + 3);

    const upcoming: Task[] = [];
    const critical: Task[] = [];
    const overdue: Task[] = [];
    const seenIds = new Set<string>();

    let totalPlanned = 0;
    let totalLogged = 0;

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
            additional: 0,
            remaining: 0,
            tasks: [],
          });
        }

        const projectEntry = projectMap.get(projectKey)!;
        const projectOwner = group.assignee?.trim() || 'Sem responsável';
        if (projectOwner !== 'Sem responsável') {
          projectEntry.assignees.add(projectOwner);
        }

        project.tasks.forEach(task => {
          const flat = flattenTaskWithSubtasks(task);
          flat.forEach(t => {
            allTasks.push(t);
            const status = categorizeStatus(t.status);
            statusTotals[status]++;

            // Task control - collect tasks with missing data (exclude completed)
            if (status !== 'completed') {
              const assigneeName = t.assignee?.trim();
              if (!assigneeName || assigneeName === '' || assigneeName.toLowerCase() === 'sem responsável') {
                tasksWithoutAssignee.push(t);
              }
              if (!t.timeEstimate || t.timeEstimate === 0) {
                tasksWithoutEstimate.push(t);
              }
              if (!t.dueDate) {
                tasksWithoutDueDate.push(t);
              }
              if (!t.startDate) {
                tasksWithoutStartDate.push(t);
              }
              if (!t.priority || t.priority.trim() === '') {
                tasksWithoutPriority.push(t);
              }
              if (!t.description || t.description.trim() === '') {
                tasksWithoutDescription.push(t);
              }
            }

            const memberName = t.assignee?.trim() || 'Sem responsável';
            
            // Check if task has multiple assignees (e.g., "Rafael / Alvaro")
            const assigneeNames = memberName.includes('/') 
              ? memberName.split('/').map(name => name.trim()).filter(name => name && name !== 'Sem responsável')
              : [memberName].filter(name => name && name !== 'Sem responsável');
            
            // Skip tasks with no valid assignees
            if (assigneeNames.length === 0) {
              assigneeNames.push('Sem responsável');
            }
            
            // Each assignee gets the full hours (they work together)
            assigneeNames.forEach(assigneeName => {
              if (!teamMap.has(assigneeName)) {
                teamMap.set(assigneeName, {
                  member: assigneeName,
                  total: 0,
                  completed: 0,
                  inProgress: 0,
                  blocked: 0,
                  overdue: 0,
                  planned: 0,
                  logged: 0,
                });
              }
              const memberEntry = teamMap.get(assigneeName)!;
              memberEntry.total += 1 / assigneeNames.length; // Count task fractionally
              if (status === 'completed') memberEntry.completed += 1 / assigneeNames.length;
              else if (status === 'inProgress') memberEntry.inProgress += 1 / assigneeNames.length;
              else if (status === 'blocked') memberEntry.blocked += 1 / assigneeNames.length;

              memberEntry.planned += t.timeEstimate || 0; // Full hours for each person
              memberEntry.logged += t.timeLogged || 0; // Full hours for each person
            });
            totalPlanned += t.timeEstimate || 0;
            totalLogged += t.timeLogged || 0;

            projectEntry.total++;
            if (status === 'completed') projectEntry.completed++;
            else if (status === 'inProgress') projectEntry.inProgress++;
            else if (status === 'blocked') projectEntry.blocked++;
            else projectEntry.pending++;

            projectEntry.planned += t.timeEstimate || 0;
            projectEntry.logged += t.timeLogged || 0;
            projectEntry.additional += t.additionalTime || 0;
            projectEntry.remaining += t.remaining || 0;
            if (!t.isSubtask) {
              projectEntry.tasks.push(t);
            }

            // Deadlines
            if (t.dueDate && status !== 'completed') {
              const due = new Date(t.dueDate);
              due.setHours(0, 0, 0, 0);
              if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                if (due < now) {
                  overdue.push(t);
                  // Distribute overdue count among assignees
                  assigneeNames.forEach(assigneeName => {
                    const memberEntry = teamMap.get(assigneeName);
                    if (memberEntry) {
                      memberEntry.overdue += 1 / assigneeNames.length;
                    }
                  });
                  projectEntry.overdue++;
                } else if (due <= threeDaysAhead) {
                  critical.push(t);
                } else if (due <= weekAhead) {
                  upcoming.push(t);
                }
              }
            }

            // Weekly velocity
            const weekKey = getWeekKey(t.dueDate);
            if (weekKey) {
              if (!weeklyVelocityMap.has(weekKey)) {
                weeklyVelocityMap.set(weekKey, { completed: 0, inProgress: 0, hours: 0 });
              }
              const entry = weeklyVelocityMap.get(weekKey)!;
              if (status === 'completed') entry.completed++;
              else if (status === 'inProgress') entry.inProgress++;
              entry.hours += t.timeLogged || 0;
            }

            // Priority distribution by person (respect filters)
            const isSubtask = Boolean(t.isSubtask);
            const passesHierarchy = isSubtask ? priorityShowSubtasks : priorityShowParentTasks;
            const passesStatus = priorityShowCompleted || status !== 'completed';
            if (passesHierarchy && passesStatus) {
              const bucket = getPriorityBucket(t.priority);
              
              // Check if task has multiple assignees (e.g., "Rafael / Alvaro")
              const assigneeNames = memberName.includes('/') 
                ? memberName.split('/').map(name => name.trim()).filter(name => name && name !== 'Sem responsável')
                : [memberName].filter(name => name && name !== 'Sem responsável');
              
              // Skip tasks with no valid assignees
              if (assigneeNames.length === 0) {
                assigneeNames.push('Sem responsável');
              }
              
              // Each assignee gets the full hours (they work together)
              assigneeNames.forEach(assigneeName => {
                if (!priorityDistribution.has(assigneeName)) {
                  priorityDistribution.set(assigneeName, new Map([
                    ['urgente', { count: 0, hours: 0 }],
                    ['alta', { count: 0, hours: 0 }],
                    ['normal', { count: 0, hours: 0 }],
                    ['baixa', { count: 0, hours: 0 }],
                    ['sem_prioridade', { count: 0, hours: 0 }],
                  ]));
                }
                const personPriorities = priorityDistribution.get(assigneeName)!;
                const priorityEntry = personPriorities.get(bucket)!;
                priorityEntry.count += 1 / assigneeNames.length; // Distribute task count fractionally
                priorityEntry.hours += t.timeEstimate || 0; // Full hours for each person
              });
            }
          });
        });
      });
    });

    // Sort deadlines by date
    const sortByDue = (a: Task, b: Task) => {
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      return dateA - dateB;
    };
    critical.sort(sortByDue);
    upcoming.sort(sortByDue);
    overdue.sort(sortByDue);

    // Team array
    const team = Array.from(teamMap.values())
      .filter(m => m.member !== 'Sem responsável')
      .map(m => ({
        ...m,
        completionRate: m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0,
        utilization: m.planned > 0 ? Math.round((m.logged / m.planned) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Projects array
    const projects = Array.from(projectMap.values())
      .map(p => ({
        ...p,
        assignees: Array.from(p.assignees),
        completionRate: p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0,
        burn: p.planned > 0 ? Math.round((p.logged / p.planned) * 100) : null,
      }))
      .sort((a, b) => b.total - a.total);

    // Weekly velocity array
    const weeklyVelocity = Array.from(weeklyVelocityMap.entries())
      .map(([weekKey, data]) => {
        const date = new Date(weekKey);
        return {
          weekKey,
          label: `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`,
          ...data,
        };
      })
      .sort((a, b) => a.weekKey.localeCompare(b.weekKey))
      .slice(-8);

    // Overview
    const projectNames = new Set<string>();
    sortedData.forEach(g => g.projects.forEach(p => projectNames.add(p.name)));
    const totalTasks = allTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((statusTotals.completed / totalTasks) * 100) : 0;

    const focusAreas = (['blocked', 'pending', 'inProgress'] as StatusCategory[])
      .map(status => ({
        status,
        count: statusTotals[status],
        percentage: totalTasks > 0 ? Math.round((statusTotals[status] / totalTasks) * 100) : 0,
      }))
      .filter(item => item.count > 0);

    // Priority distribution array sorted by member
    const priorityLabels: Record<PriorityBucket, string> = {
      urgente: 'Urgente (P0)',
      alta: 'Alta (P1)',
      normal: 'Normal (P2)',
      baixa: 'Baixa (P3)',
      sem_prioridade: 'Sem prioridade',
    };

    const priorityArray = Array.from(priorityDistribution.entries())
      .filter(([member]) => member !== 'Sem responsável')
      .map(([member, priorities]) => {
        const totalHours = Array.from(priorities.values()).reduce((sum, p) => sum + p.hours, 0);
        const totalCount = Array.from(priorities.values()).reduce((sum, p) => sum + p.count, 0);
        return {
          member,
          priorities: Object.fromEntries(
            Array.from(priorities.entries()).map(([bucket, data]) => [
              bucket,
              { ...data, label: priorityLabels[bucket] }
            ])
          ) as Record<PriorityBucket, { count: number; hours: number; label: string }>,
          totalHours,
          totalCount,
        };
      })
      .sort((a, b) => b.totalHours - a.totalHours);

    // Task control summary
    const taskControl = {
      withoutAssignee: tasksWithoutAssignee,
      withoutEstimate: tasksWithoutEstimate,
      withoutDueDate: tasksWithoutDueDate,
      withoutStartDate: tasksWithoutStartDate,
      withoutPriority: tasksWithoutPriority,
      withoutDescription: tasksWithoutDescription,
      totalIncomplete: new Set([
        ...tasksWithoutAssignee.map(t => t.id),
        ...tasksWithoutEstimate.map(t => t.id),
        ...tasksWithoutDueDate.map(t => t.id),
        ...tasksWithoutStartDate.map(t => t.id),
        ...tasksWithoutPriority.map(t => t.id),
        ...tasksWithoutDescription.map(t => t.id),
      ]).size,
    };

    return {
      overview: {
        activeProjects: projectNames.size,
        totalTasks,
        completedTasks: statusTotals.completed,
        completionRate,
        blockedTasks: statusTotals.blocked,
        pendingTasks: statusTotals.pending,
        inProgressTasks: statusTotals.inProgress,
        totalPlanned,
        totalLogged,
        focusAreas,
      },
      team,
      projects,
      weeklyVelocity,
      deadlineWatchlist: { critical, upcoming, overdue },
      priorityDistribution: priorityArray,
      taskControl,
    };
  }, [sortedData, priorityShowParentTasks, priorityShowSubtasks, priorityShowCompleted]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Visão Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'team', label: 'Equipe', icon: <Users className="w-4 h-4" /> },
    { key: 'projects', label: 'Projetos', icon: <Layers className="w-4 h-4" /> },
    { key: 'sprints', label: 'Sprints', icon: <Activity className="w-4 h-4" /> },
    { key: 'deadlines', label: 'Prazos', icon: <CalendarRange className="w-4 h-4" /> },
    { key: 'priorities', label: 'Prioridades', icon: <Target className="w-4 h-4" /> },
    { key: 'taskControl', label: 'Controle Tarefas', icon: <AlertTriangle className="w-4 h-4" /> },
    { key: 'timesheet', label: 'Timesheet', icon: <Clock className="w-4 h-4" /> },
    { key: 'timesheet2', label: 'Timesheet 2', icon: <Calendar className="w-4 h-4" /> },
  ];

  const { overview, team, projects, weeklyVelocity, deadlineWatchlist, priorityDistribution, taskControl } = aggregates;

  // Render deadline item
  const renderDeadlineItem = (task: Task, tone: 'critical' | 'warning' | 'muted') => {
    const toneClasses = {
      critical: 'bg-rose-50 border-rose-200 text-rose-700',
      warning: 'bg-amber-50 border-amber-200 text-amber-700',
      muted: 'bg-slate-50 border-slate-200 text-slate-600',
    };

    return (
      <div key={task.id} className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 border ${toneClasses[tone]}`}>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{task.name}</p>
          <p className="text-xs opacity-75 truncate">
            {task.projectName} {task.assignee ? `• ${task.assignee}` : ''}
          </p>
        </div>
        <div className="text-xs font-bold px-2.5 py-1 bg-white/50 rounded-lg">
          {formatDueDate(task.dueDate)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Gestão</h2>
              <p className="text-xs text-slate-500">Painel executivo experimental</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium text-slate-600 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tag Filter */}
          <div className="relative">
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                selectedTags.length > 0
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Tags {selectedTags.length > 0 && `(${selectedTags.length})`}</span>
            </button>
            
            {showTagFilter && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-700">Filtrar por Tags</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setSelectedTags(allTags)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Todos
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => setSelectedTags([])}
                      className="text-[10px] text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  {allTags.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhuma tag encontrada</p>
                  ) : (
                    allTags.map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <label
                          key={tag}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags([...selectedTags, tag]);
                              } else {
                                setSelectedTags(selectedTags.filter(t => t !== tag));
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className={`text-xs font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-600'}`}>
                            {tag}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Main Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Taxa de Conclusão"
                  value={`${overview.completionRate}%`}
                  subtitle={`${overview.completedTasks} de ${overview.totalTasks} tarefas`}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  color="green"
                  trend={{ value: 12, positive: true }}
                  size="large"
                />
                <MetricCard
                  title="Projetos Ativos"
                  value={overview.activeProjects}
                  subtitle={`${overview.inProgressTasks} em andamento`}
                  icon={<Briefcase className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Horas Registradas"
                  value={`${overview.totalLogged.toFixed(0)}h`}
                  subtitle={`de ${overview.totalPlanned.toFixed(0)}h planejadas`}
                  icon={<Clock className="w-5 h-5" />}
                  color="purple"
                />
                <MetricCard
                  title="Tarefas Atrasadas"
                  value={deadlineWatchlist.overdue.length}
                  subtitle={`${deadlineWatchlist.critical.length} críticas`}
                  icon={<AlertTriangle className="w-5 h-5" />}
                  color="red"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team Performance */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Desempenho da Equipe</h3>
                      <p className="text-xs text-slate-500">Distribuição de carga por membro</p>
                    </div>
                    <Users className="w-5 h-5 text-slate-400" />
                  </div>
                  {team.length === 0 ? (
                    <EmptyState message="Nenhum membro da equipe encontrado" />
                  ) : (
                    <div className="space-y-4">
                      {team.slice(0, 5).map(member => (
                        <div key={member.member} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">{member.member}</span>
                            <span className="text-xs text-slate-500">{member.completed}/{member.total}</span>
                          </div>
                          <ProgressBar 
                            value={member.completionRate} 
                            color={member.completionRate >= 70 ? 'green' : member.completionRate >= 40 ? 'orange' : 'red'} 
                            showLabel 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Distribuição de Status</h3>
                      <p className="text-xs text-slate-500">Visão geral do andamento</p>
                    </div>
                    <PieChart className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className="text-xs font-medium text-emerald-700">Concluídas</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">{overview.completedTasks}</p>
                    </div>
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-sky-500" />
                        <span className="text-xs font-medium text-sky-700">Em Andamento</span>
                      </div>
                      <p className="text-2xl font-bold text-sky-700">{overview.inProgressTasks}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-xs font-medium text-amber-700">Pendentes</span>
                      </div>
                      <p className="text-2xl font-bold text-amber-700">{overview.pendingTasks}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-xs font-medium text-rose-700">Bloqueadas</span>
                      </div>
                      <p className="text-2xl font-bold text-rose-700">{overview.blockedTasks}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critical Deadlines */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Prazos Críticos</h3>
                    <p className="text-xs text-slate-500">Tarefas que requerem atenção imediata</p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                {deadlineWatchlist.critical.length === 0 ? (
                  <EmptyState message="Nenhum prazo crítico no momento 🎉" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {deadlineWatchlist.critical.slice(0, 6).map(task => renderDeadlineItem(task, 'critical'))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {team.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState message="Nenhum membro da equipe encontrado" />
                </div>
              ) : (
                team.map(member => (
                  <div key={member.member} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {member.member.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{member.member}</p>
                          <p className="text-xs text-slate-500">{member.total} tarefas</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        member.completionRate >= 70 ? 'bg-emerald-50 text-emerald-600' :
                        member.completionRate >= 40 ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {member.completionRate}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <ProgressBar value={member.completionRate} color="green" />
                      
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Concluídas</p>
                          <p className="text-sm font-bold text-emerald-600">{member.completed}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Em Andamento</p>
                          <p className="text-sm font-bold text-sky-600">{member.inProgress}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Bloqueadas</p>
                          <p className="text-sm font-bold text-rose-600">{member.blocked}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Atrasadas</p>
                          <p className="text-sm font-bold text-amber-600">{member.overdue}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Horas: {member.logged.toFixed(1)}h / {member.planned.toFixed(1)}h</span>
                          <span className={`font-semibold ${member.utilization >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {member.utilization}% util.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium mb-1">Membros Ativos</p>
                      <p className="text-3xl font-bold">
                        {(() => {
                          const membersWithProjects = new Set<string>();
                          data.forEach(person => {
                            person.projects.forEach(project => {
                              const hasProjetoTag = project.tasks.some(task => 
                                task.tags && task.tags.some(tag => tag.toLowerCase() === 'projeto')
                              );
                              if (hasProjetoTag) {
                                membersWithProjects.add(person.assignee);
                              }
                            });
                          });
                          return membersWithProjects.size;
                        })()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium mb-1">Total de Projetos</p>
                      <p className="text-3xl font-bold">
                        {(() => {
                          const projectsSet = new Set<string>();
                          data.forEach(person => {
                            person.projects.forEach(project => {
                              const hasProjetoTag = project.tasks.some(task => 
                                task.tags && task.tags.some(tag => tag.toLowerCase() === 'projeto')
                              );
                              if (hasProjetoTag) {
                                projectsSet.add(project.name);
                              }
                            });
                          });
                          return projectsSet.size;
                        })()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Layers className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium mb-1">Horas Planejadas</p>
                      <p className="text-3xl font-bold">
                        {(() => {
                          let total = 0;
                          data.forEach(person => {
                            person.projects.forEach(project => {
                              project.tasks.forEach(task => {
                                if (task.tags && task.tags.some(tag => tag.toLowerCase() === 'projeto')) {
                                  total += task.timeEstimate || 0;
                                }
                              });
                            });
                          });
                          return total.toFixed(0);
                        })()}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium mb-1">Horas Registradas</p>
                      <p className="text-3xl font-bold">
                        {(() => {
                          let total = 0;
                          data.forEach(person => {
                            person.projects.forEach(project => {
                              project.tasks.forEach(task => {
                                if (task.tags && task.tags.some(tag => tag.toLowerCase() === 'projeto')) {
                                  total += task.timeLogged || 0;
                                }
                              });
                            });
                          });
                          return total.toFixed(0);
                        })()}h
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Members and their Projects */}
              {(() => {
                const membersWithProjects = data
                  .map(person => {
                    const projects = person.projects
                      .filter(project => {
                        return project.tasks.some(task => 
                          task.tags && task.tags.some(tag => tag.toLowerCase() === 'projeto')
                        );
                      })
                      .map(project => {
                      // Filtrar apenas tarefas com tag "projeto"
                      const projectTasks = project.tasks.filter(task => 
                        task.tags && task.tags.some(tag => tag.toLowerCase() === 'projeto')
                      );
                      
                      const totalTasks = projectTasks.length;
                      const completedTasks = projectTasks.filter(t => 
                        t.status && t.status.toLowerCase().includes('conclu')
                      ).length;
                      const plannedHours = projectTasks.reduce((sum, t) => sum + (t.timeEstimate || 0), 0);
                      const loggedHours = projectTasks.reduce((sum, t) => sum + (t.timeLogged || 0), 0);
                      const remainingHours = projectTasks.reduce((sum, t) => sum + (t.remaining || 0), 0);

                      return {
                        name: project.name,
                        tags: project.tags,
                        tasks: projectTasks, // Usar apenas tarefas com tag "projeto"
                        totalTasks,
                        completedTasks,
                        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                        plannedHours,
                        loggedHours,
                        remainingHours
                      };
                    });

                    return {
                      assignee: person.assignee,
                      avatar: person.assignee.substring(0, 2).toUpperCase(),
                      projects: projects,
                      totalProjects: projects.length,
                      totalHours: projects.reduce((sum, p) => sum + p.plannedHours, 0),
                      loggedHours: projects.reduce((sum, p) => sum + p.loggedHours, 0)
                    };
                  })
                  .filter(member => member.projects.length > 0)
                  .sort((a, b) => b.totalProjects - a.totalProjects);

                if (membersWithProjects.length === 0) {
                  return <EmptyState message="Nenhum projeto com tag 'projeto' encontrado" />;
                }

                return (
                  <div className="space-y-6">
                    {membersWithProjects.map(member => (
                      <div key={member.assignee} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        {/* Member Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg border-2 border-white/30">
                                {member.avatar}
                              </div>
                              <div>
                                <h3 className="text-2xl font-bold text-white mb-1">{member.assignee}</h3>
                                <div className="flex items-center gap-4 text-blue-100">
                                  <div className="flex items-center gap-1">
                                    <Layers className="w-4 h-4" />
                                    <span className="font-semibold">{member.totalProjects}</span>
                                    <span className="text-sm">{member.totalProjects === 1 ? 'projeto' : 'projetos'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-semibold">{member.totalHours.toFixed(0)}h</span>
                                    <span className="text-sm">planejadas</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Activity className="w-4 h-4" />
                                    <span className="font-semibold">{member.loggedHours.toFixed(0)}h</span>
                                    <span className="text-sm">registradas</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-4xl font-bold text-white">
                                {member.totalHours > 0 
                                  ? Math.round((member.loggedHours / member.totalHours) * 100)
                                  : 0}%
                              </div>
                              <div className="text-blue-200 text-sm font-medium">Utilização</div>
                            </div>
                          </div>
                        </div>

                        {/* Projects Grid */}
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {member.projects.map(project => (
                            <div key={project.name} className="bg-white rounded-xl shadow-md border border-slate-200 hover:shadow-xl transition-all overflow-hidden">
                              {/* Project Header */}
                              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-lg font-bold text-white mb-2 line-clamp-2">{project.name}</h4>
                                    {project.tags && project.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {project.tags.slice(0, 2).map((tag, idx) => (
                                          <span key={idx} className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-shrink-0">
                                    <div className="relative w-14 h-14">
                                      <svg className="transform -rotate-90" width="56" height="56">
                                        <circle cx="28" cy="28" r="24" stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
                                        <circle
                                          cx="28" cy="28" r="24"
                                          stroke="white"
                                          strokeWidth="4"
                                          fill="none"
                                          strokeDasharray={`${2 * Math.PI * 24}`}
                                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - project.completionRate / 100)}`}
                                          strokeLinecap="round"
                                        />
                                      </svg>
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-sm font-bold text-white">{project.completionRate}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Project Stats */}
                              <div className="p-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 font-medium">Tarefas</span>
                                  <span className="font-bold text-slate-900">
                                    {project.completedTasks} / {project.totalTasks}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 font-medium">Planejado</span>
                                  <span className="font-bold text-blue-600">{project.plannedHours.toFixed(1)}h</span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 font-medium">Registrado</span>
                                  <span className="font-bold text-green-600">{project.loggedHours.toFixed(1)}h</span>
                                </div>

                                {project.remainingHours > 0 && (
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 font-medium">Restante</span>
                                    <span className="font-bold text-amber-600">{project.remainingHours.toFixed(1)}h</span>
                                  </div>
                                )}

                                {/* Progress Bar */}
                                <div className="pt-2">
                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all ${
                                        project.completionRate >= 75 ? 'bg-green-500' :
                                        project.completionRate >= 50 ? 'bg-blue-500' :
                                        project.completionRate >= 25 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${project.completionRate}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sprints Tab */}
          {activeTab === 'sprints' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {weeklyVelocity.length === 0 ? (
                <div className="col-span-full">
                  <EmptyState message="Dados insuficientes para exibir sprints" />
                </div>
              ) : (
                weeklyVelocity.map(week => {
                  const total = week.completed + week.inProgress;
                  const rate = total > 0 ? Math.round((week.completed / total) * 100) : 0;
                  return (
                    <div key={week.weekKey} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400">Semana de</p>
                          <p className="text-lg font-bold text-slate-800">{week.label}</p>
                        </div>
                        <span className={`text-lg font-bold ${rate >= 70 ? 'text-emerald-600' : rate >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {rate}%
                        </span>
                      </div>

                      <ProgressBar value={rate} color={rate >= 70 ? 'green' : rate >= 40 ? 'orange' : 'red'} size="lg" />

                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
                          <p className="text-lg font-bold text-emerald-600">{week.completed}</p>
                          <p className="text-[10px] uppercase text-emerald-600/70">Entregues</p>
                        </div>
                        <div className="bg-sky-50 rounded-lg px-3 py-2 text-center">
                          <p className="text-lg font-bold text-sky-600">{week.inProgress}</p>
                          <p className="text-[10px] uppercase text-sky-600/70">Em Progresso</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">{week.hours.toFixed(1)}h</span> registradas
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Deadlines Tab */}
          {activeTab === 'deadlines' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Critical */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Críticos</h3>
                    <p className="text-xs text-slate-500">Próximos 3 dias</p>
                  </div>
                  <span className="ml-auto text-lg font-bold text-rose-600">{deadlineWatchlist.critical.length}</span>
                </div>
                {deadlineWatchlist.critical.length === 0 ? (
                  <EmptyState message="Nenhum prazo crítico" />
                ) : (
                  <div className="space-y-2">
                    {deadlineWatchlist.critical.slice(0, 8).map(task => renderDeadlineItem(task, 'critical'))}
                  </div>
                )}
              </div>

              {/* Upcoming */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <CalendarRange className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Próximos</h3>
                    <p className="text-xs text-slate-500">4-7 dias</p>
                  </div>
                  <span className="ml-auto text-lg font-bold text-amber-600">{deadlineWatchlist.upcoming.length}</span>
                </div>
                {deadlineWatchlist.upcoming.length === 0 ? (
                  <EmptyState message="Nenhum prazo próximo" />
                ) : (
                  <div className="space-y-2">
                    {deadlineWatchlist.upcoming.slice(0, 8).map(task => renderDeadlineItem(task, 'warning'))}
                  </div>
                )}
              </div>

              {/* Overdue */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Atrasados</h3>
                    <p className="text-xs text-slate-500">Prazo vencido</p>
                  </div>
                  <span className="ml-auto text-lg font-bold text-slate-600">{deadlineWatchlist.overdue.length}</span>
                </div>
                {deadlineWatchlist.overdue.length === 0 ? (
                  <EmptyState message="Nenhuma tarefa atrasada 🎉" />
                ) : (
                  <div className="space-y-2">
                    {deadlineWatchlist.overdue.slice(0, 8).map(task => renderDeadlineItem(task, 'muted'))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Priorities Tab */}
          {activeTab === 'priorities' && (
            <PrioritiesTabContent 
              priorityDistribution={priorityDistribution}
              priorityShowParentTasks={priorityShowParentTasks}
              setPriorityShowParentTasks={setPriorityShowParentTasks}
              priorityShowSubtasks={priorityShowSubtasks}
              setPriorityShowSubtasks={setPriorityShowSubtasks}
              priorityShowCompleted={priorityShowCompleted}
              setPriorityShowCompleted={setPriorityShowCompleted}
            />
          )}

          {/* Task Control Tab */}
          {activeTab === 'taskControl' && (
            <TaskControlTab 
              taskControl={taskControl} 
              totalPending={overview.totalTasks - overview.completedTasks}
            />
          )}

          {/* Timesheet Tab */}
          {activeTab === 'timesheet' && (
            <TimesheetTab 
              data={sortedData}
              config={config}
            />
          )}

          {/* Timesheet 2 Tab - Visual Timeline */}
          {activeTab === 'timesheet2' && (
            <TimesheetTab2 
              data={sortedData}
              config={config}
            />
          )}

        </div>
      </div>
    </div>
  );
};

// Collapsible Card Component for Task Control
const CollapsibleTaskCard: React.FC<{
  title: string;
  subtitle: string;
  count: number;
  tasks: Task[];
  icon: React.ReactNode;
  colorScheme: 'red' | 'amber' | 'orange' | 'violet' | 'sky' | 'emerald';
}> = ({ title, subtitle, count, tasks, icon, colorScheme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const colors = {
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', iconBg: 'bg-red-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600', iconBg: 'bg-amber-100' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', iconBg: 'bg-orange-100' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600', iconBg: 'bg-violet-100' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-600', iconBg: 'bg-sky-100' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  };

  const scheme = count > 0 ? colors[colorScheme] : colors.emerald;
  const isOk = count === 0;
  const displayLimit = 15;
  const visibleTasks = showAll ? tasks : tasks.slice(0, displayLimit);
  const hasMore = tasks.length > displayLimit;

  return (
    <div className={`rounded-xl border ${scheme.border} overflow-hidden transition-all`}>
      <button
        onClick={() => !isOk && setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between ${scheme.bg} ${!isOk ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${scheme.iconBg}`}>
            <div className={scheme.text}>{icon}</div>
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-800 text-sm">{title}</p>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scheme.text}`}>{count}</span>
          {!isOk && (
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
          {isOk && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
        </div>
      </button>
      
      {isOpen && tasks.length > 0 && (
        <div className="border-t border-slate-100 bg-white">
          <div className={`overflow-y-auto ${showAll ? 'max-h-96' : 'max-h-64'}`}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-xs text-slate-500 uppercase">
                  <th className="text-left px-4 py-2 font-medium">Tarefa</th>
                  <th className="text-left px-4 py-2 font-medium">Projeto</th>
                  <th className="text-left px-4 py-2 font-medium">Responsável</th>
                  <th className="text-left px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 max-w-[250px]">
                      <p className="truncate font-medium text-slate-700" title={task.name}>{task.name}</p>
                      {task.isSubtask && (
                        <span className="text-[10px] text-slate-400 ml-1">(subtarefa)</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500 truncate max-w-[150px]">{task.projectName}</td>
                    <td className="px-4 py-2 text-slate-500">{task.assignee || '—'}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {task.status || 'Sem status'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full px-4 py-2 text-center text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 border-t transition-colors"
            >
              {showAll ? 'Mostrar menos' : `Ver todas as ${tasks.length} tarefas (+${tasks.length - displayLimit} adicionais)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Timesheet Tab Component
const TimesheetTab: React.FC<{
  data: GroupedData[];
  config: AppConfig;
}> = ({ data, config }) => {
  // Get current week dates (Monday to Sunday)
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates();
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  // Calculate timesheet data per person
  const timesheetData = useMemo(() => {
    return data.map(personData => {
      const allTasks: Task[] = [];
      personData.projects.forEach(project => {
        project.tasks.forEach(task => {
          allTasks.push(task);
          if (task.subtasks) {
            allTasks.push(...task.subtasks);
          }
        });
      });

      // Calculate daily hours and tasks
      const dailyData = weekDates.map(date => {
        const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        let plannedHours = 0;
        let loggedHours = 0;
        let tasksCount = 0;
        let completedTasks = 0;

        allTasks.forEach(task => {
          // Check if task is active on this date (between start and due date)
          const startDate = task.startDate ? new Date(task.startDate) : null;
          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          
          const dateTimestamp = date.getTime();
          const isInRange = (!startDate || startDate.getTime() <= dateTimestamp) && 
                           (!dueDate || dueDate.getTime() >= dateTimestamp);

          if (isInRange) {
            tasksCount++;
            
            // Use weekly distribution if available
            if (task.weeklyDistribution && task.weeklyDistribution[dateKey]) {
              const hours = parseFloat(task.weeklyDistribution[dateKey]) || 0;
              plannedHours += hours;
            } else {
              // Fallback: distribute estimate equally across days
              if (startDate && dueDate) {
                const taskDuration = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                plannedHours += task.timeEstimate / taskDuration;
              }
            }

            // Check if task is completed
            const isCompleted = ['concluído', 'concluida', 'complete', 'done', 'closed'].some(s => 
              task.status.toLowerCase().includes(s)
            );
            if (isCompleted) completedTasks++;
          }
        });

        // Calculate logged hours (proportional to tasks)
        const totalPlanned = allTasks.reduce((sum, t) => sum + t.timeEstimate, 0);
        const totalLogged = allTasks.reduce((sum, t) => sum + t.timeLogged, 0);
        loggedHours = totalPlanned > 0 ? (plannedHours / totalPlanned) * totalLogged : 0;

        return {
          date,
          dateKey,
          plannedHours,
          loggedHours,
          tasksCount,
          completedTasks,
        };
      });

      const weekTotalPlanned = dailyData.reduce((sum, d) => sum + d.plannedHours, 0);
      const weekTotalLogged = dailyData.reduce((sum, d) => sum + d.loggedHours, 0);
      const weekTotalTasks = dailyData.reduce((sum, d) => sum + d.tasksCount, 0);
      const weekCompletedTasks = dailyData.reduce((sum, d) => sum + d.completedTasks, 0);

      return {
        assignee: personData.assignee,
        dailyData,
        weekTotalPlanned,
        weekTotalLogged,
        weekTotalTasks,
        weekCompletedTasks,
      };
    });
  }, [data, weekDates]);

  const globalStats = useMemo(() => {
    const totalPlanned = timesheetData.reduce((sum, p) => sum + p.weekTotalPlanned, 0);
    const totalLogged = timesheetData.reduce((sum, p) => sum + p.weekTotalLogged, 0);
    const totalTasks = timesheetData.reduce((sum, p) => sum + p.weekTotalTasks, 0);
    const completedTasks = timesheetData.reduce((sum, p) => sum + p.weekCompletedTasks, 0);
    const capacity = timesheetData.length * 40; // Assuming 40h/week per person

    return {
      totalPlanned,
      totalLogged,
      totalTasks,
      completedTasks,
      capacity,
      utilizationRate: capacity > 0 ? (totalPlanned / capacity) * 100 : 0,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  }, [timesheetData]);

  // Get heat map intensity (0-1)
  const getHeatIntensity = (hours: number): number => {
    const maxHoursPerDay = 8;
    return Math.min(hours / maxHoursPerDay, 1);
  };

  // Get heat color class
  const getHeatColor = (intensity: number): string => {
    if (intensity === 0) return 'bg-slate-50';
    if (intensity < 0.25) return 'bg-sky-100';
    if (intensity < 0.5) return 'bg-sky-200';
    if (intensity < 0.75) return 'bg-sky-400';
    return 'bg-sky-600';
  };

  return (
    <div className="space-y-6">
      {/* Header with Week Range */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Timesheet Semanal</h2>
            <p className="text-sky-100 text-sm">
              {weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} - {weekEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Clock className="w-12 h-12 opacity-20" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sky-100 text-xs mb-1">Horas Planejadas</p>
            <p className="text-2xl font-bold">{globalStats.totalPlanned.toFixed(0)}h</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sky-100 text-xs mb-1">Capacidade</p>
            <p className="text-2xl font-bold">{globalStats.capacity}h</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sky-100 text-xs mb-1">Utilização</p>
            <p className="text-2xl font-bold">{globalStats.utilizationRate.toFixed(0)}%</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4">
            <p className="text-sky-100 text-xs mb-1">Tarefas Concluídas</p>
            <p className="text-2xl font-bold">{globalStats.completedTasks}/{globalStats.totalTasks}</p>
          </div>
        </div>
      </div>

      {/* Heat Map Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Timeline Semanal</h3>
            <p className="text-sm text-slate-500">Distribuição de horas por pessoa e dia</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-50 border"></span>
              0h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-100"></span>
              1-2h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-200"></span>
              2-4h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-400 text-white"></span>
              4-6h
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-sky-600 text-white"></span>
              6-8h
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 sticky left-0 bg-white">
                  Pessoa
                </th>
                {weekDates.map(date => (
                  <th key={date.toISOString()} className="text-center py-3 px-3 min-w-[80px]">
                    <div className="text-xs font-semibold text-slate-600">
                      {date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                    </div>
                    <div className="text-xs text-slate-400">
                      {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </th>
                ))}
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-600">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {timesheetData.map(person => (
                <tr key={person.assignee} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-700 sticky left-0 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                        {person.assignee.charAt(0)}
                      </div>
                      <span className="text-sm">{person.assignee}</span>
                    </div>
                  </td>
                  {person.dailyData.map(day => {
                    const intensity = getHeatIntensity(day.plannedHours);
                    const colorClass = getHeatColor(intensity);
                    return (
                      <td key={day.dateKey} className="text-center py-3 px-3">
                        <div 
                          className={`rounded-lg p-3 transition-all hover:scale-105 cursor-pointer ${colorClass} ${intensity > 0.5 ? 'text-white' : 'text-slate-700'}`}
                          title={`${day.plannedHours.toFixed(1)}h planejadas | ${day.tasksCount} tarefas`}
                        >
                          <div className="text-sm font-bold">
                            {day.plannedHours > 0 ? `${day.plannedHours.toFixed(1)}h` : '-'}
                          </div>
                          {day.tasksCount > 0 && (
                            <div className="text-xs opacity-75">
                              {day.completedTasks}/{day.tasksCount}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="text-center py-3 px-4">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-800">
                        {person.weekTotalPlanned.toFixed(1)}h
                      </span>
                      <span className="text-xs text-slate-500">
                        /40h
                      </span>
                      <div className="w-full mt-2">
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-500 rounded-full transition-all"
                            style={{ width: `${Math.min((person.weekTotalPlanned / 40) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Capacity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Capacidade vs Demanda</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Planejado</span>
                <span className="text-sm font-bold text-slate-800">{globalStats.totalPlanned.toFixed(0)}h</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all"
                  style={{ width: `${(globalStats.totalPlanned / globalStats.capacity) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Capacidade Total</span>
                <span className="text-sm font-bold text-slate-800">{globalStats.capacity}h</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Taxa de Utilização</span>
                <span className={`text-2xl font-bold ${
                  globalStats.utilizationRate > 90 ? 'text-red-600' :
                  globalStats.utilizationRate > 70 ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  {globalStats.utilizationRate.toFixed(0)}%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {globalStats.utilizationRate > 90 ? '⚠️ Equipe sobrecarregada' :
                 globalStats.utilizationRate > 70 ? '✅ Utilização saudável' :
                 '📊 Capacidade disponível'}
              </p>
            </div>
          </div>
        </div>

        {/* Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Performance da Semana</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Taxa de Conclusão</span>
                <span className="text-2xl font-bold text-emerald-600">{globalStats.completionRate.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${globalStats.completionRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <p className="text-3xl font-bold text-emerald-600">{globalStats.completedTasks}</p>
                <p className="text-xs text-emerald-700 mt-1">Concluídas</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <p className="text-3xl font-bold text-slate-600">{globalStats.totalTasks - globalStats.completedTasks}</p>
                <p className="text-xs text-slate-600 mt-1">Pendentes</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>
                  Velocidade: {(globalStats.completedTasks / 7).toFixed(1)} tarefas/dia
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed View by Person and Project */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">Detalhamento por Pessoa e Projeto</h3>
          <p className="text-sm text-slate-500">Horas planejadas, gastas e desvio por dia</p>
        </div>

        {data.map(personData => {
          // Calculate project breakdown per day
          const projectBreakdown = personData.projects.map(project => {
            const dailyData = weekDates.map(date => {
              const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              let plannedHours = 0;
              let loggedHours = 0;

              // Sum hours from all tasks in this project
              project.tasks.forEach(task => {
                const allTasksInTree = [task, ...(task.subtasks || [])];
                allTasksInTree.forEach(t => {
                  const startDate = t.startDate ? new Date(t.startDate) : null;
                  const dueDate = t.dueDate ? new Date(t.dueDate) : null;
                  const dateTimestamp = date.getTime();
                  const isInRange = (!startDate || startDate.getTime() <= dateTimestamp) && 
                                   (!dueDate || dueDate.getTime() >= dateTimestamp);

                  if (isInRange) {
                    // Use weekly distribution if available
                    if (t.weeklyDistribution && t.weeklyDistribution[dateKey]) {
                      const hours = parseFloat(t.weeklyDistribution[dateKey]) || 0;
                      plannedHours += hours;
                    } else if (startDate && dueDate) {
                      // Fallback: distribute equally
                      const taskDuration = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                      plannedHours += t.timeEstimate / taskDuration;
                    }
                  }
                });
              });

              // Calculate logged hours proportionally
              const projectTotalPlanned = project.stats.planned;
              const projectTotalLogged = project.stats.logged;
              loggedHours = projectTotalPlanned > 0 ? (plannedHours / projectTotalPlanned) * projectTotalLogged : 0;

              const deviation = loggedHours - plannedHours;

              return {
                date,
                dateKey,
                plannedHours,
                loggedHours,
                deviation,
              };
            });

            const weekTotalPlanned = dailyData.reduce((sum, d) => sum + d.plannedHours, 0);
            const weekTotalLogged = dailyData.reduce((sum, d) => sum + d.loggedHours, 0);
            const weekTotalDeviation = weekTotalLogged - weekTotalPlanned;

            return {
              projectName: project.name,
              dailyData,
              weekTotalPlanned,
              weekTotalLogged,
              weekTotalDeviation,
            };
          });

          // Calculate person's daily subtotals
          const personDailySubtotals = weekDates.map((date, idx) => {
            const plannedSum = projectBreakdown.reduce((sum, p) => sum + p.dailyData[idx].plannedHours, 0);
            const loggedSum = projectBreakdown.reduce((sum, p) => sum + p.dailyData[idx].loggedHours, 0);
            const deviationSum = loggedSum - plannedSum;
            return { plannedSum, loggedSum, deviationSum };
          });

          const personWeekTotal = {
            planned: projectBreakdown.reduce((sum, p) => sum + p.weekTotalPlanned, 0),
            logged: projectBreakdown.reduce((sum, p) => sum + p.weekTotalLogged, 0),
            deviation: projectBreakdown.reduce((sum, p) => sum + p.weekTotalDeviation, 0),
          };

          return (
            <div key={personData.assignee} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Person Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-lg font-bold">
                    {personData.assignee.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{personData.assignee}</h4>
                    <p className="text-slate-300 text-sm">{projectBreakdown.length} projetos ativos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white text-2xl font-bold">{personWeekTotal.planned.toFixed(1)}h</p>
                  <p className="text-slate-300 text-xs">Total Semanal</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-slate-600 min-w-[200px]">
                        Projeto
                      </th>
                      {weekDates.map(date => (
                        <th key={date.toISOString()} className="text-center py-3 px-2 font-semibold text-slate-600">
                          <div className="text-xs">
                            {date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-xs text-slate-400">
                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        </th>
                      ))}
                      <th className="text-center py-3 px-4 font-semibold text-slate-600">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Subtotal Row */}
                    <tr className="bg-sky-50 border-b-2 border-sky-200 font-bold">
                      <td className="py-3 px-4 text-sky-900">
                        Subtotal de horas diárias na semana até o momento
                      </td>
                      {personDailySubtotals.map((day, idx) => (
                        <td key={idx} className="text-center py-3 px-2">
                          <div className="space-y-1">
                            <div className="text-sky-900">{day.plannedSum.toFixed(2)}</div>
                            <div className="text-sky-700 text-xs">{day.loggedSum.toFixed(2)}</div>
                            <div className={`text-xs font-semibold ${
                              day.deviationSum > 0 ? 'text-red-600' : 
                              day.deviationSum < 0 ? 'text-emerald-600' : 'text-slate-500'
                            }`}>
                              {day.deviationSum > 0 ? '+' : ''}{day.deviationSum.toFixed(2)}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="text-center py-3 px-4">
                        <div className="space-y-1">
                          <div className="text-sky-900">{personWeekTotal.planned.toFixed(2)}</div>
                          <div className="text-sky-700 text-xs">{personWeekTotal.logged.toFixed(2)}</div>
                          <div className={`text-xs font-semibold ${
                            personWeekTotal.deviation > 0 ? 'text-red-600' : 
                            personWeekTotal.deviation < 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}>
                            {personWeekTotal.deviation > 0 ? '+' : ''}{personWeekTotal.deviation.toFixed(2)}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Project Rows */}
                    {projectBreakdown.map((project, projectIdx) => (
                      <tr key={project.projectName} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                        projectIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      }`}>
                        <td className="py-3 px-4 font-medium text-slate-700">
                          {project.projectName}
                        </td>
                        {project.dailyData.map((day, dayIdx) => (
                          <td key={day.dateKey} className="text-center py-3 px-2">
                            {day.plannedHours > 0 || day.loggedHours > 0 ? (
                              <div className="space-y-0.5">
                                <div className="text-slate-800 font-medium">
                                  {day.plannedHours.toFixed(2)}
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {day.loggedHours.toFixed(2)}
                                </div>
                                <div className={`text-xs ${
                                  day.deviation > 0 ? 'text-red-600' : 
                                  day.deviation < 0 ? 'text-emerald-600' : 'text-slate-400'
                                }`}>
                                  {day.deviation !== 0 && (
                                    <>{day.deviation > 0 ? '+' : ''}{day.deviation.toFixed(2)}</>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        ))}
                        <td className="text-center py-3 px-4">
                          <div className="space-y-0.5">
                            <div className="text-slate-800 font-bold">
                              {project.weekTotalPlanned.toFixed(2)}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {project.weekTotalLogged.toFixed(2)}
                            </div>
                            <div className={`text-xs font-semibold ${
                              project.weekTotalDeviation > 0 ? 'text-red-600' : 
                              project.weekTotalDeviation < 0 ? 'text-emerald-600' : 'text-slate-500'
                            }`}>
                              {project.weekTotalDeviation !== 0 && (
                                <>{project.weekTotalDeviation > 0 ? '+' : ''}{project.weekTotalDeviation.toFixed(2)}</>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="bg-slate-50 px-6 py-3 border-t border-slate-200">
                <div className="flex items-center gap-6 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-800"></div>
                    <span>Horas Planejadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-500"></div>
                    <span>Horas Gastas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-600"></div>
                    <span>Desvio Positivo (excesso)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-600"></div>
                    <span>Desvio Negativo (economia)</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Task Control Tab Component
const TaskControlTab: React.FC<{
  taskControl: {
    withoutAssignee: Task[];
    withoutEstimate: Task[];
    withoutDueDate: Task[];
    withoutStartDate: Task[];
    withoutPriority: Task[];
    withoutDescription: Task[];
    totalIncomplete: number;
  };
  totalPending: number;
}> = ({ taskControl, totalPending }) => {
  const qualityScore = totalPending > 0 
    ? Math.round(((totalPending - taskControl.totalIncomplete) / totalPending) * 100)
    : 100;

  const allFields = [
    { key: 'assignee', title: 'Sem Responsável', subtitle: 'Quem vai fazer?', tasks: taskControl.withoutAssignee, icon: <Users className="w-4 h-4" />, color: 'red' as const },
    { key: 'priority', title: 'Sem Prioridade', subtitle: 'Qual a urgência?', tasks: taskControl.withoutPriority, icon: <Target className="w-4 h-4" />, color: 'violet' as const },
    { key: 'startDate', title: 'Sem Data Inicial', subtitle: 'Quando começa?', tasks: taskControl.withoutStartDate, icon: <Play className="w-4 h-4" />, color: 'sky' as const },
    { key: 'dueDate', title: 'Sem Data de Vencimento', subtitle: 'Quando termina?', tasks: taskControl.withoutDueDate, icon: <CalendarRange className="w-4 h-4" />, color: 'orange' as const },
    { key: 'estimate', title: 'Sem Estimativa de Tempo', subtitle: 'Quanto tempo leva?', tasks: taskControl.withoutEstimate, icon: <Clock className="w-4 h-4" />, color: 'amber' as const },
    { key: 'description', title: 'Sem Descrição', subtitle: 'O que fazer?', tasks: taskControl.withoutDescription, icon: <Layers className="w-4 h-4" />, color: 'sky' as const },
  ];

  const totalIssues = allFields.reduce((sum, f) => sum + f.tasks.length, 0);

  return (
    <div className="space-y-6">
      {/* Quality Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${
              qualityScore >= 90 ? 'bg-emerald-100' : 
              qualityScore >= 70 ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              <CheckCircle2 className={`w-8 h-8 ${
                qualityScore >= 90 ? 'text-emerald-600' : 
                qualityScore >= 70 ? 'text-amber-600' : 'text-red-600'
              }`} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Qualidade dos Dados</h2>
              <p className="text-slate-500">
                {totalPending - taskControl.totalIncomplete} de {totalPending} tarefas com todos os campos preenchidos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className={`text-4xl font-bold ${
                qualityScore >= 90 ? 'text-emerald-600' : 
                qualityScore >= 70 ? 'text-amber-600' : 'text-red-600'
              }`}>{qualityScore}%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Score</p>
            </div>
            <div className="text-center border-l border-slate-200 pl-6">
              <p className="text-4xl font-bold text-slate-800">{totalIssues}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider">Pendências</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all rounded-full ${
                qualityScore >= 90 ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 
                qualityScore >= 70 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 
                'bg-gradient-to-r from-red-500 to-rose-400'
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {allFields.map(field => {
          const isOk = field.tasks.length === 0;
          return (
            <div 
              key={field.key}
              className={`rounded-xl p-3 text-center border ${
                isOk ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}
            >
              <p className={`text-2xl font-bold ${isOk ? 'text-emerald-600' : 'text-slate-800'}`}>
                {field.tasks.length}
              </p>
              <p className="text-xs text-slate-500 truncate">{field.title.replace('Sem ', '')}</p>
            </div>
          );
        })}
      </div>

      {/* Collapsible Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Detalhamento por Campo
        </h3>
        {allFields.map(field => (
          <CollapsibleTaskCard
            key={field.key}
            title={field.title}
            subtitle={field.subtitle}
            count={field.tasks.length}
            tasks={field.tasks}
            icon={field.icon}
            colorScheme={field.color}
          />
        ))}
      </div>
    </div>
  );
};

// New Timesheet Tab with Timeline View
const TimesheetTabNew: React.FC<{
  data: GroupedData[];
  config: AppConfig;
}> = ({ data, config }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  // Generate 30 days calendar
  const generateDays = () => {
    const days: Array<{
      date: Date;
      day: number;
      month: number;
      weekday: string;
      isWeekend: boolean;
    }> = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 15); // Start from 15 days ago
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();
      
      days.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth() + 1,
        weekday: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    return days;
  };

  const days = generateDays();

  // Build projects structure
  const projectsData = useMemo(() => {
    const projectsMap = new Map<string, {
      id: string;
      name: string;
      color: string;
      tasks: Array<{
        id: string;
        name: string;
        members: Array<{
          name: string;
          avatar: string;
          hours: Array<{ planned: number; actual: number }>;
        }>;
      }>;
    }>();

    data.forEach(personData => {
      personData.projects.forEach(project => {
        if (!projectsMap.has(project.projectName)) {
          projectsMap.set(project.projectName, {
            id: project.projectName.toLowerCase().replace(/\s+/g, '-'),
            name: project.projectName,
            color: ['blue', 'purple', 'green', 'amber', 'rose'][Math.floor(Math.random() * 5)],
            tasks: []
          });
        }

        const projectData = projectsMap.get(project.projectName)!;
        
        // Group tasks
        const tasksMap = new Map<string, Task[]>();
        project.tasks.forEach(task => {
          const taskKey = task.name;
          if (!tasksMap.has(taskKey)) {
            tasksMap.set(taskKey, []);
          }
          tasksMap.get(taskKey)!.push(task);
        });

        tasksMap.forEach((tasks, taskName) => {
          let taskData = projectData.tasks.find(t => t.name === taskName);
          if (!taskData) {
            taskData = {
              id: taskName.toLowerCase().replace(/\s+/g, '-'),
              name: taskName,
              members: []
            };
            projectData.tasks.push(taskData);
          }

          // Calculate hours for this person
          const hours = days.map(day => {
            const dateKey = day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            let plannedHours = 0;
            let actualHours = 0;

            tasks.forEach(task => {
              const startDate = task.startDate ? new Date(task.startDate) : null;
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              
              const dateTimestamp = day.date.getTime();
              const isInRange = (!startDate || startDate.getTime() <= dateTimestamp) && 
                               (!dueDate || dueDate.getTime() >= dateTimestamp);

              if (isInRange && !day.isWeekend) {
                if (task.weeklyDistribution && task.weeklyDistribution[dateKey]) {
                  const hours = parseFloat(task.weeklyDistribution[dateKey]) || 0;
                  plannedHours += hours;
                } else if (startDate && dueDate) {
                  const taskDuration = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1;
                  plannedHours += task.timeEstimate / taskDuration;
                }
              }
            });

            actualHours = plannedHours * (0.8 + Math.random() * 0.4); // Simulate actual hours
            
            return {
              planned: Math.max(0, plannedHours),
              actual: Math.max(0, Math.round(actualHours * 10) / 10)
            };
          });

          taskData.members.push({
            name: personData.assignee,
            avatar: personData.assignee.substring(0, 2).toUpperCase(),
            hours
          });
        });
      });
    });

    return Array.from(projectsMap.values());
  }, [data, days]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 500;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      amber: 'bg-amber-100 text-amber-800 border-amber-300',
      rose: 'bg-rose-100 text-rose-800 border-rose-300'
    };
    return colors[color] || colors.blue;
  };

  const getHourColor = (planned: number, actual: number) => {
    if (!actual || actual === 0) return 'bg-gray-100';
    const diff = Math.abs(actual - planned);
    const percent = planned > 0 ? (diff / planned) * 100 : 0;
    if (percent <= 10) return 'bg-green-500';
    if (percent <= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIntensity = (actual: number) => {
    if (actual === 0) return 0;
    if (actual <= 2) return 0.4;
    if (actual <= 4) return 0.6;
    if (actual <= 6) return 0.8;
    return 1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Timesheet - Visão por Projetos</h2>
            <p className="text-gray-500 mt-1">{days[0].month}/{days[0].date.getFullYear()} • Arraste para navegar pelos dias →</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">30 dias</span>
            </div>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex">
          {/* Fixed Column - Projects/Tasks/Members */}
          <div className="w-80 flex-shrink-0 border-r-2 border-gray-300 bg-gray-50">
            <div className="h-24 border-b-2 border-gray-300 flex items-center px-6 bg-gray-100">
              <span className="font-bold text-gray-700 text-sm uppercase tracking-wide">Projetos / Tarefas</span>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {projectsData.map(project => {
                const isExpanded = expandedProjects.includes(project.id);
                
                return (
                  <div key={project.id} className="border-b border-gray-200">
                    {/* Project Row */}
                    <div
                      onClick={() => toggleProject(project.id)}
                      className={`px-6 py-4 cursor-pointer hover:bg-opacity-80 transition-all ${getColorClasses(project.color)} border-l-4`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? 
                            <ChevronDown className="w-5 h-5" /> : 
                            <ChevronRight className="w-5 h-5" />
                          }
                          <span className="font-bold text-base">{project.name}</span>
                        </div>
                        <span className="text-xs px-2 py-1 bg-white bg-opacity-60 rounded font-medium">
                          {project.tasks.length} tarefas
                        </span>
                      </div>
                    </div>

                    {/* Tasks and Members */}
                    {isExpanded && project.tasks.map(task => (
                      <div key={task.id} className="bg-white">
                        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">📋 {task.name}</span>
                        </div>
                        {task.members.map((member, idx) => (
                          <div
                            key={idx}
                            className="px-8 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-t border-gray-100"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
                              {member.avatar}
                            </div>
                            <span className="text-sm font-medium text-gray-800">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scrollable Area - Timeline */}
          <div 
            className="flex-1 overflow-x-auto overflow-y-hidden" 
            ref={scrollRef}
            style={{ maxHeight: '700px' }}
          >
            <div className="inline-block min-w-full">
              {/* Calendar Header */}
              <div className="h-24 flex border-b-2 border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-20 flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-200 ${
                      day.isWeekend ? 'bg-gray-200' : 'bg-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase">{day.weekday}</span>
                    <span className="text-2xl font-bold text-gray-900 my-1">{day.day}</span>
                    <span className="text-xs text-gray-400">{day.month}/12</span>
                  </div>
                ))}
              </div>

              {/* Grid of Hours */}
              <div>
                {projectsData.map(project => {
                  const isExpanded = expandedProjects.includes(project.id);
                  
                  return (
                    <div key={project.id} className="border-b-2 border-gray-200">
                      {/* Project Row */}
                      <div className="h-16 flex bg-gray-50">
                        {days.map((day, idx) => (
                          <div
                            key={idx}
                            className={`w-20 flex-shrink-0 border-r border-gray-200 ${
                              day.isWeekend ? 'bg-gray-100' : ''
                            }`}
                          />
                        ))}
                      </div>

                      {/* Tasks */}
                      {isExpanded && project.tasks.map(task => (
                        <div key={task.id}>
                          {/* Task Row */}
                          <div className="h-12 flex bg-gray-100 border-t border-gray-200">
                            {days.map((day, idx) => (
                              <div
                                key={idx}
                                className={`w-20 flex-shrink-0 border-r border-gray-200 ${
                                  day.isWeekend ? 'bg-gray-200' : ''
                                }`}
                              />
                            ))}
                          </div>

                          {/* Members */}
                          {task.members.map((member, memberIdx) => (
                            <div key={memberIdx} className="h-16 flex border-t border-gray-100 bg-white">
                              {days.map((day, dayIdx) => {
                                const hours = member.hours[dayIdx];
                                const intensity = getIntensity(hours.actual);
                                
                                return (
                                  <div
                                    key={dayIdx}
                                    className={`w-20 flex-shrink-0 border-r border-gray-100 p-2 relative group ${
                                      day.isWeekend ? 'bg-gray-50' : ''
                                    }`}
                                  >
                                    {!day.isWeekend && hours.actual > 0 && (
                                      <>
                                        <div
                                          className={`w-full h-full rounded-lg ${getHourColor(hours.planned, hours.actual)} flex items-center justify-center transition-all hover:scale-105 hover:shadow-md cursor-pointer`}
                                          style={{ opacity: intensity }}
                                        >
                                          <span className="text-sm font-bold text-white drop-shadow">
                                            {hours.actual}h
                                          </span>
                                        </div>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                                          <div className="font-bold mb-2 text-sm">{member.name}</div>
                                          <div className="space-y-1">
                                            <div className="flex justify-between gap-4">
                                              <span className="text-gray-300">Planejado:</span>
                                              <span className="font-semibold">{hours.planned.toFixed(1)}h</span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                              <span className="text-gray-300">Realizado:</span>
                                              <span className="font-semibold">{hours.actual}h</span>
                                            </div>
                                            <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
                                              <span className="text-gray-300">Diferença:</span>
                                              <span className={`font-bold ${
                                                hours.actual > hours.planned ? 'text-red-400' : 'text-green-400'
                                              }`}>
                                                {(hours.actual - hours.planned).toFixed(1)}h
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-700">Legenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Dentro do esperado (até 10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Atenção (10-20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Crítico (acima de 20%)</span>
            </div>
          </div>
          <div className="text-sm text-gray-500 italic">
            💡 Passe o mouse sobre as células para ver detalhes completos
          </div>
        </div>
      </div>
    </div>
  );
};

// Timesheet Tab 2 - Visual Timeline with Real Data
const TimesheetTab2: React.FC<{
  data: GroupedData[];
  config: AppConfig;
}> = ({ data, config }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedPeople, setExpandedPeople] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [initialExpansionDone, setInitialExpansionDone] = useState(false);
  
  // Date range states
  const [periodType, setPeriodType] = useState<'7days' | '15days' | '30days' | 'currentMonth' | 'lastMonth' | 'custom'>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showPeriodPicker, setShowPeriodPicker] = useState(false);

  // Person filter
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [showPersonFilter, setShowPersonFilter] = useState(false);

  // Calculate date range based on period type
  const dateRange = useMemo(() => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (periodType) {
      case '7days':
        start.setDate(today.getDate() - 3);
        end.setDate(today.getDate() + 3);
        break;
      case '15days':
        start.setDate(today.getDate() - 7);
        end.setDate(today.getDate() + 7);
        break;
      case '30days':
        start.setDate(today.getDate() - 15);
        end.setDate(today.getDate() + 14);
        break;
      case 'currentMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = new Date(customStartDate);
          end = new Date(customEndDate);
        }
        break;
    }

    return { start, end };
  }, [periodType, customStartDate, customEndDate]);

  // Generate days calendar based on date range
  const days = useMemo(() => {
    const daysArray: Array<{
      date: Date;
      day: number;
      month: number;
      weekday: string;
      isWeekend: boolean;
    }> = [];
    
    const currentDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      daysArray.push({
        date: new Date(currentDate),
        day: currentDate.getDate(),
        month: currentDate.getMonth() + 1,
        weekday: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return daysArray;
  }, [dateRange]);

  // Build person-centric structure with real data
  const peopleData = useMemo(() => {
    const peopleMap = new Map<string, {
      id: string;
      name: string;
      avatar: string;
      projects: Array<{
        id: string;
        name: string;
        tag: string;
        color: string;
        totalHours: number;
        tasks: Array<{
          id: string;
          name: string;
          hours: Array<{ planned: number; actual: number }>;
        }>;
      }>;
    }>();

    const colorPalette = ['blue', 'purple', 'green', 'amber', 'rose', 'indigo', 'cyan', 'emerald'];

    data.forEach(personData => {
      if (!peopleMap.has(personData.assignee)) {
        peopleMap.set(personData.assignee, {
          id: personData.assignee.toLowerCase().replace(/\s+/g, '-'),
          name: personData.assignee,
          avatar: personData.assignee.substring(0, 2).toUpperCase(),
          projects: []
        });
      }

      const person = peopleMap.get(personData.assignee)!;

      personData.projects.forEach((project, projectIdx) => {
        let projectData = person.projects.find(p => p.name === project.name);
        if (!projectData) {
          projectData = {
            id: `${person.id}-${project.name.toLowerCase().replace(/\s+/g, '-')}`,
            name: project.name,
            tag: project.tags?.[0] || 'Sem tag',
            color: colorPalette[person.projects.length % colorPalette.length],
            totalHours: 0,
            tasks: []
          };
          person.projects.push(projectData);
        }

        // Group tasks
        project.tasks.forEach(task => {
          if (!task.isSubtask) {
            let taskData = projectData!.tasks.find(t => t.name === task.name);
            if (!taskData) {
              taskData = {
                id: `${projectData!.id}-${task.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: task.name,
                hours: []
              };
              projectData!.tasks.push(taskData);
            }

            // Calculate hours for each day
            const hours = days.map(day => {
              const dateKey = day.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              let plannedHours = 0;
              let actualHours = 0;

              const allTasks = [task, ...(task.subtasks || [])];
              
              allTasks.forEach(t => {
                const startDate = t.startDate ? new Date(t.startDate) : null;
                const dueDate = t.dueDate ? new Date(t.dueDate) : null;
                
                const dateTimestamp = day.date.getTime();
                const isInRange = (!startDate || startDate.getTime() <= dateTimestamp) && 
                                 (!dueDate || dueDate.getTime() >= dateTimestamp);

                if (isInRange && !day.isWeekend) {
                  if (t.weeklyDistribution && t.weeklyDistribution[dateKey]) {
                    const hours = parseFloat(t.weeklyDistribution[dateKey]) || 0;
                    plannedHours += hours;
                  } else if (startDate && dueDate) {
                    const taskDurationMs = dueDate.getTime() - startDate.getTime();
                    const taskDurationDays = Math.ceil(taskDurationMs / (1000 * 60 * 60 * 24)) || 1;
                    const workingDays = Math.ceil(taskDurationDays * 5 / 7);
                    plannedHours += (t.timeEstimate || 0) / (workingDays || 1);
                  }

                  const totalEstimate = allTasks.reduce((sum, tk) => sum + (tk.timeEstimate || 0), 0);
                  const totalLogged = allTasks.reduce((sum, tk) => sum + (tk.timeLogged || 0), 0);
                  if (totalEstimate > 0 && plannedHours > 0) {
                    actualHours += (plannedHours / totalEstimate) * totalLogged;
                  }
                }
              });

              return {
                planned: Math.max(0, Math.round(plannedHours * 10) / 10),
                actual: Math.max(0, Math.round(actualHours * 10) / 10)
              };
            });

            taskData.hours = hours;
          }
        });

        // Calculate total hours for project
        projectData.totalHours = projectData.tasks.reduce((sum, t) => 
          sum + t.hours.reduce((hSum, h) => hSum + h.planned, 0), 0);
      });

      // Sort projects by hours (descending)
      person.projects.sort((a, b) => b.totalHours - a.totalHours);
    });

    return Array.from(peopleMap.values());
  }, [data, days]);

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    peopleData.forEach(person => {
      person.projects.forEach(project => {
        tags.add(project.tag);
      });
    });
    return Array.from(tags).sort();
  }, [peopleData]);

  // Initialize visible tags to show all
  React.useEffect(() => {
    if (visibleTags.length === 0 && allTags.length > 0) {
      setVisibleTags(allTags);
    }
  }, [allTags, visibleTags.length]);

  // Auto-expand first person on initial load
  React.useEffect(() => {
    if (!initialExpansionDone && peopleData.length > 0) {
      setExpandedPeople([peopleData[0].id]);
      setInitialExpansionDone(true);
    }
  }, [peopleData, initialExpansionDone]);

  // Filter projects by visible tags and selected person
  const filteredPeopleData = useMemo(() => {
    let filtered = peopleData.map(person => ({
      ...person,
      projects: person.projects.filter(p => visibleTags.includes(p.tag))
    })).filter(person => person.projects.length > 0);

    // Apply person filter
    if (selectedPerson !== 'all') {
      filtered = filtered.filter(person => person.id === selectedPerson);
    }

    return filtered;
  }, [peopleData, visibleTags, selectedPerson]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 500;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const togglePerson = (personId: string) => {
    setExpandedPeople(prev =>
      prev.includes(personId)
        ? prev.filter(id => id !== personId)
        : [...prev, personId]
    );
  };

  const toggleTag = (tag: string) => {
    setVisibleTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700 border-l-blue-500',
      purple: 'bg-purple-50 text-purple-700 border-l-purple-500',
      green: 'bg-green-50 text-green-700 border-l-green-500',
      amber: 'bg-amber-50 text-amber-700 border-l-amber-500',
      rose: 'bg-rose-50 text-rose-700 border-l-rose-500',
      indigo: 'bg-indigo-50 text-indigo-700 border-l-indigo-500',
      cyan: 'bg-cyan-50 text-cyan-700 border-l-cyan-500',
      emerald: 'bg-emerald-50 text-emerald-700 border-l-emerald-500'
    };
    return colors[color] || colors.blue;
  };

  const getHourColor = (planned: number, actual: number) => {
    if (!actual || actual === 0) return 'bg-gray-100';
    if (planned === 0) return 'bg-blue-500';
    const diff = Math.abs(actual - planned);
    const percent = (diff / planned) * 100;
    if (percent <= 10) return 'bg-green-500';
    if (percent <= 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIntensity = (actual: number) => {
    if (actual === 0) return 0;
    if (actual <= 2) return 0.4;
    if (actual <= 4) return 0.6;
    if (actual <= 6) return 0.8;
    return 1;
  };

  // Export to Excel function
  const exportToExcel = () => {
    // Prepare data for export with better structure
    const exportData: any[] = [];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    filteredPeopleData.forEach(person => {
      person.projects.forEach(project => {
        project.tasks.forEach(task => {
          days.forEach((day, dayIdx) => {
            const hours = task.hours[dayIdx];
            if (hours.planned > 0 || hours.actual > 0) {
              const date = day.date;
              const diffValue = hours.actual - hours.planned;
              const diffPercent = hours.planned > 0 ? (Math.abs(diffValue) / hours.planned * 100) : 0;
              
              exportData.push({
                'Ano': date.getFullYear(),
                'Mês': monthNames[date.getMonth()],
                'Mês Número': date.getMonth() + 1,
                'Data': date.toLocaleDateString('pt-BR'),
                'Dia': date.getDate(),
                'Dia Semana': day.weekday,
                'Pessoa': person.name,
                'Projeto': project.name,
                'Tag Projeto': project.tag,
                'Tarefa': task.name,
                'Horas Planejadas': hours.planned.toFixed(2).replace('.', ','),
                'Horas Realizadas': hours.actual.toFixed(2).replace('.', ','),
                'Diferença (h)': diffValue.toFixed(2).replace('.', ','),
                'Diferença (%)': diffPercent.toFixed(1).replace('.', ',') + '%',
                'Status': hours.actual === 0 ? 'Não Iniciado' : 
                         diffPercent <= 10 ? 'OK' :
                         diffPercent <= 20 ? 'Atenção' : 'Crítico'
              });
            }
          });
        });
      });
    });

    // Create CSV content
    if (exportData.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    // Sort by date
    exportData.sort((a, b) => {
      const dateA = a['Data'].split('/').reverse().join('');
      const dateB = b['Data'].split('/').reverse().join('');
      return dateA.localeCompare(dateB);
    });

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(';'),
      ...exportData.map(row => headers.map(header => {
        const value = row[header];
        // Escape values with quotes if they contain special characters
        if (typeof value === 'string' && (value.includes(';') || value.includes(',') || value.includes('\n'))) {
          return `"${value}"`;
        }
        return value;
      }).join(';'))
    ].join('\n');

    // Create blob and download with proper CSV format
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const startMonth = monthNames[dateRange.start.getMonth()];
    const endMonth = monthNames[dateRange.end.getMonth()];
    const year = dateRange.start.getFullYear();
    
    let fileName = `Timesheet_${year}`;
    if (startMonth === endMonth) {
      fileName += `_${startMonth}`;
    } else {
      fileName += `_${startMonth}-${endMonth}`;
    }
    
    if (selectedPerson !== 'all') {
      const personName = filteredPeopleData[0]?.name || 'Pessoa';
      fileName += `_${personName.replace(/\s+/g, '_')}`;
    }
    
    fileName += '.csv';
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPeriodLabel = () => {
    switch (periodType) {
      case '7days': return '7 dias';
      case '15days': return '15 dias';
      case '30days': return '30 dias';
      case 'currentMonth': return 'Mês Atual';
      case 'lastMonth': return 'Mês Anterior';
      case 'custom': return 'Personalizado';
      default: return '30 dias';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Timesheet - Visão por Pessoa</h2>
            <p className="text-gray-500 mt-1">
              {dateRange.start.toLocaleDateString('pt-BR')} - {dateRange.end.toLocaleDateString('pt-BR')} • {days.length} dias
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodPicker(!showPeriodPicker)}
                className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {getPeriodLabel()}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPeriodPicker && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
                  <h4 className="font-semibold text-gray-700 mb-3">Selecionar Período</h4>
                  
                  <div className="space-y-2 mb-4">
                    {[
                      { value: '7days' as const, label: 'Últimos 7 dias' },
                      { value: '15days' as const, label: 'Últimos 15 dias' },
                      { value: '30days' as const, label: 'Últimos 30 dias' },
                      { value: 'currentMonth' as const, label: 'Mês Atual' },
                      { value: 'lastMonth' as const, label: 'Mês Anterior' },
                      { value: 'custom' as const, label: 'Personalizado' }
                    ].map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setPeriodType(option.value);
                          if (option.value !== 'custom') {
                            setShowPeriodPicker(false);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${
                          periodType === option.value
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {periodType === 'custom' && (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data Início</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Data Fim</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={() => setShowPeriodPicker(false)}
                        disabled={!customStartDate || !customEndDate}
                        className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        Aplicar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Person Filter */}
            <div className="relative">
              <button
                onClick={() => setShowPersonFilter(!showPersonFilter)}
                className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-medium flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {selectedPerson === 'all' ? 'Todas Pessoas' : peopleData.find(p => p.id === selectedPerson)?.name || 'Pessoa'}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showPersonFilter && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-3 max-h-96 overflow-y-auto">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Filtrar por Pessoa
                  </h4>
                  
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setSelectedPerson('all');
                        setShowPersonFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-3 ${
                        selectedPerson === 'all'
                          ? 'bg-purple-100 text-purple-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
                        ALL
                      </div>
                      <span>Todas as Pessoas</span>
                    </button>

                    <div className="border-t border-gray-200 my-2"></div>

                    {peopleData.map(person => (
                      <button
                        key={person.id}
                        onClick={() => {
                          setSelectedPerson(person.id);
                          setShowPersonFilter(false);
                          // Auto-expand selected person
                          setExpandedPeople([person.id]);
                        }}
                        className={`w-full text-left px-3 py-2 rounded transition-colors flex items-center gap-3 ${
                          selectedPerson === person.id
                            ? 'bg-purple-100 text-purple-700 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                          {person.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{person.name}</div>
                          <div className="text-xs text-gray-500">
                            {person.projects.length} {person.projects.length === 1 ? 'projeto' : 'projetos'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className="px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors font-medium flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              Filtrar Tags ({visibleTags.length}/{allTags.length})
            </button>

            <button
              onClick={exportToExcel}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>

            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tag Filter Dropdown */}
        {showTagFilter && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700">Filtrar por Tags:</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisibleTags(allTags)}
                  className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Selecionar Todas
                </button>
                <button
                  onClick={() => setVisibleTags([])}
                  className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-2 rounded-lg font-medium transition-all ${
                    visibleTags.includes(tag)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Timeline Container */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex">
          {/* Fixed Column - People > Projects > Tasks */}
          <div className="w-96 flex-shrink-0 border-r-2 border-gray-300 bg-gray-50">
            <div className="h-24 border-b-2 border-gray-300 flex items-center px-6 bg-gradient-to-r from-gray-100 to-gray-50">
              <Users className="w-5 h-5 text-gray-600 mr-3" />
              <span className="font-bold text-gray-700 text-sm uppercase tracking-wide">Pessoas / Projetos</span>
            </div>
            
            <div className="overflow-y-auto" style={{ maxHeight: '600px' }}>
              {filteredPeopleData.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>Nenhuma pessoa com horas planejadas</p>
                </div>
              ) : (
                filteredPeopleData.map(person => {
                  const isPersonExpanded = expandedPeople.includes(person.id);
                  const totalHours = person.projects.reduce((sum, p) => sum + p.totalHours, 0);
                  
                  return (
                    <div key={person.id} className="border-b border-gray-200">
                      {/* Person Row */}
                      <div
                        onClick={() => togglePerson(person.id)}
                        className="px-5 py-4 cursor-pointer hover:bg-gray-100 transition-all bg-white border-l-4 border-l-blue-500"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0">
                              {person.avatar}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                {isPersonExpanded ? 
                                  <ChevronDown className="w-4 h-4 text-gray-500" /> : 
                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                }
                                <span className="font-bold text-gray-900">{person.name}</span>
                              </div>
                              <span className="text-xs text-gray-500 mt-1 block">{totalHours.toFixed(1)}h planejadas</span>
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded font-medium">
                            {person.projects.length} {person.projects.length === 1 ? 'projeto' : 'projetos'}
                          </span>
                        </div>
                      </div>

                      {/* Projects */}
                      {isPersonExpanded && person.projects.map(project => {
                        const isProjectExpanded = expandedProjects.includes(project.id);
                        
                        return (
                          <div key={project.id} className="bg-gray-50">
                            {/* Project Row */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleProject(project.id);
                              }}
                              className={`px-8 py-3 cursor-pointer hover:bg-opacity-90 transition-all ${getColorClasses(project.color)} border-l-4`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {isProjectExpanded ? 
                                    <ChevronDown className="w-4 h-4" /> : 
                                    <ChevronRight className="w-4 h-4" />
                                  }
                                  <span className="font-semibold text-sm">{project.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 bg-white bg-opacity-60 rounded">
                                    {project.tag}
                                  </span>
                                  <span className="text-xs text-gray-600 font-medium">
                                    {project.totalHours.toFixed(0)}h
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Tasks */}
                            {isProjectExpanded && project.tasks.map(task => (
                              <div key={task.id} className="bg-white pl-16 pr-6 py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700 leading-snug">{task.name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Scrollable Area - Timeline */}
          <div 
            className="flex-1 overflow-x-auto overflow-y-hidden" 
            ref={scrollRef}
            style={{ maxHeight: '700px' }}
          >
            <div className="inline-block min-w-full">
              {/* Calendar Header */}
              <div className="h-24 flex border-b-2 border-gray-300 bg-gradient-to-b from-gray-50 to-gray-100">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={`w-20 flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-200 ${
                      day.isWeekend ? 'bg-gray-200' : 'bg-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-500 uppercase">{day.weekday}</span>
                    <span className="text-2xl font-bold text-gray-900 my-1">{day.day}</span>
                    <span className="text-xs text-gray-400">{day.month}/12</span>
                  </div>
                ))}
              </div>

              {/* Grid of Hours */}
              <div>
                {filteredPeopleData.map(person => {
                  const isPersonExpanded = expandedPeople.includes(person.id);
                  
                  return (
                    <div key={person.id} className="border-b-2 border-gray-200">
                      {/* Person Row */}
                      <div className="h-16 flex bg-white">
                        {days.map((day, idx) => (
                          <div
                            key={idx}
                            className={`w-20 flex-shrink-0 border-r border-gray-200 ${
                              day.isWeekend ? 'bg-gray-100' : ''
                            }`}
                          />
                        ))}
                      </div>

                      {/* Projects */}
                      {isPersonExpanded && person.projects.map(project => {
                        const isProjectExpanded = expandedProjects.includes(project.id);
                        
                        return (
                          <div key={project.id}>
                            {/* Project Row */}
                            <div className="h-12 flex bg-gray-50 border-t border-gray-200">
                              {days.map((day, idx) => (
                                <div
                                  key={idx}
                                  className={`w-20 flex-shrink-0 border-r border-gray-200 ${
                                    day.isWeekend ? 'bg-gray-200' : ''
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Tasks */}
                            {isProjectExpanded && project.tasks.map(task => (
                              <div key={task.id} className="h-12 flex border-t border-gray-100 bg-white">
                                {days.map((day, dayIdx) => {
                                  const hours = task.hours[dayIdx];
                                  const intensity = getIntensity(hours.actual || hours.planned);
                                  const displayValue = hours.actual > 0 ? hours.actual : hours.planned;
                                  
                                  return (
                                    <div
                                      key={dayIdx}
                                      className={`w-20 flex-shrink-0 border-r border-gray-100 p-1.5 relative group ${
                                        day.isWeekend ? 'bg-gray-50' : ''
                                      }`}
                                    >
                                      {!day.isWeekend && displayValue > 0 && (
                                        <>
                                          <div
                                            className={`w-full h-full rounded ${getHourColor(hours.planned, hours.actual)} flex items-center justify-center transition-all hover:scale-105 hover:shadow-md cursor-pointer`}
                                            style={{ opacity: intensity }}
                                          >
                                            <span className="text-xs font-bold text-white drop-shadow">
                                              {displayValue}h
                                            </span>
                                          </div>
                                          
                                          {/* Tooltip */}
                                          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                                            <div className="font-bold mb-2 text-sm">{task.name}</div>
                                            <div className="space-y-1">
                                              <div className="flex justify-between gap-4">
                                                <span className="text-gray-300">Planejado:</span>
                                                <span className="font-semibold">{hours.planned.toFixed(1)}h</span>
                                              </div>
                                              <div className="flex justify-between gap-4">
                                                <span className="text-gray-300">Realizado:</span>
                                                <span className="font-semibold">{hours.actual.toFixed(1)}h</span>
                                              </div>
                                              <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
                                                <span className="text-gray-300">Diferença:</span>
                                                <span className={`font-bold ${
                                                  hours.actual > hours.planned ? 'text-red-400' : 'text-green-400'
                                                }`}>
                                                  {(hours.actual - hours.planned).toFixed(1)}h
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-700">Legenda:</span>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Dentro do esperado (até 10%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Atenção (10-20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Crítico (acima de 20%)</span>
            </div>
          </div>
          <div className="text-sm text-gray-500 italic">
            💡 Passe o mouse sobre as células para ver detalhes completos
          </div>
        </div>
      </div>
    </div>
  );
};

// Priorities Tab Component
const PrioritiesTabContent: React.FC<{
  priorityDistribution: any[];
  priorityShowParentTasks: boolean;
  setPriorityShowParentTasks: (value: boolean) => void;
  priorityShowSubtasks: boolean;
  setPriorityShowSubtasks: (value: boolean) => void;
  priorityShowCompleted: boolean;
  setPriorityShowCompleted: (value: boolean) => void;
}> = ({ 
  priorityDistribution,
  priorityShowParentTasks,
  setPriorityShowParentTasks,
  priorityShowSubtasks,
  setPriorityShowSubtasks,
  priorityShowCompleted,
  setPriorityShowCompleted
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'insights'>('table');

  const summaryData = useMemo(() => {
    const totals = priorityDistribution.reduce((acc, p) => ({
      urgente: acc.urgente + p.priorities.urgente.count,
      alta: acc.alta + p.priorities.alta.count,
      normal: acc.normal + p.priorities.normal.count,
      baixa: acc.baixa + p.priorities.baixa.count,
      semPrior: acc.semPrior + p.priorities.sem_prioridade.count
    }), { urgente: 0, alta: 0, normal: 0, baixa: 0, semPrior: 0 });
    return totals;
  }, [priorityDistribution]);

  const getPriorityPercentage = (value: number, total: number) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  };

  const getInsights = () => {
    const insights: Array<{
      type: 'critical' | 'warning' | 'success';
      team: string;
      message: string;
      Icon: any;
    }> = [];
    
    priorityDistribution.forEach(person => {
      const urgentPercentage = person.totalHours > 0 
        ? (person.priorities.urgente.hours / person.totalHours) * 100 
        : 0;
      
      const noPriorPercentage = person.totalHours > 0
        ? (person.priorities.sem_prioridade.hours / person.totalHours) * 100
        : 0;

      if (urgentPercentage > 90) {
        insights.push({
          type: 'critical',
          team: person.member,
          message: `${urgentPercentage.toFixed(0)}% das tarefas são urgentes - possível gargalo crítico`,
          Icon: AlertCircle
        });
      }

      if (noPriorPercentage > 30) {
        insights.push({
          type: 'warning',
          team: person.member,
          message: `${noPriorPercentage.toFixed(0)}% das tarefas sem prioridade definida`,
          Icon: AlertCircle
        });
      }

      if (urgentPercentage < 20 && noPriorPercentage < 10 && person.totalHours > 50) {
        insights.push({
          type: 'success',
          team: person.member,
          message: 'Distribuição equilibrada entre prioridades',
          Icon: TrendingUp
        });
      }
    });

    return insights;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Análise de Distribuição de Prioridades</h2>
            <p className="text-slate-500 mt-1">Visão estratégica por equipe</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setViewMode('insights')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'insights'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Insights
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={priorityShowParentTasks}
              onChange={(e) => setPriorityShowParentTasks(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Tarefas Principais</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={priorityShowSubtasks}
              onChange={(e) => setPriorityShowSubtasks(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Subtarefas</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={priorityShowCompleted}
              onChange={(e) => setPriorityShowCompleted(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-700">Incluir Concluídas</span>
          </label>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">URGENTE</p>
              <p className="text-3xl font-bold mt-1">{summaryData.urgente}</p>
              <p className="text-red-100 text-xs mt-1">tarefas estimadas</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">ALTA</p>
              <p className="text-3xl font-bold mt-1">{summaryData.alta}</p>
              <p className="text-orange-100 text-xs mt-1">tarefas estimadas</p>
            </div>
            <TrendingUp className="w-12 h-12 text-orange-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">NORMAL</p>
              <p className="text-3xl font-bold mt-1">{summaryData.normal}</p>
              <p className="text-blue-100 text-xs mt-1">tarefas estimadas</p>
            </div>
            <Activity className="w-12 h-12 text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-400 to-slate-500 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-100 text-sm font-medium">BAIXA</p>
              <p className="text-3xl font-bold mt-1">{summaryData.baixa}</p>
              <p className="text-slate-100 text-xs mt-1">tarefas estimadas</p>
            </div>
            <Clock className="w-12 h-12 text-slate-200 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100 text-sm font-medium">SEM PRIORIDADE</p>
              <p className="text-3xl font-bold mt-1">{summaryData.semPrior}</p>
              <p className="text-gray-100 text-xs mt-1">tarefas estimadas</p>
            </div>
            <MinusCircle className="w-12 h-12 text-gray-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left p-4 font-semibold text-slate-700">Pessoa</th>
                  <th className="text-center p-4 font-semibold text-red-600">Urgente</th>
                  <th className="text-center p-4 font-semibold text-orange-600">Alta</th>
                  <th className="text-center p-4 font-semibold text-blue-600">Normal</th>
                  <th className="text-center p-4 font-semibold text-slate-500">Baixa</th>
                  <th className="text-center p-4 font-semibold text-gray-600">Sem Prior.</th>
                  <th className="text-center p-4 font-semibold text-slate-700">Total</th>
                  <th className="text-center p-4 font-semibold text-slate-700">Distribuição</th>
                </tr>
              </thead>
              <tbody>
                {priorityDistribution.map((team, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-slate-800">{team.member}</td>
                    <td className="text-center p-4">
                      <span className="inline-block px-3 py-1 bg-red-50 text-red-700 rounded-lg font-medium">
                        {team.priorities.urgente.hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-lg font-medium">
                        {team.priorities.alta.hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium">
                        {team.priorities.normal.hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-block px-3 py-1 bg-slate-50 text-slate-700 rounded-lg font-medium">
                        {team.priorities.baixa.hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-block px-3 py-1 bg-gray-50 text-gray-700 rounded-lg font-medium">
                        {team.priorities.sem_prioridade.hours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="text-center p-4">
                      <span className="inline-block px-4 py-1 bg-slate-700 text-white rounded-lg font-bold">
                        {team.totalHours.toFixed(1)}h
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                        {team.priorities.urgente.hours > 0 && (
                          <div
                            className="bg-red-500"
                            style={{ width: `${getPriorityPercentage(team.priorities.urgente.hours, team.totalHours)}%` }}
                            title={`Urgente: ${getPriorityPercentage(team.priorities.urgente.hours, team.totalHours)}%`}
                          />
                        )}
                        {team.priorities.alta.hours > 0 && (
                          <div
                            className="bg-orange-500"
                            style={{ width: `${getPriorityPercentage(team.priorities.alta.hours, team.totalHours)}%` }}
                            title={`Alta: ${getPriorityPercentage(team.priorities.alta.hours, team.totalHours)}%`}
                          />
                        )}
                        {team.priorities.normal.hours > 0 && (
                          <div
                            className="bg-blue-500"
                            style={{ width: `${getPriorityPercentage(team.priorities.normal.hours, team.totalHours)}%` }}
                            title={`Normal: ${getPriorityPercentage(team.priorities.normal.hours, team.totalHours)}%`}
                          />
                        )}
                        {team.priorities.baixa.hours > 0 && (
                          <div
                            className="bg-slate-400"
                            style={{ width: `${getPriorityPercentage(team.priorities.baixa.hours, team.totalHours)}%` }}
                            title={`Baixa: ${getPriorityPercentage(team.priorities.baixa.hours, team.totalHours)}%`}
                          />
                        )}
                        {team.priorities.sem_prioridade.hours > 0 && (
                          <div
                            className="bg-gray-400"
                            style={{ width: `${getPriorityPercentage(team.priorities.sem_prioridade.hours, team.totalHours)}%` }}
                            title={`Sem Prior.: ${getPriorityPercentage(team.priorities.sem_prioridade.hours, team.totalHours)}%`}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'insights' && (
        <div className="space-y-6">
          {getInsights().map((insight, idx) => (
            <div
              key={idx}
              className={`rounded-xl shadow-sm border p-6 ${
                insight.type === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : insight.type === 'warning'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    insight.type === 'critical'
                      ? 'bg-red-100'
                      : insight.type === 'warning'
                      ? 'bg-orange-100'
                      : 'bg-green-100'
                  }`}
                >
                  <insight.Icon
                    className={`w-6 h-6 ${
                      insight.type === 'critical'
                        ? 'text-red-600'
                        : insight.type === 'warning'
                        ? 'text-orange-600'
                        : 'text-green-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 mb-1">{insight.team}</h3>
                  <p className="text-slate-600">{insight.message}</p>
                </div>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recomendações</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-slate-600">
                  <strong>Redistribuir tarefas urgentes:</strong> Considerar realocar parte das tarefas urgentes dos membros mais sobrecarregados
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-slate-600">
                  <strong>Priorizar backlog:</strong> Definir prioridade para tarefas sem classificação
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <p className="text-slate-600">
                  <strong>Revisar capacidade:</strong> Avaliar se a carga de trabalho está equilibrada entre os membros da equipe
                </p>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestDashboard;
