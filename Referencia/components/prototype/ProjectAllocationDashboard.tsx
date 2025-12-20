
import React, { useMemo } from 'react';
import { 
  Users, 
  Layers, 
  Clock, 
  Activity, 
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../../constants';
import { GroupedData } from '../../types';

// --- HELPERS ---
const formatHours = (val: number) => {
  if (!val) return '0h';
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// --- SUB-COMPONENTS ---

const CleanMetricCard: React.FC<{ label: string, value: string, subValue?: string, icon: any }> = ({ label, value, subValue, icon: Icon }) => (
  <div className="bg-white p-5 border-b border-slate-200 lg:border-b-0 lg:border-r last:border-0 flex items-start justify-between">
    <div>
      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      <h3 className="text-3xl font-light text-slate-800 tracking-tight">{value}</h3>
      {subValue && <p className="text-xs text-slate-400 mt-1 font-medium">{subValue}</p>}
    </div>
    <div className="text-slate-300">
      <Icon size={20} strokeWidth={1.5} />
    </div>
  </div>
);

const MinimalProjectCard: React.FC<{ project: any }> = ({ project }) => {
  const { name, tasks } = project;
  
  // Calc Stats
  let planned = 0;
  let logged = 0;
  let completedTasks = 0;
  
  tasks.forEach((t: any) => {
    planned += t.timeEstimate || 0;
    logged += t.timeLogged || 0;
    if (t.status === 'completed' || t.status === 'concluído') completedTasks++;
  });

  const progress = planned > 0 ? (logged / planned) * 100 : 0;
  const isOverBudget = logged > planned;
  const diff = logged - planned;
  
  // Clean Status Logic: Only show color if Critical/Warning
  let progressBarColor = 'bg-slate-800';
  let statusIndicator = null;

  if (isOverBudget) {
    progressBarColor = 'bg-rose-500';
    statusIndicator = (
      <div className="flex items-center gap-1 text-rose-600 animate-pulse">
        <AlertTriangle size={12} />
        <span className="text-[10px] font-bold uppercase tracking-wide">Estourado</span>
      </div>
    );
  } else if (progress > 90) {
    progressBarColor = 'bg-amber-500';
    statusIndicator = <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wide">Risco</span>;
  } else if (progress >= 100) { // Exact match or complete
    progressBarColor = 'bg-emerald-500';
    statusIndicator = <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wide">Completo</span>;
  } else {
    // Normal state
    statusIndicator = <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Em andamento</span>;
  }

  return (
    <div className={`group bg-white rounded-lg border p-5 flex flex-col justify-between h-full transition-all duration-200 hover:shadow-md ${isOverBudget ? 'border-rose-200 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}>
      
      {/* Header */}
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
           {statusIndicator}
           <button className="text-slate-300 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
             <MoreHorizontal size={16} />
           </button>
        </div>
        <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2" title={name}>{name}</h4>
      </div>

      {/* Stats */}
      <div className="mt-auto">
        
        {/* Progress Line */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3 relative">
           <div 
             className={`h-full rounded-full ${progressBarColor}`} 
             style={{ width: `${Math.min(progress, 100)}%` }}
           ></div>
        </div>

        <div className="flex justify-between items-end border-t border-slate-50 pt-3">
           <div>
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">Tarefas</p>
              <p className="text-xs font-semibold text-slate-700">{completedTasks} <span className="text-slate-300">/ {tasks.length}</span></p>
           </div>
           <div className="text-right">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">Horas</p>
              <div className="flex items-baseline justify-end gap-1">
                 <p className={`text-xs font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-700'}`}>
                   {formatHours(logged)}
                 </p>
                 <span className="text-[10px] text-slate-300">/ {formatHours(planned)}</span>
              </div>
              {isOverBudget && (
                <p className="text-[9px] font-bold text-rose-500 mt-0.5">+{formatHours(diff)} acima</p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

export const ProjectAllocationDashboard: React.FC = () => {
  
  // 1. Process Data
  const { metrics, members } = useMemo(() => {
    let totalMembers = 0;
    let totalProjects = 0;
    let totalPlanned = 0;
    let totalLogged = 0;
    
    // Create a map for member capacity lookups from MOCK_TEAM_DATA
    const capacityMap = new Map(MOCK_TEAM_DATA.map(m => [m.name, m.weeklyCapacity]));

    const processedMembers = MOCK_LEGACY_DATA.map(group => {
      totalMembers++;
      
      let mPlanned = 0;
      let mLogged = 0;
      const weeklyCap = capacityMap.get(group.assignee) || 40;

      group.projects.forEach(p => {
        totalProjects++;
        p.tasks.forEach(t => {
          mPlanned += t.timeEstimate || 0;
          mLogged += t.timeLogged || 0;
        });
      });

      totalPlanned += mPlanned;
      totalLogged += mLogged;

      const utilization = weeklyCap > 0 ? Math.round((mLogged / weeklyCap) * 100) : 0; 
      
      // Determine health
      let status = 'healthy';
      if (utilization > 100) status = 'overloaded';
      else if (utilization < 50) status = 'underutilized';

      return {
        ...group,
        stats: {
          planned: mPlanned,
          logged: mLogged,
          capacity: weeklyCap,
          utilization,
          status
        }
      };
    }).sort((a, b) => b.stats.utilization - a.stats.utilization);

    return {
      metrics: {
        totalMembers,
        totalProjects,
        totalPlanned,
        totalLogged
      },
      members: processedMembers
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto custom-scrollbar font-sans">
      
      {/* 1. Ultra Clean KPI Row (No Cards, just a strip) */}
      <div className="bg-white border-b border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
         <CleanMetricCard 
           label="Equipe Ativa" 
           value={metrics.totalMembers.toString()} 
           subValue="Colaboradores"
           icon={Users} 
         />
         <CleanMetricCard 
           label="Projetos em Andamento" 
           value={metrics.totalProjects.toString()} 
           subValue="Portfolio Ativo"
           icon={Briefcase} 
         />
         <CleanMetricCard 
           label="Horas Planejadas" 
           value={metrics.totalPlanned.toFixed(0)} 
           subValue="Backlog Total"
           icon={Clock} 
         />
         <CleanMetricCard 
           label="Execução Total" 
           value={metrics.totalLogged.toFixed(0)} 
           subValue={`${((metrics.totalLogged / metrics.totalPlanned) * 100).toFixed(0)}% do planejado`}
           icon={Activity} 
         />
      </div>

      <div className="p-8 space-y-12">
        {members.map(member => (
          <div key={member.assignee} className="animate-fadeIn">
             
             {/* Clean Member Header - NO AVATAR, JUST TYPOGRAPHY */}
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
                <div>
                   <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{member.assignee}</h3>
                   <div className="flex items-center gap-6 mt-2 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Briefcase size={14} className="text-slate-400" /> 
                        {member.projects.length} projetos
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" /> 
                        {member.stats.capacity}h capacidade
                      </span>
                   </div>
                </div>
                
                {/* Minimal Capacity Visual */}
                <div className="w-full md:w-64">
                   <div className="flex justify-between items-end mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Carga</span>
                      <span className={`text-sm font-bold ${member.stats.status === 'overloaded' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {member.stats.utilization}%
                      </span>
                   </div>
                   <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          member.stats.status === 'overloaded' ? 'bg-rose-500' : 
                          member.stats.status === 'underutilized' ? 'bg-slate-400' : 'bg-slate-800'
                        }`} 
                        style={{ width: `${Math.min(member.stats.utilization, 100)}%` }}
                      ></div>
                   </div>
                </div>
             </div>

             {/* Projects Grid */}
             <div>
                {member.projects.length === 0 ? (
                  <div className="py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                    Nenhum projeto ativo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                     {member.projects.map(project => (
                       <MinimalProjectCard key={project.name} project={project} />
                     ))}
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>

    </div>
  );
};
