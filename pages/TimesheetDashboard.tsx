import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, EyeOff, Moon, Sun, LayoutGrid, User, Check, AlertCircle, ToggleLeft, ToggleRight, BarChart3, Download, Settings, X, Info } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GroupedData, Task as RealTask } from '../types';
// ============================================
// TIPOS
// ============================================

type ViewMode = 'timeline' | 'calendar';

interface Hours {
  planned: number;
  actual: number;
}

interface DayData {
  date: Date;
  day: number;
  month: number;
  weekday: string;
  isWeekend: boolean;
  isToday: boolean;
}

interface Task {
  id: string;
  name: string;
  hours: Hours[];
}

interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

interface Member {
  id: string;
  name: string;
  initials: string;
  projects: Project[];
}

interface MonthOption {
  value: string;
  label: string;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  title: string;
  planned: number;
  actual: number;
}

// Props opcionais para integração com dados reais
interface TimesheetDashboardProps {
  teamMembers?: Member[];
  months?: MonthOption[];
  initialMonth?: string;
  showCompleted?: boolean;
  onMonthChange?: (month: string) => void;
  onCompletedChange?: (show: boolean) => void;
}

const TimesheetDashboard: React.FC<TimesheetDashboardProps> = ({
  teamMembers: externalTeamMembers,
  months: externalMonths,
  initialMonth,
  showCompleted = false,
  onMonthChange,
  onCompletedChange
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || '2025-12');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [showWeekends, setShowWeekends] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ViewMode>('timeline');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [expandedMembers, setExpandedMembers] = useState<string[]>([]);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [internalShowCompleted, setInternalShowCompleted] = useState<boolean>(showCompleted);
  const [internalShowTasks, setInternalShowTasks] = useState<boolean>(true);
  const [internalShowSubtasks, setInternalShowSubtasks] = useState<boolean>(true);
  const scrollSyncRef = useRef<boolean>(false);

  // Dropdown states
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cardViewMode, setCardViewMode] = useState<'compact' | 'cards'>('compact');

  useEffect(() => {
    const dark = document.documentElement.classList.contains('dark');
    setIsDark(dark);
    document.documentElement.style.backgroundColor = dark ? '#111827' : '#f9fafb';
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.style.backgroundColor = newTheme ? '#111827' : '#f9fafb';
  }, [isDark]);

  // Gerar meses dinamicamente (24 meses passados + 12 futuros)
  const generateMonths = useMemo((): MonthOption[] => {
    if (externalMonths && externalMonths.length > 0) return externalMonths;

    const result: MonthOption[] = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Gerar 24 meses passados + mês atual + 12 meses futuros = 37 meses
    for (let i = -24; i <= 12; i++) {
      const date = new Date(currentYear, currentMonth + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthStr = month.toString().padStart(2, '0');
      const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      // Capitalizar primeira letra
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      result.push({
        value: `${year}-${monthStr}`,
        label: capitalizedLabel
      });
    }
    return result;
  }, [externalMonths]);

  const months = generateMonths;

  // Anos disponíveis (extraídos dos meses)
  const availableYears = useMemo((): number[] => {
    const years = new Set<number>(months.map(m => parseInt(m.value.split('-')[0])));
    return Array.from(years).sort((a, b) => b - a); // Mais recente primeiro
  }, [months]);

  // Meses do ano selecionado
  const [selectedYear, selectedMonthNum] = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    return [y, m];
  }, [selectedMonth]);

  // Nomes dos meses em português
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Ir para mês atual
  const goToToday = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const newMonth = `${year}-${month}`;
    setSelectedMonth(newMonth);
    onMonthChange?.(newMonth);
  }, [onMonthChange]);

  // Mudar ano mantendo o mês
  const changeYear = useCallback((newYear: number) => {
    const month = selectedMonth.split('-')[1];
    const newMonth = `${newYear}-${month}`;
    setSelectedMonth(newMonth);
    onMonthChange?.(newMonth);
    setIsYearDropdownOpen(false);
  }, [selectedMonth, onMonthChange]);

  // Mudar mês mantendo o ano
  const changeMonth = useCallback((newMonth: number) => {
    const year = selectedMonth.split('-')[0];
    const monthStr = newMonth.toString().padStart(2, '0');
    const newMonthValue = `${year}-${monthStr}`;
    setSelectedMonth(newMonthValue);
    onMonthChange?.(newMonthValue);
    setIsMonthDropdownOpen(false);
  }, [selectedMonth, onMonthChange]);

  const handleMonthNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = months.findIndex(m => m.value === selectedMonth);
    if (currentIndex === -1) return;

    let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < months.length) {
      const newMonth = months[newIndex].value;
      setSelectedMonth(newMonth);
      onMonthChange?.(newMonth);
    }
  };

  const generateAllDays = useCallback((): DayData[] => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const days: DayData[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayOfWeek = date.getDay();

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      days.push({
        date,
        day: date.getDate(),
        month: date.getMonth() + 1,
        weekday: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isToday
      });
    }
    return days;
  }, [selectedMonth]);

  const allDays = useMemo(() => generateAllDays(), [generateAllDays]);
  const days = useMemo(() => showWeekends ? allDays : allDays.filter(d => !d.isWeekend), [allDays, showWeekends]);

  const formatHours = (hours: number): string => {
    if (!hours) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m === 0 ? `${h}h` : `${h}h${m}m`;
  };

  const generateProjectHours = useCallback((projectId: string, numDays: number): Hours[] => {
    const seed = projectId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (index: number) => {
      const x = Math.sin(seed * index) * 10000;
      return x - Math.floor(x);
    };
    return Array.from({ length: numDays }, (_, idx) => {
      if (allDays[idx]?.isWeekend) return { planned: 0, actual: 0 };
      const planned = Math.floor(random(idx) * 5) + 3;
      const actual = planned + (random(idx + 100) * 2 - 1);
      return { planned: Math.max(0, planned), actual: Math.max(0, Math.round(actual * 10) / 10) };
    });
  }, [allDays]);

  const sumTaskHours = (tasks: Task[], dayIndex: number): Hours => {
    const totalPlanned = tasks.reduce((sum, task) => sum + (task.hours[dayIndex]?.planned || 0), 0);
    const totalActual = tasks.reduce((sum, task) => sum + (task.hours[dayIndex]?.actual || 0), 0);
    return { planned: Math.round(totalPlanned * 10) / 10, actual: Math.round(totalActual * 10) / 10 };
  };

  // ============================================
  // INTEGRAÇÃO COM DADOS REAIS DO DATACONTEXT
  // ============================================
  const { groupedData, metadata, syncState } = useData();

  // Verificar se tarefa tem atividade no período selecionado
  const isTaskInPeriod = useCallback((task: RealTask, periodStart: Date, periodEnd: Date): boolean => {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const startDate = task.startDate ? new Date(task.startDate) : null;
    const closedDate = task.dateClosed ? new Date(task.dateClosed) : null;

    // Verificar se alguma data está dentro do período
    const isInPeriod = (date: Date | null) => {
      if (!date) return false;
      return date >= periodStart && date <= periodEnd;
    };

    // 1. Se tem dueDate, startDate ou dateClosed no período
    if (isInPeriod(dueDate) || isInPeriod(startDate) || isInPeriod(closedDate)) {
      return true;
    }

    // 2. Se a tarefa cruza o período (começou antes E termina depois ou durante)
    if (startDate && startDate < periodStart) {
      if (dueDate && dueDate >= periodStart) {
        return true;
      }
      if (!dueDate && closedDate && closedDate >= periodStart) {
        return true;
      }
      // Tarefa em andamento sem dueDate
      if (!dueDate && !closedDate) {
        return true;
      }
    }

    // 3. Se não tem nenhuma data mas tem horas (timeEstimate ou timeLogged),
    // mostrar no mês atual como fallback
    if (!startDate && !dueDate && !closedDate) {
      const now = new Date();
      const isCurrentMonth = periodStart.getMonth() === now.getMonth() &&
        periodStart.getFullYear() === now.getFullYear();
      if (isCurrentMonth && (task.timeEstimate > 0 || task.timeLogged > 0)) {
        return true;
      }
    }

    // 4. Se dueDate é no futuro e não tem startDate, considerar ativa se dueDate >= periodStart
    if (!startDate && dueDate && dueDate >= periodStart && dueDate <= periodEnd) {
      return true;
    }

    return false;
  }, []);

  // Distribuir horas da tarefa pelos dias do mês
  const distributeTaskHours = useCallback((task: RealTask, numDays: number, periodStart: Date, periodEnd: Date): Hours[] => {
    const hours: Hours[] = Array(numDays).fill(null).map(() => ({ planned: 0, actual: 0 }));

    // Calcular período efetivo da tarefa
    const taskStart = task.startDate ? new Date(task.startDate) : periodStart;
    const taskEnd = task.dueDate ? new Date(task.dueDate) : periodEnd;

    // Encontrar dias efetivos no período
    let effectiveDays = 0;
    allDays.forEach((day, idx) => {
      if (!day.isWeekend && day.date >= taskStart && day.date <= taskEnd) {
        effectiveDays++;
      }
    });

    if (effectiveDays === 0) effectiveDays = 1;

    // Distribuir horas (timeEstimate e timeLogged já vêm em HORAS do clickup.ts)
    const plannedPerDay = (task.timeEstimate || 0) / effectiveDays;
    const loggedPerDay = (task.timeLogged || 0) / effectiveDays;

    allDays.forEach((day, idx) => {
      if (!day.isWeekend && day.date >= taskStart && day.date <= taskEnd) {
        hours[idx] = {
          planned: Math.round(plannedPerDay * 10) / 10,
          actual: Math.round(loggedPerDay * 10) / 10
        };
      }
    });

    return hours;
  }, [allDays]);

  // Converter dados reais para estrutura do Timesheet
  const teamMembers = useMemo<Member[]>(() => {
    // Se há dados externos, usar
    if (externalTeamMembers && externalTeamMembers.length > 0) {
      return externalTeamMembers;
    }

    // Se não há dados do sync, retornar vazio
    if (!groupedData || groupedData.length === 0) {
      console.log('[TIMESHEET] Sem dados do groupedData');
      return [];
    }

    // Período do mês selecionado
    const [year, month] = selectedMonth.split('-').map(Number);
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59); // Último dia do mês

    console.log('[TIMESHEET] Processando período:', {
      selectedMonth,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      totalGroups: groupedData.length
    });

    // Debug: analisar amostra dos dados
    if (groupedData[0]?.projects[0]?.tasks[0]) {
      const sampleTask = groupedData[0].projects[0].tasks[0];
      console.log('[TIMESHEET] Amostra de tarefa:', {
        name: sampleTask.name,
        startDate: sampleTask.startDate,
        dueDate: sampleTask.dueDate,
        dateClosed: sampleTask.dateClosed,
        timeEstimate: sampleTask.timeEstimate,
        timeLogged: sampleTask.timeLogged,
        status: sampleTask.status
      });
    }

    // Converter cada membro do groupedData
    return groupedData.map(group => {
      const initials = group.assignee
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      // Filtrar e converter projetos
      const projects: Project[] = group.projects
        .map(proj => {
          console.log(`[DEBUG RAW] Project "${proj.name}" has ${proj.tasks.length} tasks:`);
          proj.tasks.forEach((task, idx) => {
            if (idx < 3) { // Log first 3 tasks only
              console.log(`  [DEBUG RAW] Task "${task.name}": timeEstimate=${task.timeEstimate}h, timeLogged=${task.timeLogged}h, has ${task.subtasks?.length || 0} subtasks`);
            }
          });

          // Filtrar tarefas que têm atividade no período
          // E aplicar filtro de concluídas se necessário
          const activeTasks = proj.tasks.filter(task => {
            // Primeiro: verificar se está no período
            if (!isTaskInPeriod(task, periodStart, periodEnd)) return false;

            // Segundo: verificar se deve mostrar concluídas
            if (!internalShowCompleted) {
              const isCompleted = task.status?.toLowerCase().includes('conclu') ||
                task.status?.toLowerCase().includes('complete') ||
                task.status?.toLowerCase().includes('done') ||
                task.status?.toLowerCase().includes('closed');
              if (isCompleted) return false;
            }

            return true;
          });

          // Se não há tarefas ativas, pular projeto
          if (activeTasks.length === 0) return null;

          // Helper: Agregar horas recursivamente de todas as subtasks
          const aggregateTaskHours = (task: RealTask): { estimate: number; logged: number } => {
            let totalEstimate = task.timeEstimate || 0;
            let totalLogged = task.timeLogged || 0;

            // Se tem subtasks, somar recursivamente
            if (task.subtasks && task.subtasks.length > 0) {
              task.subtasks.forEach(subtask => {
                const subHours = aggregateTaskHours(subtask);
                totalEstimate += subHours.estimate;
                totalLogged += subHours.logged;
              });
            }

            return { estimate: totalEstimate, logged: totalLogged };
          };

          // Converter tarefas COM agregação de horas das subtasks
          const tasks: Task[] = activeTasks.map(task => {
            const aggregated = aggregateTaskHours(task);

            // Criar tarefa temporária com horas agregadas para distribuição
            const taskWithAggregatedHours: RealTask = {
              ...task,
              timeEstimate: aggregated.estimate,
              timeLogged: aggregated.logged
            };

            return {
              id: task.id,
              name: task.name,
              hours: distributeTaskHours(taskWithAggregatedHours, allDays.length, periodStart, periodEnd)
            };
          });

          return {
            id: `${group.assignee}-${proj.name}`.replace(/\s/g, '-').toLowerCase(),
            name: proj.name,
            tasks
          };
        })
        .filter((p): p is Project => p !== null);

      return {
        id: group.assignee.toLowerCase().replace(/\s/g, '-'),
        name: group.assignee,
        initials,
        projects
      };
    }).filter(member => member.projects.length > 0); // Só membros com projetos ativos
  }, [externalTeamMembers, groupedData, selectedMonth, allDays, isTaskInPeriod, distributeTaskHours, internalShowCompleted]);

  // Auto-select first team member when data loads (no 'all' option)
  useEffect(() => {
    if (teamMembers.length > 0 && (selectedMemberFilter === 'all' || !teamMembers.find(m => m.id === selectedMemberFilter))) {
      setSelectedMemberFilter(teamMembers[0].id);
    }
  }, [teamMembers, selectedMemberFilter]);


  // Auto-scroll to Today
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const todayIndex = days.findIndex(d => d.isToday);
        if (todayIndex !== -1) {
          const colWidth = 112; // w-28 = 112px
          const containerWidth = scrollRef.current.clientWidth;
          const scrollPos = (todayIndex * colWidth) - (containerWidth / 2) + (colWidth / 2);
          scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [selectedMonth, days, activeTab]);

  const toggleMember = (memberId: string) => {
    setExpandedMembers(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const filteredMembers = selectedMemberFilter === 'all' ? teamMembers : teamMembers.filter(m => m.id === selectedMemberFilter);

  const scroll = (direction: 'left' | 'right') => {
    setTooltipData(null);
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -400 : 400, behavior: 'smooth' });
  };

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]);
  };

  const handleMemberFilterClick = (memberId: string) => {
    if (selectedMemberFilter === memberId) {
      setSelectedMemberFilter('all');
      setExpandedProjects([]);
    } else {
      setSelectedMemberFilter(memberId);
      setExpandedProjects([]);
    }
  };

  const getStatusColor = (planned: number, actual: number) => {
    // Sem horas registradas → cinza neutro
    if (!actual) return isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-50 text-gray-400 border-gray-200';
    // Sem planejamento → amarelo (atenção: horas sem estimate)
    if (!planned || planned === 0) return isDark ? 'bg-amber-900 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200';

    // Gastou MENOS ou igual ao planejado → sempre verde (dentro do orçamento)
    if (actual <= planned) {
      return isDark ? 'bg-emerald-900 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    // Gastou MAIS que o planejado → alerta baseado em quanto estourou
    const overPercent = ((actual - planned) / planned) * 100;
    // ≤10% acima = amarelo leve, >10% = vermelho
    if (overPercent <= 10) return isDark ? 'bg-amber-900 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200';
    return isDark ? 'bg-rose-900 text-rose-300 border-rose-700' : 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const showTooltip = (e: React.MouseEvent, title: string, planned: number, actual: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipData({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top,
      title,
      planned,
      actual
    });
  };

  const hideTooltip = () => {
    setTooltipData(null);
  };

  const CalendarView = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startingDay = firstDay.getDay();

    let calendarDays: (number | null)[] = [];
    if (showWeekends) {
      calendarDays = [...Array(startingDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    } else {
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i);
        const dayOfWeek = date.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          calendarDays.push(i);
        }
      }
    }

    const weekDays = showWeekends
      ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

    const selectedMember = filteredMembers[0];

    const getProjectsForDay = (day: number) => {
      if (!day || !selectedMember) return [];
      const projects: { name: string; planned: number; actual: number; status: 'over' | 'under' | 'ok' }[] = [];
      selectedMember.projects.forEach(project => {
        // Match both day AND month to get correct index
        const dayIndex = allDays.findIndex(d => d.day === day && d.month === month);
        if (dayIndex !== -1) {
          const hours = sumTaskHours(project.tasks, dayIndex);
          if (hours.actual > 0 || hours.planned > 0) {
            projects.push({
              name: project.name,
              planned: hours.planned,
              actual: hours.actual,
              status: hours.actual > hours.planned * 1.1 ? 'over' : hours.actual < hours.planned * 0.9 ? 'under' : 'ok'
            });
          }
        }
      });
      return projects;
    };

    return (
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden`}>
        {selectedMemberFilter === 'all' ? (
          <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Selecione um membro da equipe</p>
            <p className="text-sm mt-1">Para visualizar o calendário individual, escolha uma pessoa acima</p>
          </div>
        ) : !selectedMember ? (
          <div className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Nenhum dado disponível</p>
            <p className="text-sm mt-1">Não há projetos para este membro no mês selecionado</p>
          </div>
        ) : (
          <>
            <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center`}>
                  <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{selectedMember.initials}</span>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedMember.name}</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className={`grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'}`}>
              {weekDays.map(day => (
                <div key={day} className={`p-3 text-center border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                  <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{day}</span>
                </div>
              ))}
              {calendarDays.map((day, index) => {
                const projects = day ? getProjectsForDay(day) : [];
                const totalPlanned = projects.reduce((sum, p) => sum + p.planned, 0);
                const totalActual = projects.reduce((sum, p) => sum + p.actual, 0);
                const isToday = day
                  ? new Date(year, month - 1, day).toDateString() === new Date().toDateString()
                  : false;

                return (
                  <div key={index} className={`min-h-36 p-2 border-b border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} ${isToday
                    ? (isDark ? 'bg-blue-500/10 ring-2 ring-inset ring-blue-500' : 'bg-blue-50 ring-2 ring-inset ring-blue-400')
                    : (index % (showWeekends ? 7 : 5) === (showWeekends ? 0 : -1) || index % (showWeekends ? 7 : 5) === (showWeekends ? 6 : -1) ? (isDark ? 'bg-gray-850' : 'bg-gray-50') : (isDark ? 'bg-gray-800' : 'bg-white'))
                    } ${!day ? 'opacity-30' : ''}`}>
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold ${isToday ? 'text-blue-500' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>{day}</span>
                          {totalActual > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${isDark ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-800' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}>
                              {formatHours(totalActual)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {projects.slice(0, 3).map((project, idx) => {
                            // Determine card style based on status
                            const cardStyle = project.status === 'over'
                              ? (isDark ? 'bg-rose-900/20 border-rose-800/50 text-rose-100' : 'bg-rose-50 border-rose-100 text-rose-900')
                              : project.status === 'under'
                                ? (isDark ? 'bg-amber-900/20 border-amber-800/50 text-amber-100' : 'bg-amber-50 border-amber-100 text-amber-900')
                                : (isDark ? 'bg-emerald-900/20 border-emerald-800/50 text-emerald-100' : 'bg-emerald-50 border-emerald-100 text-emerald-900');

                            const deviation = project.actual - project.planned;
                            const hasDeviation = deviation !== 0;

                            return (
                              <div key={idx} className={`p-2 rounded-lg border-l-4 text-xs ${cardStyle}`}>
                                <div className="font-semibold truncate mb-1.5" title={project.name}>{project.name}</div>
                                <div className="space-y-0.5">
                                  <div className="flex justify-between items-center">
                                    <span className={`uppercase font-bold text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Planejado</span>
                                    <span className={`font-mono font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatHours(project.planned)}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className={`uppercase font-bold text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gasto</span>
                                    <span className={`font-mono font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatHours(project.actual)}</span>
                                  </div>
                                  {hasDeviation && (
                                    <div className={`flex justify-between items-center pt-0.5 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                      <span className={`uppercase font-bold text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Desvio</span>
                                      <span className={`font-mono font-bold ${deviation > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {deviation > 0 ? '+' : ''}{formatHours(deviation)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {projects.length > 3 && (
                            <div className={`text-xs px-2 py-1 text-center rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              +{projects.length - 3} mais
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };


  // Verificar se há dados do sync
  const hasData = groupedData && groupedData.length > 0;
  const hasMembersInPeriod = teamMembers.length > 0;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors`}>
      <div className="max-w-full mx-auto">
        {/* SIMPLIFIED HEADER */}
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg px-4 py-3 mb-4`}>
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Timesheet</h1>
              {hasData && !hasMembersInPeriod && (
                <span className="text-xs text-amber-500 font-medium">• Sem atividade em {monthNames[selectedMonthNum - 1]}</span>
              )}
              {!hasData && (
                <span className="text-xs text-amber-500 font-medium">• Faça sync</span>
              )}
            </div>

            {/* Center: Controls - Team, Month Navigation, Filters */}
            <div className="flex items-center gap-2">
              {/* Team Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => { setIsTeamDropdownOpen(!isTeamDropdownOpen); setIsMonthDropdownOpen(false); setIsYearDropdownOpen(false); setIsSettingsOpen(false); }}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-200' : 'border-gray-200 hover:bg-gray-50 text-gray-700'} transition-colors`}
                >
                  <span>{teamMembers.find(m => m.id === selectedMemberFilter)?.name || 'Selecione...'}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>

                {isTeamDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsTeamDropdownOpen(false)}></div>
                    <div className={`absolute top-full left-0 mt-1 w-48 rounded-lg border shadow-lg z-40 py-1 max-h-64 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      {teamMembers.map(member => (
                        <button
                          key={member.id}
                          onClick={() => { handleMemberFilterClick(member.id); setIsTeamDropdownOpen(false); }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <span>{member.name}</span>
                          {selectedMemberFilter === member.id && <Check className="w-3 h-3 text-indigo-500" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMonthNavigate('prev')}
                  disabled={months.findIndex(m => m.value === selectedMonth) <= 0}
                  className={`p-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => { setIsMonthDropdownOpen(!isMonthDropdownOpen); setIsTeamDropdownOpen(false); setIsYearDropdownOpen(false); setIsSettingsOpen(false); }}
                    className={`flex items-center gap-1 px-2 py-1.5 text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
                  >
                    <span>{monthNames[selectedMonthNum - 1]} {selectedYear}</span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>

                  {isMonthDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsMonthDropdownOpen(false)}></div>
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-64 rounded-lg border shadow-lg z-40 p-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        {/* Year selector */}
                        <div className="flex items-center justify-between mb-3">
                          <button onClick={() => changeYear(selectedYear - 1)} className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedYear}</span>
                          <button onClick={() => changeYear(selectedYear + 1)} className={`p-1 rounded ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Month grid */}
                        <div className="grid grid-cols-4 gap-1">
                          {monthNames.map((name, idx) => (
                            <button
                              key={idx}
                              onClick={() => { changeMonth(idx + 1); setIsMonthDropdownOpen(false); }}
                              className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${selectedMonthNum === idx + 1
                                ? 'bg-indigo-600 text-white font-bold'
                                : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                              {name.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handleMonthNavigate('next')}
                  disabled={months.findIndex(m => m.value === selectedMonth) >= months.length - 1}
                  className={`p-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: View Toggle + Settings Gear */}
            <div className="flex items-center gap-2">
              {/* View Switcher */}
              <div className={`flex p-1 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-900' : 'border-gray-200 bg-gray-100'}`}>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`p-1.5 rounded-md transition-all ${activeTab === 'timeline'
                    ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    }`}
                  title="Timeline"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('calendar')}
                  className={`p-1.5 rounded-md transition-all ${activeTab === 'calendar'
                    ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    }`}
                  title="Calendário"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              {/* Cards/Compact Toggle (only when timeline is active) */}
              {activeTab === 'timeline' && (
                <div className={`flex p-0.5 rounded-md ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setCardViewMode('compact')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${cardViewMode === 'compact'
                      ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm')
                      : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                      }`}
                    title="Visão Compacta"
                  >
                    Simples
                  </button>
                  <button
                    onClick={() => setCardViewMode('cards')}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${cardViewMode === 'cards'
                      ? (isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm')
                      : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                      }`}
                    title="Visão Detalhada"
                  >
                    Detalhada
                  </button>
                </div>
              )}

              {/* Settings Gear */}
              <div className="relative">
                <button
                  onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsTeamDropdownOpen(false); setIsMonthDropdownOpen(false); setIsYearDropdownOpen(false); }}
                  className={`p-2 rounded-lg transition-colors ${isSettingsOpen
                    ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                    : (isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                    }`}
                  title="Configurações de Visualização"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Settings Popup */}
                {isSettingsOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsSettingsOpen(false)}></div>
                    <div className={`absolute top-full right-0 mt-2 w-72 rounded-xl border shadow-xl z-40 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      {/* Header */}
                      <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Configuração de Visualização</span>
                        <button onClick={() => setIsSettingsOpen(false)} className={`p-1 rounded-lg ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Toggles */}
                      <div className="p-4 space-y-3">
                        {/* Show Completed */}
                        <button
                          onClick={() => {
                            const newValue = !internalShowCompleted;
                            setInternalShowCompleted(newValue);
                            onCompletedChange?.(newValue);
                          }}
                          className="w-full flex items-center justify-between"
                        >
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mostrar Tarefas Concluídas</span>
                          <div className={`transition-colors ${internalShowCompleted ? 'text-indigo-500' : isDark ? 'text-gray-500' : 'text-gray-300'}`}>
                            {internalShowCompleted ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </div>
                        </button>

                        {/* Show Weekends */}
                        <button
                          onClick={() => setShowWeekends(!showWeekends)}
                          className="w-full flex items-center justify-between"
                        >
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Mostrar Finais de Semana</span>
                          <div className={`transition-colors ${showWeekends ? 'text-indigo-500' : isDark ? 'text-gray-500' : 'text-gray-300'}`}>
                            {showWeekends ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </div>
                        </button>

                        {/* Theme Toggle */}
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between"
                        >
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Modo Escuro</span>
                          <div className={`transition-colors ${isDark ? 'text-indigo-500' : 'text-gray-300'}`}>
                            {isDark ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </div>
                        </button>
                      </div>

                      {/* Legend Section */}
                      <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Legenda de Desvio</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Dentro da meta (±10%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Atenção (±20%)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Crítico (&gt;20%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Renderização condicional das visualizações */}
        {activeTab === 'calendar' ? <CalendarView /> : (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden`}>
            <div className="flex">
              {/* Sidebar (Left) - Largura aumentada para evitar texto cortado */}
              <div
                className={`w-72 min-w-[288px] flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto sidebar-scroll-container`}
                style={{ maxHeight: '700px' }}
                onScroll={(e) => {
                  if (scrollSyncRef.current) {
                    scrollSyncRef.current = false;
                    return;
                  }
                  setTooltipData(null);
                  const scrollTop = e.currentTarget.scrollTop;
                  const rightPanel = document.querySelector('.timeline-scroll-container');
                  if (rightPanel && rightPanel.scrollTop !== scrollTop) {
                    scrollSyncRef.current = true;
                    rightPanel.scrollTop = scrollTop;
                  }
                }}
              >
                <div className={`h-16 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex items-center px-4 sticky top-0 z-20`}>
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Projetos / Tarefas</span>
                </div>

                <div className="pb-20">
                  {filteredMembers.map((member, memberIdx) => {
                    const isMemberExpanded = expandedMembers.includes(member.id);
                    const shouldShowProjects = selectedMemberFilter !== 'all' || isMemberExpanded;

                    return (
                      <div key={member.id}>
                        {selectedMemberFilter === 'all' && (
                          <div
                            onClick={() => toggleMember(member.id)}
                            className={`h-10 px-4 flex items-center justify-between gap-2 border-y cursor-pointer transition-colors ${memberIdx > 0 ? 'mt-8' : ''} ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}
                          >
                            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{member.name}</span>
                            {isMemberExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                          </div>
                        )}
                        {shouldShowProjects && member.projects.map((project, projIdx) => {
                          const isExpanded = expandedProjects.includes(project.id);
                          const rowHeight = cardViewMode === 'cards' ? 'h-20' : 'h-16';
                          return (
                            <div key={project.id} className={`${selectedMemberFilter !== 'all' && projIdx > 0 ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : (projIdx > 0 || selectedMemberFilter === 'all' ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : '')}`}>
                              <div onClick={() => toggleProject(project.id)}
                                className={`${rowHeight} px-4 cursor-pointer ${isDark ? 'hover:bg-gray-700 bg-gray-800' : 'hover:bg-gray-50 bg-white'} transition-colors border-l-4 ${isDark ? 'border-gray-500' : 'border-gray-400'} flex items-center`}>
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {isExpanded ? <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />}
                                  <span
                                    className={`text-sm font-semibold truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}
                                    title={project.name}
                                  >
                                    {project.name}
                                  </span>
                                </div>
                              </div>

                              {isExpanded && internalShowTasks && (
                                <>
                                  {project.tasks.map((task, taskIdx) => {
                                    const taskRowHeight = cardViewMode === 'cards' ? 'h-16' : 'h-12';
                                    return (
                                      <div key={task.id} className={`${taskRowHeight} px-6 ${isDark ? 'bg-gray-850 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} transition-colors flex items-center ${taskIdx > 0 ? `border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}` : 'border-t border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <span
                                          className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                                          title={task.name}
                                        >
                                          {task.name}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Timeline (Right) */}
              <div
                className="flex-1 overflow-x-auto overflow-y-auto timeline-scroll-container"
                ref={scrollRef}
                style={{ maxHeight: '700px' }}
                onScroll={(e) => {
                  if (scrollSyncRef.current) {
                    scrollSyncRef.current = false;
                    return;
                  }
                  setTooltipData(null);
                  const scrollTop = e.currentTarget.scrollTop;
                  const leftPanel = document.querySelector('.sidebar-scroll-container');
                  if (leftPanel && leftPanel.scrollTop !== scrollTop) {
                    scrollSyncRef.current = true;
                    leftPanel.scrollTop = scrollTop;
                  }
                }}
              >
                <div className="inline-block min-w-full pb-20">
                  <div className={`h-16 flex border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} sticky top-0 z-20`}>
                    {days.map((day, idx) => {
                      const cellWidth = cardViewMode === 'cards' ? 'w-36 min-w-36' : 'w-28 min-w-28';
                      return (
                        <div key={idx} className={`${cellWidth} flex-shrink-0 flex flex-col items-center justify-center border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} ${day.isToday ? (isDark ? 'bg-blue-500/10 border-blue-600 ring-2 ring-blue-500' : 'bg-blue-100 border-blue-400 ring-2 ring-blue-400') :
                          day.isWeekend ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : (isDark ? 'bg-gray-900' : 'bg-white')
                          }`}>
                          <span className={`text-xs font-medium ${day.isToday ? (isDark ? 'text-blue-200' : 'text-blue-700') : (isDark ? 'text-gray-400' : 'text-gray-500')} uppercase`}>{day.weekday}</span>
                          <span className={`text-lg font-semibold ${day.isToday ? (isDark ? 'text-blue-100' : 'text-blue-900') : (isDark ? 'text-gray-200' : 'text-gray-900')} mt-0.5`}>{day.day}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    {filteredMembers.map((member, memberIdx) => {
                      const isMemberExpanded = expandedMembers.includes(member.id);
                      const shouldShowProjects = selectedMemberFilter !== 'all' || isMemberExpanded;

                      return (
                        <div key={member.id}>
                          {selectedMemberFilter === 'all' && (
                            <div className={`h-10 flex border-y ${memberIdx > 0 ? 'mt-8' : ''} ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                              {days.map((day, idx) => (
                                <div key={idx} className={`${cardViewMode === 'cards' ? 'w-36 min-w-36' : 'w-28 min-w-28'} flex-shrink-0 border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}`}></div>
                              ))}
                            </div>
                          )}
                          {shouldShowProjects && member.projects.map((project, projIdx) => {
                            const isExpanded = expandedProjects.includes(project.id);
                            const rowHeight = cardViewMode === 'cards' ? 'h-20' : 'h-16';
                            return (
                              <div key={project.id} className={`${selectedMemberFilter !== 'all' && projIdx > 0 ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : (projIdx > 0 || selectedMemberFilter === 'all' ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : '')}`}>
                                <div className={`${rowHeight} flex ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                  {days.map((day, dayIdx) => {
                                    const dayIndexInAll = allDays.findIndex(d => d.day === day.day && d.month === day.month);
                                    const hours = sumTaskHours(project.tasks, dayIndexInAll);
                                    const deviation = hours.actual - hours.planned;
                                    const hasDeviation = deviation !== 0 && hours.actual > 0;
                                    const cellWidth = cardViewMode === 'cards' ? 'w-36 min-w-36' : 'w-28 min-w-28';

                                    return (
                                      <div
                                        key={dayIdx}
                                        className={`${cellWidth} flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} p-1.5 flex items-center justify-center ${day.isToday ? (isDark ? 'bg-blue-500/10 border-l-2 border-r-2 border-blue-600' : 'bg-blue-50 border-l-2 border-r-2 border-blue-300') :
                                          day.isWeekend ? (isDark ? 'bg-gray-850' : 'bg-gray-50') : ''
                                          }`}
                                        onMouseEnter={(e) => cardViewMode === 'compact' && hours.actual > 0 && showTooltip(e, project.name, hours.planned, hours.actual)}
                                        onMouseLeave={hideTooltip}
                                      >
                                        {hours.actual > 0 && (
                                          cardViewMode === 'cards' ? (
                                            // CARD DETALHADO
                                            <div className={`w-full h-full rounded-lg border-2 p-1.5 ${getStatusColor(hours.planned, hours.actual).replace('border-', 'border-l-4 border-l-')}`}>
                                              <div className="flex justify-between items-center text-[9px]">
                                                <span className={`uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Planejado</span>
                                                <span className={`font-mono font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatHours(hours.planned)}</span>
                                              </div>
                                              <div className="flex justify-between items-center text-[9px] mt-0.5">
                                                <span className={`uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gasto</span>
                                                <span className={`font-mono font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatHours(hours.actual)}</span>
                                              </div>
                                              {hasDeviation && (
                                                <div className={`flex justify-between items-center text-[9px] mt-0.5 pt-0.5 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                                                  <span className={`uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Desvio</span>
                                                  <span className={`font-mono font-bold ${deviation > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                    {deviation > 0 ? '+' : ''}{formatHours(deviation)}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            // COMPACTO (atual)
                                            <div className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center cursor-default`}>
                                              <span className="text-sm font-semibold whitespace-nowrap">{formatHours(hours.actual)}</span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {isExpanded && internalShowTasks && project.tasks.map((task, taskIdx) => {
                                  const taskRowHeight = cardViewMode === 'cards' ? 'h-16' : 'h-12';
                                  return (
                                    <div key={task.id} className={`${taskRowHeight} flex ${isDark ? 'bg-gray-850' : 'bg-gray-50'} ${taskIdx > 0 ? `border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}` : 'border-t border-gray-200 dark:border-gray-700'
                                      }`}>
                                      {days.map((day, dayIdx) => {
                                        const dayIndexInAll = allDays.findIndex(d => d.day === day.day && d.month === day.month);
                                        const hours = task.hours[dayIndexInAll];
                                        const taskCellWidth = cardViewMode === 'cards' ? 'w-36 min-w-36' : 'w-28 min-w-28';
                                        const taskDeviation = hours ? hours.actual - hours.planned : 0;
                                        const taskHasDeviation = taskDeviation !== 0 && hours?.actual > 0;
                                        return (
                                          <div
                                            key={dayIdx}
                                            className={`${taskCellWidth} flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} p-1 flex items-center justify-center ${day.isToday ? (isDark ? 'bg-blue-500/10 border-l-2 border-r-2 border-blue-600' : 'bg-blue-50 border-l-2 border-r-2 border-blue-300') :
                                              day.isWeekend ? (isDark ? 'bg-gray-800' : 'bg-white') : ''
                                              }`}
                                            onMouseEnter={(e) => cardViewMode === 'compact' && hours?.actual > 0 && showTooltip(e, task.name, hours.planned, hours.actual)}
                                            onMouseLeave={hideTooltip}
                                          >
                                            {hours?.actual > 0 && (
                                              cardViewMode === 'cards' ? (
                                                // CARD DETALHADO PARA TAREFA
                                                <div className={`w-full h-full rounded border p-1 ${getStatusColor(hours.planned, hours.actual)}`}>
                                                  <div className="flex justify-between items-center text-[8px]">
                                                    <span className={`uppercase font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plan</span>
                                                    <span className={`font-mono font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatHours(hours.planned)}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center text-[8px]">
                                                    <span className={`uppercase font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real</span>
                                                    <span className={`font-mono font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{formatHours(hours.actual)}</span>
                                                  </div>
                                                  {taskHasDeviation && (
                                                    <div className="flex justify-between items-center text-[8px]">
                                                      <span className={`uppercase font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Desv</span>
                                                      <span className={`font-mono font-semibold ${taskDeviation > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {taskDeviation > 0 ? '+' : ''}{formatHours(taskDeviation)}
                                                      </span>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                // COMPACTO
                                                <div className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center cursor-default`}>
                                                  <span className="text-xs font-semibold whitespace-nowrap">{formatHours(hours.actual)}</span>
                                                </div>
                                              )
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
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
        )}
      </div>

      {tooltipData && tooltipData.visible && (
        <div
          className="fixed z-[100] transform -translate-x-1/2 -translate-y-full pointer-events-none"
          style={{ left: tooltipData.x, top: tooltipData.y - 10 }}
        >
          <div className={`px-3 py-2 ${isDark ? 'bg-gray-700' : 'bg-gray-900'} text-white text-xs rounded shadow-lg whitespace-nowrap relative`}>
            <div className="font-semibold mb-1">{tooltipData.title}</div>
            <div className="space-y-0.5 text-gray-300">
              <div>Planejado: {formatHours(tooltipData.planned)}</div>
              <div>Realizado: {formatHours(tooltipData.actual)}</div>
            </div>
            <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-900'}`}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimesheetDashboard;