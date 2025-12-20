import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Clock,
  CheckCircle2,
  ArrowLeft,
  Layers,
  Download,
  X,
  User,
  FileText,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { MOCK_TEAM_DATA } from '../../constants';

// --- TYPES ---
type ViewPeriod = 1 | 7 | 15;

interface DailyLog {
  date: string; // YYYY-MM-DD
  planned: number;
  realized: number;
}

interface TaskRow {
  id: string;
  label: string; // Task Name
  subLabel: string; // Project Name (kept for reference)
  type: 'task';
  days: Record<string, DailyLog>;
  totalPlanned: number;
  totalRealized: number;
  // Extra details for modal
  description?: string;
  status?: string;
  assignee?: string;
}

interface ProjectRow {
  id: string;
  label: string; // Project Name
  type: 'project';
  days: Record<string, DailyLog>;
  totalPlanned: number;
  totalRealized: number;
  tasks: TaskRow[]; // Nested tasks
}

interface MemberRow {
  id: string;
  label: string; // Member Name
  subLabel: string; // Removed Role, now empty
  type: 'member';
  avatarBg: string;
  days: Record<string, DailyLog>;
  totalPlanned: number;
  totalRealized: number;
}

type DashboardRow = MemberRow | ProjectRow | TaskRow;

// --- UTILS ---
const formatDuration = (decimalHours: number, compact: boolean = false) => {
  if (!decimalHours || decimalHours === 0) return compact ? '-' : '0h';
  
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);

  if (compact) {
    // Format HH:MM for compact views
    if (hours === 0 && minutes === 0) return '-';
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  // Format Hh Mm for detailed views
  if (hours === 0 && minutes > 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
};

// --- MOCK DATA GENERATORS ---

// 1. Generate Projects containing Tasks for a member
const generateMemberData = (memberId: string, memberName: string, dates: string[]): ProjectRow[] => {
  const projectNames = ['Integração API', 'Refatoração Core', 'Dashboard BI', 'Suporte N3'];
  
  return projectNames.map((projName, pIdx) => {
    // Generate 2-4 tasks per project
    const numTasks = Math.floor(Math.random() * 3) + 2;
    const tasks: TaskRow[] = [];
    const projectDays: Record<string, DailyLog> = {};
    
    // Initialize project days
    dates.forEach(d => projectDays[d] = { date: d, planned: 0, realized: 0 });

    for (let i = 0; i < numTasks; i++) {
      const dayRecords: Record<string, DailyLog> = {};
      let tPlanned = 0;
      let tRealized = 0;

      dates.forEach(dateKey => {
        const date = new Date(dateKey);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        
        let planned = 0;
        let realized = 0;

        // Random distribution: 30% chance of work on this task on this day
        if (!isWeekend && Math.random() > 0.7) {
          planned = Math.floor(Math.random() * 4) + 1; 
          const variance = (Math.random() - 0.2); 
          realized = Math.max(0, Number((planned + variance).toFixed(2))); // Precision for calculation
        }

        dayRecords[dateKey] = { date: dateKey, planned, realized };
        tPlanned += planned;
        tRealized += realized;

        // Aggregate to Project
        projectDays[dateKey].planned += planned;
        projectDays[dateKey].realized += realized;
      });

      tasks.push({
        id: `${memberId}-p${pIdx}-t${i}`,
        label: `${projName} - Atividade ${i + 1}`,
        subLabel: projName,
        type: 'task',
        days: dayRecords,
        totalPlanned: tPlanned,
        totalRealized: tRealized,
        description: `Execução técnica referente a ${projName}. Validação de requisitos e implementação de código.`,
        status: tRealized >= tPlanned ? 'Concluído' : 'Em Andamento',
        assignee: memberName
      });
    }

    const totalProjectPlanned = Object.values(projectDays).reduce((a, b) => a + b.planned, 0);
    const totalProjectRealized = Object.values(projectDays).reduce((a, b) => a + b.realized, 0);

    return {
      id: `${memberId}-proj-${pIdx}`,
      label: projName,
      type: 'project' as const,
      days: projectDays,
      totalPlanned: totalProjectPlanned,
      totalRealized: totalProjectRealized,
      tasks: tasks.filter(t => t.totalPlanned > 0) // Only tasks with hours
    };
  }).filter(p => p.totalPlanned > 0); // Only active projects
};

// 2. Generate Team Summary
const generateTeamRows = (dates: string[]): MemberRow[] => {
  return MOCK_TEAM_DATA.map((member, idx) => {
    const dayRecords: Record<string, DailyLog> = {};
    let totalPlanned = 0;
    let totalRealized = 0;

    dates.forEach(dateKey => {
      const date = new Date(dateKey);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      let planned = 0;
      let realized = 0;

      if (!isWeekend) {
         planned = 8;
         if (Math.random() > 0.1) {
            realized = 7.5 + (Math.random() * 1.5);
         }
      }
      realized = Number(realized.toFixed(2));

      dayRecords[dateKey] = { date: dateKey, planned, realized };
      totalPlanned += planned;
      totalRealized += realized;
    });

    return {
      id: member.name,
      label: member.name,
      subLabel: '', // Role removed
      type: 'member' as const,
      avatarBg: ['bg-slate-100 text-slate-600', 'bg-blue-50 text-blue-600', 'bg-indigo-50 text-indigo-600', 'bg-gray-100 text-gray-600', 'bg-zinc-100 text-zinc-600'][idx % 5],
      days: dayRecords,
      totalPlanned,
      totalRealized
    };
  });
};

// --- MODALS ---

const TaskDetailModal = ({ task, onClose }: { task: TaskRow; onClose: () => void }) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 transform transition-all scale-100">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{task.label}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
              <Layers size={14} /> {task.subLabel}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Planejado</span>
               <div className="flex items-center gap-2 mt-1">
                 <Clock size={18} className="text-slate-400" />
                 <span className="text-2xl font-bold text-slate-700">{formatDuration(task.totalPlanned)}</span>
               </div>
             </div>
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Realizado</span>
               <div className="flex items-center gap-2 mt-1">
                 <CheckCircle2 size={18} className="text-indigo-600" />
                 <span className={`text-2xl font-bold ${task.totalRealized > task.totalPlanned ? 'text-rose-600' : 'text-indigo-600'}`}>
                   {formatDuration(task.totalRealized)}
                 </span>
               </div>
             </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-700">Descrição</h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-white border border-slate-100 p-3 rounded-lg">
              {task.description}
            </p>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
             <div className="flex items-center gap-2 text-sm text-slate-500">
               <User size={16} />
               Responsável: <span className="font-semibold text-slate-700">{task.assignee}</span>
             </div>
             <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
               {task.status}
             </span>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors text-sm">
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

const ExportModal = ({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: (start: string, end: string) => void }) => {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [start, setStart] = useState(firstDay);
  const [end, setEnd] = useState(lastDay);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <h3 className="text-lg font-bold text-slate-800">Exportar Relatório</h3>
          <p className="text-xs text-slate-500">Selecione o período para gerar o CSV</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Inicial</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Final</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-100 transition-colors text-sm">
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(start, end)} 
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
          >
            <Download size={16} />
            Gerar Arquivo
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const AttendanceDashboard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>(7);
  const [showWeekends, setShowWeekends] = useState(false); // Default false per user request
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskRow | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Accordion State for Projects
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Computed Date Range
  const startDate = useMemo(() => {
    const d = new Date(currentDate);
    if (viewPeriod === 1) return d;
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  }, [currentDate, viewPeriod]);
  
  const visibleDays = useMemo(() => {
    return Array.from({ length: viewPeriod }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return {
        date: d,
        dateKey: d.toISOString().split('T')[0],
        dayName: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', ''),
        dayNumber: d.getDate(),
        isToday: d.toDateString() === new Date().toDateString(),
        isWeekend: d.getDay() === 0 || d.getDay() === 6
      };
    });
  }, [startDate, viewPeriod]);

  // Filter columns based on Weekend Toggle
  const columnsToShow = useMemo(() => {
    return visibleDays.filter(day => showWeekends || !day.isWeekend);
  }, [visibleDays, showWeekends]);

  // Data Logic with Hierarchical Flattening
  const rows: DashboardRow[] = useMemo(() => {
    const dateKeys = visibleDays.map(d => d.dateKey);
    
    if (selectedMember) {
      // DRILL DOWN: Member -> Projects -> Tasks
      const projects = generateMemberData(selectedMember, selectedMember, dateKeys);
      const flattenedRows: DashboardRow[] = [];
      
      projects.forEach(proj => {
        flattenedRows.push(proj); // Add Project Header
        if (expandedProjects.has(proj.id)) {
          flattenedRows.push(...proj.tasks); // Add Tasks if expanded
        }
      });
      
      return flattenedRows;
    } else {
      // TEAM OVERVIEW: Show Members
      return generateTeamRows(dateKeys);
    }
  }, [selectedMember, visibleDays, expandedProjects]);

  // Aggregate Totals for Header KPIs
  const periodTotals = useMemo(() => {
    // Only sum up top-level rows (Members or Projects) to avoid double counting tasks
    const relevantRows = rows.filter(r => r.type === 'member' || r.type === 'project');
    return relevantRows.reduce((acc, curr) => ({
      planned: acc.planned + curr.totalPlanned,
      realized: acc.realized + curr.totalRealized
    }), { planned: 0, realized: 0 });
  }, [rows]);

  // Handlers
  const navigate = (direction: 'next' | 'prev') => {
    const d = new Date(startDate);
    const offset = direction === 'next' ? viewPeriod : -viewPeriod;
    d.setDate(d.getDate() + offset);
    setCurrentDate(d);
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setViewPeriod(1);
  };

  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [year, month, day] = e.target.value.split('-').map(Number);
      setCurrentDate(new Date(year, month - 1, day, 12, 0, 0));
    }
  };

  const performExport = (startStr: string, endStr: string) => {
    const startDate = new Date(startStr);
    const endDate = new Date(endStr);
    
    // Generate dates in range
    const exportDates: string[] = [];
    const d = new Date(startDate);
    while (d <= endDate) {
      exportDates.push(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }

    // Generate Data for this range
    // NOTE: This generates new random data because our mock is dynamic. 
    // In a real app, this would fetch from backend/store.
    let exportRows: DashboardRow[] = [];
    if (selectedMember) {
       const projects = generateMemberData(selectedMember, selectedMember, exportDates);
       projects.forEach(p => {
         exportRows.push(p);
         exportRows.push(...p.tasks);
       });
    } else {
       exportRows = generateTeamRows(exportDates);
    }

    const headerRow = [
      'Item / Descrição', 
      'Tipo', 
      ...exportDates.map(dStr => new Date(dStr).toLocaleDateString('pt-BR')), 
      'Total Realizado', 
      'Total Planejado'
    ].join(';');

    const dataRows = exportRows.map(row => {
      const dayValues = exportDates.map(dKey => {
        const log = row.days[dKey];
        return log && log.realized > 0 ? log.realized.toString().replace('.', ',') : '0';
      }).join(';');

      const cleanLabel = row.label.replace(/"/g, '""'); 
      const labelStr = `"${cleanLabel}"`;

      return [
        labelStr,
        row.type,
        dayValues,
        row.totalRealized.toString().replace('.', ','),
        row.totalPlanned.toString().replace('.', ',')
      ].join(';');
    }).join('\n');

    const csvContent = '\uFEFF' + headerRow + '\n' + dataRows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_${selectedMember || 'geral'}_${startStr}_a_${endStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setShowExportModal(false);
  };

  const toggleProject = (projectId: string) => {
    const newSet = new Set(expandedProjects);
    if (newSet.has(projectId)) {
      newSet.delete(projectId);
    } else {
      newSet.add(projectId);
    }
    setExpandedProjects(newSet);
  };

  const renderCellContent = (planned: number, realized: number, isCompact: boolean, type: string) => {
    if (planned === 0 && realized === 0) return <div className="h-full w-full"></div>;

    const percentage = planned > 0 ? (realized / planned) * 100 : 0;
    const isOver = percentage > 110;
    const isUnder = percentage < 90 && percentage > 0;
    
    let barColor = 'bg-slate-300';
    if (realized > 0) {
       if (isOver) barColor = 'bg-rose-500';
       else if (isUnder) barColor = 'bg-amber-400';
       else barColor = 'bg-emerald-500';
    }

    // Projects get a simpler summary bar
    if (type === 'project') {
       return (
         <div className="h-full w-full flex flex-col justify-center items-center px-1">
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
               <div className={`h-full ${barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
            </div>
            <div className="flex justify-between w-full mt-1 px-1">
               <span className="text-[9px] font-bold text-slate-600">{formatDuration(realized, true)}</span>
               <span className="text-[9px] text-slate-400">{formatDuration(planned, true)}</span>
            </div>
         </div>
       );
    }

    if (isCompact) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-1">
           <div className="text-[10px] font-bold text-slate-700">{realized > 0 ? formatDuration(realized, true) : '-'}</div>
           <div className={`h-1 w-full rounded-full mt-1 ${barColor}`}></div>
        </div>
      );
    }

    return (
      <div className="h-full w-full rounded-lg border border-slate-100 bg-white p-2 flex flex-col justify-between hover:border-indigo-200 hover:shadow-sm transition-all relative overflow-hidden cursor-pointer group/cell">
         <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`}></div>
         <div className="flex justify-between items-start pl-2">
            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Real</span>
            <span className={`text-xs font-bold ${isOver ? 'text-rose-600' : 'text-slate-800'}`}>{formatDuration(realized)}</span>
         </div>
         <div className="flex justify-between items-end pl-2">
            <span className="text-[9px] uppercase text-slate-400 font-bold tracking-wider">Meta</span>
            <span className="text-xs font-medium text-slate-500">{formatDuration(planned)}</span>
         </div>
      </div>
    );
  };

  return (
    <>
      {activeTask && <TaskDetailModal task={activeTask} onClose={() => setActiveTask(null)} />}
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} onConfirm={performExport} />
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-140px)] overflow-hidden font-sans animate-fadeIn scroll-smooth">
        
        {/* Header Toolbar */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-6 bg-white sticky top-0 z-40">
          <div className="flex items-center gap-6 w-full xl:w-auto">
            {selectedMember ? (
              <div className="flex items-center gap-3 animate-slideInLeft">
                 <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                   <ArrowLeft size={20} />
                 </button>
                 <div>
                   <h2 className="text-lg font-bold text-slate-800 leading-tight">{selectedMember}</h2>
                   <p className="text-xs text-slate-500">Visão por Projetos</p>
                 </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                   <CalendarIcon size={20} />
                 </div>
                 <div>
                   <h2 className="text-lg font-bold text-slate-800 leading-tight">Visão Geral</h2>
                   <p className="text-xs text-slate-500">Horas da Equipe</p>
                 </div>
              </div>
            )}
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div className="flex gap-2">
              <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
                {[1, 7, 15].map(days => (
                  <button 
                    key={days}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewPeriod === days ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                    onClick={() => setViewPeriod(days as ViewPeriod)}
                  >
                    {days === 1 ? 'Dia' : days === 7 ? 'Semana' : 'Quinzena'}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowWeekends(!showWeekends)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${!showWeekends ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                title={showWeekends ? 'Ocultar Sáb/Dom' : 'Mostrar Sáb/Dom'}
              >
                {showWeekends ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="hidden sm:inline">FDS</span>
              </button>
            </div>
          </div>

          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm mx-auto xl:mx-0 relative">
              <button onClick={() => navigate('prev')} className="p-2 hover:bg-slate-50 text-slate-500 border-r border-slate-100 rounded-l-xl"><ChevronLeft size={16} /></button>
              <div className="relative group cursor-pointer flex items-center justify-center px-4 py-1.5 min-w-[160px] hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-semibold text-slate-700 select-none">
                    {visibleDays[0].date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} 
                    {' - '}
                    {visibleDays[visibleDays.length - 1].date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>
                  {/* Improved Date Picker Interaction */}
                  <input 
                    type="date" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onChange={handleDatePickerChange} 
                    title="Clique para selecionar data"
                  />
              </div>
              <button onClick={() => navigate('next')} className="p-2 hover:bg-slate-50 text-slate-500 border-l border-slate-100 rounded-r-xl"><ChevronRight size={16} /></button>
          </div>

          <div className="flex gap-4 w-full xl:w-auto justify-end">
             <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-end min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Meta</span>
                <div className="flex items-center gap-1.5 text-slate-600"><Clock size={14} /><span className="text-lg font-bold">{formatDuration(periodTotals.planned)}</span></div>
             </div>
             <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-end min-w-[100px]">
                <span className="text-[10px] uppercase font-bold text-slate-400">Realizado</span>
                <div className="flex items-center gap-1.5 text-indigo-600"><CheckCircle2 size={14} /><span className="text-lg font-bold">{formatDuration(periodTotals.realized)}</span></div>
             </div>
             <button onClick={() => setShowExportModal(true)} className="ml-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl flex items-center justify-center transition-colors" title="Exportar CSV"><Download size={20} /></button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-50">
          <table className="w-full border-collapse border-spacing-0">
            <thead className="bg-white sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="w-72 p-4 text-left border-b border-r border-slate-200 bg-white sticky left-0 z-40 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]">
                   <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                      <span>{selectedMember ? 'Projeto / Tarefa' : 'Equipe'}</span>
                      {!selectedMember && <Settings size={14} className="hover:text-indigo-600 cursor-pointer" />}
                   </div>
                </th>
                {columnsToShow.map(day => (
                  <th key={day.dateKey} onClick={() => handleDateClick(day.date)} className={`p-2 text-center border-b border-r border-slate-200 cursor-pointer transition-colors hover:bg-indigo-50 ${viewPeriod === 15 ? 'min-w-[50px]' : 'min-w-[110px]'} ${day.isToday ? 'bg-indigo-50/40' : 'bg-white'}`}>
                     <div className="flex flex-col items-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider mb-0.5 ${day.isToday ? 'text-indigo-600' : 'text-slate-400'}`}>{day.dayName.substring(0, viewPeriod === 15 ? 1 : 3)}</span>
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full ${day.isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700'}`}><span className="text-xs font-bold">{day.dayNumber}</span></div>
                     </div>
                  </th>
                ))}
                <th className="w-24 p-2 text-center border-b border-slate-200 bg-slate-50/50"><span className="text-[10px] uppercase font-bold text-slate-400">Total</span></th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {rows.map(row => {
                const isProject = row.type === 'project';
                const isTask = row.type === 'task';
                const isMember = row.type === 'member';
                const isExpanded = isProject && expandedProjects.has(row.id);

                return (
                  <tr key={row.id} className={`group transition-colors ${isProject ? 'bg-slate-50 hover:bg-slate-100' : isTask ? 'bg-white hover:bg-slate-50' : 'hover:bg-slate-50'}`}>
                    
                    {/* Label Column */}
                    <td className={`p-4 border-b border-r border-slate-200 sticky left-0 z-20 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] ${isProject ? 'bg-slate-50 group-hover:bg-slate-100' : 'bg-white group-hover:bg-slate-50'}`}>
                       <div 
                         className={`flex items-center gap-3 ${isTask ? 'pl-8' : ''} cursor-pointer`}
                         onClick={() => {
                           if (isMember) setSelectedMember(row.id);
                           if (isProject) toggleProject(row.id);
                           if (isTask) setActiveTask(row as TaskRow);
                         }}
                       >
                          {/* Icons based on Type */}
                          {isMember && (
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm border border-slate-100 ${(row as MemberRow).avatarBg}`}>
                              {row.label.substring(0,2).toUpperCase()}
                            </div>
                          )}
                          {isProject && (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white text-slate-600 border border-slate-200 shadow-sm">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                            </div>
                          )}
                          {isTask && (
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 text-indigo-400 border border-slate-100">
                              <FileText size={14} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className={`text-sm font-bold text-slate-700 truncate ${!isTask && 'group-hover:text-indigo-600'}`}>
                              {row.label}
                            </p>
                            {/* HIDE ROLE FOR MEMBERS, SHOW PROJECT FOR TASKS */}
                            {row.type === 'task' && (
                              <p className="text-[10px] text-slate-400 uppercase font-semibold truncate">
                                {row.subLabel}
                              </p>
                            )}
                          </div>
                       </div>
                    </td>

                    {/* Data Cells */}
                    {columnsToShow.map(day => {
                      const data = row.days[day.dateKey] || { planned: 0, realized: 0 };
                      const isCompact = viewPeriod === 15;
                      const isWeekend = day.isWeekend;
                      const cellBg = day.isToday ? 'bg-indigo-50/10' : isWeekend ? 'bg-slate-50/30' : '';
                      
                      return (
                        <td 
                          key={day.dateKey} 
                          className={`
                            border-b border-r border-slate-100 relative align-top transition-colors
                            ${cellBg}
                            ${isCompact ? 'p-1 h-12' : 'p-2 h-16'}
                          `}
                          onClick={() => isTask && setActiveTask(row as TaskRow)}
                        >
                           {renderCellContent(data.planned, data.realized, isCompact, row.type)}
                        </td>
                      );
                    })}

                    {/* Total */}
                    <td className="border-b border-slate-200 bg-slate-50/30 text-center p-2">
                       <div className="flex flex-col items-center justify-center h-full">
                          <span className={`text-xs font-bold ${row.totalRealized > row.totalPlanned ? 'text-rose-600' : 'text-indigo-600'}`}>
                            {formatDuration(row.totalRealized)}
                          </span>
                          <span className="text-[9px] font-medium text-slate-400">/ {formatDuration(row.totalPlanned)}</span>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            
            {/* Fixed Footer for Daily Totals */}
            <tfoot className="bg-slate-100 sticky bottom-0 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-slate-300">
              <tr>
                <td className="sticky left-0 z-30 bg-slate-100 px-4 py-3 border-r border-slate-200 font-bold text-slate-600 text-right uppercase text-xs">
                  Carga Diária
                </td>
                {columnsToShow.map(day => {
                  // Calculate daily total from ROWS (avoiding duplication)
                  // For daily totals, we only want to sum up the visible top-level items
                  // If viewing team: sum members. If viewing member: sum projects.
                  const dailyRealized = rows
                    .filter(r => (selectedMember ? r.type === 'project' : r.type === 'member'))
                    .reduce((acc, r) => acc + (r.days[day.dateKey]?.realized || 0), 0);
                  
                  const isHeavy = dailyRealized > 8; // Highlight overload > 8h
                  
                  return (
                    <td key={day.dateKey} className="px-1 py-2 text-center border-r border-slate-200">
                      <div className="flex justify-center">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isHeavy ? 'bg-rose-500 text-white' : dailyRealized > 0 ? 'bg-slate-200 text-slate-700' : 'text-slate-300'}`}>
                          {formatDuration(dailyRealized, true)}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="bg-slate-200 border-t border-slate-300"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  );
};
