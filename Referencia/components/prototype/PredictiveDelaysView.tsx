
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Target,
  Info,
  X,
  AlertOctagon,
  Search
} from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Cell,
  Label
} from 'recharts';
import { MOCK_LEGACY_DATA } from '../../constants';

// --- HELPERS ---
const formatHours = (val: number) => `${Math.round(val)}h`;
const formatDate = (date: Date) => date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

// --- MODAL DE DETALHES ---
const ProjectDetailModal = ({ project, onClose }: { project: any, onClose: () => void }) => {
  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <h3 className="text-xl font-bold text-slate-800">{project.name}</h3>
               <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full border ${
                 project.risk.level === 'critical' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                 project.risk.level === 'warning' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                 'bg-emerald-100 text-emerald-700 border-emerald-200'
               }`}>
                 {project.risk.label}
               </span>
            </div>
            <p className="text-sm text-slate-500">Responsável: <strong className="text-slate-700">{project.assignee}</strong></p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* KPIs do Projeto */}
        <div className="grid grid-cols-3 border-b border-slate-100 divide-x divide-slate-100">
           <div className="p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Estimado</span>
              <p className="text-lg font-bold text-slate-700">{formatHours(project.metrics.estimate)}</p>
           </div>
           <div className="p-4 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Realizado</span>
              <p className={`text-lg font-bold ${project.metrics.budgetProgress > 100 ? 'text-rose-600' : 'text-slate-700'}`}>
                {formatHours(project.metrics.logged)}
              </p>
           </div>
           <div className="p-4 text-center bg-slate-50/50">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Projeção Final</span>
              <p className={`text-lg font-bold ${project.metrics.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatHours(project.metrics.projected)}
              </p>
           </div>
        </div>

        {/* Lista de Tarefas Contribuintes */}
        <div className="flex-1 overflow-y-auto p-0">
           <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tarefas do Projeto
           </div>
           <div className="divide-y divide-slate-100">
              {project.rawTasks.map((task: any, idx: number) => {
                 const isOver = (task.timeLogged || 0) > (task.timeEstimate || 0);
                 return (
                   <div key={idx} className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div>
                         <p className="font-bold text-slate-700 text-sm mb-0.5">{task.name}</p>
                         <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{task.status || 'Pendente'}</span>
                            {task.priority && <span>Prioridade: {task.priority}</span>}
                         </div>
                      </div>
                      <div className="text-right">
                         <p className={`text-sm font-bold ${isOver ? 'text-rose-600' : 'text-slate-700'}`}>
                           {formatHours(task.timeLogged || 0)} <span className="text-slate-400 text-xs font-normal">/ {formatHours(task.timeEstimate || 0)}</span>
                         </p>
                         {isOver && <span className="text-[10px] text-rose-500 font-bold flex items-center justify-end gap-1"><TrendingUp size={10} /> Estourado</span>}
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
           <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-100 transition-colors">
             Fechar
           </button>
        </div>
      </div>
    </div>
  );
};

export const PredictiveDelaysView: React.FC = () => {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);

  // 1. ENGINE PREDITIVA
  const predictions = useMemo(() => {
    const today = new Date();
    const projects: any[] = [];

    if (!MOCK_LEGACY_DATA || MOCK_LEGACY_DATA.length === 0) return [];

    MOCK_LEGACY_DATA.forEach(group => {
      group.projects.forEach(proj => {
        let totalEst = 0;
        let totalLog = 0;
        let minDate = new Date(8640000000000000);
        let maxDate = new Date(-8640000000000000);
        let hasDates = false;

        // Agregar dados das tarefas
        proj.tasks.forEach(t => {
          totalEst += t.timeEstimate || 0;
          totalLog += t.timeLogged || 0;
          
          if (t.startDate) {
            const d = new Date(t.startDate);
            if (d < minDate) { minDate = d; hasDates = true; }
          }
          if (t.dueDate) {
            const d = new Date(t.dueDate);
            if (d > maxDate) { maxDate = d; hasDates = true; }
          }
        });

        // Ignorar projetos sem dados suficientes para predição
        if (!hasDates || totalEst === 0) return;

        // Cálculos Temporais
        const totalDuration = maxDate.getTime() - minDate.getTime();
        const elapsed = today.getTime() - minDate.getTime();
        
        // % do Tempo que já passou (0 a 1+)
        let timeProgress = totalDuration > 0 ? elapsed / totalDuration : 1;
        timeProgress = Math.max(0, timeProgress); 

        // % do Orçamento consumido
        const budgetConsumed = totalLog / totalEst;

        // Previsão de Horas Finais (Forecast Linear)
        // Se timeProgress for muito baixo (< 10%), a projeção é instável, então usamos o estimado
        const projectedTotalHours = timeProgress > 0.1 ? (totalLog / timeProgress) : totalEst;
        
        // Desvio Projetado (Variance)
        const projectedVariance = projectedTotalHours - totalEst;

        // Categoria de Risco e Cores
        let riskLevel = 'low'; // low, warning, critical, stalled
        let riskLabel = 'Saudável';
        let color = '#10b981'; // Green

        // Lógica de Semáforo Preditivo (SPI/CPI simplificado)
        if (budgetConsumed > (timeProgress + 0.15)) { 
           // Gastou 15% a mais do que o tempo percorrido
           riskLevel = 'critical';
           riskLabel = 'Burn Rate Crítico';
           color = '#ef4444'; // Red
        } else if (budgetConsumed > timeProgress) {
           riskLevel = 'warning';
           riskLabel = 'Atenção';
           color = '#f59e0b'; // Amber
        } else if (timeProgress > 0.5 && budgetConsumed < (timeProgress * 0.4)) {
           // Passou 50% do tempo e gastou menos de 40% do esperado -> Provavelmente parado
           riskLevel = 'stalled';
           riskLabel = 'Estagnado';
           color = '#3b82f6'; // Blue
        }

        projects.push({
          id: `${group.assignee}-${proj.name}`,
          assignee: group.assignee,
          name: proj.name,
          color,
          rawTasks: proj.tasks, // Passar tarefas originais para o modal
          metrics: {
            estimate: totalEst,
            logged: totalLog,
            projected: projectedTotalHours,
            variance: projectedVariance,
            timeProgress: Math.min(timeProgress * 100, 100), // Clamp para visualização 0-100
            budgetProgress: Math.min(budgetConsumed * 100, 100), // Clamp para visualização
            rawTimeProgress: timeProgress,
            rawBudgetProgress: budgetConsumed
          },
          dates: {
            start: minDate,
            due: maxDate
          },
          risk: {
            level: riskLevel,
            label: riskLabel
          }
        });
      });
    });

    // Ordenar pelos mais críticos (maior variância positiva)
    return projects.sort((a, b) => b.metrics.variance - a.metrics.variance);
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-200 text-xs z-50">
          <p className="font-bold text-slate-800 mb-1">{data.name}</p>
          <p className="text-slate-500 mb-2">{data.assignee}</p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span>Tempo Decorrido:</span>
              <span className="font-bold">{data.metrics.timeProgress.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Orçamento Gasto:</span>
              <span className={`font-bold ${data.metrics.budgetProgress > data.metrics.timeProgress ? 'text-rose-600' : 'text-emerald-600'}`}>
                {data.metrics.budgetProgress.toFixed(0)}%
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between gap-4">
               <span className="text-slate-400">Previsão Final:</span>
               <span className="font-bold">{formatHours(data.metrics.projected)}</span>
            </div>
            <div className="pt-2 mt-1 text-center text-indigo-600 font-bold text-[10px]">
               Clique para ver detalhes
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] p-6 space-y-6 overflow-y-auto custom-scrollbar">
      
      {selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
        />
      )}

      {/* 1. Header & Explicação */}
      <div className="flex flex-col md:flex-row gap-6">
         <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-start gap-4">
               <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <TrendingUp size={24} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Predição de Atrasos (EVM Simplificado)</h2>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                     Este painel cruza o <strong>Tempo Decorrido</strong> (eixo X) com o <strong>Orçamento Gasto</strong> (eixo Y).
                     Projetos acima da linha pontilhada estão "queimando" horas rápido demais e tendem a estourar.
                     <br/>
                     <span className="text-indigo-600 font-bold cursor-help" title="Clique nas bolinhas do gráfico ou na tabela para abrir detalhes">Dica: Clique em um projeto para ver as tarefas detalhadas.</span>
                  </p>
               </div>
            </div>
         </div>

         {/* Mini KPIs */}
         <div className="flex gap-4">
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl min-w-[140px] flex flex-col justify-center items-center">
               <span className="text-3xl font-black text-rose-600">{predictions.filter(p => p.risk.level === 'critical').length}</span>
               <span className="text-xs font-bold text-rose-700 uppercase mt-1">Críticos</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl min-w-[140px] flex flex-col justify-center items-center">
               <span className="text-3xl font-black text-blue-600">{predictions.filter(p => p.risk.level === 'stalled').length}</span>
               <span className="text-xs font-bold text-blue-700 uppercase mt-1">Estagnados</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* 2. Scatter Plot (Visualização de Risco) */}
         <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col min-h-[450px] relative">
            <div className="absolute top-4 right-4 z-10 flex gap-2 text-[10px] font-bold">
               <span className="flex items-center gap-1 px-2 py-1 bg-rose-100 text-rose-700 rounded"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Crítico</span>
               <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Atenção</span>
               <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Estagnado</span>
               <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Saudável</span>
            </div>

            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Target size={18} className="text-slate-400" /> Matriz de Velocidade (Burn Rate)
            </h3>
            
            <div className="flex-1 w-full relative min-h-[300px]">
               {/* Background Context Labels */}
               <div className="absolute top-10 left-10 text-xs font-bold text-rose-300 transform -rotate-12 pointer-events-none">
                  PERIGO: GASTO ACELERADO
               </div>
               <div className="absolute bottom-10 right-10 text-xs font-bold text-blue-300 transform -rotate-12 pointer-events-none">
                  ALERTA: BAIXA ATIVIDADE
               </div>

               {predictions.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis 
                         type="number" 
                         dataKey="metrics.timeProgress" 
                         name="Tempo Decorrido" 
                         unit="%" 
                         domain={[0, 100]}
                         label={{ value: 'Tempo Decorrido (%)', position: 'bottom', offset: 0, fontSize: 12, fill: '#94a3b8' }}
                         tick={{ fontSize: 11, fill: '#64748b' }}
                       />
                       <YAxis 
                         type="number" 
                         dataKey="metrics.budgetProgress" 
                         name="Orçamento Consumido" 
                         unit="%" 
                         domain={[0, 100]}
                         label={{ value: 'Orçamento Gasto (%)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#94a3b8' }}
                         tick={{ fontSize: 11, fill: '#64748b' }}
                       />
                       <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                       
                       {/* Linha de Equilíbrio Ideal (45 graus) */}
                       <ReferenceLine 
                          segment={[{ x: 0, y: 0 }, { x: 100, y: 100 }]} 
                          stroke="#cbd5e1" 
                          strokeDasharray="5 5" 
                          strokeWidth={2}
                       />

                       <Scatter name="Projetos" data={predictions} shape="circle">
                          {predictions.map((entry, index) => (
                             <Cell 
                               key={`cell-${index}`} 
                               fill={entry.color} 
                               stroke="white"
                               strokeWidth={2}
                               r={hoveredProject === entry.id ? 10 : 8} 
                               className="hover:opacity-80 transition-all cursor-pointer shadow-sm" 
                               onMouseEnter={() => setHoveredProject(entry.id)}
                               onMouseLeave={() => setHoveredProject(null)}
                               onClick={() => setSelectedProject(entry)}
                             />
                          ))}
                       </Scatter>
                    </ScatterChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                    Dados insuficientes para gerar o gráfico.
                 </div>
               )}
            </div>
         </div>

         {/* 3. Lista de Top Riscos */}
         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-0 overflow-hidden flex flex-col h-[450px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-slate-400" />
                  Maiores Desvios (Top 5)
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               {predictions.slice(0, 6).map((p) => {
                  const isNegative = p.metrics.variance > 0; // Variance > 0 means projected overbudget
                  
                  return (
                     <div 
                        key={p.id} 
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${hoveredProject === p.id ? 'bg-indigo-50' : ''}`}
                        onMouseEnter={() => setHoveredProject(p.id)}
                        onMouseLeave={() => setHoveredProject(null)}
                        onClick={() => setSelectedProject(p)}
                     >
                        <div className="flex justify-between items-start mb-1">
                           <h4 className="text-sm font-bold text-slate-700 line-clamp-1" title={p.name}>{p.name}</h4>
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${p.risk.level === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                              {p.risk.label}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{p.assignee}</p>
                        
                        <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                           <div className="flex flex-col">
                              <span className="text-slate-400 text-[9px] uppercase font-bold">Estimado</span>
                              <span className="font-bold text-slate-700">{formatHours(p.metrics.estimate)}</span>
                           </div>
                           <ArrowRight size={12} className="text-slate-300" />
                           <div className="flex flex-col text-right">
                              <span className="text-slate-400 text-[9px] uppercase font-bold">Projeção</span>
                              <span className={`font-bold ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                                 {formatHours(p.metrics.projected)}
                              </span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

      </div>

      {/* 4. Tabela Detalhada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-12">
         <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
               <Clock size={18} className="text-slate-400" /> Previsões Detalhadas por Projeto
            </h3>
            <div className="flex items-center gap-2">
               <Search size={14} className="text-slate-400" />
               <input type="text" placeholder="Filtrar..." className="bg-transparent text-xs outline-none text-slate-600 w-24" />
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
               <thead className="bg-white text-slate-500 border-b border-slate-100 font-bold text-xs uppercase tracking-wider">
                  <tr>
                     <th className="px-6 py-4">Projeto / Responsável</th>
                     <th className="px-4 py-4 text-center">Risco</th>
                     <th className="px-4 py-4 text-center">Progresso (Real vs Tempo)</th>
                     <th className="px-4 py-4 text-right">Planejado</th>
                     <th className="px-4 py-4 text-right">Projeção Final</th>
                     <th className="px-4 py-4 text-right">Desvio Est.</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {predictions.map((p) => {
                     return (
                        <tr 
                           key={p.id} 
                           className={`hover:bg-indigo-50/30 transition-colors group cursor-pointer ${hoveredProject === p.id ? 'bg-indigo-50' : ''}`}
                           onMouseEnter={() => setHoveredProject(p.id)}
                           onMouseLeave={() => setHoveredProject(null)}
                           onClick={() => setSelectedProject(p)}
                        >
                           <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{p.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{p.assignee}</div>
                              <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                 <Calendar size={10} />
                                 {formatDate(p.dates.start)} -> {formatDate(p.dates.due)}
                              </div>
                           </td>
                           <td className="px-4 py-4 text-center">
                              <div className={`w-3 h-3 rounded-full mx-auto ${p.color.replace('#', 'bg-[#').replace('ef4444', 'bg-rose-500').replace('f59e0b', 'bg-amber-500').replace('3b82f6', 'bg-blue-500').replace('10b981', 'bg-emerald-500')}`} title={p.risk.label}></div>
                           </td>
                           <td className="px-4 py-4 align-middle">
                              <div className="w-full max-w-[140px] mx-auto">
                                 <div className="flex justify-between text-[10px] mb-1 text-slate-500 font-medium">
                                    <span>Gasto: {p.metrics.budgetProgress.toFixed(0)}%</span>
                                    <span>Tempo: {p.metrics.timeProgress.toFixed(0)}%</span>
                                 </div>
                                 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                                    {/* Tempo (Marker) */}
                                    <div 
                                       className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10" 
                                       style={{ left: `${p.metrics.timeProgress}%` }}
                                       title="Tempo Decorrido"
                                    ></div>
                                    {/* Gasto (Bar) */}
                                    <div 
                                       className={`h-full rounded-full transition-all duration-500`} 
                                       style={{ width: `${p.metrics.budgetProgress}%`, backgroundColor: p.color }}
                                    ></div>
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-4 text-right font-medium text-slate-600">
                              {formatHours(p.metrics.estimate)}
                           </td>
                           <td className="px-4 py-4 text-right font-bold text-slate-800">
                              {formatHours(p.metrics.projected)}
                           </td>
                           <td className={`px-4 py-4 text-right font-bold ${p.metrics.variance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {p.metrics.variance > 0 ? '+' : ''}{formatHours(p.metrics.variance)}
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
