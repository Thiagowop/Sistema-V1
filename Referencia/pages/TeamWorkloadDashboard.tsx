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
  MoreHorizontal
} from 'lucide-react';
import { GroupedData, Task } from '../types';

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
  if (s.includes('conclu') || s.includes('done') || s.includes('complete')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (s.includes('andamento') || s.includes('progress') || s.includes('doing')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (s.includes('bloqueado') || s.includes('blocked')) return 'bg-rose-100 text-rose-700 border-rose-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const getPriorityColor = (priority: string | null | undefined) => {
  const p = priority?.toLowerCase() || '';
  if (p.includes('urgent') || p.includes('0')) return 'text-rose-600';
  if (p.includes('alta') || p.includes('high') || p.includes('1')) return 'text-orange-500';
  return 'text-slate-300';
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
        // Prioridade simples baseada na string
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
             <AlertCircle size={14} /> Atrasado
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
        {membersMetrics.map(member => {
          const isExpanded = expandedMembers.has(member.name);
          const isOverCapacity = member.totalLogged > member.totalEstimate;

          return (
            <div 
              key={member.name} 
              className={`
                bg-white rounded-xl border transition-all duration-300 overflow-hidden
                ${isExpanded ? 'shadow-md border-indigo-200 ring-1 ring-indigo-100' : 'shadow-sm border-slate-200 hover:border-indigo-200'}
              `}
            >
              {/* Header do Card (Resumo) */}
              <div 
                className="p-5 cursor-pointer select-none"
                onClick={() => toggleMember(member.name)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                      {member.name.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{member.name}</h3>
                      <p className="text-xs text-slate-400">{member.tasks.length} tarefas ativas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {member.overdueCount > 0 && (
                       <span className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-600 rounded-md text-xs font-bold border border-rose-200 shadow-sm" title={`${member.overdueCount} tarefas atrasadas`}>
                         <AlertCircle size={12} /> {member.overdueCount}
                       </span>
                     )}
                     <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                       {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                     </button>
                  </div>
                </div>

                {/* Barra de Capacidade Macro */}
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-500">Carga Horária vs Estimativa</span>
                      <span className={isOverCapacity ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                         {member.totalLogged.toFixed(1)}h <span className="text-slate-400 font-normal">/ {member.totalEstimate.toFixed(1)}h</span>
                      </span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
                      {/* Background Striped Pattern for empty space */}
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,#000_25%,#000_50%,transparent_50%,transparent_75%,#000_75%,#000_100%)] bg-[length:8px_8px]"></div>
                      
                      <div 
                        className={`h-full rounded-full transition-all duration-500 relative z-10 ${isOverCapacity ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min(member.capacityPercentage, 100)}%` }}
                      ></div>
                   </div>
                </div>
              </div>

              {/* Corpo Expansível (Lista de Tarefas) */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/30">
                  {member.tasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Nenhuma tarefa atribuída.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {member.tasks.map(task => (
                        <div key={task.id} className="p-4 hover:bg-white transition-colors group">
                           {/* Linha 1: Nome e Status */}
                           <div className="flex items-start justify-between gap-4 mb-2">
                              <div className="flex items-start gap-2 min-w-0">
                                <Flag size={16} className={`mt-0.5 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
                                <div className="min-w-0">
                                   <p className="text-sm font-semibold text-slate-700 truncate leading-tight group-hover:text-indigo-700 transition-colors" title={task.name}>
                                     {task.name}
                                   </p>
                                   <p className="text-[10px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                                      {task.projectName}
                                   </p>
                                </div>
                              </div>
                              <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(task.status)}`}>
                                {task.status || 'Pendente'}
                              </span>
                           </div>

                           {/* Linha 2: Métricas e Datas */}
                           <div className="flex items-center justify-between pl-6 mt-3">
                              
                              {/* Data */}
                              <div className={`flex items-center gap-1.5 text-xs font-medium ${task.isOverdue ? 'text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100' : 'text-slate-500'}`}>
                                 <Calendar size={14} />
                                 <span>
                                   {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                 </span>
                                 {task.isOverdue && <span className="font-bold text-[10px] ml-1">ATRASADO</span>}
                              </div>

                              {/* Micro Barra de Progresso */}
                              <div className="flex items-center gap-3">
                                 <div className="flex flex-col items-end min-w-[80px]">
                                    <div className="flex items-center gap-2 text-xs">
                                       <span className="font-semibold text-slate-700">{task.timeLogged?.toFixed(1) || 0}h</span>
                                       <span className="text-slate-300">/</span>
                                       <span className="text-slate-500">{task.timeEstimate?.toFixed(1) || 0}h</span>
                                    </div>
                                    {/* Diferença Visual */}
                                    {(task.timeEstimate || 0) > 0 && (task.timeLogged || 0) > 0 && (
                                       <div className={`text-[10px] font-bold flex items-center ${task.diff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                          {task.diff > 0 ? '+' : ''}{task.diff.toFixed(1)}h
                                       </div>
                                    )}
                                 </div>
                                 
                                 {/* Visual Bar */}
                                 <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${task.hasNegativeBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(task.progress, 100)}%` }}
                                    ></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                    <button className="flex items-center justify-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors w-full">
                       Ver detalhes no Backlog <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};