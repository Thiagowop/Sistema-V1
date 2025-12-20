import React, { useState, useMemo, useEffect } from 'react';
import { 
  Download, 
  Search, 
  Maximize2, 
  Minimize2,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  AlertCircle,
  LayoutTemplate, // Icon for Vertical/Block view
  Columns,        // Icon for Horizontal/Timeline view
  ChevronsDown,   // Expand All
  ChevronsUp,     // Collapse All
  CalendarRange   // Icon for Agenda View
} from 'lucide-react';
import { MOCK_TEAM_DATA } from '../constants';

// --- TYPES & HELPER FUNCTIONS ---

interface DailyData {
  planned: number;
  realized: number;
}

interface TimesheetRow {
  id: string;
  type: 'member' | 'project' | 'task';
  label: string;
  subLabel?: string;
  daily: Record<string, DailyData>;
  totalPlanned: number;
  totalRealized: number;
  expanded?: boolean;
  parentId?: string;
  grandParentId?: string; 
}

type ViewDensity = 'detailed' | 'compact' | 'heatmap';
type LayoutMode = 'horizontal' | 'vertical' | 'agenda';

interface UnifiedTimesheetProps {
  initialLayout?: LayoutMode;
}

// Helper: Converter Decimal
const formatDuration = (decimal: number, simple = false) => {
  if (!decimal || decimal === 0) return simple ? '-' : '-';
  
  if (simple) {
    return Math.round(decimal).toString();
  }

  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

// Helper: Diferença de dias
const getDayDifference = (start: Date, end: Date) => {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
};

// Helper: Array de datas
const getDatesInRange = (startDate: Date, endDate: Date) => {
  const dates = [];
  const d = new Date(startDate);
  d.setHours(0,0,0,0);
  const e = new Date(endDate);
  e.setHours(0,0,0,0);

  while (d <= e) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

// --- DATA GENERATOR ---
const generateUnifiedData = (dates: Date[], filterMember: string | null): TimesheetRow[] => {
  const rows: TimesheetRow[] = [];
  const members = filterMember 
    ? MOCK_TEAM_DATA.filter(m => m.name === filterMember)
    : MOCK_TEAM_DATA;

  members.forEach(member => {
    // Member Row
    const memberRow: TimesheetRow = {
      id: member.name,
      type: 'member',
      label: member.name,
      subLabel: '', // Role removed
      daily: {},
      totalPlanned: 0,
      totalRealized: 0,
      expanded: true 
    };

    dates.forEach(d => {
      const k = d.toISOString().split('T')[0];
      memberRow.daily[k] = { planned: 0, realized: 0 };
    });

    rows.push(memberRow);

    // Mock Projects
    const projects = ['Integração API', 'Refatoração Legacy', 'Suporte N3'];
    projects.forEach((projName, pIdx) => {
      const projId = `${member.name}-${pIdx}`;
      const projectRow: TimesheetRow = {
        id: projId,
        type: 'project',
        label: projName,
        daily: {},
        totalPlanned: 0,
        totalRealized: 0,
        parentId: member.name,
        expanded: true
      };

      dates.forEach(d => {
        const k = d.toISOString().split('T')[0];
        projectRow.daily[k] = { planned: 0, realized: 0 };
      });

      // Tasks
      const tasks: TimesheetRow[] = [];
      const numTasks = 2; 
      
      for(let t=0; t<numTasks; t++) {
        const taskRow: TimesheetRow = {
          id: `${projId}-t${t}`,
          type: 'task',
          label: `Tarefa ${t+1}: Desenvolvimento de Feature`,
          subLabel: projName, 
          daily: {},
          totalPlanned: 0,
          totalRealized: 0,
          parentId: projId,
          grandParentId: member.name
        };

        dates.forEach(d => {
           const k = d.toISOString().split('T')[0];
           const isWeekend = d.getDay() === 0 || d.getDay() === 6;
           let p = 0;
           let r = 0;
           if (!isWeekend && Math.random() > 0.6) {
             p = Math.floor(Math.random() * 4) + 1;
             r = Math.random() > 0.3 ? p : p + (Math.random() * 1.5); 
           }
           taskRow.daily[k] = { planned: p, realized: r };
           taskRow.totalPlanned += p;
           taskRow.totalRealized += r;

           projectRow.daily[k].planned += p;
           projectRow.daily[k].realized += r;
           projectRow.totalPlanned += p;
           projectRow.totalRealized += r;

           memberRow.daily[k].planned += p;
           memberRow.daily[k].realized += r;
           memberRow.totalPlanned += p;
           memberRow.totalRealized += r;
        });
        tasks.push(taskRow);
      }
      rows.push(projectRow);
      rows.push(...tasks);
    });
  });

  return rows;
};

// --- COMPONENT ---

export const UnifiedTimesheet: React.FC<UnifiedTimesheetProps> = ({ initialLayout = 'horizontal' }) => {
  const today = new Date();
  const initialStart = new Date(today);
  initialStart.setDate(today.getDate() - 6);

  const [dateRangeValues, setDateRangeValues] = useState({
    start: initialStart.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0]
  });

  const [selectedMember, setSelectedMember] = useState<string>('Todos');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialLayout);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync layout if prop changes
  useEffect(() => {
    setLayoutMode(initialLayout);
  }, [initialLayout]);

  // Computed Date Objects
  const dateRange = useMemo(() => {
    return getDatesInRange(new Date(dateRangeValues.start), new Date(dateRangeValues.end));
  }, [dateRangeValues]);

  // Compute Weeks for Vertical View
  const weeklyChunks = useMemo(() => {
    const chunks: Date[][] = [];
    for (let i = 0; i < dateRange.length; i += 7) {
      chunks.push(dateRange.slice(i, i + 7));
    }
    return chunks;
  }, [dateRange]);

  // Density Logic
  const viewDensity: ViewDensity = useMemo(() => {
    if (layoutMode === 'vertical' || layoutMode === 'agenda') return 'compact';
    const days = dateRange.length;
    if (days <= 9) return 'detailed';
    if (days <= 19) return 'compact';
    return 'heatmap';
  }, [dateRange.length, layoutMode]);
  
  const data = useMemo(() => {
    return generateUnifiedData(dateRange, selectedMember === 'Todos' ? null : selectedMember);
  }, [dateRange, selectedMember]);

  // AUTO EXPAND ALL EFFECT
  useEffect(() => {
    const allIds = new Set<string>();
    data.forEach(r => {
      // Expand Members and Projects by default
      if (r.type === 'member' || r.type === 'project') {
        allIds.add(r.id);
      }
    });
    setExpandedIds(allIds);
  }, [data]);

  const visibleRows = useMemo(() => {
    return data.filter(row => {
      if (row.type === 'member') return true;
      if (row.type === 'project') return expandedIds.has(row.parentId!);
      if (row.type === 'task') {
        return expandedIds.has(row.parentId!) && expandedIds.has(row.grandParentId!);
      }
      return false;
    });
  }, [data, expandedIds]);

  const totals = useMemo(() => {
    let p = 0; 
    let r = 0;
    dateRange.forEach(d => {
      const key = d.toISOString().split('T')[0];
      const dayTotal = data
        .filter(row => row.type === 'member') 
        .reduce((acc, curr) => ({ 
            planned: acc.planned + curr.daily[key].planned, 
            realized: acc.realized + curr.daily[key].realized 
        }), { planned: 0, realized: 0 });
      
      p += dayTotal.planned;
      r += dayTotal.realized;
    });
    return { planned: p, realized: r };
  }, [data, dateRange]);

  // --- HANDLERS ---

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setErrorMsg(null);
    const newValues = { ...dateRangeValues, [field]: value };
    const start = new Date(newValues.start);
    const end = new Date(newValues.end);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

    if (end < start) {
       // Auto-adjust range if end is before start
       if (field === 'start') {
          const newEnd = new Date(start);
          newEnd.setDate(start.getDate() + 6);
          setDateRangeValues({ start: value, end: newEnd.toISOString().split('T')[0] });
          return;
       } else {
         setDateRangeValues({ ...newValues, start: value });
         return;
       }
    }

    const diffDays = getDayDifference(start, end);
    // Increased limit to 90 days
    if (diffDays > 90) { 
       setErrorMsg("Período longo (> 90 dias) pode causar lentidão.");
       // We ALLOW selection, just warn
    }
    
    setDateRangeValues(newValues);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    data.forEach(r => {
      if (r.type === 'member' || r.type === 'project') allIds.add(r.id);
    });
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleExportExcel = () => {
    alert("Exportação iniciada...");
  };

  // --- RENDERERS ---

  const renderCell = (log: DailyData, type: string, density: ViewDensity, isAgenda = false) => {
    if (log.planned === 0 && log.realized === 0) {
      if (density === 'heatmap') return <div className="w-full h-full"></div>;
      return <div className="w-full h-full opacity-0">-</div>;
    }
    
    const isOver = log.realized > log.planned && log.planned > 0;
    const realizedStr = formatDuration(log.realized);
    const plannedStr = formatDuration(log.planned);

    if (type === 'member' || type === 'project') {
      const pct = log.planned > 0 ? Math.min((log.realized / log.planned) * 100, 100) : 0;
      const barColor = isOver ? 'bg-rose-500' : (type === 'member' ? 'bg-indigo-500' : 'bg-blue-500');
      const textColor = isOver ? 'text-rose-600' : 'text-slate-700';
      
      if (isAgenda) {
          return (
             <div className="flex flex-col justify-center h-full w-full px-1">
               <span className={`text-xs font-bold ${textColor}`}>{realizedStr}</span>
               <div className="w-full h-1.5 bg-slate-200 rounded-full mt-0.5"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div></div>
             </div>
          );
      }

      if (density === 'heatmap') {
         return (
           <div className="flex flex-col items-center justify-center h-full w-full" title={`Real: ${realizedStr} / Meta: ${plannedStr}`}>
             <div className="text-[10px] font-bold text-slate-700">{Math.round(log.realized)}</div>
             <div className="w-6 h-1 bg-slate-200 rounded-full mt-0.5"><div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }}></div></div>
           </div>
         );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full w-full px-2">
           <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-1"><div className={`h-full ${barColor}`} style={{ width: `${pct}%` }}></div></div>
           <div className="flex justify-between w-full text-[9px] font-bold"><span className={textColor}>{realizedStr}</span><span className="text-slate-400 font-normal">/ {plannedStr}</span></div>
        </div>
      );
    }

    if (density === 'detailed') {
      return (
        <div className={`w-full h-full rounded-lg border-l-4 p-1.5 flex flex-col justify-center gap-1 shadow-sm transition-all hover:shadow-md ${isOver ? 'border-rose-500 bg-rose-50/40' : 'border-emerald-500 bg-white hover:border-emerald-400'}`}>
           <div className="flex justify-between items-center"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider scale-90 origin-left">GASTAS</span><span className={`text-xs font-bold ${isOver ? 'text-rose-700' : 'text-slate-700'}`}>{realizedStr}</span></div>
           <div className="flex justify-between items-center border-t border-slate-100/50 pt-0.5"><span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider scale-90 origin-left">PLANEJADAS</span><span className="text-xs font-medium text-slate-500">{plannedStr}</span></div>
        </div>
      );
    }

    if (density === 'compact') {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center rounded border transition-colors ${isOver ? 'bg-rose-50 border-rose-200' : 'bg-white border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
           <span className={`text-xs font-bold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>{realizedStr}</span>
           {log.planned > 0 && (<span className="text-[10px] text-slate-400 border-t border-slate-100 px-1 mt-0.5">{plannedStr}</span>)}
        </div>
      );
    }

    const intensity = log.realized > 6 ? 'bg-indigo-200' : log.realized > 2 ? 'bg-indigo-100' : 'bg-slate-50';
    return (
      <div className={`w-full h-full flex items-center justify-center text-[10px] font-bold cursor-help transition-opacity hover:opacity-80 ${isOver ? 'bg-rose-100 text-rose-700' : `${intensity} text-slate-600`}`} title={`Planejado: ${plannedStr} | Realizado: ${realizedStr}`}>
         {Math.round(log.realized) > 0 ? Math.round(log.realized) : <div className="w-1 h-1 rounded-full bg-slate-300"></div>}
      </div>
    );
  };

  // --- AGENDA VIEW RENDERER (Transposed) ---
  const renderAgendaTable = () => {
    // Columns = Members
    // Rows = Dates
    const members = data.filter(r => r.type === 'member');

    return (
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table className="w-full border-separate border-spacing-0">
           <thead className="sticky top-0 z-50">
             <tr>
               <th className="sticky left-0 top-0 z-50 bg-slate-50 border-r border-b border-slate-200 p-3 w-[120px] shadow-sm">
                 <span className="text-xs font-bold text-slate-400 uppercase">Data</span>
               </th>
               {members.map(member => (
                 <th key={member.id} className="min-w-[140px] px-3 py-3 bg-white border-r border-b border-slate-200 text-left">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold">
                         {member.label.substring(0,2)}
                       </div>
                       <div className="flex flex-col">
                         <span className="text-xs font-bold text-slate-700 truncate max-w-[100px]">{member.label}</span>
                         <span className="text-[9px] text-slate-400 uppercase">{member.subLabel?.split(' ')[0]}</span>
                       </div>
                    </div>
                 </th>
               ))}
             </tr>
           </thead>
           <tbody>
             {dateRange.map(d => {
                const dateKey = d.toISOString().split('T')[0];
                const isToday = d.toDateString() === new Date().toDateString();
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;

                return (
                  <tr key={dateKey} className={isToday ? 'bg-indigo-50/20' : isWeekend ? 'bg-slate-50/40' : 'bg-white'}>
                     {/* DATE COLUMN */}
                     <td className={`sticky left-0 z-30 p-3 border-r border-b border-slate-200 ${isToday ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-500'}`}>
                        <div className="flex flex-col items-center">
                           <span className="text-lg font-bold">{d.getDate()}</span>
                           <span className="text-[10px] uppercase font-bold">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                        </div>
                     </td>

                     {/* MEMBER COLUMNS */}
                     {members.map(member => {
                       const log = member.daily[dateKey];
                       
                       return (
                         <td key={`${member.id}-${dateKey}`} className="border-r border-b border-slate-100 p-2 h-16 align-top hover:bg-slate-50 transition-colors">
                            {renderCell(log, 'member', 'compact', true)}
                            {/* Optional: Show task preview if space permits */}
                            {log.realized > 0 && (
                               <div className="mt-1 flex flex-wrap gap-1">
                                  {/* Just visual indicators for tasks */}
                                  <div className="w-full h-1 bg-slate-100 rounded-full"></div>
                                  <div className="w-2/3 h-1 bg-slate-100 rounded-full"></div>
                               </div>
                            )}
                         </td>
                       );
                     })}
                  </tr>
                );
             })}
           </tbody>
        </table>
      </div>
    );
  };

  // --- REUSABLE TABLE RENDERER ---
  const renderTable = (dates: Date[], isVerticalBlock = false) => (
    <div className="flex-1 overflow-auto custom-scrollbar relative">
       <table className="w-full border-separate border-spacing-0 table-fixed">
          <thead>
            <tr className="z-40">
               <th className="sticky left-0 top-0 z-50 bg-slate-50 border-r border-b border-slate-200 p-3 text-left w-[260px] shadow-[2px_2px_5px_-2px_rgba(0,0,0,0.05)]">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Estrutura</span>
               </th>
               {dates.map((d) => {
                 const isToday = d.toDateString() === new Date().toDateString();
                 const width = isVerticalBlock ? 'min-w-[70px]' : (viewDensity === 'detailed' ? 'min-w-[80px]' : viewDensity === 'compact' ? 'min-w-[50px]' : 'min-w-[32px]');
                 
                 return (
                   <th key={d.toISOString()} className={`sticky top-0 z-40 p-1 text-center border-r border-b border-slate-200 ${width} ${isToday ? 'bg-indigo-50' : 'bg-slate-50'}`}>
                      <div className="flex flex-col items-center">
                         <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                           {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','').substring(0, (!isVerticalBlock && viewDensity === 'heatmap') ? 1 : 3)}
                         </span>
                         <span className={`text-xs font-bold ${isToday ? 'text-indigo-700' : 'text-slate-700'}`}>
                           {d.getDate()}
                         </span>
                      </div>
                   </th>
                 );
               })}
               {!isVerticalBlock && (
                 <th className="sticky top-0 z-40 bg-slate-50 border-b border-slate-200 p-2 text-center min-w-[80px]">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                 </th>
               )}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map(row => {
              const isMember = row.type === 'member';
              const isProject = row.type === 'project';
              const isTask = row.type === 'task';
              const rowHeight = (viewDensity === 'detailed' && isTask && !isVerticalBlock) ? 'h-20' : 'h-10';
              
              return (
                <tr key={row.id} className={`group ${isMember ? 'bg-slate-50/50 hover:bg-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                   <td className={`p-0 sticky left-0 z-30 border-r border-slate-200 border-b border-slate-100 ${isMember ? 'bg-slate-50' : 'bg-white'}`}>
                      <div 
                        className={`flex items-center ${rowHeight} px-3 gap-2 cursor-pointer transition-colors ${isTask ? 'pl-8' : isProject ? 'pl-4' : ''}`}
                        onClick={() => (isMember || isProject) && toggleExpand(row.id)}
                      >
                         {isMember && <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{row.label.substring(0,2)}</div>}
                         {(isMember || isProject) && <div className="text-slate-400 flex-shrink-0">{expandedIds.has(row.id) ? <ChevronDown size={14} /> : <ChevronRightIcon size={14} />}</div>}
                         {isTask && <div className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 flex-shrink-0"></div>}
                         <div className="min-w-0 overflow-hidden"><p className={`truncate text-sm ${isMember ? 'font-bold text-slate-800' : isProject ? 'font-semibold text-slate-700' : 'text-slate-600'}`} title={row.label}>{row.label}</p></div>
                      </div>
                   </td>
                   {dates.map(d => {
                     const k = d.toISOString().split('T')[0];
                     const log = row.daily[k];
                     const isToday = d.toDateString() === new Date().toDateString();
                     const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                     const cellDensity = isVerticalBlock ? 'compact' : viewDensity; 

                     return (
                       <td key={k} className={`border-r border-b border-slate-100 ${viewDensity === 'heatmap' && !isVerticalBlock ? 'p-0' : 'p-1'} ${rowHeight} ${isToday ? 'bg-indigo-50/20' : isWeekend ? 'bg-slate-50/30' : ''}`}>
                          {renderCell(log, row.type, cellDensity)}
                       </td>
                     );
                   })}
                   {!isVerticalBlock && (
                     <td className="p-2 border-b border-slate-100 text-center bg-slate-50/30">
                        <div className="flex flex-col items-center justify-center">
                           <span className={`text-xs font-bold ${row.totalRealized > row.totalPlanned ? 'text-rose-600' : 'text-slate-700'}`}>{formatDuration(row.totalRealized)}</span>
                           <span className="text-[10px] text-slate-400 font-medium">/ {formatDuration(row.totalPlanned)}</span>
                        </div>
                     </td>
                   )}
                </tr>
              );
            })}
          </tbody>
       </table>
    </div>
  );

  const TimesheetContent = ({ isModal = false }) => (
    <div className={`flex flex-col h-full bg-slate-50 ${isModal ? 'p-6' : ''}`}>
      
      {/* 1. Header Controls */}
      <div className="flex flex-col xl:flex-row gap-4 mb-4 justify-between items-start xl:items-center">
         <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
               <Search size={16} className="text-slate-400" />
               <select 
                 value={selectedMember}
                 onChange={(e) => setSelectedMember(e.target.value)}
                 className="bg-transparent text-sm font-bold text-slate-700 focus:outline-none cursor-pointer"
               >
                 <option value="Todos">Todos da Equipe</option>
                 {MOCK_TEAM_DATA.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
               </select>
            </div>

            {/* Layout Toggle */}
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
               <button 
                 onClick={() => setLayoutMode('horizontal')} 
                 className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${layoutMode === 'horizontal' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                 title="Timeline"
               >
                 <Columns size={14} />
                 <span className="hidden sm:inline">Timeline</span>
               </button>
               <button 
                 onClick={() => setLayoutMode('vertical')} 
                 className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${layoutMode === 'vertical' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                 title="Semanas"
               >
                 <LayoutTemplate size={14} />
                 <span className="hidden sm:inline">Semanas</span>
               </button>
               <button 
                 onClick={() => setLayoutMode('agenda')} 
                 className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${layoutMode === 'agenda' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                 title="Agenda"
               >
                 <CalendarRange size={14} />
                 <span className="hidden sm:inline">Agenda</span>
               </button>
            </div>

            {/* Expand Controls (Only for Horizontal/Vertical) */}
            {layoutMode !== 'agenda' && (
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                 <button onClick={expandAll} className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="Expandir Tudo"><ChevronsDown size={16} /></button>
                 <button onClick={collapseAll} className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-colors" title="Recolher Tudo"><ChevronsUp size={16} /></button>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 px-2 border-r border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">De</span>
                  <input type="date" value={dateRangeValues.start} onChange={(e) => handleDateChange('start', e.target.value)} className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer" />
               </div>
               <div className="flex items-center gap-2 px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Até</span>
                  <input type="date" value={dateRangeValues.end} onChange={(e) => handleDateChange('end', e.target.value)} className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer" />
               </div>
            </div>
            
            {errorMsg && (
              <div className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1 animate-fadeIn"><AlertCircle size={10} />{errorMsg}</div>
            )}
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-4">
               <div className="flex flex-col items-end"><span className="text-[10px] uppercase font-bold text-slate-400">Total Planejado</span><span className="text-sm font-bold text-slate-700">{formatDuration(totals.planned)}</span></div>
               <div className="flex flex-col items-end"><span className="text-[10px] uppercase font-bold text-slate-400">Total Realizado</span><span className={`text-sm font-bold ${totals.realized > totals.planned ? 'text-rose-600' : 'text-emerald-600'}`}>{formatDuration(totals.realized)}</span></div>
            </div>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-colors border border-emerald-100"><Download size={16} /> Exportar</button>
            {!isModal ? (
              <button onClick={() => setIsFullScreen(true)} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-colors shadow-lg shadow-slate-300"><Maximize2 size={16} /> Expandir</button>
            ) : (
              <button onClick={() => setIsFullScreen(false)} className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-colors"><Minimize2 size={16} /> Fechar</button>
            )}
         </div>
      </div>

      {/* 2. Main Grid Container */}
      <div className="flex-1 bg-slate-50 rounded-2xl flex flex-col overflow-hidden relative gap-4">
        
        {layoutMode === 'horizontal' && (
           <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
             {renderTable(dateRange, false)}
           </div>
        )}
        
        {layoutMode === 'vertical' && (
           <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-2">
              {weeklyChunks.map((weekDates, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                   <div className="px-4 py-2 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
                         Semana {idx + 1}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                         {weekDates[0].toLocaleDateString('pt-BR')} - {weekDates[weekDates.length-1].toLocaleDateString('pt-BR')}
                      </span>
                   </div>
                   {renderTable(weekDates, true)}
                </div>
              ))}
           </div>
        )}

        {layoutMode === 'agenda' && (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              {renderAgendaTable()}
            </div>
        )}

        {/* Footer Aggregates */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 flex justify-end gap-6 text-xs font-medium text-slate-500 shadow-sm">
           <span>Visualização: <strong className="uppercase">{layoutMode}</strong> {layoutMode === 'horizontal' && `(${viewDensity})`}</span>
           <span>•</span>
           <span>Mostrando {dateRange.length} dias</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isFullScreen && (
        <div className="h-[600px] animate-fadeIn">
          <TimesheetContent />
        </div>
      )}
      {isFullScreen && (
        <div className="fixed inset-0 z-[100] bg-white animate-fadeIn p-0 flex flex-col">
          <TimesheetContent isModal={true} />
        </div>
      )}
    </>
  );
};