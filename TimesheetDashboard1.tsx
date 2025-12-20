import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Eye, EyeOff, Moon, Sun, LayoutGrid } from 'lucide-react';

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

const TimesheetDashboard: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2025-12');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');
  const [showWeekends, setShowWeekends] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'calendar'>('timeline');
  const [isDark, setIsDark] = useState<boolean>(false);

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

  const months: MonthOption[] = [
    { value: '2025-11', label: 'Novembro 2025' },
    { value: '2025-12', label: 'Dezembro 2025' },
    { value: '2026-01', label: 'Janeiro 2026' },
  ];

  const generateAllDays = useCallback((): DayData[] => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const days: DayData[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayOfWeek = date.getDay();
      
      // Check if this specific date is today
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

  const teamMembers = useMemo<Member[]>(() => [
    {
      id: 'brozinga', name: 'Brozinga', initials: 'BR',
      projects: [
        { id: 'brozinga-proj-1', name: 'Integração API Bancária',
          tasks: [
            { id: 'task-1', name: 'Desenvolvimento de Feature', hours: generateProjectHours('brozinga-task-1', allDays.length) },
            { id: 'task-2', name: 'Code Review', hours: generateProjectHours('brozinga-task-2', allDays.length) }
          ]
        },
        { id: 'brozinga-proj-2', name: 'Suporte & Sustentação',
          tasks: [{ id: 'task-5', name: 'Atendimento N3', hours: generateProjectHours('brozinga-task-5', allDays.length) }]
        }
      ]
    },
    {
      id: 'rafael', name: 'Rafael', initials: 'RA',
      projects: [
        { id: 'rafael-proj-1', name: 'Integração API Bancária',
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
        { id: 'pedro-proj-1', name: 'Integração API Bancária',
          tasks: [{ id: 'task-2', name: 'Testes Integrados', hours: generateProjectHours('pedro-task-2', allDays.length) }]
        },
        { id: 'pedro-proj-2', name: 'Refatoração Legacy',
          tasks: [{ id: 'task-4', name: 'Análise de Performance', hours: generateProjectHours('pedro-task-4', allDays.length) }]
        }
      ]
    }
  ], [allDays.length, generateProjectHours]);

  const filteredMembers = selectedMemberFilter === 'all' ? teamMembers : teamMembers.filter(m => m.id === selectedMemberFilter);

  const scroll = (direction: 'left' | 'right') => {
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

  const CalendarView = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startingDay = firstDay.getDay();
    
    let calendarDays: (number | null)[] = [];
    if (showWeekends) {
      calendarDays = [...Array(startingDay).fill(null), ...Array.from({length: daysInMonth}, (_, i) => i + 1)];
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
                const isWeekend = showWeekends && (index % 7 === 0 || index % 7 === 6);
                const totalPlanned = projects.reduce((sum, p) => sum + p.planned, 0);
                const totalActual = projects.reduce((sum, p) => sum + p.actual, 0);
                // We use generateAllDays() so we need to be careful with isToday logic in calendar
                // Since 'day' is just a number here, we reconstruct the date to check
                const isToday = day 
                  ? new Date(year, month - 1, day).toDateString() === new Date().toDateString() 
                  : false;
                
                return (
                  <div key={index} className={`min-h-36 p-2 border-b border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
                    isToday
                      ? (isDark ? 'bg-blue-500/10 ring-2 ring-inset ring-blue-500' : 'bg-blue-50 ring-2 ring-inset ring-blue-400')
                      : (isWeekend ? (isDark ? 'bg-gray-850' : 'bg-gray-50') : (isDark ? 'bg-gray-800' : 'bg-white'))
                  } ${!day ? 'opacity-30' : ''}`}>
                    {day && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-semibold ${isToday ? 'text-blue-500' : (isDark ? 'text-gray-300' : 'text-gray-700')}`}>{day}</span>
                          {totalActual > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                              totalActual > totalPlanned * 1.1 
                                ? (isDark ? 'bg-rose-900 text-rose-200' : 'bg-rose-100 text-rose-700')
                                : totalActual < totalPlanned * 0.9
                                ? (isDark ? 'bg-amber-900 text-amber-200' : 'bg-amber-100 text-amber-700')
                                : (isDark ? 'bg-emerald-900 text-emerald-200' : 'bg-emerald-100 text-emerald-700')
                            }`}>
                              {formatHours(totalActual)}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {projects.slice(0, 2).map((project, idx) => (
                            <div key={idx} className={`text-xs p-2 rounded border ${
                              project.status === 'over'
                                ? (isDark ? 'bg-rose-900 bg-opacity-20 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800')
                                : project.status === 'under'
                                ? (isDark ? 'bg-amber-900 bg-opacity-20 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800')
                                : (isDark ? 'bg-emerald-900 bg-opacity-20 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
                            }`}>
                              <div className="font-semibold truncate text-xs mb-1.5">{project.name}</div>
                              <div className="flex items-center gap-1 text-xs">
                                <div className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-black bg-opacity-20' : 'bg-white bg-opacity-50'}`}>
                                  <div className="text-xs opacity-70">Plan</div>
                                  <div className="font-bold">{formatHours(project.planned)}</div>
                                </div>
                                <div className={`flex-1 px-2 py-1 rounded ${isDark ? 'bg-black bg-opacity-30' : 'bg-white bg-opacity-70'}`}>
                                  <div className="text-xs opacity-70">Real</div>
                                  <div className="font-bold">{formatHours(project.actual)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {projects.length > 2 && (
                            <div className={`text-xs px-2 py-1 text-center rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              +{projects.length - 2} projeto{projects.length - 2 > 1 ? 's' : ''}
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
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Timesheet</h1>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Gestão de horas da equipe</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button ref={themeButtonRef} onClick={toggleTheme} className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}>
                {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>

              <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
                className={`appearance-none pl-4 pr-10 py-2 border ${isDark ? 'border-gray-600 bg-gray-700 text-gray-200' : 'border-gray-300 bg-white text-gray-700'} rounded-lg text-sm font-medium cursor-pointer`}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>

              <div className={`h-6 w-px ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></div>

              <button onClick={() => setShowWeekends(!showWeekends)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  showWeekends ? (isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700') : (isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700')
                }`}>
                {showWeekends ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showWeekends ? 'Ocultar' : 'Mostrar'} FDS</span>
              </button>

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

          <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4 mb-4`}>
            <div className="flex gap-2">
              <button onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'timeline' ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white') : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700')
                }`}>
                <LayoutGrid className="w-4 h-4" />
                Timeline
              </button>
              <button onClick={() => setActiveTab('calendar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  activeTab === 'calendar' ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white') : (isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700')
                }`}>
                <Calendar className="w-4 h-4" />
                Calendário
              </button>
            </div>
          </div>

          <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => { setSelectedMemberFilter('all'); setExpandedProjects([]); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedMemberFilter === 'all' ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white') : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
                }`}>
                Todos
              </button>
              {teamMembers.map(member => (
                <button key={member.id} onClick={() => handleMemberFilterClick(member.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                    selectedMemberFilter === member.id ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-900 text-white') : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
                  }`}>
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                    selectedMemberFilter === member.id ? 'bg-white bg-opacity-20 text-white' : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-700')
                  }`}>{member.initials}</div>
                  {member.name}
                </button>
              ))}
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
                
                <div>
                  {filteredMembers.map((member, memberIdx) => (
                    <div key={member.id} className={memberIdx > 0 ? `border-t-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}` : ''}>
                      {member.projects.map((project, projIdx) => {
                        const isExpanded = expandedProjects.includes(project.id);
                        return (
                          <div key={project.id} className={projIdx > 0 ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : ''}>
                            <div onClick={() => toggleProject(project.id)}
                              className={`h-20 px-4 cursor-pointer ${isDark ? 'hover:bg-gray-700 bg-gray-800' : 'hover:bg-gray-50 bg-white'} transition-colors border-l-4 ${isDark ? 'border-gray-500' : 'border-gray-400'} flex items-center`}>
                              <div className="flex items-center gap-3">
                                {isExpanded ? <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} /> : <ChevronRight className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />}
                                <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{project.name}</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className={`${isDark ? 'bg-gray-850' : 'bg-gray-50'}`}>
                                {project.tasks.map((task, taskIdx) => (
                                  <div key={task.id} className={`h-16 px-6 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} transition-colors flex items-center ${
                                    taskIdx > 0 ? `border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}` : 'border-t border-gray-200 dark:border-gray-700'
                                  }`}>
                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{task.name}</span>
                                  </div>
                                ))}
                              </div>
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
                  const scrollTop = e.currentTarget.scrollTop;
                  const leftPanel = document.querySelector('.sidebar-scroll-container');
                  if (leftPanel && leftPanel.scrollTop !== scrollTop) {
                    leftPanel.scrollTop = scrollTop;
                  }
                }}
              >
                <div className="inline-block min-w-full">
                  <div className={`h-16 flex border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} sticky top-0 z-20`}>
                    {days.map((day, idx) => (
                      <div key={idx} className={`w-28 min-w-28 flex-shrink-0 flex flex-col items-center justify-center border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} ${
                        day.isToday ? (isDark ? 'bg-blue-500/10 border-blue-600 ring-2 ring-blue-500' : 'bg-blue-100 border-blue-400 ring-2 ring-blue-400') :
                        day.isWeekend ? (isDark ? 'bg-gray-800' : 'bg-gray-100') : (isDark ? 'bg-gray-900' : 'bg-white')
                      }`}>
                        <span className={`text-xs font-medium ${day.isToday ? (isDark ? 'text-blue-200' : 'text-blue-700') : (isDark ? 'text-gray-400' : 'text-gray-500')} uppercase`}>{day.weekday}</span>
                        <span className={`text-lg font-semibold ${day.isToday ? (isDark ? 'text-blue-100' : 'text-blue-900') : (isDark ? 'text-gray-200' : 'text-gray-900')} mt-0.5`}>{day.day}</span>
                      </div>
                    ))}
                  </div>

                  <div>
                    {filteredMembers.map((member, memberIdx) => (
                      <div key={member.id} className={memberIdx > 0 ? `border-t-4 ${isDark ? 'border-gray-600' : 'border-gray-300'}` : ''}>
                        {member.projects.map((project, projIdx) => {
                          const isExpanded = expandedProjects.includes(project.id);
                          return (
                            <div key={project.id} className={projIdx > 0 ? `border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}` : ''}>
                              <div className={`h-20 flex ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                {days.map((day, dayIdx) => {
                                  const dayIndexInAll = allDays.findIndex(d => d.day === day.day && d.month === day.month);
                                  const hours = sumTaskHours(project.tasks, dayIndexInAll);
                                  return (
                                    <div key={dayIdx} className={`w-28 min-w-28 flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} p-2.5 flex items-center justify-center relative group ${
                                      day.isToday ? (isDark ? 'bg-blue-500/10 border-l-2 border-r-2 border-blue-600' : 'bg-blue-50 border-l-2 border-r-2 border-blue-300') :
                                      day.isWeekend ? (isDark ? 'bg-gray-850' : 'bg-gray-50') : ''
                                    }`}>
                                      {!isExpanded && !day.isWeekend && hours.actual > 0 && (
                                        <>
                                          <div className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center cursor-default`}>
                                            <span className="text-sm font-semibold whitespace-nowrap">{formatHours(hours.actual)}</span>
                                          </div>
                                          <div className={`absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 ${isDark ? 'bg-gray-700' : 'bg-gray-900'} text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap`}>
                                            <div className="font-semibold mb-1">{project.name}</div>
                                            <div className="space-y-0.5 text-gray-300">
                                              <div>Planejado: {formatHours(hours.planned)}</div>
                                              <div>Realizado: {formatHours(hours.actual)}</div>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {isExpanded && project.tasks.map((task, taskIdx) => (
                                <div key={task.id} className={`h-16 flex ${isDark ? 'bg-gray-850' : 'bg-gray-50'} ${
                                  taskIdx > 0 ? `border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}` : 'border-t border-gray-200 dark:border-gray-700'
                                }`}>
                                  {days.map((day, dayIdx) => {
                                    const dayIndexInAll = allDays.findIndex(d => d.day === day.day && d.month === day.month);
                                    const hours = task.hours[dayIndexInAll];
                                    return (
                                      <div key={dayIdx} className={`w-28 min-w-28 flex-shrink-0 border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} p-2 flex items-center justify-center relative group ${
                                        day.isToday ? (isDark ? 'bg-blue-500/10 border-l-2 border-r-2 border-blue-600' : 'bg-blue-50 border-l-2 border-r-2 border-blue-300') :
                                        day.isWeekend ? (isDark ? 'bg-gray-800' : 'bg-white') : ''
                                      }`}>
                                        {!day.isWeekend && hours?.actual > 0 && (
                                          <>
                                            <div className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center cursor-default`}>
                                              <span className="text-xs font-semibold whitespace-nowrap">{formatHours(hours.actual)}</span>
                                            </div>
                                            <div className={`absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 ${isDark ? 'bg-gray-700' : 'bg-gray-900'} text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap`}>
                                              <div className="font-semibold mb-1">{task.name}</div>
                                              <div className="space-y-0.5 text-gray-300">
                                                <div>Planejado: {formatHours(hours.planned)}</div>
                                                <div>Realizado: {formatHours(hours.actual)}</div>
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
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimesheetDashboard;