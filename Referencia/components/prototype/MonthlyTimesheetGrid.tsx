
import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Search } from 'lucide-react';

export const MonthlyTimesheetGrid = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('2025-12');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');

  const months = [
    { value: '2025-11', label: 'Novembro 2025' },
    { value: '2025-12', label: 'Dezembro 2025' },
    { value: '2026-01', label: 'Janeiro 2026' },
  ];

  const generateDays = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const days = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month - 1, i);
      const dayOfWeek = date.getDay();
      
      days.push({
        date: date,
        day: date.getDate(),
        month: date.getMonth() + 1,
        weekday: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][dayOfWeek],
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    return days;
  };

  const days = generateDays();

  // Converte horas decimais para horas e minutos
  const formatHours = (hours: number) => {
    if (!hours || hours === 0) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (m === 0) return `${h}h`;
    return `${h}h${m}m`;
  };

  const generateRandomHours = (numDays: number) => {
    return Array.from({ length: numDays }, (_, idx) => {
      const isWeekend = days[idx]?.isWeekend;
      if (isWeekend) return { planned: 0, actual: 0 };
      
      const planned = Math.floor(Math.random() * 5) + 3;
      const actual = planned + (Math.random() * 2 - 1);
      return {
        planned: Math.max(0, planned),
        actual: Math.max(0, Math.round(actual * 10) / 10)
      };
    });
  };

  // Função para somar horas de todas as subtarefas
  const sumTaskHours = (tasks: any[]) => {
    return days.map((_, dayIdx) => {
      const totalPlanned = tasks.reduce((sum, task) => sum + (task.hours[dayIdx]?.planned || 0), 0);
      const totalActual = tasks.reduce((sum, task) => sum + (task.hours[dayIdx]?.actual || 0), 0);
      return {
        planned: Math.round(totalPlanned * 10) / 10,
        actual: Math.round(totalActual * 10) / 10
      };
    });
  };

  const teamMembers = [
    {
      id: 'brozinga',
      name: 'Brozinga',
      initials: 'BR',
      projects: [
        {
          id: 'proj-1',
          name: 'Integração API Bancária',
          tasks: [
            { id: 'task-1', name: 'Desenvolvimento de Feature', hours: generateRandomHours(days.length) },
            { id: 'task-2', name: 'Code Review', hours: generateRandomHours(days.length) }
          ]
        },
        {
          id: 'proj-3',
          name: 'Suporte & Sustentação',
          tasks: [
            { id: 'task-5', name: 'Atendimento N3', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    },
    {
      id: 'rafael',
      name: 'Rafael',
      initials: 'RA',
      projects: [
        {
          id: 'proj-1',
          name: 'Integração API Bancária',
          tasks: [
            { id: 'task-1', name: 'Desenvolvimento de Feature', hours: generateRandomHours(days.length) },
            { id: 'task-3', name: 'Testes Integrados', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    },
    {
      id: 'pedro',
      name: 'Pedro',
      initials: 'PE',
      projects: [
        {
          id: 'proj-1',
          name: 'Integração API Bancária',
          tasks: [
            { id: 'task-2', name: 'Testes Integrados', hours: generateRandomHours(days.length) }
          ]
        },
        {
          id: 'proj-2',
          name: 'Refatoração Legacy',
          tasks: [
            { id: 'task-4', name: 'Análise de Performance', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    },
    {
      id: 'alvaro',
      name: 'Alvaro',
      initials: 'AL',
      projects: [
        {
          id: 'proj-2',
          name: 'Refatoração Legacy',
          tasks: [
            { id: 'task-3', name: 'Análise de Código', hours: generateRandomHours(days.length) },
            { id: 'task-4', name: 'Implementação', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    },
    {
      id: 'paresqui',
      name: 'Paresqui',
      initials: 'PA',
      projects: [
        {
          id: 'proj-2',
          name: 'Refatoração Legacy',
          tasks: [
            { id: 'task-4', name: 'Implementação', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    },
    {
      id: 'thiago',
      name: 'Thiago',
      initials: 'TH',
      projects: [
        {
          id: 'proj-1',
          name: 'Integração API Bancária',
          tasks: [
            { id: 'task-2', name: 'Testes Integrados', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    },
    {
      id: 'soares',
      name: 'Soares',
      initials: 'SO',
      projects: [
        {
          id: 'proj-2',
          name: 'Refatoração Legacy',
          tasks: [
            { id: 'task-5', name: 'Documentação', hours: generateRandomHours(days.length) }
          ]
        },
        {
          id: 'proj-3',
          name: 'Suporte & Sustentação',
          tasks: [
            { id: 'task-6', name: 'Atendimento N2', hours: generateRandomHours(days.length) }
          ]
        }
      ]
    }
  ];

  const filteredMembers = selectedMemberFilter === 'all' 
    ? teamMembers 
    : teamMembers.filter(m => m.id === selectedMemberFilter);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      (scrollRef.current as HTMLDivElement).scrollBy({
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

  const handleMemberFilterClick = (memberId: string) => {
    if (selectedMemberFilter === memberId) {
      setSelectedMemberFilter('all');
      setExpandedProjects([]);
    } else {
      setSelectedMemberFilter(memberId);
      setExpandedProjects([]);
    }
  };

  // --- NOVA LÓGICA DE CORES (Minimalista) ---
  const getStatusColor = (planned: number, actual: number) => {
    if (!actual || actual === 0) return 'bg-white text-gray-300 border-gray-200 border-dashed'; // Empty State
    
    const diff = Math.abs(actual - planned);
    const percent = planned > 0 ? (diff / planned) * 100 : 100;
    
    // GARGALO / CRÍTICO (> 20% de desvio): Vermelho para chamar atenção
    if (percent > 20) {
      return 'bg-rose-50 text-rose-700 border-rose-200 font-bold shadow-sm';
    }
    
    // NORMAL / ESPERADO: Cor leve e limpa (Slate suave)
    // Removemos o verde e o amarelo para deixar a tela menos "arco-íris"
    return 'bg-[#F8FAFC] text-slate-600 border-slate-200 hover:border-indigo-200 hover:shadow-sm transition-all';
  };

  // Tamanho fixo mínimo das células
  const cellWidth = zoom === 0.8 ? 'w-14 min-w-14' : zoom === 1 ? 'w-20 min-w-20' : 'w-24 min-w-24';
  const cellHeight = zoom === 0.8 ? 'h-12' : zoom === 1 ? 'h-14' : 'h-16';
  const taskHeight = zoom === 0.8 ? 'h-10' : zoom === 1 ? 'h-11' : 'h-12';

  const isFiltered = selectedMemberFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-full mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Search size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Timesheet Mensal</h1>
                <p className="text-sm text-gray-500 font-medium">Gestão de horas da equipe</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-white text-sm font-bold text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="h-6 w-px bg-gray-300"></div>

              {/* Zoom Controls */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                 <button 
                   onClick={() => setZoom(0.8)} 
                   className={`px-2 py-1 text-xs font-bold rounded ${zoom === 0.8 ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                 >80%</button>
                 <button 
                   onClick={() => setZoom(1)} 
                   className={`px-2 py-1 text-xs font-bold rounded ${zoom === 1 ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                 >100%</button>
                 <button 
                   onClick={() => setZoom(1.2)} 
                   className={`px-2 py-1 text-xs font-bold rounded ${zoom === 1.2 ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                 >120%</button>
              </div>

              <div className="h-6 w-px bg-gray-300"></div>

              <button
                onClick={() => scroll('left')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedMemberFilter('all');
                  setExpandedProjects([]);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  selectedMemberFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {teamMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => handleMemberFilterClick(member.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    selectedMemberFilter === member.id
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                    selectedMemberFilter === member.id
                      ? 'bg-white bg-opacity-20 text-white'
                      : 'bg-white text-slate-700'
                  }`}>
                    {member.initials}
                  </div>
                  {member.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm flex h-[600px]">
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
            <div className="h-16 border-b border-gray-200 flex items-center px-4 bg-gray-50 flex-shrink-0">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Projetos / Tarefas
              </span>
            </div>
            
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {filteredMembers.map((member, memberIdx) => (
                <div key={member.id} className={memberIdx > 0 ? 'border-t border-gray-200' : ''}>
                  {/* Se estiver filtrado, não mostramos o cabeçalho do membro de novo, pois já sabemos quem é.
                      Se for 'todos', mostramos o cabeçalho do membro.
                   */}
                  {selectedMemberFilter === 'all' && (
                     <div className="px-4 py-2 bg-slate-100/50 text-xs font-bold text-slate-500 uppercase border-b border-slate-100 sticky top-0 z-10">
                        {member.name}
                     </div>
                  )}

                  {member.projects.map((project) => {
                    const isExpanded = expandedProjects.includes(project.id);
                    
                    return (
                      <div key={project.id}>
                        <div
                          onClick={() => toggleProject(project.id)}
                          className="px-4 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors bg-white border-l-2 border-slate-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isExpanded ? 
                                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" /> : 
                                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              }
                              <span className="text-sm font-bold text-gray-800 truncate max-w-[220px]" title={project.name}>{project.name}</span>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="bg-gray-50">
                            {project.tasks.map((task) => (
                              <div
                                key={task.id}
                                className={`px-6 flex items-center hover:bg-gray-100 transition-colors border-t border-gray-100 ${taskHeight}`}
                              >
                                <span className="text-xs font-medium text-gray-600 truncate" title={task.name}>{task.name}</span>
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

          <div 
            className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-50" 
            ref={scrollRef}
          >
            <div className="inline-block min-w-full h-full relative">
              {/* Header das Datas - Sticky Top */}
              <div className="h-16 flex border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-[0_2px_5px_-2px_rgba(0,0,0,0.05)]">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={`${cellWidth} flex-shrink-0 flex flex-col items-center justify-center border-r border-gray-100 ${
                      day.isWeekend ? 'bg-gray-100' : 'bg-white'
                    }`}
                  >
                    <span className="text-[10px] font-medium text-gray-500 uppercase">{day.weekday}</span>
                    <span className="text-sm font-bold text-gray-900 mt-0.5">{day.day}</span>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div>
                {filteredMembers.map((member, memberIdx) => (
                  <div key={member.id} className={memberIdx > 0 ? 'border-t border-gray-200' : ''}>
                    
                    {/* Espaçador para alinhar com o cabeçalho do membro na esquerda */}
                    {selectedMemberFilter === 'all' && (
                       <div className="h-[33px] bg-slate-100/50 border-b border-slate-100"></div>
                    )}

                    {member.projects.map((project) => {
                      const isExpanded = expandedProjects.includes(project.id);
                      const projectTotalHours = sumTaskHours(project.tasks);
                      
                      return (
                        <div key={project.id}>
                          {/* Linha do Projeto com horas totais (quando fechado) */}
                          <div className={`${cellHeight} flex bg-white border-t border-gray-200 transition-colors hover:bg-slate-50`}>
                            {days.map((day, dayIdx) => {
                              const hours = projectTotalHours[dayIdx];
                              
                              return (
                                <div
                                  key={dayIdx}
                                  className={`${cellWidth} flex-shrink-0 border-r border-gray-100 p-2 relative group flex items-center justify-center ${
                                    day.isWeekend ? 'bg-slate-50/30' : ''
                                  }`}
                                >
                                  {!isExpanded && !day.isWeekend && hours.actual > 0 && (
                                    <>
                                      <div
                                        className={`w-full h-8 rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center transition-all cursor-default`}
                                      >
                                        <span className={`${zoom === 0.8 ? 'text-[10px]' : 'text-xs'} font-semibold whitespace-nowrap`}>
                                          {formatHours(hours.actual)}
                                        </span>
                                      </div>
                                      
                                      <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                        <div className="font-semibold mb-1">{project.name}</div>
                                        <div className="space-y-0.5 text-gray-300">
                                          <div>Planejado: {formatHours(hours.planned)}</div>
                                          <div>Realizado: {formatHours(hours.actual)}</div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  {isExpanded && !day.isWeekend && (
                                     <span className="text-[10px] text-slate-300 font-bold">-</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Tarefas (quando expandido) */}
                          {isExpanded && project.tasks.map((task) => (
                            <div key={task.id} className={`${taskHeight} flex bg-slate-50/30 border-t border-gray-100`}>
                              {days.map((day, dayIdx) => {
                                const hours = task.hours[dayIdx];
                                
                                return (
                                  <div
                                    key={dayIdx}
                                    className={`${cellWidth} flex-shrink-0 border-r border-gray-100 p-1.5 relative group flex items-center justify-center ${
                                      day.isWeekend ? 'bg-slate-50/50' : ''
                                    }`}
                                  >
                                    {!day.isWeekend && hours.actual > 0 ? (
                                      <>
                                        <div
                                          className={`w-full h-full rounded border ${getStatusColor(hours.planned, hours.actual)} flex items-center justify-center transition-all cursor-default`}
                                        >
                                          <span className={`${zoom === 0.8 ? 'text-[10px]' : 'text-xs'} font-semibold whitespace-nowrap`}>
                                            {formatHours(hours.actual)}
                                          </span>
                                        </div>
                                        
                                        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                          <div className="font-semibold mb-1">{task.name}</div>
                                          <div className="space-y-0.5 text-gray-300">
                                            <div>Planejado: {formatHours(hours.planned)}</div>
                                            <div>Realizado: {formatHours(hours.actual)}</div>
                                          </div>
                                        </div>
                                      </>
                                    ) : (
                                       !day.isWeekend && <span className="text-slate-200 text-[10px]">+</span>
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
        
        {/* LEGENDA REMOVIDA PARA VISUAL MAIS LIMPO */}
      </div>
    </div>
  );
};
