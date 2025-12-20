
import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  ChevronRight,
  Briefcase,
  AlertOctagon,
  Clock,
  CheckCircle2,
  CalendarDays,
  Filter,
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ArrowLeft,
  Download,
  ChevronDown,
  User,
  XCircle,
  Target, // Icone para Foco Estratégico
  Crosshair
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { MOCK_LEGACY_DATA, PRIORITY_CONFIG, MOCK_TEAM_DATA } from '../../constants';
import { PriorityType, GroupedData } from '../../types';

// --- HELPER ---
const formatHours = (value: number) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Pseudo-random seeder
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

// --- TYPES ---
interface ModalItem {
  id: string;
  title: string;
  subtitle: string;
  value: string;
  status?: string; 
}

// --- SUB-COMPONENTS ---

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-sm z-50 pointer-events-none">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill || entry.color }} />
              <span className="text-slate-600 font-medium">{entry.name}:</span>
              <span className="font-bold text-slate-800 ml-auto">{formatHours(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DrillDownModal = ({ title, items, isOpen, onClose, onItemClick }: { title: string, items: ModalItem[], isOpen: boolean, onClose: () => void, onItemClick?: (id:string) => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
          {items.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 size={48} className="mx-auto mb-2 text-emerald-100" />
              <p>Nenhum item encontrado.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {items.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => onItemClick && onItemClick(item.id)}
                  className={`p-3 hover:bg-slate-50 rounded-xl flex items-center justify-between group transition-colors border border-transparent hover:border-slate-100 ${onItemClick ? 'cursor-pointer' : ''}`}
                >
                   <div className="min-w-0 pr-4">
                      <p className={`text-sm font-bold truncate ${onItemClick ? 'text-indigo-700 group-hover:underline' : 'text-slate-700'}`}>{item.title}</p>
                      <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                   </div>
                   <div className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${
                     item.status === 'critical' ? 'bg-rose-50 text-rose-600' :
                     item.status === 'warning' ? 'bg-amber-50 text-amber-600' :
                     'bg-slate-100 text-slate-600'
                   }`}>
                     {item.value}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-50 p-3 text-center border-t border-slate-100 text-xs text-slate-400 font-medium">
           Mostrando {items.length} itens
        </div>
      </div>
    </div>
  );
};

interface SmartKpiProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  theme: 'indigo' | 'rose' | 'emerald' | 'amber' | 'blue' | 'purple';
  progress?: { current: number; total: number; label?: string };
  onClick?: () => void;
  trend?: string;
}

const SmartKpiCard = ({ label, value, subValue, icon: Icon, theme, progress, onClick, trend }: SmartKpiProps) => {
  const themes = {
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-white', iconColor: 'text-indigo-600', bar: 'bg-indigo-500', border: 'border-indigo-100', hover: 'hover:border-indigo-300' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-white', iconColor: 'text-rose-600', bar: 'bg-rose-500', border: 'border-rose-100', hover: 'hover:border-rose-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-white', iconColor: 'text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-100', hover: 'hover:border-emerald-300' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-white', iconColor: 'text-amber-600', bar: 'bg-amber-500', border: 'border-amber-100', hover: 'hover:border-amber-300' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-white', iconColor: 'text-blue-600', bar: 'bg-blue-500', border: 'border-blue-100', hover: 'hover:border-blue-300' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-white', iconColor: 'text-purple-600', bar: 'bg-purple-500', border: 'border-purple-100', hover: 'hover:border-purple-300' },
  };

  const t = themes[theme];
  const percent = progress ? Math.min((progress.current / progress.total) * 100, 100) : 0;

  return (
    <button 
      onClick={onClick}
      className={`
        relative w-full p-5 rounded-2xl bg-white border ${t.border} shadow-sm text-left transition-all duration-300 group
        ${onClick ? `cursor-pointer ${t.hover} hover:-translate-y-1 hover:shadow-md` : 'cursor-default'}
      `}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2.5 rounded-xl ${t.bg} ${t.iconColor}`}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${t.bg} ${t.text}`}>
            {trend}
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {subValue && <span className="text-xs text-slate-500 font-medium">{subValue}</span>}
        </div>
      </div>

      {progress && (
        <div className="mt-4">
          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
             <span>{progress.label || 'Progresso'}</span>
             <span className={t.text}>{percent.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ease-out ${t.bar}`} 
               style={{ width: `${percent}%` }} 
             />
          </div>
        </div>
      )}
    </button>
  );
};

const generateDailyDistribution = (totalHours: number, month: number, year: number, taskId: string) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const distribution: Record<number, number> = {};
  
  if (totalHours <= 0) return distribution;

  let remaining = totalHours;
  let seed = taskId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  let safety = 0;
  while (remaining > 0.1 && safety < 50) {
    const randomVal = pseudoRandom(seed++);
    const day = Math.floor(randomVal * daysInMonth) + 1;
    const chunkRandom = pseudoRandom(seed++);
    const chunk = Math.min(remaining, (chunkRandom * 3.5) + 0.5); 
    
    distribution[day] = (distribution[day] || 0) + chunk;
    remaining -= chunk;
    safety++;
  }
  
  if (remaining > 0) {
     const lastDay = Math.min(daysInMonth, 28);
     distribution[lastDay] = (distribution[lastDay] || 0) + remaining;
  }

  return distribution;
};

// --- MAIN COMPONENT ---

export const StrategicViewProto: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('2025-12'); 
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null); 
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<PriorityType | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<PriorityType | null>(null);
  
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, items: ModalItem[] }>({
    isOpen: false, title: '', items: []
  });

  const monthOptions = useMemo(() => {
    const options = [];
    const [currYear, currMonth] = selectedMonth.split('-').map(Number);
    const centerDate = new Date(currYear, currMonth - 1, 1);

    for (let i = -6; i <= 6; i++) {
      const d = new Date(centerDate);
      d.setMonth(centerDate.getMonth() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const formattedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      
      options.push({ value: `${y}-${m}`, label: formattedLabel });
    }
    return options;
  }, [selectedMonth]);

  const dashboardData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const activeDayNum = selectedDay ? parseInt(selectedDay.replace(/\D/g, '')) : null;

    const filteredData = selectedMember 
      ? MOCK_LEGACY_DATA.filter(g => g.assignee === selectedMember)
      : MOCK_LEGACY_DATA;

    const dailyMap = new Array(daysInMonth + 1).fill(0).map(() => ({ planned: 0, logged: 0 }));
    const projectHoursMap = new Map<string, number>(); 
    const activeProjectsList: ModalItem[] = [];
    const delayedTasksList: ModalItem[] = [];
    const overBudgetList: ModalItem[] = [];
    const projectContributors = new Set<string>();
    const processedProjects = new Set<string>();
    const priorityStats = { urgent: 0, high: 0, normal: 0, low: 0, none: 0 };

    let totalPlanned = 0;
    let totalLogged = 0;
    
    // BI Metrics
    let strategicHours = 0; // Hours on Urgent/High
    let totalActiveHours = 0; // Total planned hours

    filteredData.forEach(group => {
      group.projects.forEach(proj => {
        let projTotalLoggedFiltered = 0;
        let projHasFilteredPriority = false;

        proj.tasks.forEach(t => {
           const pStr = (t.priority || '').toLowerCase();
           let match = true;
           if (filterPriority) {
              const config = PRIORITY_CONFIG[filterPriority];
              if (!pStr.includes(config.label.split(' - ')[1].toLowerCase()) && !pStr.includes(filterPriority)) match = false;
           }
           
           if (match) {
             const loggedDist = generateDailyDistribution(t.timeLogged || 0, month, year, t.id);
             if (activeDayNum) {
                projTotalLoggedFiltered += loggedDist[activeDayNum] || 0;
             } else {
                projTotalLoggedFiltered += t.timeLogged || 0;
             }
             projHasFilteredPriority = true;
           }
        });

        if (projHasFilteredPriority || !filterPriority) {
           projectHoursMap.set(proj.name, (projectHoursMap.get(proj.name) || 0) + projTotalLoggedFiltered);
        }

        if (selectedProject && proj.name === selectedProject) {
           projectContributors.add(group.assignee);
        }

        if (selectedProject && proj.name !== selectedProject) return;

        let projPlanned = 0;
        let projLogged = 0;
        let projHasActiveTasks = false;

        proj.tasks.forEach(t => {
          const p = (t.priority || '').toLowerCase();
          let match = true;
          if (filterPriority) {
             const config = PRIORITY_CONFIG[filterPriority];
             if (!p.includes(config.label.split(' - ')[1].toLowerCase()) && !t.priority?.includes(filterPriority)) match = false;
          }
          if (!match) return;

          const loggedDist = generateDailyDistribution(t.timeLogged || 0, month, year, t.id);
          const plannedDist = generateDailyDistribution(t.timeEstimate || 0, month, year, t.id);

          let effectivePlanned = 0;
          let effectiveLogged = 0;

          if (activeDayNum) {
             effectivePlanned = plannedDist[activeDayNum] || 0;
             effectiveLogged = loggedDist[activeDayNum] || 0;
          } else {
             effectivePlanned = t.timeEstimate || 0;
             effectiveLogged = t.timeLogged || 0;
          }

          for (let d = 1; d <= daysInMonth; d++) {
             dailyMap[d].logged += loggedDist[d] || 0;
             dailyMap[d].planned += plannedDist[d] || 0;
          }

          if (activeDayNum && effectiveLogged === 0 && effectivePlanned === 0) return; 

          if (t.status !== 'completed' && t.status !== 'concluído') projHasActiveTasks = true;

          totalPlanned += effectivePlanned;
          totalLogged += effectiveLogged;
          projPlanned += effectivePlanned;
          projLogged += effectiveLogged;

          const isUrgent = p.includes('urgent') || p === '0';
          const isHigh = p.includes('high') || p === '1';
          
          if (isUrgent) priorityStats.urgent += effectivePlanned;
          else if (isHigh) priorityStats.high += effectivePlanned;
          else if (p.includes('normal') || p === '2') priorityStats.normal += effectivePlanned;
          else if (p.includes('low') || p === '3') priorityStats.low += effectivePlanned;
          else priorityStats.none += effectivePlanned;

          // Strategic Hours Calculation
          if (isUrgent || isHigh) {
            strategicHours += effectivePlanned;
          }
          totalActiveHours += effectivePlanned;

          if (t.dueDate && t.status !== 'completed' && t.status !== 'concluído' && new Date(t.dueDate) < new Date()) {
            delayedTasksList.push({
              id: t.id,
              title: t.name,
              subtitle: `${t.assignee} • ${new Date(t.dueDate).toLocaleDateString('pt-BR')}`,
              value: 'Atrasado',
              status: 'critical'
            });
          }
        });

        if (projHasActiveTasks && !processedProjects.has(proj.name)) {
           processedProjects.add(proj.name);
           activeProjectsList.push({ id: proj.name, title: proj.name, subtitle: `${proj.tasks.length} tarefas`, value: 'Ativo', status: 'warning' });
        }

        if (projLogged > projPlanned && projPlanned > 0 && !overBudgetList.find(i => i.id === proj.name)) {
           overBudgetList.push({ id: proj.name, title: proj.name, subtitle: `Estimado: ${formatHours(projPlanned)}`, value: `+${formatHours(projLogged - projPlanned)}`, status: 'critical' });
        }
      });
    });

    const weeksData = [];
    let currentDay = 1;
    for (let w = 1; w <= 5; w++) {
       if (currentDay > daysInMonth) break;
       const endDay = Math.min(currentDay + 6, daysInMonth);
       let wPlanned = 0;
       let wLogged = 0;
       for (let d = currentDay; d <= endDay; d++) {
          wPlanned += dailyMap[d].planned;
          wLogged += dailyMap[d].logged;
       }
       weeksData.push({
         name: `Semana ${w}`,
         range: `${currentDay}-${endDay}`,
         startDay: currentDay,
         endDay: endDay,
         planned: wPlanned,
         logged: wLogged
       });
       currentDay = endDay + 1;
    }

    const projectRanking = Array.from(projectHoursMap.entries())
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);

    return {
      activeProjectsList,
      delayedTasksList,
      overBudgetList,
      projectContributors: Array.from(projectContributors),
      hours: { planned: totalPlanned, logged: totalLogged },
      projectRanking,
      priorityStats,
      weeksData,
      dailyMap,
      strategicFocus: { strategic: strategicHours, total: totalActiveHours }
    };
  }, [selectedMember, selectedProject, filterPriority, selectedMonth, selectedDay]); 

  const chartData = useMemo(() => {
    if (selectedWeek) {
       const weekInfo = dashboardData.weeksData.find(w => w.name === selectedWeek);
       if (!weekInfo) return [];
       const days = [];
       for (let d = weekInfo.startDay; d <= weekInfo.endDay; d++) {
          days.push({
             name: `Dia ${d}`,
             fullDate: `${selectedMonth}-${d}`,
             planned: dashboardData.dailyMap[d].planned,
             logged: dashboardData.dailyMap[d].logged
          });
       }
       return days;
    } else {
       return dashboardData.weeksData;
    }
  }, [selectedWeek, dashboardData]);

  const pieData = useMemo(() => {
    const s = dashboardData.priorityStats;
    return [
      { name: '0 - Urgente', type: PriorityType.URGENT, value: s.urgent, color: PRIORITY_CONFIG[PriorityType.URGENT].color },
      { name: '1 - Alta', type: PriorityType.HIGH, value: s.high, color: PRIORITY_CONFIG[PriorityType.HIGH].color },
      { name: '2 - Normal', type: PriorityType.NORMAL, value: s.normal, color: PRIORITY_CONFIG[PriorityType.NORMAL].color },
      { name: '3 - Baixa', type: PriorityType.LOW, value: s.low, color: PRIORITY_CONFIG[PriorityType.LOW].color },
      { name: '4 - S/ Prior.', type: PriorityType.NONE, value: s.none, color: PRIORITY_CONFIG[PriorityType.NONE].color },
    ].filter(item => item.value > 0);
  }, [dashboardData]);

  const changeMonth = (offset: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + offset, 1);
    const newY = date.getFullYear();
    const newM = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${newY}-${newM}`);
    setSelectedWeek(null);
  };

  const openModal = (title: string, items: ModalItem[]) => setModalConfig({ isOpen: true, title, items });
  const clearAllFilters = () => { setSelectedProject(null); setSelectedDay(null); setFilterPriority(null); };

  const isOverBudget = dashboardData.hours.logged > dashboardData.hours.planned;
  const strategicPct = dashboardData.strategicFocus.total > 0 ? (dashboardData.strategicFocus.strategic / dashboardData.strategicFocus.total) * 100 : 0;
  
  return (
    <div className="flex flex-col gap-6 animate-fadeIn pb-8 p-6 bg-slate-50 min-h-screen">
      
      {/* Title */}
      <div className="mb-2">
         <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold mb-2">Versão Protótipo</div>
         <h1 className="text-2xl font-bold text-slate-800">Visão Estratégica Isolada</h1>
         <p className="text-sm text-slate-500">Substituindo métrica de "Velocidade" por "Foco Estratégico"</p>
      </div>

      <DrillDownModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
        title={modalConfig.title} 
        items={modalConfig.items} 
        onItemClick={(id) => { if (modalConfig.title === "Projetos Ativos") { setSelectedProject(id); setModalConfig(prev => ({ ...prev, isOpen: false })); } }}
      />

      <div className="w-full space-y-6">
        
        {/* FILTERS & CONTROLS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
             <div className="flex flex-wrap items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
                <div className="relative group px-2 border-r border-slate-200">
                    <div className="flex items-center gap-2 py-1.5 cursor-pointer">
                        <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                            <User size={14} />
                        </div>
                        <div className="relative min-w-[140px]">
                            <select value={selectedMember || 'overview'} onChange={(e) => { setSelectedMember(e.target.value === 'overview' ? null : e.target.value); setSelectedProject(null); }} className="w-full appearance-none bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer py-1 pr-6">
                                <option value="overview">Todos da Equipe</option>
                                {MOCK_TEAM_DATA.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                            <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 pl-2">
                    <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><ChevronLeft size={16} /></button>
                    <div className="relative">
                      <button onClick={() => setShowMonthPicker(!showMonthPicker)} className="px-2 py-1.5 hover:bg-white rounded-lg transition-colors text-xs font-bold text-slate-700 min-w-[110px] text-center capitalize flex items-center justify-center gap-2">
                          <CalendarIcon size={14} className="text-slate-400" />
                          {new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </button>
                      {showMonthPicker && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowMonthPicker(false)}></div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto custom-scrollbar p-1 animate-fadeIn">
                              {monthOptions.map(opt => (
                                <button key={opt.value} onClick={() => { setSelectedMonth(opt.value); setSelectedWeek(null); setShowMonthPicker(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${selectedMonth === opt.value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>
                                  {opt.label}
                                  {selectedMonth === opt.value && <CheckCircle2 size={12} />}
                                </button>
                              ))}
                          </div>
                        </>
                      )}
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-slate-600 transition-colors"><ChevronRight size={16} /></button>
                </div>
             </div>
             {(selectedProject || selectedDay || filterPriority) && (
                <button onClick={clearAllFilters} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-rose-100" title="Limpar Filtros"><XCircle size={16} /></button>
             )}
           </div>
        </div>

        {/* --- KPI GRID (MODIFIED WITH STRATEGIC FOCUS) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           
           <SmartKpiCard 
             label="Aderência"
             value={formatHours(dashboardData.hours.logged)}
             subValue={`/ ${formatHours(dashboardData.hours.planned)}`}
             icon={Clock}
             theme={isOverBudget ? 'rose' : 'emerald'}
             progress={{ current: dashboardData.hours.logged, total: dashboardData.hours.planned, label: isOverBudget ? 'Estouro' : 'Utilização' }}
             trend={isOverBudget ? '+12% acima' : 'Dentro da meta'}
           />

           <SmartKpiCard 
             label="Índice de Risco"
             value={dashboardData.delayedTasksList.length}
             subValue="Itens Críticos"
             icon={AlertOctagon}
             theme={dashboardData.delayedTasksList.length > 0 ? 'rose' : 'emerald'}
             onClick={() => openModal("Tarefas Atrasadas", dashboardData.delayedTasksList)}
             trend={dashboardData.delayedTasksList.length > 0 ? 'Atenção Necessária' : 'Tudo sob controle'}
           />

           {/* --- THE CHANGED CARD: STRATEGIC FOCUS --- */}
           <SmartKpiCard 
             label="Foco Estratégico"
             value={`${strategicPct.toFixed(0)}%`}
             subValue="Em P0+P1"
             icon={Crosshair}
             theme="purple"
             progress={{ current: dashboardData.strategicFocus.strategic, total: dashboardData.strategicFocus.total, label: 'Prioridade Real' }}
             trend="Alinhamento"
           />

           <SmartKpiCard 
             label="Escopo Ativo"
             value={dashboardData.activeProjectsList.length}
             subValue="Projetos"
             icon={Briefcase}
             theme="indigo"
             onClick={() => openModal("Projetos Ativos", dashboardData.activeProjectsList)}
             trend={`${dashboardData.projectContributors.length} pessoas alocadas`}
           />

        </div>

        {/* --- CHARTS (UNCHANGED VISUALS) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[340px]">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-slate-800 text-lg">Distribuição de Horas</h3>
                 <BarChart3 className="text-slate-300" />
              </div>
              <div className="flex-1 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={pieData} innerRadius={65} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none" onClick={(data) => setFilterPriority(filterPriority === data.type ? null : data.type)} onMouseEnter={(_, index) => setHoveredPriority(pieData[index].type)} onMouseLeave={() => setHoveredPriority(null)} cursor="pointer">
                          {pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} opacity={(filterPriority && filterPriority !== entry.type) || (hoveredPriority && hoveredPriority !== entry.type) ? 0.3 : 1} />
                          ))}
                       </Pie>
                       <Tooltip formatter={(value: number) => formatHours(value)} />
                       <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8} />
                    </PieChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[340px]">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="font-bold text-slate-800 text-lg">Ranking de Projetos</h3>
                 <BarChart3 className="text-slate-300" />
              </div>
              <div className="flex-1 relative w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={dashboardData.projectRanking} margin={{ top: 0, right: 30, left: 10, bottom: 0 }} onClick={(data) => data.activePayload && setSelectedProject(selectedProject === data.activePayload[0].payload.name ? null : data.activePayload[0].payload.name)} cursor="pointer">
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} />
                       <Tooltip cursor={{ fill: 'transparent' }} content={<CustomChartTooltip />} wrapperStyle={{ outline: 'none' }} />
                       <Bar dataKey="hours" radius={[0, 4, 4, 0]} barSize={20}>
                         {dashboardData.projectRanking.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={!selectedProject || selectedProject === entry.name ? '#6366f1' : '#cbd5e1'} />
                         ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>

        {/* Timeline Chart */}
        <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden h-[300px]">
             <div className="flex items-center justify-between mb-4 z-10 relative">
               <div className="flex items-center gap-2">
                  {selectedWeek && (
                    <button onClick={() => { setSelectedWeek(null); setSelectedDay(null); }} className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <div>
                    <h4 className="font-bold text-slate-600 flex items-center gap-2 text-lg">
                      {selectedWeek ? `Detalhamento: ${selectedWeek}` : `Evolução Mensal: ${selectedProject || selectedMonth}`}
                    </h4>
                  </div>
               </div>
             </div>
             
             <div className="flex-1 animate-fadeIn">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barSize={32} onClick={(data) => { if (data.activePayload) { const payload = data.activePayload[0].payload; !selectedWeek ? setSelectedWeek(payload.name) : setSelectedDay(payload.name); } }} style={{ cursor: 'pointer' }}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                       <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val: number) => formatHours(val)} />
                       <Legend verticalAlign="top" height={36}/>
                       <Bar dataKey="planned" name="Planejado" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                       <Bar dataKey="logged" name="Realizado" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry: any, index: number) => {
                             const isOver = entry.logged > entry.planned;
                             return <Cell key={`cell-${index}`} fill={isOver ? '#ef4444' : '#6366f1'} />;
                          })}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
             </div>
        </div>

      </div>
    </div>
  );
};
