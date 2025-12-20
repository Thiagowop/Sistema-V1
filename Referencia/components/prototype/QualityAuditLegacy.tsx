
import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Calendar, 
  Flag, 
  Clock, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  X
} from 'lucide-react';
import { GroupedData, Task } from '../../types';

interface QualityAuditLegacyProps {
  data: GroupedData[];
}

// --- CONSTANTES ---
const WEIGHTS = {
  assignee: 2,
  dueDate: 2,
  priority: 1,
  estimate: 1,
  description: 0.5
};

export const QualityAuditLegacy: React.FC<QualityAuditLegacyProps> = ({ data }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // --- PROCESSAMENTO DE DADOS (LÓGICA LEGADA) ---
  const stats = useMemo(() => {
    const issues = {
      assignee: [] as Task[],
      dueDate: [] as Task[],
      priority: [] as Task[],
      estimate: [] as Task[],
      description: [] as Task[]
    };
    
    let totalTasks = 0;
    let totalPenalty = 0;

    data.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          // Ignorar concluídos
          if (task.status?.toLowerCase().includes('conclu') || task.status === 'completed') return;

          totalTasks++;
          let taskPenalty = 0;

          if (!task.assignee || task.assignee === 'Sem responsável') {
            issues.assignee.push(task);
            taskPenalty += WEIGHTS.assignee;
          }
          if (!task.dueDate) {
            issues.dueDate.push(task);
            taskPenalty += WEIGHTS.dueDate;
          }
          if (!task.priority || task.priority === '4') {
            issues.priority.push(task);
            taskPenalty += WEIGHTS.priority;
          }
          if (!task.timeEstimate) {
            issues.estimate.push(task);
            taskPenalty += WEIGHTS.estimate;
          }
          if (!task.description || task.description.length < 5) {
            issues.description.push(task);
            taskPenalty += WEIGHTS.description;
          }

          totalPenalty += taskPenalty;
        });
      });
    });

    // Score simples baseado em penalidade média
    const maxPenaltyPerTask = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    const avgPenalty = totalTasks > 0 ? totalPenalty / totalTasks : 0;
    const score = Math.max(0, Math.round(100 - (avgPenalty / maxPenaltyPerTask) * 100));

    return { issues, totalTasks, score, totalErrors: Object.values(issues).reduce((acc, arr) => acc + arr.length, 0) };
  }, [data]);

  const categories = [
    { id: 'assignee', label: 'Sem Responsável', icon: Users, count: stats.issues.assignee.length, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'dueDate', label: 'Sem Data', icon: Calendar, count: stats.issues.dueDate.length, color: 'text-orange-600', bg: 'bg-orange-50' },
    { id: 'priority', label: 'Sem Prioridade', icon: Flag, count: stats.issues.priority.length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'estimate', label: 'Sem Estimativa', icon: Clock, count: stats.issues.estimate.length, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'description', label: 'Sem Descrição', icon: FileText, count: stats.issues.description.length, color: 'text-slate-600', bg: 'bg-slate-50' },
  ];

  const activeList = activeCategory ? (stats.issues as any)[activeCategory] as Task[] : [];
  const activeCategoryInfo = categories.find(c => c.id === activeCategory);

  return (
    <div className="p-6 space-y-8 animate-fadeIn max-w-6xl mx-auto">
      
      {/* Header Contextual */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
               <ShieldAlert size={32} />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">Auditoria de Qualidade (V1)</h2>
               <p className="text-sm text-slate-500">Visualização focada em categorias de erro, não em pessoas.</p>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <div className="text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Global</p>
               <p className={`text-4xl font-black ${stats.score >= 80 ? 'text-emerald-500' : stats.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                 {stats.score}
               </p>
            </div>
            <div className="w-px h-10 bg-slate-200"></div>
            <div className="text-center">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Erros Totais</p>
               <p className="text-4xl font-black text-slate-700">{stats.totalErrors}</p>
            </div>
         </div>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
         {categories.map((cat) => (
           <button
             key={cat.id}
             onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
             className={`
                relative p-4 rounded-xl border text-left transition-all duration-200 group
                ${activeCategory === cat.id 
                  ? 'bg-white ring-2 ring-indigo-500 border-transparent shadow-lg transform -translate-y-1' 
                  : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }
             `}
           >
              <div className="flex justify-between items-start mb-3">
                 <div className={`p-2 rounded-lg ${cat.bg} ${cat.color}`}>
                    <cat.icon size={20} />
                 </div>
                 <span className={`text-xl font-bold ${cat.count > 0 ? 'text-slate-800' : 'text-slate-300'}`}>
                    {cat.count}
                 </span>
              </div>
              <p className="text-sm font-bold text-slate-600 group-hover:text-indigo-700 transition-colors">
                {cat.label}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {cat.count === 0 ? 'Tudo certo' : `${cat.count} problemas`}
              </p>
              
              {activeCategory === cat.id && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-indigo-500 transform rotate-45 z-0"></div>
              )}
           </button>
         ))}
      </div>

      {/* Lista de Detalhes (Expandível) */}
      {activeCategory && activeCategoryInfo && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-slideInUp relative z-10">
           <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${activeCategoryInfo.bg}`}>
              <h3 className={`font-bold text-lg flex items-center gap-2 ${activeCategoryInfo.color}`}>
                 <activeCategoryInfo.icon size={20} />
                 Corrigir: {activeCategoryInfo.label}
              </h3>
              <button 
                onClick={() => setActiveCategory(null)}
                className="p-1 rounded-full hover:bg-white/50 text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
           </div>
           
           <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-0">
              {activeList.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                   <CheckCircle2 size={48} className="mx-auto mb-2 text-emerald-200" />
                   <p>Nenhuma tarefa encontrada nesta categoria. Bom trabalho!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                   {activeList.map(task => (
                     <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                        <div>
                           <p className="font-bold text-slate-700 text-sm group-hover:text-indigo-700 transition-colors">
                             {task.name}
                           </p>
                           <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                {task.projectName || 'Geral'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={12} /> {task.assignee || 'Ninguém'}
                              </span>
                           </div>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg shadow hover:bg-slate-900 flex items-center gap-1">
                           Abrir <ChevronRight size={12} />
                        </button>
                     </div>
                   ))}
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
};
