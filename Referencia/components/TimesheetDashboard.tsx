
import React, { useState, useRef, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ChevronDown, 
  ChevronRight as ChevronRightIcon,
  Download,
  Filter,
  Users,
  Briefcase,
  Clock
} from 'lucide-react';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../constants'; // Import centralized data

// --- TYPES ---
interface DailyEntry {
  hours: number;
  status: 'ok' | 'warning' | 'critical';
}

// --- HELPER FORMATTER ---
const formatHours = (value: number) => {
  if (!value) return '-';
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '-';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h${m > 0 ? m : ''}`;
};

// --- HELPER FOR DATES ---
const getDaysArray = (currentDate: Date) => {
  const arr = [];
  // Show 15 days window centered on today, or starting from 'currentDate'
  const start = new Date(currentDate);
  start.setDate(currentDate.getDate() - 7);
  
  for (let i = 0; i < 20; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const weekday = d.getDay();
    const today = new Date();
    
    arr.push({
      fullDate: d,
      key: `${day}-${month}`, // Simple key matching MOCK generator logic if we were using it, but we need ISO for real data
      isoKey: d.toISOString().split('T')[0],
      labelDay: day,
      labelMonth: `${day}/${month.toString().padStart(2, '0')}`,
      weekdayLabel: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][weekday],
      isWeekend: weekday === 0 || weekday === 6,
      isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth()
    });
  }
  return arr;
};

export const TimesheetDashboard = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set()); 
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
  const days = useMemo(() => getDaysArray(currentViewDate), [currentViewDate]);

  // Transform MOCK_LEGACY_DATA into Timesheet Structure dynamically
  // This ensures that what we see in "Project View" is what we see here.
  const data = useMemo(() => {
    return MOCK_LEGACY_DATA.map((group, mIdx) => {
      // Find color from team data if available
      const teamInfo = MOCK_TEAM_DATA.find(t => t.name === group.assignee);
      
      const projects = group.projects.map((proj, pIdx) => {
        const tasks = proj.tasks.map((task, tIdx) => {
          // Generate pseudo-logs based on task data
          // If task has timeLogged, distribute it around startDate or today
          const daily: Record<string, DailyEntry> = {};
          
          if (task.timeLogged && task.timeLogged > 0) {
             const centerDate = task.startDate ? new Date(task.startDate) : new Date();
             const totalLogged = task.timeLogged;
             
             // Spread logic: simple distribution for visualization
             const spreadDays = 5;
             const hoursPerDay = totalLogged / spreadDays;
             
             for(let i=0; i<spreadDays; i++) {
                const d = new Date(centerDate);
                d.setDate(d.getDate() + i);
                const iso = d.toISOString().split('T')[0];
                
                // Skip weekends
                if (d.getDay() !== 0 && d.getDay() !== 6) {
                   daily[iso] = { 
                     hours: hoursPerDay, 
                     status: hoursPerDay > 8 ? 'critical' : hoursPerDay > 6 ? 'warning' : 'ok' 
                   };
                }
             }
          }

          return {
            id: task.id,
            name: task.name,
            daily
          };
        });

        return {
          id: `${group.assignee}-${proj.name}`,
          name: proj.name,
          tasks,
          totalHours: tasks.reduce((acc, t) => acc + (Object.values(t.daily).reduce((a,b) => a+b.hours, 0)), 0)
        };
      });

      return {
        id: group.assignee,
        name: group.assignee,
        totalHours: teamInfo?.totalHours || 0,
        projects
      };
    });
  }, []);

  // Helpers
  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedItems(newSet);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  // Aggregation Functions
  const getProjectDailyTotal = (project: any, isoDate: string): number => {
    let total = 0;
    project.tasks.forEach((task: any) => {
      const entry = task.daily[isoDate];
      if (entry) total += entry.hours;
    });
    return total;
  };

  const getPersonDailyTotal = (person: any, isoDate: string): number => {
    let total = 0;
    person.projects.forEach((proj: any) => {
      total += getProjectDailyTotal(proj, isoDate);
    });
    return total;
  };

  // Heatmap Logic
  const getHeatmapClass = (hours: number, isWeekend: boolean, type: 'person' | 'project' | 'task') => {
    if (hours === 0) return 'bg-transparent';
    
    if (type === 'person') {
        if (hours > 10) return 'bg-rose-500 text-white shadow-md shadow-rose-200';
        if (hours > 8) return 'bg-amber-400 text-white shadow-sm';
        if (hours >= 7) return 'bg-emerald-500 text-white shadow-sm';
        if (hours >= 4) return 'bg-blue-200 text-blue-900';
        return 'bg-blue-50 text-blue-600';
    } else {
        if (hours >= 6) return 'bg-indigo-100 text-indigo-700 font-bold';
        if (hours >= 3) return 'bg-slate-100 text-slate-700 font-medium';
        return 'bg-slate-50 text-slate-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fadeIn font-sans text-slate-800">
      
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
             <Calendar size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Timesheet</h1>
            <p className="text-xs text-slate-500 font-medium">Visualização Consolidada</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors">
            <Download size={14} />
            <span>Excel</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button onClick={() => scroll('left')} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-500 transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={() => scroll('right')} className="p-1.5 hover:bg-slate-50 rounded-md text-slate-500 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT COLUMN: HIERARCHY */}
        <div className="w-[320px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          <div className="h-[60px] border-b border-slate-200 bg-slate-50 flex items-center px-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users size={12} /> Colaborador / Projeto
            </span>
          </div>

          <div className="overflow-y-hidden hover:overflow-y-auto custom-scrollbar flex-1 bg-white">
            {data.map(person => {
              const isExpanded = expandedItems.has(person.id);
              
              return (
                <div key={person.id} className="group">
                  {/* LEVEL 1: PERSON */}
                  <div className="relative border-b border-slate-100 bg-white z-10 transition-colors hover:bg-slate-50">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isExpanded ? 'bg-indigo-500' : 'bg-transparent'}`}></div>
                    <div 
                      onClick={() => toggleExpand(person.id)}
                      className="px-4 py-3 flex items-center gap-3 cursor-pointer h-[60px]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className={`font-bold text-sm truncate ${isExpanded ? 'text-indigo-800' : 'text-slate-800'}`}>{person.name}</h3>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 rounded">{formatHours(person.totalHours)}</span>
                        </div>
                      </div>
                      <div className="text-slate-300">
                         {isExpanded ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}
                      </div>
                    </div>
                  </div>

                  {/* LEVEL 2: PROJECTS */}
                  {isExpanded && person.projects.map(proj => {
                    const isProjExpanded = expandedItems.has(proj.id); // Use specific ID
                    // Unique ID for project inside person context for expansion state
                    const uniqueProjId = `${person.id}-${proj.name}`; 
                    const isUniqueExpanded = expandedItems.has(uniqueProjId);

                    return (
                      <div key={uniqueProjId} className="bg-slate-50/50">
                        <div 
                          onClick={() => toggleExpand(uniqueProjId)}
                          className="px-4 py-2 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors pl-8 h-[48px] group/proj"
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                             <Briefcase size={12} className={isUniqueExpanded ? 'text-indigo-500' : 'text-slate-400'} />
                             <h4 className={`text-xs font-bold truncate ${isUniqueExpanded ? 'text-indigo-700' : 'text-slate-600'}`}>{proj.name}</h4>
                          </div>
                          <div className={`text-slate-300 transform transition-transform ${isUniqueExpanded ? 'rotate-90' : ''}`}>
                             <ChevronRightIcon size={12} />
                          </div>
                        </div>

                        {/* LEVEL 3: TASKS */}
                        {isUniqueExpanded && proj.tasks.map((task: any) => (
                          <div key={task.id} className="px-4 py-2 border-b border-slate-100 bg-white hover:bg-indigo-50/20 transition-colors pl-12 flex items-center gap-2 h-[40px] relative group/task">
                             <div className="absolute left-[42px] top-0 bottom-0 w-px bg-slate-200 group-hover/task:bg-indigo-200"></div>
                             <div className="min-w-0 flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-300 group-hover/task:bg-indigo-400"></div>
                                <span className="text-[11px] text-slate-500 truncate group-hover/task:text-slate-800 transition-colors" title={task.name}>{task.name}</span>
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

        {/* RIGHT AREA: GRID */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-50" ref={scrollRef}>
          <div className="inline-block min-w-full">
            {/* GRID HEADER */}
            <div className="flex h-[60px] border-b border-slate-200 sticky top-0 z-10 bg-white shadow-[0_2px_10px_-5px_rgba(0,0,0,0.05)]">
              {days.map(day => (
                <div key={day.key} className={`w-[60px] flex-shrink-0 border-r border-slate-100 flex flex-col items-center justify-center relative ${day.isWeekend ? 'bg-slate-50/80' : 'bg-white'}`}>
                  {day.isToday && <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>}
                  <span className={`text-[9px] font-bold uppercase tracking-wide mb-0.5 ${day.isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day.weekdayLabel.substring(0,3)}</span>
                  <span className={`text-sm font-bold ${day.isToday ? 'text-indigo-700' : 'text-slate-700'}`}>{day.labelDay}</span>
                </div>
              ))}
            </div>

            {/* GRID BODY */}
            <div className="bg-white min-h-full">
              {data.map(person => {
                const isExpanded = expandedItems.has(person.id);
                return (
                  <div key={person.id}>
                    {/* Person Row */}
                    <div className="flex h-[60px] border-b border-slate-100 bg-white transition-colors hover:bg-slate-50">
                      {days.map(day => {
                        const totalDaily = getPersonDailyTotal(person, day.isoKey);
                        const cellClass = getHeatmapClass(totalDaily, day.isWeekend, 'person');
                        
                        return (
                          <div key={day.key} className={`w-[60px] flex-shrink-0 border-r border-slate-100 flex items-center justify-center p-1.5 ${day.isWeekend ? 'bg-slate-50/50' : ''}`}>
                             <div className={`w-full h-full rounded-md flex items-center justify-center text-[11px] transition-all duration-300 ${cellClass}`}>
                               {formatHours(totalDaily)}
                             </div>
                          </div>
                        );
                      })}
                    </div>

                    {isExpanded && person.projects.map(proj => {
                      const uniqueProjId = `${person.id}-${proj.name}`;
                      const isProjExpanded = expandedItems.has(uniqueProjId);
                      
                      return (
                        <div key={uniqueProjId} className="bg-slate-50/50">
                          {/* Project Row */}
                          <div className="flex h-[48px] border-b border-slate-100">
                            {days.map(day => {
                              const projDaily = getProjectDailyTotal(proj, day.isoKey);
                              const cellClass = getHeatmapClass(projDaily, day.isWeekend, 'project');
                              return (
                                <div key={day.key} className={`w-[60px] flex-shrink-0 border-r border-slate-100 flex items-center justify-center p-1.5 ${day.isWeekend ? 'bg-slate-100/50' : ''}`}>
                                   <div className={`w-full h-full rounded flex items-center justify-center text-[10px] ${cellClass}`}>
                                       {formatHours(projDaily)}
                                   </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Task Rows */}
                          {isProjExpanded && proj.tasks.map((task: any) => (
                            <div key={task.id} className="flex h-[40px] border-b border-slate-100 bg-white">
                              {days.map(day => {
                                const entry = task.daily[day.isoKey];
                                const hours = entry ? entry.hours : 0;
                                
                                return (
                                  <div key={day.key} className={`w-[60px] flex-shrink-0 border-r border-slate-100 flex items-center justify-center p-1 ${day.isWeekend ? 'bg-slate-50/30' : ''}`}>
                                    {hours > 0 && (
                                      <div className="text-[10px] text-slate-500 font-medium">
                                        {formatHours(hours)}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
