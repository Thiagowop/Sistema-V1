
import React, { useMemo } from 'react';
import { 
  Briefcase, 
  CalendarRange, 
  Cpu, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  MoreHorizontal,
  Hash
} from 'lucide-react';
import { GroupedData } from '../types';

interface ProjectTechnicalViewProps {
  data: GroupedData[];
  selectedMemberIdx: number;
}

// Helper para gerar tags tecnológicas fictícias baseadas no nome do projeto para dar o "ar técnico"
const getMockTechStack = (projectName: string) => {
  const stacks = [
    ['React', 'TypeScript', 'Tailwind'],
    ['Node.js', 'PostgreSQL', 'Docker'],
    ['Python', 'Pandas', 'AWS Lambda'],
    ['Vue.js', 'Firebase', 'Jest'],
    ['Angular', 'Java', 'Oracle'],
    ['Next.js', 'Prisma', 'Vercel']
  ];
  // Hash simples para consistência
  const hash = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return stacks[hash % stacks.length];
};

const formatHours = (val: number) => `${Math.round(val)}h`;

export const ProjectTechnicalView: React.FC<ProjectTechnicalViewProps> = ({ data, selectedMemberIdx }) => {
  const currentGroup = data[selectedMemberIdx];

  // Processamento de Dados focado no PROJETO
  const enrichedProjects = useMemo(() => {
    return currentGroup.projects.map(proj => {
      let totalPlanned = 0;
      let totalLogged = 0;
      let minDate = Infinity;
      let maxDate = -Infinity;
      let activeTasks = 0;
      let completedTasks = 0;

      proj.tasks.forEach(t => {
        totalPlanned += t.timeEstimate || 0;
        totalLogged += t.timeLogged || 0;
        
        if (t.startDate) {
          const start = new Date(t.startDate).getTime();
          if (start < minDate) minDate = start;
        }
        if (t.dueDate) {
          const end = new Date(t.dueDate).getTime();
          if (end > maxDate) maxDate = end;
        }

        if (t.status === 'completed' || t.status?.includes('conclu')) completedTasks++;
        else activeTasks++;
      });

      // Cálculos de Saúde do Projeto
      const progress = totalPlanned > 0 ? (totalLogged / totalPlanned) * 100 : 0;
      const budgetHealth = totalLogged > totalPlanned ? 'critical' : (progress > 90 ? 'warning' : 'healthy');
      
      // Simulação de "Sprint Atual" ou fase baseada na data
      const now = new Date().getTime();
      const phase = maxDate < now ? 'Encerramento' : (progress < 10 ? 'Iniciação' : 'Execução');

      return {
        name: proj.name,
        client: 'Interno / MCSA', // Mock de cliente
        techStack: getMockTechStack(proj.name),
        metrics: {
          planned: totalPlanned,
          logged: totalLogged,
          progress,
          activeTasks,
          completedTasks
        },
        dates: {
          start: minDate !== Infinity ? new Date(minDate) : null,
          end: maxDate !== -Infinity ? new Date(maxDate) : null,
        },
        health: budgetHealth,
        phase
      };
    }).sort((a, b) => b.metrics.logged - a.metrics.logged); // Ordenar por esforço investido
  }, [currentGroup]);

  if (!currentGroup) return <div>Selecione um membro.</div>;

  return (
    <div className="p-6 lg:p-8 animate-fadeIn">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="text-indigo-600" />
            Portfólio Técnico
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Visão consolidada dos projetos sob responsabilidade de <strong className="text-indigo-700">{currentGroup.assignee}</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {enrichedProjects.map((project, idx) => (
          <div 
            key={idx} 
            className={`
              bg-white rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md group
              ${project.health === 'critical' ? 'border-rose-200' : 'border-slate-200 hover:border-indigo-200'}
            `}
          >
            {/* Header: Titulo e Status */}
            <div className="p-5 border-b border-slate-100 relative overflow-hidden">
              {/* Barra de Status Topo */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                project.health === 'critical' ? 'bg-rose-500' : 
                project.health === 'warning' ? 'bg-amber-500' : 
                'bg-emerald-500'
              }`}></div>

              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  {project.phase}
                </span>
                <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 leading-snug mb-1 group-hover:text-indigo-700 transition-colors">
                {project.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Briefcase size={12} /> {project.client}
              </p>
            </div>

            {/* Body: Métricas Macro */}
            <div className="p-5 space-y-5">
              
              {/* Grid de KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                   <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Clock size={12} />
                      <span>Horas Totais</span>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-700">{formatHours(project.metrics.logged)}</span>
                      <span className="text-[10px] text-slate-400">/ {formatHours(project.metrics.planned)}</span>
                   </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                   <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <Activity size={12} />
                      <span>Progresso</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${
                        project.metrics.progress > 100 ? 'text-rose-600' : 'text-slate-700'
                      }`}>
                        {project.metrics.progress.toFixed(0)}%
                      </span>
                      {project.metrics.progress > 100 && <AlertTriangle size={14} className="text-rose-500" />}
                   </div>
                </div>
              </div>

              {/* Stack Tecnológica */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Hash size={10} /> Tech Stack
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.techStack.map(tech => (
                    <span key={tech} className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Datas */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50 text-xs text-slate-500">
                 <div className="flex items-center gap-2">
                    <CalendarRange size={14} className="text-slate-400" />
                    <span>
                      {project.dates.start ? project.dates.start.toLocaleDateString('pt-BR', {month:'short', day:'numeric'}) : 'N/A'} 
                      {' -> '} 
                      {project.dates.end ? project.dates.end.toLocaleDateString('pt-BR', {month:'short', day:'numeric'}) : 'N/A'}
                    </span>
                 </div>
                 {project.health === 'critical' ? (
                   <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                     <TrendingUp size={12} /> Estouro
                   </span>
                 ) : (
                   <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                     <CheckCircle2 size={12} /> Saudável
                   </span>
                 )}
              </div>

            </div>
          </div>
        ))}

        {enrichedProjects.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <Briefcase size={40} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum projeto ativo encontrado para este membro.</p>
          </div>
        )}
      </div>
    </div>
  );
};
