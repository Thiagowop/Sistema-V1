
import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  BarChart2,
  MoreHorizontal,
  PlayCircle
} from 'lucide-react';
import { MOCK_LEGACY_DATA } from '../../constants';
import { Task } from '../../types';

// --- HELPERS DE FORMATAÇÃO E LÓGICA ---

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '--/--';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatHours = (val: number) => {
  if (!val) return '-';
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// --- COMPONENTE DE CÉLULA: CRONOGRAMA UNIFICADO ---
const ScheduleCell = ({ start, end, isDone }: { start?: string | null, end?: string | null, isDone: boolean }) => {
  const endDate = end ? new Date(end) : null;
  const today = new Date();
  
  // Lógica de Atraso: Se não acabou E (não tem prazo OU prazo já passou)
  const isOverdue = !isDone && endDate && endDate < today;
  
  // Lógica de Risco: Faltam menos de 2 dias
  const isRisk = !isDone && !isOverdue && endDate && (endDate.getTime() - today.getTime()) < (2 * 24 * 60 * 60 * 1000);

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <span className="w-12 text-[10px] uppercase font-bold text-slate-400">Início</span>
        <span className="font-mono">{formatDate(start)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="w-12 text-[10px] uppercase font-bold text-slate-400">Prazo</span>
        <div className={`flex items-center gap-1 font-mono font-bold ${
          isOverdue ? 'text-rose-600 bg-rose-50 px-1.5 rounded' : 
          isRisk ? 'text-amber-600' : 
          'text-slate-700'
        }`}>
          {formatDate(end)}
          {isOverdue && <AlertCircle size={12} />}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE DE CÉLULA: EXECUÇÃO (HORAS) ---
const EffortCell = ({ planned, logged }: { planned: number, logged: number }) => {
  const percentage = planned > 0 ? (logged / planned) * 100 : 0;
  const isOverBudget = logged > planned;
  const remaining = planned - logged;

  // Cor da barra
  let barColor = 'bg-emerald-500';
  if (isOverBudget) barColor = 'bg-rose-500'; // Estourou
  else if (percentage > 90) barColor = 'bg-amber-500'; // Quase lá

  return (
    <div className="w-full max-w-[220px]">
      {/* Barra de Progresso Visual */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5 flex relative">
         <div 
           className={`h-full rounded-full ${barColor} transition-all duration-500`}
           style={{ width: `${Math.min(percentage, 100)}%` }}
         ></div>
         {/* Se estourou, mostra uma linha indicando onde era o 100% */}
         {isOverBudget && (
           <div className="absolute top-0 bottom-0 right-0 w-1 bg-rose-600 animate-pulse"></div>
         )}
      </div>

      {/* Valores Detalhados */}
      <div className="flex items-center justify-between text-xs">
         <div className="flex gap-2">
            <span className="text-slate-400" title="Planejado">{formatHours(planned)}</span>
            <ArrowRight size={12} className="text-slate-300 mt-0.5" />
            <span className={`font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-700'}`} title="Registrado">
              {formatHours(logged)}
            </span>
         </div>
         
         {/* Badge de Restante */}
         {remaining !== 0 && (
           <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
             remaining < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
           }`}>
             {remaining < 0 ? '+' : 'Restam '}{formatHours(Math.abs(remaining))}
           </span>
         )}
      </div>
    </div>
  );
};

export const PriorityDistributionProto: React.FC = () => {
  
  // Achatar os dados para criar uma lista de tarefas para o painel de controle
  const flatTasks = useMemo(() => {
    const tasks: any[] = [];
    MOCK_LEGACY_DATA.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          tasks.push({
            ...task,
            assigneeName: group.assignee, // Garante o nome correto do responsável
            projectName: project.name
          });
        });
      });
    });
    // Ordenar por: Atrasados > Estourados > Normais
    return tasks.sort((a, b) => {
      const now = new Date().getTime();
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      
      const aOverdue = aDue < now && a.status !== 'completed';
      const bOverdue = bDue < now && b.status !== 'completed';

      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      return 0;
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-sm">
            <BarChart2 size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Painel de Controle da Equipe</h2>
            <p className="text-xs text-slate-500 font-medium">Monitoramento de Prazos e Aderência ao Planejamento</p>
          </div>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg text-xs font-bold text-rose-700">
              <AlertCircle size={14} /> Crítico
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
              <Clock size={14} /> No Prazo
           </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto custom-scrollbar p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-w-[900px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 w-[25%]">Responsável / Tarefa</th>
                <th className="px-4 py-4 w-[20%]">Cronograma</th>
                <th className="px-4 py-4 w-[25%]">Execução (Planejado vs Real)</th>
                <th className="px-4 py-4 w-[15%] text-center">Status</th>
                <th className="px-4 py-4 w-[15%] text-center">Saúde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {flatTasks.map((task) => {
                const isCompleted = task.status === 'completed' || task.status === 'concluído';
                const isOverBudget = (task.timeLogged || 0) > (task.timeEstimate || 0);
                const isOverdue = !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

                return (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* COLUNA 1: RESPONSÁVEL E TAREFA */}
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                          {task.assigneeName ? task.assigneeName.substring(0, 2).toUpperCase() : 'SR'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                             <span className="font-bold text-slate-700 truncate">{task.assigneeName}</span>
                             <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 truncate max-w-[100px]">
                               {task.projectName}
                             </span>
                          </div>
                          <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed" title={task.name}>
                            {task.name}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* COLUNA 2: CRONOGRAMA UNIFICADO */}
                    <td className="px-4 py-4 align-middle bg-slate-50/30">
                       <ScheduleCell 
                         start={task.startDate} 
                         end={task.dueDate} 
                         isDone={isCompleted} 
                       />
                    </td>

                    {/* COLUNA 3: EXECUÇÃO (BARRA + VALORES) */}
                    <td className="px-4 py-4 align-middle">
                       <EffortCell 
                         planned={task.timeEstimate || 0} 
                         logged={task.timeLogged || 0} 
                       />
                    </td>

                    {/* COLUNA 4: STATUS */}
                    <td className="px-4 py-4 align-middle text-center">
                       <span className={`
                         inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border
                         ${isCompleted 
                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                           : 'bg-white text-slate-500 border-slate-200'}
                       `}>
                         {isCompleted ? 'Concluído' : task.status || 'Pendente'}
                       </span>
                    </td>

                    {/* COLUNA 5: SAÚDE GERAL (ALERTA) */}
                    <td className="px-4 py-4 align-middle text-center">
                       <div className="flex justify-center">
                          {isOverdue ? (
                            <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100" title="Prazo Ultrapassado">
                               <AlertCircle size={16} />
                               <span className="text-xs font-bold">Atrasado</span>
                            </div>
                          ) : isOverBudget ? (
                            <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100" title="Horas Estouradas">
                               <AlertTriangle size={16} />
                               <span className="text-xs font-bold">Estouro</span>
                            </div>
                          ) : isCompleted ? (
                            <div className="text-emerald-500">
                               <CheckCircle2 size={20} />
                            </div>
                          ) : (
                            <div className="text-slate-300">
                               <PlayCircle size={20} />
                            </div>
                          )}
                       </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
