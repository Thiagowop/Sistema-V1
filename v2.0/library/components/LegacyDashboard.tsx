import React, { useState, useMemo } from 'react';
import { GroupedData, AppConfig, Task } from '../../types';
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
  Play,
  Flame,
  Shield,
  Search,
  CircleDashed,
  Timer,
  AlertCircle,
  MoreHorizontal,
  Filter,
  Calendar
} from 'lucide-react';

// NOTE: ClickUpApiTask was removed as we use 'any' for compatibility here
// import { ClickUpApiTask } from '../services/clickup';

interface TestDashboardProps {
  data: GroupedData[];
  config: AppConfig;
  rawData?: any | null;
}

type StatusCategory = 'completed' | 'inProgress' | 'pending' | 'blocked';
type TabKey = 'overview' | 'team' | 'projects' | 'sprints' | 'deadlines' | 'priorities' | 'taskControl';

// --- HELPER FORMATTER ---
const formatHours = (value: number) => {
  if (!value) return '0h';
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

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

// --- Task Control Tab Component ---
interface TaskControlTabProps {
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
}

const TaskControlTab: React.FC<TaskControlTabProps> = ({ taskControl, totalPending }) => {
  const [activeFilter, setActiveFilter] = useState<'assignee' | 'estimate' | 'dueDate' | 'startDate' | 'priority' | 'description'>('assignee');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  
  // Helper to check if task falls within date range
  const isTaskInPeriod = (task: Task) => {
    // If no filter, show all
    if (!dateFilter.start && !dateFilter.end) return true;
    
    const start = dateFilter.start ? new Date(dateFilter.start) : new Date('1970-01-01');
    const end = dateFilter.end ? new Date(dateFilter.end) : new Date('2100-01-01');
    // Set end of day for the end date to include tasks on that day
    end.setHours(23, 59, 59, 999);

    // If task has ANY date in range, show it
    if (task.dueDate) {
      const d = new Date(task.dueDate);
      if (d >= start && d <= end) return true;
    }
    if (task.startDate) {
      const d = new Date(task.startDate);
      if (d >= start && d <= end) return true;
    }

    if (!task.dueDate && !task.startDate) return true;

    return false;
  };

  // Filter the lists based on date
  const filteredLists = useMemo(() => ({
    withoutAssignee: taskControl.withoutAssignee.filter(isTaskInPeriod),
    withoutEstimate: taskControl.withoutEstimate.filter(isTaskInPeriod),
    withoutDueDate: taskControl.withoutDueDate.filter(isTaskInPeriod),
    withoutStartDate: taskControl.withoutStartDate.filter(isTaskInPeriod),
    withoutPriority: taskControl.withoutPriority.filter(isTaskInPeriod),
    withoutDescription: taskControl.withoutDescription.filter(isTaskInPeriod),
  }), [taskControl, dateFilter]);

  // Recalculate Total Incomplete based on filtered lists
  const filteredTotalIncomplete = useMemo(() => {
    const ids = new Set([
      ...filteredLists.withoutAssignee.map(t => t.id),
      ...filteredLists.withoutEstimate.map(t => t.id),
      ...filteredLists.withoutDueDate.map(t => t.id),
      ...filteredLists.withoutStartDate.map(t => t.id),
      ...filteredLists.withoutPriority.map(t => t.id),
      ...filteredLists.withoutDescription.map(t => t.id),
    ]);
    return ids.size;
  }, [filteredLists]);

  const filters = [
    { key: 'assignee', label: 'Sem Responsável', count: filteredLists.withoutAssignee.length },
    { key: 'priority', label: 'Sem Prioridade', count: filteredLists.withoutPriority.length },
    { key: 'dueDate', label: 'Sem Prazo', count: filteredLists.withoutDueDate.length },
    { key: 'estimate', label: 'Sem Estimativa', count: filteredLists.withoutEstimate.length },
    { key: 'description', label: 'Sem Descrição', count: filteredLists.withoutDescription.length },
    { key: 'startDate', label: 'Sem Data Início', count: filteredLists.withoutStartDate.length },
  ];

  const currentList = 
    activeFilter === 'assignee' ? filteredLists.withoutAssignee :
    activeFilter === 'priority' ? filteredLists.withoutPriority :
    activeFilter === 'dueDate' ? filteredLists.withoutDueDate :
    activeFilter === 'estimate' ? filteredLists.withoutEstimate :
    activeFilter === 'description' ? filteredLists.withoutDescription :
    filteredLists.withoutStartDate;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Date Filter Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex items-center gap-2 text-slate-600">
            <Filter size={20} className="text-indigo-500" />
            <span className="font-bold text-sm">Filtro Temporal</span>
         </div>
         <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full md:w-auto">
               <span className="text-xs font-bold text-slate-400 uppercase">De</span>
               <input 
                 type="date" 
                 className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                 value={dateFilter.start}
                 onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
               />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 w-full md:w-auto">
               <span className="text-xs font-bold text-slate-400 uppercase">Até</span>
               <input 
                 type="date" 
                 className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none"
                 value={dateFilter.end}
                 onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
               />
            </div>
            {(dateFilter.start || dateFilter.end) && (
              <button 
                onClick={() => setDateFilter({ start: '', end: '' })}
                className="text-xs font-bold text-rose-500 hover:text-rose-700 underline"
              >
                Limpar
              </button>
            )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
             <AlertTriangle className="text-amber-500" size={20} />
             Qualidade do Backlog
           </h3>
           <div className="flex items-center gap-4">
             <div className="flex-1">
               <p className="text-sm text-slate-500 mb-1">Tarefas com dados incompletos</p>
               <p className="text-3xl font-bold text-slate-800">{filteredTotalIncomplete}</p>
             </div>
             <div className="w-px h-12 bg-slate-100"></div>
             <div className="flex-1">
               <p className="text-sm text-slate-500 mb-1">Impacto no Planejamento</p>
               <p className="text-xl font-bold text-rose-600">
                 {totalPending > 0 ? Math.round((filteredTotalIncomplete / totalPending) * 100) : 0}%
               </p>
             </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4">Categorias de Erro</h3>
           <div className="grid grid-cols-2 gap-2">
              {filters.map(f => (
                <button 
                  key={f.key}
                  onClick={() => setActiveFilter(f.key as any)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${activeFilter === f.key ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-indigo-100'}`}
                >
                   <span className="text-xs font-bold">{f.label}</span>
                   <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.count > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{f.count}</span>
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
           <h4 className="font-bold text-slate-700 flex items-center gap-2">
             Tarefas: {filters.find(f => f.key === activeFilter)?.label}
           </h4>
           <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">
             {currentList.length} itens
           </span>
        </div>
        
        {currentList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
             <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-200" />
             <p>Nenhuma tarefa encontrada nesta categoria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {currentList.map(task => (
              <div key={task.id} className="px-6 py-4 hover:bg-slate-50 flex items-center justify-between group">
                 <div>
                   <p className="font-medium text-slate-800">{task.name}</p>
                   <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                     <span>{task.projectName}</span>
                     <span>•</span>
                     <span>{task.assignee || 'Sem responsável'}</span>
                     {(task.dueDate || task.startDate) && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                             <Calendar size={10} />
                             {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : new Date(task.startDate!).toLocaleDateString('pt-BR')}
                          </span>
                        </>
                     )}
                   </p>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{task.id}</span>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TestDashboard: React.FC<TestDashboardProps> = ({ data, config, rawData }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Sort data by team member order
  const sortedData = useMemo(() => {
    if (!config.teamMemberOrder || config.teamMemberOrder.length === 0) {
      return data;
    }
    const orderMap = new Map(config.teamMemberOrder.map((name, idx) => [name.toLowerCase(), idx]));
    return [...data].sort((a, b) => {
      const aIdx = orderMap.get(a.assignee.toLowerCase()) ?? 999;
      const bIdx = orderMap.get(b.assignee.toLowerCase()) ?? 999;
      return (aIdx as number) - (bIdx as number);
    });
  }, [data, config.teamMemberOrder]);

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
            if (!teamMap.has(memberName)) {
              teamMap.set(memberName, {
                member: memberName,
                total: 0,
                completed: 0,
                inProgress: 0,
                blocked: 0,
                overdue: 0,
                planned: 0,
                logged: 0,
              });
            }
            const memberEntry = teamMap.get(memberName)!;
            memberEntry.total++;
            if (status === 'completed') memberEntry.completed++;
            else if (status === 'inProgress') memberEntry.inProgress++;
            else if (status === 'blocked') memberEntry.blocked++;

            memberEntry.planned += t.timeEstimate || 0;
            memberEntry.logged += t.timeLogged || 0;
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

            // Deadlines
            if (t.dueDate && status !== 'completed') {
              const due = new Date(t.dueDate);
              due.setHours(0, 0, 0, 0);
              if (!seenIds.has(t.id)) {
                seenIds.add(t.id);
                if (due < now) {
                  overdue.push(t);
                  memberEntry.overdue++;
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

            // Priority distribution by person
            const bucket = getPriorityBucket(t.priority);
            if (!priorityDistribution.has(memberName)) {
              priorityDistribution.set(memberName, new Map([
                ['urgente', { count: 0, hours: 0 }],
                ['alta', { count: 0, hours: 0 }],
                ['normal', { count: 0, hours: 0 }],
                ['baixa', { count: 0, hours: 0 }],
                ['sem_prioridade', { count: 0, hours: 0 }],
              ]));
            }
            const personPriorities = priorityDistribution.get(memberName)!;
            const priorityEntry = personPriorities.get(bucket)!;
            priorityEntry.count++;
            priorityEntry.hours += t.timeEstimate || 0;
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
          label: `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`,
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
  }, [sortedData]);

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Visão Geral', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'team', label: 'Equipe', icon: <Users className="w-4 h-4" /> },
    { key: 'projects', label: 'Projetos', icon: <Layers className="w-4 h-4" /> },
    { key: 'sprints', label: 'Sprints', icon: <Activity className="w-4 h-4" /> },
    { key: 'deadlines', label: 'Prazos', icon: <CalendarRange className="w-4 h-4" /> },
    { key: 'priorities', label: 'Prioridades', icon: <Target className="w-4 h-4" /> },
    { key: 'taskControl', label: 'Controle Tarefas', icon: <AlertTriangle className="w-4 h-4" /> },
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
              <h2 className="font-bold text-slate-800 text-lg">Teste Dash</h2>
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
                  value={formatHours(overview.totalLogged)}
                  subtitle={`de ${formatHours(overview.totalPlanned)} planejadas`}
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
                          <span className="text-slate-500">Horas: {formatHours(member.logged)} / {formatHours(member.planned)}</span>
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
            <div className="space-y-4">
              {projects.length === 0 ? (
                <EmptyState message="Nenhum projeto encontrado" />
              ) : (
                projects.slice(0, 12).map(project => (
                  <div key={project.name} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                            <Layers className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800 truncate">{project.name}</h4>
                            <p className="text-xs text-slate-500">
                              {project.assignees.length > 0 ? project.assignees.join(', ') : 'Equipe não definida'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {project.total} tarefas
                        </span>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                          {project.completed} concluídas
                        </span>
                        {project.blocked > 0 && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-600">
                            {project.blocked} bloqueadas
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Conclusão</p>
                          <ProgressBar value={project.completionRate} color="green" showLabel size="sm" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">T. Estimado</p>
                          <p className="text-sm font-semibold text-sky-600">{formatHours(project.planned)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">T. Adicional</p>
                          <p className={`text-sm font-semibold ${project.additional > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {project.additional > 0 ? `+${formatHours(project.additional)}` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">T. Restante</p>
                          <p className={`text-sm font-semibold ${project.remaining > 0 ? 'text-violet-600' : 'text-slate-400'}`}>
                            {project.remaining > 0 ? `${formatHours(project.remaining)}` : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">T. Registrado</p>
                          <p className="text-sm font-semibold text-emerald-600">{formatHours(project.logged)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                          <span className="font-semibold text-slate-700">{formatHours(week.hours)}</span> registradas
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
            <div className="space-y-6 animate-fadeIn">
              
              {/* Strategic KPI Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Firefighting Index (Reactivity) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Flame size={64} className="text-orange-500" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Índice de "Incêndios"</p>
                     <p className="text-xs text-slate-400 mt-1">Razão entre tarefas Urgentes/Altas vs Normais</p>
                   </div>
                   <div className="mt-4">
                     {(() => {
                        const totalHigh = priorityDistribution.reduce((acc, p) => acc + p.priorities.urgente.hours + p.priorities.alta.hours, 0);
                        const totalNormal = priorityDistribution.reduce((acc, p) => acc + p.priorities.normal.hours + p.priorities.baixa.hours, 0);
                        const ratio = totalNormal > 0 ? (totalHigh / totalNormal) : 0;
                        const isBad = ratio > 0.5; 
                        
                        return (
                          <div>
                            <span className={`text-4xl font-bold ${isBad ? 'text-red-600' : 'text-emerald-600'}`}>
                              {(ratio * 100).toFixed(0)}%
                            </span>
                            <div className={`mt-2 text-xs font-bold px-2 py-1 inline-block rounded-full ${isBad ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isBad ? '🔥 Alta Reatividade' : '✅ Fluxo Controlado'}
                            </div>
                          </div>
                        );
                     })()}
                   </div>
                </div>

                {/* 2. Top Offender (Bottleneck) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <AlertTriangle size={64} className="text-red-500" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Maior Gargalo P1</p>
                     <p className="text-xs text-slate-400 mt-1">Pessoa com mais horas urgentes acumuladas</p>
                   </div>
                   <div className="mt-4">
                     {(() => {
                        const topOffender = [...priorityDistribution].sort((a, b) => b.priorities.urgente.hours - a.priorities.urgente.hours)[0];
                        if (!topOffender || topOffender.priorities.urgente.hours === 0) return <p className="text-2xl font-bold text-slate-400">Nenhum</p>;
                        
                        return (
                          <div>
                            <span className="text-3xl font-bold text-slate-800">
                              {topOffender.member}
                            </span>
                            <div className="flex items-center gap-2 mt-2 text-red-600 font-bold">
                              <span>{formatHours(topOffender.priorities.urgente.hours)} Urgentes</span>
                            </div>
                          </div>
                        );
                     })()}
                   </div>
                </div>

                {/* 3. Planning Adherence */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Shield size={64} className="text-blue-500" />
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Tarefas sem Prioridade</p>
                     <p className="text-xs text-slate-400 mt-1">Risco de planejamento invisível</p>
                   </div>
                   <div className="mt-4">
                     {(() => {
                        const totalNoPrio = priorityDistribution.reduce((acc, p) => acc + p.priorities.sem_prioridade.hours, 0);
                        return (
                          <div>
                            <span className={`text-4xl font-bold ${totalNoPrio > 20 ? 'text-amber-500' : 'text-slate-700'}`}>
                              {formatHours(totalNoPrio)}
                            </span>
                            <div className="mt-2 text-xs text-slate-500">
                              Não classificadas
                            </div>
                          </div>
                        );
                     })()}
                   </div>
                </div>

              </div>

              {/* Priority Heatmap Matrix */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Matriz de Calor de Prioridades</h3>
                      <p className="text-xs text-slate-500">Identificação visual de sobrecarga</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-100 border"></div> Baixo</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-200"></div> Médio</span>
                     <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Alto</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-4 font-bold">Colaborador</th>
                        <th className="text-center px-2 py-4 w-32 text-red-600 font-bold border-l border-slate-100">Urgente (P1)</th>
                        <th className="text-center px-2 py-4 w-32 text-orange-600 font-bold border-l border-slate-100">Alta (P2)</th>
                        <th className="text-center px-2 py-4 w-32 text-blue-600 font-bold border-l border-slate-100">Normal (P3)</th>
                        <th className="text-center px-2 py-4 w-32 text-slate-600 font-bold border-l border-slate-100">Baixa (P4)</th>
                        <th className="text-center px-2 py-4 w-32 text-slate-400 font-bold border-l border-slate-100">N/A</th>
                        <th className="text-right px-6 py-4 w-32 font-bold text-slate-800 border-l border-slate-100">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {priorityDistribution.map((row) => {
                        // Helper to get heatmap color intensity based on hours
                        const getHeatmapClass = (hours: number, type: 'red' | 'orange' | 'blue' | 'slate') => {
                          if (hours === 0) return 'text-slate-300';
                          if (hours < 10) return `bg-${type}-50 text-${type}-700`;
                          if (hours < 30) return `bg-${type}-100 text-${type}-800 font-semibold`;
                          return `bg-${type}-200 text-${type}-900 font-bold border border-${type}-300`;
                        };

                        return (
                          <tr key={row.member} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                  {row.member.substring(0,2).toUpperCase()}
                                </div>
                                <span className="font-semibold text-slate-700">{row.member}</span>
                              </div>
                            </td>
                            
                            {/* Urgent Cell */}
                            <td className="p-1 border-l border-slate-100">
                               <div className={`h-full w-full rounded-lg flex flex-col items-center justify-center py-2 ${getHeatmapClass(row.priorities.urgente.hours, 'red')}`}>
                                  <span>{row.priorities.urgente.hours > 0 ? formatHours(row.priorities.urgente.hours) : '—'}</span>
                                  {row.priorities.urgente.hours > 0 && <span className="text-[10px] opacity-70">{row.priorities.urgente.count} tasks</span>}
                               </div>
                            </td>

                             {/* High Cell */}
                             <td className="p-1 border-l border-slate-100">
                               <div className={`h-full w-full rounded-lg flex flex-col items-center justify-center py-2 ${getHeatmapClass(row.priorities.alta.hours, 'orange')}`}>
                                  <span>{row.priorities.alta.hours > 0 ? formatHours(row.priorities.alta.hours) : '—'}</span>
                                  {row.priorities.alta.hours > 0 && <span className="text-[10px] opacity-70">{row.priorities.alta.count} tasks</span>}
                               </div>
                            </td>

                             {/* Normal Cell */}
                             <td className="p-1 border-l border-slate-100">
                               <div className={`h-full w-full rounded-lg flex flex-col items-center justify-center py-2 ${getHeatmapClass(row.priorities.normal.hours, 'blue')}`}>
                                  <span>{row.priorities.normal.hours > 0 ? formatHours(row.priorities.normal.hours) : '—'}</span>
                                  {row.priorities.normal.hours > 0 && <span className="text-[10px] opacity-70">{row.priorities.normal.count} tasks</span>}
                               </div>
                            </td>

                             {/* Low Cell */}
                             <td className="p-1 border-l border-slate-100">
                               <div className={`h-full w-full rounded-lg flex flex-col items-center justify-center py-2 ${getHeatmapClass(row.priorities.baixa.hours, 'slate')}`}>
                                  <span>{row.priorities.baixa.hours > 0 ? formatHours(row.priorities.baixa.hours) : '—'}</span>
                                  {row.priorities.baixa.hours > 0 && <span className="text-[10px] opacity-70">{row.priorities.baixa.count} tasks</span>}
                               </div>
                            </td>

                             {/* N/A Cell */}
                             <td className="p-1 border-l border-slate-100">
                               <div className={`h-full w-full rounded-lg flex flex-col items-center justify-center py-2 ${row.priorities.sem_prioridade.hours > 0 ? 'bg-gray-100 text-gray-600 font-medium' : 'text-slate-300'}`}>
                                  <span>{row.priorities.sem_prioridade.hours > 0 ? formatHours(row.priorities.sem_prioridade.hours) : '—'}</span>
                               </div>
                            </td>

                            <td className="px-6 py-4 text-right font-bold text-slate-800 border-l border-slate-100">
                               {formatHours(row.totalHours)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Improved Visual Distribution */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold text-slate-800">Distribuição Visual Proporcional</h3>
                   <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500"></div> Urgente</span>
                      <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-500"></div> Alta</span>
                      <span className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500"></div> Normal</span>
                   </div>
                </div>
                
                <div className="space-y-6">
                  {priorityDistribution.map(row => (
                    <div key={row.member} className="group">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">{row.member}</span>
                        <span className="text-slate-500 group-hover:text-indigo-600 transition-colors">{formatHours(row.totalHours)} estimadas</span>
                      </div>
                      <div className="h-4 rounded-full overflow-hidden bg-slate-100 flex shadow-inner">
                        {row.totalHours > 0 && (
                          <>
                            {row.priorities.urgente.hours > 0 && (
                              <div 
                                className="bg-red-500 hover:bg-red-400 transition-colors relative group/bar" 
                                style={{ width: `${(row.priorities.urgente.hours / row.totalHours) * 100}%` }}
                              />
                            )}
                            {row.priorities.alta.hours > 0 && (
                              <div 
                                className="bg-orange-500 hover:bg-orange-400 transition-colors" 
                                style={{ width: `${(row.priorities.alta.hours / row.totalHours) * 100}%` }}
                              />
                            )}
                            {row.priorities.normal.hours > 0 && (
                              <div 
                                className="bg-blue-500 hover:bg-blue-400 transition-colors" 
                                style={{ width: `${(row.priorities.normal.hours / row.totalHours) * 100}%` }}
                              />
                            )}
                            {row.priorities.baixa.hours > 0 && (
                              <div 
                                className="bg-slate-400 hover:bg-slate-300 transition-colors" 
                                style={{ width: `${(row.priorities.baixa.hours / row.totalHours) * 100}%` }}
                              />
                            )}
                            {row.priorities.sem_prioridade.hours > 0 && (
                              <div 
                                className="bg-gray-200" 
                                style={{ width: `${(row.priorities.sem_prioridade.hours / row.totalHours) * 100}%` }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task Control Tab */}
          {activeTab === 'taskControl' && (
            <TaskControlTab 
              taskControl={taskControl} 
              totalPending={overview.totalTasks - overview.completedTasks}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default TestDashboard;
