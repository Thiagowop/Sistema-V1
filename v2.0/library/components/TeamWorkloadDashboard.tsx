
import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Flag,
  CheckCircle2, 
  TrendingUp, 
  MoreHorizontal,
  FolderOpen,
  Layout,
  ChevronRight
} from 'lucide-react';
import { GroupedData, Task } from '../../types';

const formatHours = (value: number) => {
  if (!value) return '0h';
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// --- Interfaces Estendidas para o Componente ---
interface EnrichedTask extends Task {
  projectName: string;
  isOverdue: boolean;
  hasNegativeBudget: boolean;
  diff: number; // Logged - Estimate
  progress: number;
}

interface MemberMetrics {
  name: string;
  tasks: EnrichedTask[];
  totalEstimate: number;
  totalLogged: number;
  capacityPercentage: number;
  overdueCount: number;
  negativeBudgetCount: number;
}

interface TeamWorkloadDashboardProps {
  data: GroupedData[];
}

// --- Helpers de Estilo ---

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase() || '';
  if (s.includes('conclu') || s.includes('done') || s.includes('complete')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s.includes('andamento') || s.includes('progress') || s.includes('doing')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s.includes('bloqueado') || s.includes('blocked')) return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const getPriorityInfo = (priority: string | null | undefined) => {
  const p = priority?.toLowerCase() || '';
  if (p.includes('urgent') || p.includes('0')) return { label: 'Urgente', style: 'bg-rose-50 text-rose-700 border-rose-200', color: 'text-rose-600' };
  if (p.includes('alta') || p.includes('high') || p.includes('1')) return { label: 'Alta', style: 'bg-orange-50 text-orange-700 border-orange-200', color: 'text-orange-500' };
  if (p.includes('normal') || p.includes('2')) return { label: 'Normal', style: 'bg-blue-50 text-blue-700 border-blue-200', color: 'text-blue-500' };
  if (p.includes('baixa') || p.includes('low') || p.includes('3')) return { label: 'Baixa', style: 'bg-slate-50 text-slate-600 border-slate-200', color: 'text-slate-500' };
  return { label: 'S/ Prior.', style: 'bg-slate-50 text-slate-400 border-slate-100', color: 'text-slate-300' };
};

// --- Sub-Componente: Card de Membro com Projetos Aninhados ---

interface MemberWorkloadCardProps {
  member: MemberMetrics; 
  isExpanded: boolean; 
  onToggle: () => void;
}

const MemberWorkloadCard: React.FC<MemberWorkloadCardProps> = ({ 
  member, 
  isExpanded, 
  onToggle 
}) => {
  // State para controlar quais projetos estão expandidos internamente
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  const toggleProject = (e: React.MouseEvent, projectName: string) => {
    e.stopPropagation();
    const newSet = new Set(expandedProjects);
    if (newSet.has(projectName)) {
      newSet.delete(projectName);
    } else {
      newSet.add(projectName);
    }
    setExpandedProjects(newSet);
  };

  // Agrupar tarefas por projeto
  const projectGroups = useMemo(() => {
    const groups: Record<string, { tasks: EnrichedTask[], totalLogged: number, totalEstimate: number }> = {};
    
    member.tasks.forEach(task => {
      const pName = task.projectName || 'Sem Projeto';
      if (!groups[pName]) {
        groups[pName] = { tasks: [], totalLogged: 0, totalEstimate: 0 };
      }
      groups[pName].tasks.push(task);
      groups[pName].totalLogged += (task.timeLogged || 0);
      groups[pName].totalEstimate += (task.timeEstimate || 0);
    });

    // Converter para array ordenado por atividade (horas logadas)
    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalLogged - a.totalLogged);
  }, [member.tasks]);

  const isOverCapacity = member.totalLogged > member.totalEstimate;
  const hasIssues = isOverCapacity || member.overdueCount > 0;

  // Cores Temáticas
  const borderColor = isExpanded 
    ? (hasIssues ? 'border-rose-200 ring-1 ring-rose-100' : 'border-indigo-200 ring-1 ring-indigo-100')
    : 'border-slate-200';
  const hoverBorder = hasIssues ? 'hover:border-rose-200' : 'hover:border-indigo-200';
  const progressBarColor = hasIssues ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-indigo-500';

  return (
    <div 
      className={`
        bg-white rounded-xl border transition-all duration-500 ease-out overflow-hidden transform
        ${isExpanded ? 'shadow-lg scale-[1.005] z-10' : 'shadow-sm hover:shadow-md hover:scale-[1.01] hover:-translate-y-0.5'}
        ${borderColor}
        ${!isExpanded && hoverBorder}
      `}
    >
      {/* Header do Card (Resumo) */}
      <div 
        className="p-5 cursor-pointer select-none relative"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Removed Avatar Square - Just Text Layout */}
            <div>
              <h3 className={`font-bold text-lg leading-tight transition-colors duration-300 ${hasIssues ? 'text-rose-900' : 'text-slate-800'}`}>
                {member.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                 <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 rounded-md text-slate-500 border border-slate-200">
                   {member.tasks.length} tarefas
                 </span>
                 <span className="text-xs text-slate-400">•</span>
                 <span className="text-xs text-slate-500">{projectGroups.length} projetos</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {member.overdueCount > 0 && (
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold border border-rose-100 animate-pulse">
                 <AlertCircle size={14} /> 
                 <span>{member.overdueCount} em atraso</span>
               </div>
             )}
             <div className={`transition-transform duration-300 p-1.5 rounded-full hover:bg-slate-100 ${isExpanded ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
               <ChevronDown size={20} />
             </div>
          </div>
        </div>

        {/* Barra de Capacidade Macro */}
        <div className="space-y-2">
           <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500 uppercase tracking-wider font-bold">Capacidade Utilizada</span>
              <span className={isOverCapacity ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>
                 {formatHours(member.totalLogged)} <span className="text-slate-400 font-normal">/ {formatHours(member.totalEstimate)}</span>
              </span>
           </div>
           <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex relative ring-1 ring-slate-200/50">
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%,#000_100%)] bg-[length:8px_8px]"></div>
              <div 
                className={`h-full rounded-full transition-all duration-700 relative z-10 ${progressBarColor}`}
                style={{ width: `${Math.min(member.capacityPercentage, 100)}%` }}
              ></div>
           </div>
        </div>
      </div>

      {/* Corpo Expansível (Lista de Projetos -> Tarefas) */}
      <div 
        className={`transition-all duration-300 ease-in-out border-t border-slate-100 bg-slate-50/50 ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-3 space-y-3">
          {projectGroups.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
              <FolderOpen size={24} className="mb-2 opacity-50" />
              Nenhum projeto ativo atribuído.
            </div>
          ) : (
            projectGroups.map((group) => {
              const isProjExpanded = expandedProjects.has(group.name);
              const groupProgress = group.totalEstimate > 0 ? (group.totalLogged / group.totalEstimate) * 100 : 0;
              const isGroupOver = group.totalLogged > group.totalEstimate && group.totalEstimate > 0;

              return (
                <div 
                  key={group.name} 
                  className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${isProjExpanded ? 'border-indigo-200 shadow-md my-2' : 'border-slate-200 shadow-sm'}`}
                >
                   {/* Project Header Accordion */}
                   <button 
                     className={`w-full px-4 py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors text-left group/proj-header ${isProjExpanded ? 'bg-slate-50/80' : ''}`}
                     onClick={(e) => toggleProject(e, group.name)}
                   >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                         <div className={`p-2 rounded-lg transition-colors ${isProjExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover/proj-header:text-slate-600'}`}>
                            {isProjExpanded ? <FolderOpen size={18} /> : <Layout size={18} />}
                         </div>
                         <div className="min-w-0 flex-1">
                            <h4 className={`text-sm font-bold truncate ${isProjExpanded ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {group.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                               <span className="text-[10px] text-slate-500 font-medium">{group.tasks.length} tarefas</span>
                               {isGroupOver && (
                                 <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                   <AlertCircle size={10} />
                                   Estourado
                                 </span>
                               )}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         {/* Stats Pill */}
                         <div className="hidden sm:flex flex-col items-end">
                            <div className="flex items-center gap-1.5 text-xs">
                               <span className={`font-bold ${isGroupOver ? 'text-rose-600' : 'text-slate-700'}`}>
                                 {formatHours(group.totalLogged)}
                               </span>
                               <span className="text-slate-400">/ {formatHours(group.totalEstimate)}</span>
                            </div>
                            {/* Mini Bar */}
                            <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                               <div className={`h-full ${isGroupOver ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(groupProgress, 100)}%` }}></div>
                            </div>
                         </div>
                         
                         <div className={`text-slate-400 transition-transform duration-300 ${isProjExpanded ? 'rotate-180 text-indigo-500' : ''}`}>
                            <ChevronDown size={18} />
                         </div>
                      </div>
                   </button>

                   {/* Tasks List */}
                   <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out bg-slate-50/50 ${isProjExpanded ? 'max-h-[800px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}
                   >
                      <div className="p-2 space-y-2">
                        {group.tasks.map(task => {
                           const priorityInfo = getPriorityInfo(task.priority);
                           const isOverBudget = task.hasNegativeBudget;
                           
                           return (
                             <div 
                                key={task.id} 
                                className={`
                                  bg-white p-3 rounded-lg border shadow-sm hover:shadow-md transition-all group/task flex flex-col gap-2 relative
                                  ${isOverBudget
                                    ? 'border-rose-200 hover:border-rose-300'
                                    : 'border-slate-200 hover:border-indigo-200'
                                  }
                                `}
                             >
                                {/* Left Accent Bar */}
                                <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${priorityInfo.color.replace('text-', 'bg-')}`}></div>

                                {/* Header: Name & Status */}
                                <div className="flex items-start justify-between gap-3 pl-3">
                                   <p className="text-sm font-semibold text-slate-700 leading-snug line-clamp-2 group-hover/task:text-indigo-700 transition-colors" title={task.name}>
                                     {task.name}
                                   </p>
                                   <div className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${getStatusColor(task.status)}`}>
                                     {task.status || 'Pendente'}
                                   </div>
                                </div>

                                {/* Meta: Date & Hours */}
                                <div className="flex items-center justify-between pl-3 mt-1">
                                   
                                   {/* Date Badge */}
                                   <div className={`flex items-center gap-1.5 text-xs ${task.isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                                      <Calendar size={12} />
                                      <span>
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                      </span>
                                      {task.isOverdue && <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[9px] font-bold">ATRASADO</span>}
                                   </div>

                                   {/* Hours & Budget */}
                                   <div className="flex items-center gap-3">
                                      {/* Numeric */}
                                      <div className="flex items-baseline gap-1 text-xs">
                                         <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-700'}`}>
                                           {formatHours(task.timeLogged || 0)}
                                         </span>
                                         <span className="text-slate-400 text-[10px]">/ {formatHours(task.timeEstimate || 0)}</span>
                                      </div>
                                      
                                      {/* Visual Budget Bar */}
                                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden" title={`${Math.round(task.progress)}% usado`}>
                                         <div 
                                           className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                           style={{ width: `${Math.min(task.progress, 100)}%` }}
                                         ></div>
                                      </div>
                                   </div>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                   </div>
                </div>
              );
            })
          )}
        </div>
        
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-center backdrop-blur-sm">
          <button className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
              Ver detalhes completos no Backlog <MoreHorizontal size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Componente Principal ---

export const TeamWorkloadDashboard: React.FC<TeamWorkloadDashboardProps> = ({ data }) => {
  const [expandedMembers, setExpandedMembers] = useState<Set<string>>(new Set());

  const toggleMember = (memberName: string) => {
    const newSet = new Set(expandedMembers);
    if (newSet.has(memberName)) {
      newSet.delete(memberName);
    } else {
      newSet.add(memberName);
    }
    setExpandedMembers(newSet);
  };

  // Processamento dos dados para enriquecer com métricas visuais
  const membersMetrics: MemberMetrics[] = useMemo(() => {
    return data.map(group => {
      let totalEstimate = 0;
      let totalLogged = 0;
      let overdueCount = 0;
      let negativeBudgetCount = 0;

      // Achatar a estrutura de projetos para lista de tarefas do membro
      const tasks: EnrichedTask[] = group.projects.flatMap(proj => 
        proj.tasks.map(t => {
          const estimate = t.timeEstimate || 0;
          const logged = t.timeLogged || 0;
          const diff = logged - estimate;
          const hasNegativeBudget = logged > estimate && estimate > 0;
          
          // Verificar atraso
          const now = new Date();
          now.setHours(0,0,0,0);
          const dueDate = t.dueDate ? new Date(t.dueDate) : null;
          const isOverdue = dueDate ? dueDate < now && t.status !== 'completed' && t.status !== 'concluído' : false;

          totalEstimate += estimate;
          totalLogged += logged;
          if (isOverdue) overdueCount++;
          if (hasNegativeBudget) negativeBudgetCount++;

          return {
            ...t,
            projectName: proj.name,
            isOverdue,
            hasNegativeBudget,
            diff,
            progress: estimate > 0 ? Math.min((logged / estimate) * 100, 100) : 0
          };
        })
      );

      // Ordenar tarefas: Urgentes e Atrasadas primeiro
      tasks.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        const pA = (a.priority || '').toLowerCase().includes('urgent') ? 1 : 0;
        const pB = (b.priority || '').toLowerCase().includes('urgent') ? 1 : 0;
        return pB - pA;
      });

      const capacityPercentage = totalEstimate > 0 ? (totalLogged / totalEstimate) * 100 : 0;

      return {
        name: group.assignee,
        tasks,
        totalEstimate,
        totalLogged,
        capacityPercentage,
        overdueCount,
        negativeBudgetCount
      };
    }).sort((a, b) => b.totalLogged - a.totalLogged); // Ordenar membros por volume de trabalho
  }, [data]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-slate-800">
      
      {/* Header Contextual */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestão Visual de Carga</h2>
          <p className="text-sm text-slate-500">Monitoramento de aderência a estimativas e prazos por colaborador.</p>
        </div>
        <div className="flex gap-4 text-xs font-medium text-slate-600">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-100 text-rose-700">
             <AlertCircle size={14} /> Atrasado / Estourado
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
             <div className="w-2 h-2 rounded-full bg-slate-300"></div> Planejado
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
             <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Realizado
           </div>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {membersMetrics.map(member => (
          <MemberWorkloadCard 
            key={member.name}
            member={member}
            isExpanded={expandedMembers.has(member.name)}
            onToggle={() => toggleMember(member.name)}
          />
        ))}
      </div>
    </div>
  );
};
