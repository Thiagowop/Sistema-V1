import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon,
  Clock,
  Briefcase,
  FileText,
  User,
  Filter
} from 'lucide-react';

// --- TYPES & MOCK GENERATORS ---

interface DailyLog {
  hours: number;
  status: 'ok' | 'warning' | 'critical' | 'empty';
}

interface WTask {
  id: string;
  name: string;
  logs: Record<string, DailyLog>; // Key: YYYY-MM-DD
}

interface WProject {
  id: string;
  name: string;
  client: string;
  tasks: WTask[];
}

interface WMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  projects: WProject[];
}

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

// Helper to get weeks of a month
const getWeeksInMonth = (year: number, month: number) => {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Start from the first day of the month, adjusted to previous Monday if necessary
  let current = new Date(firstDay);
  const dayOfWeek = current.getDay(); // 0 (Sun) to 6 (Sat)
  // Adjust to Monday (1)
  const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  current.setDate(diff);

  let weekNumber = 1;

  while (current <= lastDay || (current.getMonth() === month && current.getDay() !== 1)) {
    const weekStart = new Date(current);
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weeks.push({
      id: weekNumber,
      label: `Semana ${weekNumber}`,
      range: `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1}`,
      start: weekStart,
      end: weekEnd,
      days: Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      })
    });

    // Advance 7 days
    current.setDate(current.getDate() + 7);
    weekNumber++;
    
    // Safety break
    if (weekNumber > 6) break;
  }
  
  return weeks;
};

const generateMockData = (weeks: any[]): WMember[] => {
  const members = ['Brozinga', 'Paresqui', 'Alvaro', 'Thiago', 'Soares'];
  const roles = ['Tech Lead', 'Dev Pleno', 'Suporte', 'PM', 'Estagiário'];
  const colors = ['bg-blue-600', 'bg-violet-600', 'bg-amber-600', 'bg-emerald-600', 'bg-indigo-600'];

  return members.map((name, idx) => {
    return {
      id: `m-${idx}`,
      name,
      role: roles[idx],
      avatarColor: colors[idx],
      projects: [
        {
          id: `p-${idx}-1`,
          name: 'Desenvolvimento Core',
          client: 'Interno',
          tasks: [
            { id: `t-${idx}-1-1`, name: 'Implementação de API', logs: {} },
            { id: `t-${idx}-1-2`, name: 'Code Review', logs: {} }
          ]
        },
        {
          id: `p-${idx}-2`,
          name: 'Sustentação',
          client: 'Cliente A',
          tasks: [
            { id: `t-${idx}-2-1`, name: 'Correção de Bugs', logs: {} }
          ]
        }
      ].map(proj => {
        // Fill logs
        proj.tasks.forEach(task => {
          weeks.forEach((week: any) => {
            week.days.forEach((day: Date) => {
              if (day.getDay() !== 0 && day.getDay() !== 6 && Math.random() > 0.6) {
                const hours = Math.floor(Math.random() * 4) + 1;
                task.logs[day.toISOString().split('T')[0]] = {
                  hours,
                  status: hours > 4 ? 'warning' : 'ok'
                };
              }
            });
          });
        });
        return proj;
      })
    };
  });
};

export const WeeklyTimesheet: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Derived State
  const weeks = useMemo(() => {
    return getWeeksInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const activeWeek = weeks[activeWeekIndex] || weeks[0];
  
  // Mock Data (regenerates when month changes to simulate fetch)
  const data = useMemo(() => generateMockData(weeks), [weeks]);

  // Handlers
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
    setActiveWeekIndex(0); // Reset to first week
  };

  const calculateTotal = (logs: Record<string, DailyLog>, days: Date[]) => {
    return days.reduce((acc, day) => {
      const key = day.toISOString().split('T')[0];
      return acc + (logs[key]?.hours || 0);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
      
      {/* 1. Header & Controls */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm z-20 relative">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
           <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-all shadow-sm"><ChevronLeft size={18} /></button>
              <div className="px-4 font-bold text-slate-700 min-w-[140px] text-center select-none">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-all shadow-sm"><ChevronRight size={18} /></button>
           </div>
           
           <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
           
           <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer hover:border-indigo-300 transition-colors">
              <Filter size={14} />
              <span>Filtrar Equipe</span>
           </div>
        </div>

        {/* WEEKLY TABS */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full xl:w-auto overflow-x-auto no-scrollbar">
           {weeks.map((week, idx) => (
             <button
               key={week.id}
               onClick={() => setActiveWeekIndex(idx)}
               className={`
                 flex flex-col items-center justify-center px-4 py-1.5 rounded-lg text-xs font-medium transition-all min-w-[100px] flex-shrink-0
                 ${activeWeekIndex === idx 
                   ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                   : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                 }
               `}
             >
               <span className={`font-bold ${activeWeekIndex === idx ? 'text-indigo-700' : ''}`}>{week.label}</span>
               <span className="text-[10px] opacity-70">{week.range}</span>
             </button>
           ))}
        </div>
      </div>

      {/* 2. Main Timesheet Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-w-[800px]">
           
           {/* Grid Header */}
           <div className="grid grid-cols-[300px_1fr] border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
              <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                 Colaborador / Projeto
              </div>
              <div className="grid grid-cols-8">
                 {activeWeek.days.map((day: Date, i: number) => {
                   const isToday = day.toDateString() === new Date().toDateString();
                   const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                   
                   return (
                     <div key={i} className={`flex flex-col items-center justify-center p-2 border-l border-slate-200 ${isToday ? 'bg-indigo-50' : ''}`}>
                        <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                        </span>
                        <span className={`text-sm font-bold ${isToday ? 'text-indigo-700' : isWeekend ? 'text-slate-400' : 'text-slate-700'}`}>
                          {day.getDate()}
                        </span>
                     </div>
                   );
                 })}
                 <div className="flex items-center justify-center p-2 border-l border-slate-200 bg-slate-100 text-xs font-bold text-slate-500 uppercase">
                    Total
                 </div>
              </div>
           </div>

           {/* Grid Body */}
           <div className="divide-y divide-slate-100">
              {data.map(member => {
                const isExpanded = expandedIds.has(member.id);
                // Calculate Member Totals for the Week
                const memberTotal = member.projects.reduce((acc, proj) => {
                   return acc + proj.tasks.reduce((tAcc, task) => tAcc + calculateTotal(task.logs, activeWeek.days), 0);
                }, 0);

                return (
                  <div key={member.id} className="group">
                     {/* Level 1: Member Row */}
                     <div className="grid grid-cols-[300px_1fr] bg-white hover:bg-slate-50 transition-colors">
                        <div 
                          className="p-3 pl-4 flex items-center gap-3 cursor-pointer border-r border-transparent group-hover:border-slate-200"
                          onClick={() => toggleExpand(member.id)}
                        >
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm ${member.avatarColor}`}>
                              {member.name.substring(0,2)}
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800">{member.name}</p>
                              <p className="text-[10px] text-slate-500">{member.role}</p>
                           </div>
                           <div className="text-slate-300">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                           </div>
                        </div>

                        {/* Member Columns (Aggregated) */}
                        <div className="grid grid-cols-8">
                           {activeWeek.days.map((day: Date, i: number) => {
                              const dateKey = day.toISOString().split('T')[0];
                              const dayTotal = member.projects.reduce((acc, proj) => {
                                return acc + proj.tasks.reduce((tAcc, task) => tAcc + (task.logs[dateKey]?.hours || 0), 0);
                              }, 0);
                              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                              return (
                                <div key={i} className={`flex items-center justify-center border-l border-slate-100 ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                                   {dayTotal > 0 ? (
                                     <span className="font-bold text-sm text-slate-700">{formatHours(dayTotal)}</span>
                                   ) : (
                                     <span className="text-slate-200 text-xs">-</span>
                                   )}
                                </div>
                              );
                           })}
                           <div className="flex items-center justify-center border-l border-slate-200 bg-slate-50">
                              <span className="font-bold text-sm text-indigo-600">{formatHours(memberTotal)}</span>
                           </div>
                        </div>
                     </div>

                     {/* Level 2: Projects & Tasks */}
                     {isExpanded && member.projects.map(project => {
                       const isProjExpanded = expandedIds.has(project.id);
                       
                       return (
                         <div key={project.id} className="bg-slate-50/30">
                            {/* Project Header */}
                            <div className="grid grid-cols-[300px_1fr] border-t border-slate-100">
                               <div 
                                 className="py-2 px-4 pl-12 flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors"
                                 onClick={() => toggleExpand(project.id)}
                               >
                                  {isProjExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRightIcon size={14} className="text-slate-400" />}
                                  <Briefcase size={14} className="text-slate-400" />
                                  <span className="text-xs font-bold text-slate-600 truncate">{project.name}</span>
                               </div>
                               <div className="grid grid-cols-8 opacity-50">
                                  {/* Empty cells for project header to reduce noise, or add project totals here */}
                                  {Array.from({length:8}).map((_, k) => (
                                    <div key={k} className="border-l border-slate-100"></div>
                                  ))}
                               </div>
                            </div>

                            {/* Tasks Rows */}
                            {isProjExpanded && project.tasks.map(task => (
                               <div key={task.id} className="grid grid-cols-[300px_1fr] border-t border-slate-100 bg-white hover:bg-indigo-50/10 transition-colors">
                                  <div className="py-3 px-4 pl-20 flex items-center gap-2">
                                     <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                     <span className="text-xs text-slate-500 truncate" title={task.name}>{task.name}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-8">
                                     {activeWeek.days.map((day: Date, i: number) => {
                                        const dateKey = day.toISOString().split('T')[0];
                                        const log = task.logs[dateKey];
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                        
                                        return (
                                          <div key={i} className={`flex items-center justify-center border-l border-slate-100 relative p-1 ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                                             {log ? (
                                               <div className={`
                                                 w-full h-full rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer transition-transform hover:scale-105
                                                 ${log.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-700'}
                                               `}>
                                                  {formatHours(log.hours)}
                                               </div>
                                             ) : (
                                               <div className="w-full h-full hover:bg-slate-50 rounded-md cursor-pointer group/cell flex items-center justify-center">
                                                  <span className="opacity-0 group-hover/cell:opacity-100 text-slate-300 text-[10px]">+</span>
                                               </div>
                                             )}
                                          </div>
                                        );
                                     })}
                                     <div className="flex items-center justify-center border-l border-slate-200 text-xs font-bold text-slate-600 bg-slate-50/50">
                                        {formatHours(calculateTotal(task.logs, activeWeek.days))}
                                     </div>
                                  </div>
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
  );
};