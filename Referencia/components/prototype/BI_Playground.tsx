
import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Trash2, 
  BrainCircuit, 
  User, 
  Lightbulb,
  BarChart3,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Gauge,
  AlertCircle,
  Timer,
  Ban,
  ClipboardCheck,
  Hourglass,
  AlertOctagon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../../constants';

// --- COMPONENTE EDUCATIVO ---
const MetricExplainer = ({ title, description, businessImpact, metricType }: { title: string, description: string, businessImpact: string, metricType: 'strategy' | 'efficiency' | 'health' }) => {
  const styles = {
    strategy: { bg: 'bg-indigo-50', border: 'border-indigo-200', icon: 'text-indigo-600', title: 'text-indigo-900' },
    efficiency: { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-600', title: 'text-slate-900' },
    health: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', title: 'text-blue-900' },
  };
  const s = styles[metricType];

  return (
    <div className={`h-full p-6 rounded-2xl border-2 ${s.border} ${s.bg} flex flex-col shadow-sm`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-white shadow-sm ${s.icon}`}>
          <Lightbulb size={24} />
        </div>
        <h4 className={`font-black text-base uppercase tracking-tight ${s.title}`}>{title}</h4>
      </div>
      <p className="text-base text-slate-800 mb-6 leading-relaxed font-semibold">
        {description}
      </p>
      <div className="mt-auto pt-5 border-t border-black/10">
        <span className="text-xs font-black uppercase text-slate-500 mb-2 block tracking-widest">Impacto na Operação</span>
        <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
          "{businessImpact}"
        </p>
      </div>
    </div>
  );
};

const KpiCard = ({ label, value, subtext, type }: { label: string, value: string, subtext: string, type: 'good' | 'bad' | 'neutral' | 'warning' }) => {
  const colors = {
    good: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    bad: 'text-rose-700 bg-rose-50 border-rose-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    neutral: 'text-slate-800 bg-white border-slate-200'
  };
  return (
    <div className={`p-6 rounded-2xl border-2 shadow-sm transition-all hover:shadow-md ${colors[type]}`}>
      <p className="text-xs font-black uppercase tracking-widest mb-2 text-slate-500">{label}</p>
      <div className="flex items-baseline gap-2">
        <div className="text-4xl font-black tracking-tighter">{value}</div>
        <ArrowUpRight size={20} className="opacity-40" />
      </div>
      <p className="text-sm font-bold mt-2 text-slate-600 leading-tight">{subtext}</p>
    </div>
  );
};

export const BI_Playground: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'waste' | 'fragmentation'>('strategy');
  const [selectedMember, setSelectedMember] = useState<string | 'all'>('all');

  const biData = useMemo(() => {
    const rawData = MOCK_LEGACY_DATA;
    const today = new Date();
    
    // Análise de Gargalos Complexa
    const bottleneckAnalysis: any[] = [];
    let globalStagnatedMembers = 0;
    let criticalOverdueCount = 0;

    MOCK_TEAM_DATA.forEach(member => {
      const group = rawData.find(g => g.assignee === member.name);
      let blockedTasks = 0;
      let pendingTasks = 0;
      let validationTasks = 0;
      let overdueCritical = 0;
      
      const projectsSet = new Set<string>();
      const stuckProjectsSet = new Set<string>();

      if (group) {
        group.projects.forEach(proj => {
          projectsSet.add(proj.name);
          let projIsProductive = false;
          let projHasTasks = false;

          proj.tasks.forEach(task => {
            projHasTasks = true;
            const status = (task.status || '').toLowerCase();
            const isDone = status.includes('conclu') || status.includes('done');
            
            // Checar Vencimento Crítico (> 7 dias)
            if (task.dueDate && !isDone) {
              const d = new Date(task.dueDate);
              const diffDays = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);
              if (diffDays > 7) overdueCritical++;
            }

            if (!isDone) {
              if (status.includes('bloq') || status.includes('stop')) {
                blockedTasks++;
              } else if (status.includes('pend') || status.includes('wait') || status.includes('aguard')) {
                pendingTasks++;
              } else if (status.includes('valid') || status.includes('review') || status.includes('homolog')) {
                validationTasks++;
              } else {
                // Se houver PELO MENOS UMA tarefa em andamento real, o projeto é produtivo
                projIsProductive = true;
              }
            }
          });

          // Se o projeto tem tarefas mas nenhuma é produtiva, ele está travado
          if (!projIsProductive && projHasTasks) {
            stuckProjectsSet.add(proj.name);
          }
        });
      }

      const totalProjects = projectsSet.size;
      const stuckProjects = stuckProjectsSet.size;
      // Cálculo de Risco de Ociosidade: % de projetos travados
      const idleRiskPct = totalProjects > 0 ? (stuckProjects / totalProjects) * 100 : 0;
      
      if (idleRiskPct >= 100 && totalProjects > 0) globalStagnatedMembers++;
      criticalOverdueCount += overdueCritical;

      bottleneckAnalysis.push({
        name: member.name,
        'Bloqueado': blockedTasks,
        'Pendente': pendingTasks,
        'Validação': validationTasks,
        totalStuck: blockedTasks + pendingTasks + validationTasks,
        totalProjects,
        stuckProjects,
        idleRiskPct,
        overdueCritical
      });
    });

    // Dados para Visão Estratégica (Filtro por membro)
    let filteredData = rawData;
    if (selectedMember !== 'all') {
      filteredData = rawData.filter(g => g.assignee === selectedMember);
    }

    let totalHours = 0;
    let p0p1Hours = 0;
    let p3p4Hours = 0;

    filteredData.forEach(group => {
      group.projects.forEach(proj => {
        proj.tasks.forEach(task => {
          const hours = task.timeEstimate || task.timeLogged || 1;
          totalHours += hours;
          const p = (task.priority || '').toString().toLowerCase();
          if (p === '0' || p === '1' || p.includes('urgent') || p.includes('high')) p0p1Hours += hours;
          else p3p4Hours += hours;
        });
      });
    });

    return {
      totalHours,
      strategicPct: totalHours > 0 ? (p0p1Hours / totalHours) * 100 : 0,
      operationalPct: totalHours > 0 ? (p3p4Hours / totalHours) * 100 : 0,
      bottleneckAnalysis: bottleneckAnalysis.sort((a, b) => b.idleRiskPct - a.idleRiskPct),
      globalStagnatedMembers,
      criticalOverdueCount,
      focusChartData: [
        { name: 'P0 e P1 (Estratégico)', value: p0p1Hours, color: '#4f46e5' },
        { name: 'P3 e P4 (Rotina/Suporte)', value: p3p4Hours, color: '#94a3b8' },
      ]
    };
  }, [selectedMember]);

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] font-sans overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inteligência de Alocação</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Análise de Fluxo e Risco de Ociosidade</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
           <button onClick={() => setActiveTab('strategy')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'strategy' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}><Target size={18} /> ESTRATÉGIA</button>
           <button onClick={() => setActiveTab('waste')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'waste' ? 'bg-white text-rose-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}><ShieldAlert size={18} /> GARGALOS</button>
           <button onClick={() => setActiveTab('fragmentation')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'fragmentation' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-800'}`}><Layers size={18} /> WIP / FOCO</button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
          
          {/* VIEW: ESTRATÉGIA */}
          {activeTab === 'strategy' && (
            <div className="animate-fadeIn space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KpiCard label="Foco em tarefas P0 e P1" value={`${biData.strategicPct.toFixed(0)}%`} subtext="Impacto direto no roadmap de produtos" type={biData.strategicPct > 80 ? 'good' : 'warning'} />
                  <KpiCard label="Foco em tarefas P3 P4" value={`${biData.operationalPct.toFixed(0)}%`} subtext="Suporte, Débito Técnico e Manutenção" type="neutral" />
                  <KpiCard label="Saúde da Distribuição" value={biData.strategicPct > 90 ? 'ALTA' : 'MODERADA'} subtext="Balanceamento entre inovação e rotina" type="good" />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-8 bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col min-h-[450px]">
                     <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-indigo-600" /> CATEGORIZAÇÃO DE ESFORÇO</h3>
                        <div className="relative group">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)} className="pl-9 pr-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer">
                            <option value="all">TODA A EQUIPE</option>
                            {MOCK_TEAM_DATA.map(m => <option key={m.name} value={m.name}>{m.name.toUpperCase()}</option>)}
                          </select>
                        </div>
                     </div>
                     <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={biData.focusChartData} cx="50%" cy="50%" innerRadius={100} outerRadius={140} paddingAngle={8} dataKey="value">
                                 {biData.focusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                              </Pie>
                              <Tooltip contentStyle={{ borderRadius: '16px', fontWeight: 'bold' }} formatter={(val: number) => `${val.toFixed(0)}h`} />
                              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontWeight: 'bold', fontSize: '14px' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="lg:col-span-4">
                     <MetricExplainer metricType="strategy" title="Inovação vs. Manutenção" description="Uma equipe saudável deve manter o foco em P0/P1 mas nunca zerar o esforço em P3/P4. A falta de manutenção gera débito técnico que trava os projetos P0 no futuro." businessImpact="Equipes que ignoram P3/P4 por mais de 2 meses sofrem um aumento de 40% em bugs críticos." />
                  </div>
               </div>
            </div>
          )}

          {/* VIEW: GARGALOS (LÓGICA COMPLEXA) */}
          {activeTab === 'waste' && (
            <div className="animate-fadeIn space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KpiCard label="Ociosidade por Impedimento" value={`${biData.globalStagnatedMembers}`} subtext="Membros com 100% dos projetos parados" type={biData.globalStagnatedMembers > 0 ? 'bad' : 'good'} />
                  <KpiCard label="Atrasos Críticos (> 7 dias)" value={biData.criticalOverdueCount.toString()} subtext="Tarefas vencidas que estão gerando gargalo" type={biData.criticalOverdueCount > 3 ? 'bad' : 'warning'} />
                  <KpiCard label="Eficiência de Fluxo" value="68%" subtext="Tempo médio fora de 'Validação/Pendente'" type="neutral" />
               </div>
               
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-8 bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><AlertOctagon className="text-rose-600" /> RISK SCORE DE ESTAGNAÇÃO</h3>
                        <div className="flex gap-4 text-[10px] font-black uppercase">
                           <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div> Bloqueio</span>
                           <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div> Pendente</span>
                           <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div> Validação</span>
                        </div>
                     </div>
                     <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                           <ComposedChart layout="vertical" data={biData.bottleneckAnalysis} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.2} />
                              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fontWeight: 'black', fill: '#1e293b' }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '16px', border: 'none', shadow: 'lg', fontWeight: 'bold' }} />
                              
                              <Bar name="Bloqueado" dataKey="Bloqueado" stackId="a" fill="#ef4444" barSize={32} />
                              <Bar name="Pendente" dataKey="Pendente" stackId="a" fill="#f59e0b" />
                              <Bar name="Validação" dataKey="Validação" stackId="a" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                              
                              {/* Linha indicadora de Risco de Ociosidade */}
                              <Line name="% Risco Ociosidade" dataKey="idleRiskPct" stroke="#000" strokeWidth={2} dot={{ r: 4, fill: '#000' }} />
                           </ComposedChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="lg:col-span-4">
                     <MetricExplainer metricType="efficiency" title="A Armadilha da Validação" description="Quando um colaborador tem poucos projetos (ex: 2) e todos entram em 'Validação', ele fica estagnado. O custo da ociosidade forçada é maior que o custo do erro." businessImpact="Cada membro estagnado custa à empresa sua taxa horária integral sem gerar valor. Ociosidade acima de 20% da equipe indica falha na coordenação de prioridades." />
                  </div>
               </div>

               {/* ALERTAS CRÍTICOS DE GARGALO */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {biData.bottleneckAnalysis.filter(m => m.idleRiskPct >= 100).map(m => (
                    <div key={m.name} className="bg-rose-50 border-2 border-rose-200 p-6 rounded-3xl flex items-center gap-6 animate-pulse">
                        <div className="p-4 bg-rose-600 text-white rounded-2xl">
                          <Hourglass size={32} />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-rose-900 uppercase">Colaborador Estagnado</h4>
                          <p className="text-sm text-rose-800 font-bold">
                            {m.name} está com todos os {m.totalProjects} projetos parados por terceiros. Risco máximo de ociosidade forçada hoje.
                          </p>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* VIEW: FRAGMENTAÇÃO (WIP) */}
          {activeTab === 'fragmentation' && (
            <div className="animate-fadeIn space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <KpiCard label="Overload de Projetos" value={biData.bottleneckAnalysis.filter(m => m.totalProjects > 4).length.toString()} subtext="Pessoas com mais de 4 frentes simultâneas" type="bad" />
                  <KpiCard label="WIP Ideal" value="2 a 3" subtext="Meta de frentes por desenvolvedor" type="good" />
                  <KpiCard label="Média de WIP" value={(biData.bottleneckAnalysis.reduce((a,b)=>a+b.totalProjects,0)/biData.bottleneckAnalysis.length).toFixed(1)} subtext="Projetos ativos por pessoa" type="neutral" />
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                  <div className="lg:col-span-8 bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col min-h-[500px]">
                     <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2"><Layers className="text-blue-600" /> WIP (WORK IN PROGRESS) POR PESSOA</h3>
                     <p className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-wide">Frentes de Trabalho simultâneas</p>
                     <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={biData.bottleneckAnalysis} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                              <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 'black', fill: '#1e293b' }} axisLine={false} dy={10} />
                              <YAxis axisLine={false} allowDecimals={false} domain={[0, 6]} />
                              <Tooltip cursor={{ fill: '#f1f5f9' }} />
                              <Bar dataKey="totalProjects" name="Frentes Ativas" radius={[8, 8, 0, 0]} barSize={50}>
                                 {biData.bottleneckAnalysis.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={entry.totalProjects > 4 ? '#e11d48' : entry.totalProjects <= 1 ? '#f59e0b' : '#10b981'} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
                  <div className="lg:col-span-4">
                     <MetricExplainer metricType="health" title="A Lei da Fragmentação" description="Quanto mais projetos uma pessoa atende, mais tempo ela gasta com 'Context Switching' (troca de mentalidade) e menos com produção real." businessImpact="Equipes com WIP > 4 entregam 30% menos valor do que equipes com WIP = 2, devido ao cansaço cognitivo." />
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
