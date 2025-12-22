import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, EyeOff, Moon, Sun, LayoutGrid, User, Check } from 'lucide-react';

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
}

const TimesheetDashboard: React.FC<TimesheetDashboardProps> = ({ teamMembers: externalTeamMembers, months: externalMonths }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-12');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [showWeekends, setShowWeekends] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar'>('timeline');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  // Dropdown states
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

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
  const availableYears = useMemo(() => {
    const years = new Set(months.map(m => parseInt(m.value.split('-')[0])));
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
    setSelectedMonth(`${year}-${month}`);
  }, []);

  // Mudar ano mantendo o mês
  const changeYear = useCallback((newYear: number) => {
    const month = selectedMonth.split('-')[1];
    setSelectedMonth(`${newYear}-${month}`);
    setIsYearDropdownOpen(false);
  }, [selectedMonth]);

  // Mudar mês mantendo o ano
  const changeMonth = useCallback((newMonth: number) => {
    const year = selectedMonth.split('-')[0];
    const monthStr = newMonth.toString().padStart(2, '0');
    setSelectedMonth(`${year}-${monthStr}`);
    setIsMonthDropdownOpen(false);
  }, [selectedMonth]);

  const handleMonthNavigate = (direction: 'prev' | 'next') => {
    const currentIndex = months.findIndex(m => m.value === selectedMonth);
    if (currentIndex === -1) return;

    let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex >= 0 && newIndex < months.length) {
      setSelectedMonth(months[newIndex].value);
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

  // Usar teamMembers fornecidos via props ou fallback para mockados
  const teamMembers = useMemo<Member[]>(() => {
    if (externalTeamMembers && externalTeamMembers.length > 0) {
      return externalTeamMembers;
    }

    // Fallback para dados mockados
    return [
      {
        id: 'brozinga', name: 'Brozinga', initials: 'BR',
        projects: [
          {
            id: 'brozinga-proj-1', name: 'Integração API Bancária',
            tasks: [
              { id: 'task-1', name: 'Desenvolvimento de Feature', hours: generateProjectHours('brozinga-task-1', allDays.length) },
              { id: 'task-2', name: 'Code Review', hours: generateProjectHours('brozinga-task-2', allDays.length) }
            ]
          },
          {
            id: 'brozinga-proj-2', name: 'Suporte & Sustentação',
            tasks: [{ id: 'task-5', name: 'Atendimento N3', hours: generateProjectHours('brozinga-task-5', allDays.length) }]
          }
        ]
      },
      {
        id: 'rafael', name: 'Rafael', initials: 'RA',
        projects: [
          {
            id: 'rafael-proj-1', name: 'Integração API Bancária',
            tasks: [
              { id: 'task-1', name: 'Desenvolvimento de Feature', hours: generateProjectHours('rafael-task-1', allDays.length) },
              { id: 'task-3', name: 'Testes Integrados', hours: generateProjectHours('rafael-task-3', allDays.length) }
            ]
          }
        ]
      },
      {
        id: 'pedro', name: 'Pedro', initials: 'PE',
        projects: [
          {
            id: 'pedro-proj-1', name: 'Integração API Bancária',
            tasks: [{ id: 'task-2', name: 'Testes Integrados', hours: generateProjectHours('pedro-task-2', allDays.length) }]
          },
          {
            id: 'pedro-proj-2', name: 'Refatoração Legacy',
            tasks: [{ id: 'task-4', name: 'Análise de Performance', hours: generateProjectHours('pedro-task-4', allDays.length) }]
          }
        ]
      }
    ];
  }, [externalTeamMembers, allDays.length, generateProjectHours]);

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
    if (!actual) return isDark ? 'bg-gray-800 text-gray-500 border-gray-700' : 'bg-gray-50 text-gray-400 border-gray-200';
    const percent = (Math.abs(actual - planned) / planned) * 100;
    if (percent <= 10) return isDark ? 'bg-emerald-900 text-emerald-300 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (percent <= 20) return isDark ? 'bg-amber-900 text-amber-300 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200';
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
        const dayIndex = allDays.findIndex(d => d.day === day);
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

                            return (
                              <div key={idx} className={`p-2 rounded border text-xs ${cardStyle}`}>
                                <div className="font-semibold truncate mb-1" title={project.name}>{project.name}</div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className={`text-[10px] uppercase tracking-wide opacity-70 mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Plan</div>
                                    <div className="font-bold text-sm">{formatHours(project.planned)}</div>
                                  </div>
                                  <div>
                                    <div className={`text-[10px] uppercase tracking-wide opacity-70 mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real</div>
                                    <div className="font-bold text-sm">{formatHours(project.actual)}</div>
                                  </div>
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


  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} p-6 transition-colors`}>
      <div className="max-w-full mx-auto">
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg p-5 mb-4`}>
          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Timesheet</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Gestão de horas da equipe</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Integrated Control Bar: Team & Month */}
              <div className={`flex items-center rounded-lg border shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>

                {/* Team Selector Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setIsTeamDropdownOpen(!isTeamDropdownOpen); setIsMonthDropdownOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-r ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} transition-colors rounded-l-lg`}
                  >
                    <User className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>
                      {selectedMemberFilter === 'all' ? 'Todos da Equipe' : teamMembers.find(m => m.id === selectedMemberFilter)?.name}
                    </span>
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </button>

                  {isTeamDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsTeamDropdownOpen(false)}></div>
                      <div className={`absolute top-full left-0 mt-2 w-56 rounded-lg border shadow-lg z-40 py-1 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <button
                          onClick={() => { handleMemberFilterClick('all'); setIsTeamDropdownOpen(false); }}
                          className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                        >
                          <span className="font-medium">Todos da Equipe</span>
                          {selectedMemberFilter === 'all' && <Check className="w-3 h-3 text-indigo-500" />}
                        </button>
                        <div className={`h-px my-1 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                        {teamMembers.map(member => (
                          <button
                            key={member.id}
                            onClick={() => { handleMemberFilterClick(member.id); setIsTeamDropdownOpen(false); }}
                            className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{member.initials}</span>
                              <span>{member.name}</span>
                            </div>
                            {selectedMemberFilter === member.id && <Check className="w-3 h-3 text-indigo-500" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Month/Year Selector Control - IMPROVED */}
                <div className="flex items-center gap-1 relative">
                  {/* Botão Anterior */}
                  <button
                    onClick={() => handleMonthNavigate('prev')}
                    disabled={months.findIndex(m => m.value === selectedMonth) <= 0}
                    className={`p-2 ${isDark ? 'text-gray-400 hover:text-white disabled:opacity-30' : 'text-gray-400 hover:text-gray-900 disabled:opacity-30'}`}
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Seletor de Mês */}
                  <div className="relative">
                    <button
                      onClick={() => { setIsMonthDropdownOpen(!isMonthDropdownOpen); setIsTeamDropdownOpen(false); setIsYearDropdownOpen(false); }}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border ${isDark ? 'text-gray-200 hover:bg-gray-700 border-gray-600' : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}
                    >
                      <span>{monthNames[selectedMonthNum - 1]}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {isMonthDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsMonthDropdownOpen(false)}></div>
                        <div className={`absolute top-full left-0 mt-1 w-36 rounded-lg border shadow-lg z-40 py-1 max-h-64 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          {monthNames.map((name, idx) => (
                            <button
                              key={idx}
                              onClick={() => changeMonth(idx + 1)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'} ${selectedMonthNum === idx + 1 ? (isDark ? 'bg-indigo-600/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700') : ''}`}
                            >
                              <span>{name}</span>
                              {selectedMonthNum === idx + 1 && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Seletor de Ano */}
                  <div className="relative">
                    <button
                      onClick={() => { setIsYearDropdownOpen(!isYearDropdownOpen); setIsTeamDropdownOpen(false); setIsMonthDropdownOpen(false); }}
                      className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border ${isDark ? 'text-gray-200 hover:bg-gray-700 border-gray-600' : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}
                    >
                      <span>{selectedYear}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {isYearDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsYearDropdownOpen(false)}></div>
                        <div className={`absolute top-full left-0 mt-1 w-24 rounded-lg border shadow-lg z-40 py-1 max-h-64 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          {availableYears.map(year => (
                            <button
                              key={year}
                              onClick={() => changeYear(year)}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'} ${selectedYear === year ? (isDark ? 'bg-indigo-600/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700') : ''}`}
                            >
                              <span>{year}</span>
                              {selectedYear === year && <Check className="w-3 h-3" />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Botão Próximo */}
                  <button
                    onClick={() => handleMonthNavigate('next')}
                    disabled={months.findIndex(m => m.value === selectedMonth) >= months.length - 1}
                    className={`p-2 ${isDark ? 'text-gray-400 hover:text-white disabled:opacity-30' : 'text-gray-400 hover:text-gray-900 disabled:opacity-30'}`}
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Botão Hoje */}
                  <button
                    onClick={goToToday}
                    className={`ml-2 px-2 py-1.5 text-xs font-medium rounded-lg border ${isDark ? 'text-indigo-300 hover:bg-indigo-600/20 border-indigo-600/50' : 'text-indigo-600 hover:bg-indigo-50 border-indigo-200'}`}
                    title="Ir para mês atual"
                  >
                    Hoje
                  </button>
                </div>
              </div>

              <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

              {/* View Switcher Icons */}
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
                  className={`p-1.5 rounded-md transition-all ml-1 ${activeTab === 'calendar'
                    ? (isDark ? 'bg-gray-700 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                    }`}
                  title="Calendário"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>

              <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

              {/* Settings Group */}
              <div className="flex items-center gap-2">
                <button ref={themeButtonRef} onClick={toggleTheme} className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                  {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
                </button>

                <button onClick={() => setShowWeekends(!showWeekends)}
                  className={`p-2 rounded-lg ${showWeekends ? (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700') : (isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700')
                    }`}
                  title={showWeekends ? 'Ocultar Finais de Semana' : 'Mostrar Finais de Semana'}
                >
                  {showWeekends ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {activeTab === 'timeline' && (
                <>
                  <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

                  <button onClick={() => scroll('left')} className={`p-2 rounded-lg border ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <ChevronLeft className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                  <button onClick={() => scroll('right')} className={`p-2 rounded-lg border ${isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>
                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`mt-6 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center gap-6 text-xs`}>
            <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Legenda:</span>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-emerald-500`}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Dentro da meta (±10%)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-amber-500`}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Atenção (±20%)</span>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-rose-500`}></div>
              <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Crítico (&gt;20%)</span>
            </div>
          </div>
        </div>

        {activeTab === 'calendar' ? <CalendarView /> : (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-lg overflow-hidden`}>
            <div className="flex">
              {/* Sidebar (Left) */}
              <div
                className={`w-80 flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} overflow-y-auto sidebar-scroll-container`}
                style={{ maxHeight: '700px' }}
                onScroll={(e) => {
                  setTooltipData(null);
                  const scrollTop = e.currentTarget.scrollTop;
                  const rightPanel = document.querySelector('.timeline-scroll-container');
                  if (rightPanel && rightPanel.scrollTop !== scrollTop) {
                    rightPanel.scrollTop = scrollTop;
                  }
                }}
              >
                <div className={`h-16 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex items-center px-4 sticky top-0 z-20`}>
                  <span className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wider`}>Projetos / Tarefas</span>
                </div>

                <div className="pb-20">
                  {filteredMembers.map((member, memberIdx) => (
                    <div key={member.id} className={memberIdx > 0 ? 'mt-8' : ''}>
                      {selectedMemberFilter === 'all' && (
                        <div className={`h-10 px-4 flex items-center gap-2 border-y ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>
                            {member.initials}
                          </div>
                          <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{member.name}</span>
                        </div>
                      )}
                      {member.projects.map((project, projIdx) => {
                        const isExpanded = expandedProjects.includes(project.id);
                        return (
                          <div key={project.id} className={`${selectedMemberFilter !== 'all' && projIdx > 0 ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : (projIdx > 0 || selectedMemberFilter === 'all' ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : '')}`}>
                            <div onClick={() => toggleProject(project.id)}
                              className={`h-20 px-4 cursor-pointer ${isDark ? 'hover:bg-gray-700 bg-gray-800' : 'hover:bg-gray-50 bg-white'} transition-colors border-l-4 ${isDark ? 'border-gray-500' : 'border-gray-400'} flex items-center`}>
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />}
                                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{project.name}</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <>
                                {project.tasks.map((task, taskIdx) => (
                                  <div key={task.id} className={`h-16 px-6 ${isDark ? 'bg-gray-850 hover:bg-gray-800' : 'bg-gray-50 hover:bg-gray-100'} transition-colors flex items-center ${taskIdx > 0 ? `border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}` : 'border-t border-gray-200 dark:border-gray-700'
                                    }`}>
                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.name}</span>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline (Right) */}
              <div
                className="flex-1 overflow-x-auto overflow-y-auto timeline-scroll-container"
                ref={scrollRef}
                style={{ maxHeight: '700px' }}
                onScroll={(e) => {
                  setTooltipData(null);
                  const scrollTop = e.currentTarget.scrollTop;
                  const leftPanel = document.querySelector('.sidebar-scroll-container');
                  if (leftPanel && leftPanel.scrollTop !== scrollTop) {
                    leftPanel.scrollTop = scrollTop;
                  }
                }}
              >
                <div className="inline-block min-w-full pb-20">
                  <div className={`h-16 flex border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} sticky top-0 z-20`}>
                    {days.map((day, idx) => (
                      <div key={idx} className={`w-28 min-w-28 flex-shrink-0 flex flex-col items-center justify-center border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} ${day.isToday ? (isDark ? 'bg-blue-500/10 border-blue-600 ring-2 ring-blue-500' : 'bg-blue-100 border-blue-400 ring-2 ring-blue-400') :
                        day.isWeekend ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : (isDark ? 'bg-gray-900' : 'bg-white')
                        }`}>
                        <span className={`text-xs font-medium ${day.isToday ? (isDark ? 'text-blue-200' : 'text-blue-700') : (isDark ? 'text-gray-400' : 'text-gray-500')} uppercase`}>{day.weekday}</span>
                        <span className={`text-lg font-semibold ${day.isToday ? (isDark ? 'text-blue-100' : 'text-blue-900') : (isDark ? 'text-gray-200' : 'text-gray-900')} mt-0.5`}>{day.day}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    {filteredMembers.map((member, memberIdx) => (
                      <div key={member.id} className={memberIdx > 0 ? 'mt-8' : ''}>
                        {selectedMemberFilter === 'all' && (
                          <div className={`h-10 flex border-y ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            {days.map((day, idx) => (
                              <div key={idx} className={`w-28 min-w-28 flex-shrink-0 border-r ${isDark ? 'border-slate-700' : 'border-slate-200'}`}></div>
                            ))}
                          </div>
                        )}
                        {member.projects.map((project, projIdx) => {
                          const isExpanded = expandedProjects.includes(project.id);
                          return (
                            <div key={project.id} className={`${selectedMemberFilter !== 'all' && projIdx > 0 ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : (projIdx > 0 || selectedMemberFilter === 'all' ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : '')}`}>
                              <div className={`h-20 flex ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                {days.map((day, dayIdx) => {
                                  const dayIndexInAll = allDays.findIndex(d => d.day === day.day && d.month === day.month);
                                  const hours = sumTaskHours(project.tasks, dayIndexInAll);
                                  return (
                                    <div
                                      key={dayIdx}
                                      className={`w-28 min-w-28 flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} p-2.5 flex items-center justify-center ${day.isToday ? (isDark ? 'bg-blue-500/10 border-l-2 border-r-2 border-blue-600' : 'bg-blue-50 border-l-2 border-r-2 border-blue-300') :
                                        day.isWeekend ? (isDark ? 'bg-gray-850' : 'bg-gray-50') : ''
                                        }`}
                                      onMouseEnter={(e) => !isExpanded && !day.isWeekend && hours.actual > 0 && showTooltip(e, project.name, hours.planned, hours.actual)}
                                      onMouseLeave={hideTooltip}
                                    >
                                      {!isExpanded && !day.isWeekend && hours.actual > 0 && (
                                        <div className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center cursor-default`}>
                                          <span className="text-sm font-semibold whitespace-nowrap">{formatHours(hours.actual)}</span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {isExpanded && project.tasks.map((task, taskIdx) => (
                                <div key={task.id} className={`h-16 flex ${isDark ? 'bg-gray-850' : 'bg-gray-50'} ${taskIdx > 0 ? `border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}` : 'border-t border-gray-200 dark:border-gray-700'
                                  }`}>
                                  {days.map((day, dayIdx) => {
                                    const dayIndexInAll = allDays.findIndex(d => d.day === day.day && d.month === day.month);
                                    const hours = task.hours[dayIndexInAll];
                                    return (
                                      <div
                                        key={dayIdx}
                                        className={`w-28 min-w-28 flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} p-2 flex items-center justify-center ${day.isToday ? (isDark ? 'bg-blue-500/10 border-l-2 border-r-2 border-blue-600' : 'bg-blue-50 border-l-2 border-r-2 border-blue-300') :
                                          day.isWeekend ? (isDark ? 'bg-gray-800' : 'bg-white') : ''
                                          }`}
                                        onMouseEnter={(e) => !day.isWeekend && hours?.actual > 0 && showTooltip(e, task.name, hours.planned, hours.actual)}
                                        onMouseLeave={hideTooltip}
                                      >
                                        {!day.isWeekend && hours?.actual > 0 && (
                                          <div className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center cursor-default`}>
                                            <span className="text-xs font-semibold whitespace-nowrap">{formatHours(hours.actual)}</span>
                                          </div>
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
                    ))}
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