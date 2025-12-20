
import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Users, 
  AlertTriangle, 
  Briefcase,
  Battery,
  BatteryMedium,
  BatteryWarning,
  BatteryLow,
  ChevronRight,
  X,
  Target,
  Activity,
  Zap,
  Clock,
  ExternalLink,
  ShieldAlert,
  // Added missing Layers import
  Layers
} from 'lucide-react';
import { MOCK_TEAM_DATA, PRIORITY_CONFIG, MOCK_LEGACY_DATA } from '../constants';
import { PriorityType } from '../types';

const formatHours = (val: number) => `${Math.round(val)}h`;

export const AllocationDashboard: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const processedData = useMemo(() => {
    return MOCK_TEAM_DATA.map(member => {
      const utilization = member.weeklyCapacity > 0 ? (member.totalHours / member.weeklyCapacity) * 100 : 0;
      const legacyInfo = MOCK_LEGACY_DATA.find(l => l.assignee === member.name);
      const projects = legacyInfo?.projects || [];
      
      return {
        ...member,
        utilization,
        projects,
        projectCount: projects.length,
        healthStatus: utilization > 110 ? 'burnout' : utilization > 90 ? 'critical' : utilization > 60 ? 'optimal' : 'available'
      };
    }).sort((a, b) => b.utilization - a.utilization);
  }, []);

  const summary = useMemo(() => {
    const totalCapacity = MOCK_TEAM_DATA.reduce((acc, curr) => acc + curr.weeklyCapacity, 0);
    const totalDemand = MOCK_TEAM_DATA.reduce((acc, curr) => acc + curr.totalHours, 0);
    return {
      totalCapacity,
      totalDemand,
      avgUtilization: (totalDemand / totalCapacity) * 100,
      overloaded: processedData.filter(m => m.utilization > 100).length,
      ideal: processedData.filter(m => m.utilization >= 70 && m.utilization <= 100).length
    };
  }, [processedData]);

  const memberAllocationDetail = useMemo(() => {
    if (!selectedMember) return null;
    const member = processedData.find(m => m.name === selectedMember);
    if (!member) return null;

    return [
      { name: 'Urgente', value: member.urgent, color: PRIORITY_CONFIG[PriorityType.URGENT].color, type: PriorityType.URGENT },
      { name: 'Alta', value: member.high, color: PRIORITY_CONFIG[PriorityType.HIGH].color, type: PriorityType.HIGH },
      { name: 'Normal', value: member.normal, color: PRIORITY_CONFIG[PriorityType.NORMAL].color, type: PriorityType.NORMAL },
      { name: 'Baixa', value: member.low, color: PRIORITY_CONFIG[PriorityType.LOW].color, type: PriorityType.LOW },
      { name: 'S/ Prioridade', value: member.none, color: PRIORITY_CONFIG[PriorityType.NONE].color, type: PriorityType.NONE },
    ].filter(v => v.value > 0);
  }, [selectedMember, processedData]);

  const getHealthConfig = (utilization: number) => {
    if (utilization > 110) return { icon: BatteryWarning, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', label: 'Sobrecarga', bar: 'bg-rose-500' };
    if (utilization > 90) return { icon: BatteryLow, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Limite', bar: 'bg-amber-500' };
    if (utilization > 60) return { icon: BatteryMedium, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Ideal', bar: 'bg-emerald-500' };
    return { icon: Battery, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Disponível', bar: 'bg-blue-500' };
  };

  const selectedMemberData = selectedMember ? processedData.find(m => m.name === selectedMember) : null;
  const totalMemberHours = memberAllocationDetail ? memberAllocationDetail.reduce((a, b) => a + b.value, 0) : 0;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fadeIn">
      
      {/* 1. Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 pb-0">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Carga Global</p>
           <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-slate-800">{summary.avgUtilization.toFixed(0)}%</h3>
              <Activity size={20} className="text-blue-500 mb-1" />
           </div>
           <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(summary.avgUtilization, 100)}%` }}></div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Horas Alocadas</p>
           <h3 className="text-3xl font-black text-slate-800">{formatHours(summary.totalDemand)}</h3>
           <p className="text-[10px] text-slate-400 font-medium mt-1">Capacidade total: {formatHours(summary.totalCapacity)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pessoas Excedidas</p>
           <div className="flex items-center gap-3">
              <h3 className="text-3xl font-black text-rose-600">{summary.overloaded}</h3>
              <AlertTriangle size={24} className="text-rose-500" />
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Foco Ideal</p>
           <div className="flex items-center gap-3">
              <h3 className="text-3xl font-black text-emerald-600">{summary.ideal}</h3>
              <Zap size={24} className="text-emerald-500" />
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-hidden">
        
        {/* 2. Team Grid List */}
        <div className="lg:col-span-7 overflow-y-auto custom-scrollbar space-y-3 pr-2">
           <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-700 flex items-center gap-2 uppercase text-xs tracking-widest">
                <Users size={16} className="text-blue-600" />
                Matriz de Alocação por Membro
              </h3>
           </div>

           {processedData.map(member => {
             const health = getHealthConfig(member.utilization);
             const isSelected = selectedMember === member.name;
             
             return (
               <button 
                 key={member.name}
                 onClick={() => setSelectedMember(isSelected ? null : member.name)}
                 className={`
                   w-full bg-white p-4 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group
                   ${isSelected ? 'ring-2 ring-blue-600 border-transparent shadow-xl' : 'border-slate-200 hover:border-blue-300 shadow-sm'}
                 `}
               >
                 <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-[180px]">
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-inner transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                         {member.name.substring(0, 2).toUpperCase()}
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800 text-base">{member.name}</h4>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                              <Briefcase size={10} /> {member.projectCount} Projetos
                            </span>
                         </div>
                       </div>
                    </div>

                    <div className="flex-1 flex flex-col gap-1">
                       <div className="flex justify-between items-end">
                          <span className={`text-[10px] font-black uppercase tracking-tight ${health.color}`}>{health.label}</span>
                          <span className="text-xs font-bold text-slate-700">{member.utilization.toFixed(0)}%</span>
                       </div>
                       <div className="h-2.5 w-full bg-slate-100 rounded-lg overflow-hidden p-0">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${health.bar}`} 
                            style={{ width: `${Math.min(member.utilization, 100)}%` }}
                          ></div>
                       </div>
                    </div>

                    <div className="flex items-center gap-4 min-w-[100px] justify-end">
                       <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                          <p className="text-sm font-bold text-slate-700">{formatHours(member.totalHours)}</p>
                       </div>
                       <ChevronRight size={18} className={`transition-transform duration-300 ${isSelected ? 'rotate-90 text-blue-600' : 'text-slate-300'}`} />
                    </div>
                 </div>
               </button>
             );
           })}
        </div>

        {/* 3. Detail Sidebar - INFRAESTRUTURA DE INFORMAÇÃO MELHORADA */}
        <div className="lg:col-span-5 h-full overflow-hidden">
           <div className={`
             h-full bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col transition-all overflow-hidden
             ${selectedMember ? 'border-blue-200 ring-4 ring-blue-50' : 'bg-slate-50 border-dashed'}
           `}>
             {selectedMember && memberAllocationDetail && selectedMemberData ? (
               <div className="animate-fadeIn flex flex-col h-full">
                  {/* Sidebar Header */}
                  <div className="px-6 py-6 border-b border-slate-100 flex justify-between items-start bg-white sticky top-0 z-10">
                     <div>
                        <h3 className="text-xl font-bold text-slate-800">{selectedMember}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Análise de Procedência de Horas</p>
                     </div>
                     <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                     
                     {/* Seção 1: Composição por Prioridade (O Donut com dados) */}
                     <div className="flex flex-col items-center">
                        <div className="h-[220px] w-full relative">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                 <Pie 
                                   data={memberAllocationDetail} 
                                   innerRadius={65} 
                                   outerRadius={85} 
                                   paddingAngle={4} 
                                   cx="50%"
                                   cy="50%"
                                   dataKey="value" 
                                   stroke="none"
                                   animationDuration={800}
                                 >
                                    {memberAllocationDetail.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                 </Pie>
                                 <Tooltip formatter={(val: number) => formatHours(val)} />
                                 
                                 {/* Texto Central SVG */}
                                 <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="pointer-events-none">
                                   <tspan x="50%" dy="-5" className="text-3xl font-black fill-slate-800" style={{ fontSize: '32px' }}>{formatHours(totalMemberHours)}</tspan>
                                   <tspan x="50%" dy="25" className="text-[10px] font-black fill-slate-400 uppercase tracking-widest">CARGA TOTAL</tspan>
                                 </text>
                              </PieChart>
                           </ResponsiveContainer>
                        </div>

                        {/* Legenda de Prioridades para dar contexto ao Donut */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full mt-2">
                           {memberAllocationDetail.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                                 <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></div>
                                 <div className="min-w-0">
                                    <p className="text-[9px] font-black text-slate-400 uppercase truncate leading-none mb-1">{item.name}</p>
                                    <p className="text-xs font-bold text-slate-700 leading-none">{formatHours(item.value)}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* Seção 2: Onde as horas estão? (Projetos) */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                           <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <Layers size={14} className="text-blue-500" />
                             Detalhamento por Projeto
                           </h4>
                           <span className="text-[10px] font-bold text-slate-400">{selectedMemberData.projects.length} projetos</span>
                        </div>
                        
                        <div className="space-y-2">
                           {selectedMemberData.projects.map((proj, idx) => {
                              const projHours = proj.tasks.reduce((acc, t) => acc + (t.timeEstimate || 0), 0);
                              const projPercentage = totalMemberHours > 0 ? (projHours / totalMemberHours) * 100 : 0;
                              
                              return (
                                 <div key={idx} className="group p-3 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-sm transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                       <div className="min-w-0 flex-1">
                                          <p className="text-sm font-bold text-slate-800 truncate leading-tight">{proj.name}</p>
                                          <p className="text-[10px] text-slate-400 font-medium">{proj.tasks.length} tarefas atribuídas</p>
                                       </div>
                                       <div className="text-right ml-4">
                                          <p className="text-xs font-black text-slate-700">{formatHours(projHours)}</p>
                                          <p className="text-[9px] text-slate-400 font-bold uppercase">{projPercentage.toFixed(0)}% da carga</p>
                                       </div>
                                    </div>
                                    <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                                       <div className="h-full bg-blue-400 rounded-full transition-all duration-1000" style={{ width: `${projPercentage}%` }}></div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Seção 3: Riscos de Alocação */}
                     <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <ShieldAlert size={14} className="text-rose-500" />
                          Alertas de Performance
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                              <div className="flex items-center gap-2 mb-2 text-rose-600">
                                 <AlertTriangle size={14} />
                                 <span className="text-[10px] font-black uppercase">Crítico</span>
                              </div>
                              <p className="text-xl font-black text-rose-700">{formatHours(selectedMemberData.urgent)}</p>
                              <p className="text-[10px] text-rose-600/70 font-medium">Em tarefas Urgentes</p>
                           </div>
                           
                           <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                              <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                 <Clock size={14} />
                                 <span className="text-[10px] font-black uppercase">Consumo</span>
                              </div>
                              <p className="text-xl font-black text-indigo-700">100%</p>
                              <p className="text-[10px] text-indigo-600/70 font-medium">Aderência ao Plano</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 sticky bottom-0">
                     <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <ExternalLink size={14} />
                        Gerir Backlog
                     </button>
                  </div>
               </div>
             ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fadeIn py-20">
                  <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-sm flex items-center justify-center mb-6 text-slate-200 border border-slate-100 rotate-12">
                     <Target size={48} strokeWidth={1} />
                  </div>
                  <h4 className="font-bold text-slate-700 text-base">Análise de Colaborador</h4>
                  <p className="text-[11px] text-slate-400 mt-2 max-w-[240px] leading-relaxed font-medium">
                    Selecione um membro na matriz lateral para decompor as <strong>{summary.totalDemand.toFixed(0)}h totais</strong> e entender onde o time está concentrando esforços.
                  </p>
               </div>
             )}
           </div>
        </div>
      </div>

    </div>
  );
};
