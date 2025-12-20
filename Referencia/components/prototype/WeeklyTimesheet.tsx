
import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon,
  Filter,
} from 'lucide-react';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../../constants';

interface DailyLog {
  hours: number;
}

// --- HELPER FORMATTER ---
const formatHours = (value: number) => {
  if (!value) return '-';
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
  
  let current = new Date(firstDay);
  const dayOfWeek = current.getDay();
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

    current.setDate(current.getDate() + 7);
    weekNumber++;
    if (weekNumber > 6) break;
  }
  
  return weeks;
};

export const WeeklyTimesheet: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const weeks = useMemo(() => {
    return getWeeksInMonth(currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate]);

  const activeWeek = weeks[activeWeekIndex] || weeks[0];
  
  // CONSUMING CENTRALIZED DATA
  const data = useMemo(() => {
    return MOCK_LEGACY_DATA.map(group => {
      // Find team member info for role/color
      // In a real app we'd have this in the object, mocking colors for now based on name index
      const colors = ['bg-blue-600', 'bg-violet-600', 'bg-amber-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-rose-600', 'bg-sky-600'];
      const memberIndex = MOCK_TEAM_DATA.findIndex(m => m.name === group.assignee);
      const color = colors[memberIndex % colors.length] || 'bg-slate-600';
      
      const projects = group.projects.map(proj => {
        const tasks = proj.tasks.map(task => {
           // Simulate distribution of total logged hours across the week
           const logs: Record<string, DailyLog> = {};
           if (task.timeLogged && task.timeLogged > 0) {
              // Distribute 'timeLogged' across days where startDate <= day <= dueDate (or roughly today)
              // For visualization consistency, we simply spread it on valid weekdays
              const spread = 5;
              const perDay = task.timeLogged / spread;
              
              // We need to map this to "dates" relative to today to show up in the current week view
              // Since MOCK_LEGACY_DATA has dates relative to today, we can use that.
              
              // Simplification: If task has hours, show them on days relative to start date
              if (task.startDate) {
                 const start = new Date(task.startDate);
                 for(let i=0; i<spread; i++) {
                    const d = new Date(start);
                    d.setDate(d.getDate() + i);
                    if (d.getDay() !== 0 && d.getDay() !== 6) {
                        logs[d.toISOString().split('T')[0]] = { hours: perDay };
                    }
                 }
              }
           }
           
           return {
             id: task.id,
             name: task.name,
             logs
           };
        });

        return {
          id: `${group.assignee}-${proj.name}`,
          name: proj.name,
          tasks
        };
      });

      return {
        id: group.assignee,
        name: group.assignee,
        role: 'Membro da Equipe', // Placeholder
        avatarColor: color,
        projects
      };
    });
  }, []);

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
    setActiveWeekIndex(0);
  };

  const calculateTotal = (logs: Record<string, DailyLog>, days: Date[]) => {
    return days.reduce((acc, day) => {
      const key = day.toISOString().split('T')[0];
      return acc + (logs[key]?.hours || 0);
    }, 0);
  };

  const DAY_COL_CLASS = "min-w-[140px] flex-1"; 
  const LABEL_COL_CLASS = "w-[300px] shrink-0 sticky left-0 z-30 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]";

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
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

      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col w-full h-full">
           <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-40">
              <div className={`p-4 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center ${LABEL_COL_CLASS} border-b border-r border-slate-200 bg-slate-50`}>
                 Colaborador / Projeto
              </div>
              <div className="flex flex-1">
                 {activeWeek.days.map((day: Date, i: number) => {
                   const isToday = day.toDateString() === new Date().toDateString();
                   return (
                     <div key={i} className={`flex flex-col items-center justify-center p-3 border-r border-slate-200 ${DAY_COL_CLASS} ${isToday ? 'bg-indigo-50' : ''}`}>
                        <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {day.toLocaleDateString('pt-BR', { weekday: 'long' })}
                        </span>
                        <span className={`text-xl font-bold mt-1 ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                          {day.getDate()}
                        </span>
                     </div>
                   );
                 })}
                 <div className="flex items-center justify-center p-3 w-[100px] shrink-0 bg-slate-100 text-xs font-bold text-slate-500 uppercase">
                    Total
                 </div>
              </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-slate-100">
                  {data.map(member => {
                    const isExpanded = expandedIds.has(member.id);
                    const memberTotal = member.projects.reduce((acc, proj) => {
                      return acc + proj.tasks.reduce((tAcc, task) => tAcc + calculateTotal(task.logs, activeWeek.days), 0);
                    }, 0);

                    return (
                      <div key={member.id} className="group">
                        <div className="flex bg-white hover:bg-slate-50 transition-colors">
                            <div 
                              className={`p-3 pl-4 flex items-center gap-3 cursor-pointer border-r border-slate-100 group-hover:border-slate-200 ${LABEL_COL_CLASS}`}
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

                            <div className="flex flex-1">
                              {activeWeek.days.map((day: Date, i: number) => {
                                  const dateKey = day.toISOString().split('T')[0];
                                  const dayTotal = member.projects.reduce((acc, proj) => {
                                    return acc + proj.tasks.reduce((tAcc, task) => tAcc + (task.logs[dateKey]?.hours || 0), 0);
                                  }, 0);
                                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                                  return (
                                    <div key={i} className={`flex items-center justify-center border-r border-slate-100 ${DAY_COL_CLASS} ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                                      {dayTotal > 0 ? (
                                        <span className="font-bold text-sm text-slate-700">{formatHours(dayTotal)}</span>
                                      ) : (
                                        <span className="text-slate-200 text-xs">-</span>
                                      )}
                                    </div>
                                  );
                              })}
                              <div className="flex items-center justify-center w-[100px] shrink-0 border-l border-slate-200 bg-slate-50">
                                  <span className="font-bold text-sm text-indigo-600">{formatHours(memberTotal)}</span>
                              </div>
                            </div>
                        </div>

                        {isExpanded && member.projects.map(project => {
                          const isProjExpanded = expandedIds.has(project.id);
                          
                          return (
                            <div key={project.id} className="bg-slate-50/30">
                                <div className="flex border-t border-slate-100">
                                  <div 
                                    className={`py-2 px-4 pl-12 flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors border-r border-slate-100 ${LABEL_COL_CLASS} bg-slate-50`}
                                    onClick={() => toggleExpand(project.id)}
                                  >
                                      {isProjExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRightIcon size={14} className="text-slate-400" />}
                                      <span className="text-xs font-bold text-slate-600 truncate">{project.name}</span>
                                  </div>
                                  <div className="flex flex-1 opacity-50">
                                      {Array.from({length:7}).map((_, k) => (
                                        <div key={k} className={`border-r border-slate-100 ${DAY_COL_CLASS}`}></div>
                                      ))}
                                      <div className="w-[100px] shrink-0 border-l border-slate-100"></div>
                                  </div>
                                </div>

                                {isProjExpanded && project.tasks.map(task => (
                                  <div key={task.id} className="flex border-t border-slate-100 bg-white hover:bg-indigo-50/5 transition-colors">
                                      <div className={`py-3 px-4 pl-20 flex items-center gap-2 border-r border-slate-100 ${LABEL_COL_CLASS}`}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <span className="text-xs text-slate-500 truncate" title={task.name}>{task.name}</span>
                                      </div>
                                      
                                      <div className="flex flex-1">
                                        {activeWeek.days.map((day: Date, i: number) => {
                                            const dateKey = day.toISOString().split('T')[0];
                                            const log = task.logs[dateKey];
                                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                            
                                            return (
                                              <div key={i} className={`flex items-center justify-center border-r border-slate-100 relative p-1 ${DAY_COL_CLASS} ${isWeekend ? 'bg-slate-50/50' : ''}`}>
                                                {log ? (
                                                  <div className="w-full h-full rounded-md flex items-center justify-center text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-sm">
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
                                        <div className="flex items-center justify-center w-[100px] shrink-0 border-l border-slate-200 text-xs font-bold text-slate-600 bg-slate-50/50">
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
    </div>
  );
};
