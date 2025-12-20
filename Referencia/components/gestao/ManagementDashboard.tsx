
import React, { useState, useMemo } from 'react';
import { MOCK_TEAM_DATA, MOCK_LEGACY_DATA } from '../../constants';
import { TeamWorkloadDashboard } from '../TeamWorkloadDashboard';
import { GeneralTeamDashboard } from '../GeneralTeamDashboard';
import { QualityDashboard } from '../QualityDashboard';
import { useApp } from '../../contexts/AppContext';
import { 
  Users, 
  HeartPulse,
  PieChart,
  Activity,
  ShieldCheck,
  X,
  CheckCircle2,
  BatteryWarning,
  Thermometer,
  Zap,
  Filter,
  AlertOctagon,
  PauseCircle,
  TrendingUp,
  ListFilter,
  Calendar
} from 'lucide-react';
import { Task } from '../../types';

type AppTabKey = 'general' | 'team_health';
type HealthSubTab = 'workload' | 'data_quality' | 'team_pulse';

const formatHours = (value: number) => {
  if (!value) return '0h';
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const DrillDownModal = ({ isOpen, onClose, title, tasks, colorClass }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center ${colorClass.replace('text-', 'bg-').replace('700', '50').replace('600', '50')}`}>
          <h3 className={`font-bold text-lg ${colorClass}`}>{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/50 rounded-full"><X size={20} className="text-slate-500" /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-white">
          {tasks.length === 0 ? <div className="p-12 text-center text-slate-400">Nenhuma tarefa encontrada.</div> : (
            <div className="divide-y divide-slate-100">
              {tasks.map((task: any) => (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors">
                   <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-700 text-sm">{task.name}</h4>
                      {task.dueDate && <span className="text-[10px] font-mono text-slate-400">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span>}
                   </div>
                   <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{task.projectName} • {task.assignee}</span>
                      {task.timeEstimate && <span>{formatHours(task.timeEstimate)}</span>}
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-slate-50 p-3 text-right border-t border-slate-100">
           <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const HealthCard = ({ title, count, subtitle, icon: Icon, items, colorConfig, onClick }: any) => (
  <div className={`bg-white rounded-2xl border ${colorConfig.border} shadow-sm overflow-hidden flex flex-col h-[260px] hover:shadow-lg transition-all cursor-pointer group`} onClick={onClick}>
    <div className={`p-4 ${colorConfig.bg} border-b ${colorConfig.border} flex justify-between items-start`}>
       <div className="flex items-start gap-3">
          <div className={`p-2 bg-white rounded-lg ${colorConfig.icon} shadow-sm`}><Icon size={18} /></div>
          <div><h3 className={`font-bold text-sm ${colorConfig.text}`}>{title}</h3><p className="text-[10px] text-slate-500">{subtitle}</p></div>
       </div>
       <span className={`text-xl font-bold ${colorConfig.text}`}>{count}</span>
    </div>
    <div className="flex-1 p-3 bg-white relative">
       {items.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs"><CheckCircle2 size={24} className="mb-2 opacity-50" />Tudo em ordem.</div> : (
         <div className="space-y-2">
           {items.slice(0, 3).map((task: any) => (
             <div key={task.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 truncate text-[11px] font-semibold text-slate-700">{task.name}</div>
           ))}
           {items.length > 3 && <div className="text-center pt-2 text-[10px] font-bold text-slate-400">+ {items.length - 3} outros...</div>}
         </div>
       )}
    </div>
  </div>
);

export const ManagementDashboard: React.FC = () => {
  const { filters, clearFilters: clearGlobalFilters } = useApp();
  const [activeTab, setActiveTab] = useState<AppTabKey>('general');
  const [healthSubTab, setHealthSubTab] = useState<HealthSubTab>('workload');
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', tasks: [], colorClass: '' });

  const activeTeamData = useMemo(() => filters.members.length === 0 ? MOCK_TEAM_DATA : MOCK_TEAM_DATA.filter(m => filters.members.includes(m.name)), [filters.members]);
  const activeGroupedData = useMemo(() => {
    let d = MOCK_LEGACY_DATA;
    if (filters.members.length > 0) d = d.filter(g => filters.members.includes(g.assignee));
    if (filters.projects.length > 0) d = d.map(g => ({ ...g, projects: g.projects.filter(p => filters.projects.includes(p.name)) })).filter(g => g.projects.length > 0);
    return d;
  }, [filters.members, filters.projects]);

  const healthMetrics = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    const cat = { overdue: [] as Task[], overBudget: [] as Task[], pending: [] as Task[], upcoming: [] as Task[], validation: [] as Task[], completed: [] as Task[] };
    activeGroupedData.forEach(g => g.projects.forEach(p => p.tasks.forEach(t => {
      const s = t.status?.toLowerCase() || '';
      const isC = s.includes('conclu') || t.status === 'completed' || s.includes('done');
      if (isC) { cat.completed.push(t); return; }
      const d = t.dueDate ? new Date(t.dueDate) : null; if (d) d.setHours(0,0,0,0);
      if (d && d < today) cat.overdue.push(t);
      else if ((t.timeLogged || 0) > (t.timeEstimate || 0) && (t.timeEstimate || 0) > 0) cat.overBudget.push(t);
      else if (s.includes('pendente') || s.includes('wait') || s.includes('bloq')) cat.pending.push(t);
      else if (s.includes('valid') || s.includes('review') || s.includes('homolog')) cat.validation.push(t);
      else if (d) { 
         const sevenDays = new Date(today); sevenDays.setDate(today.getDate() + 7);
         if (d <= sevenDays) cat.upcoming.push(t);
      }
    })));
    return cat;
  }, [activeGroupedData]);

  const tabs = [{ key: 'general', label: 'Visão Geral', icon: PieChart }, { key: 'team_health', label: 'Equipe & Saúde', icon: HeartPulse }];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      <DrillDownModal isOpen={drillDownModal.isOpen} onClose={() => setDrillDownModal(prev => ({ ...prev, isOpen: false }))} title={drillDownModal.title} tasks={drillDownModal.tasks} colorClass={drillDownModal.colorClass} />

      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Painel de Gestão</h1>
              <p className="text-xs text-slate-500 font-medium">Controle de carga e performance da equipe.</p>
            </div>
            <div className="flex items-center gap-3">
               {filters.members.length > 0 && <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100 transition-colors"><Filter size={14} /> Filtro Ativo <button onClick={clearGlobalFilters} className="ml-1 hover:text-indigo-900"><X size={12} /></button></div>}
            </div>
          </div>
        </div>
        <div className="px-6"><nav className="flex space-x-1">{tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.key; return (<button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Icon size={16} /> {tab.label}</button>); })}</nav></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 w-full custom-scrollbar bg-slate-50">
        {activeTab === 'general' && <GeneralTeamDashboard data={activeGroupedData} chartType="bar" />}
        {activeTab === 'team_health' && (
          <div className="space-y-6 animate-fadeIn">
             <div className="flex items-center justify-center mb-4"><div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner"><button onClick={() => setHealthSubTab('workload')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${healthSubTab === 'workload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Activity size={16} /> Carga & Capacidade</button><button onClick={() => setHealthSubTab('team_pulse')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${healthSubTab === 'team_pulse' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Thermometer size={16} /> Saúde da Equipe</button><button onClick={() => setHealthSubTab('data_quality')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${healthSubTab === 'data_quality' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ShieldCheck size={16} /> Qualidade Dados</button></div></div>
             {healthSubTab === 'workload' && (
                <div className="space-y-8 animate-fadeIn">
                   <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                      <HealthCard title="Atrasados" subtitle="Prazo vencido" count={healthMetrics.overdue.length} icon={AlertOctagon} items={healthMetrics.overdue} colorConfig={{ bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: 'text-rose-500' }} onClick={() => setDrillDownModal({ isOpen: true, title: 'Atrasados', tasks: healthMetrics.overdue, colorClass: 'text-rose-700' })} />
                      <HealthCard title="Excedido" subtitle="Burn rate alto" count={healthMetrics.overBudget.length} icon={TrendingUp} items={healthMetrics.overBudget} colorConfig={{ bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-100', icon: 'text-pink-500' }} onClick={() => setDrillDownModal({ isOpen: true, title: 'Horas Excedidas', tasks: healthMetrics.overBudget, colorClass: 'text-pink-700' })} />
                      <HealthCard title="Próximos" subtitle="Prox 7 dias" count={healthMetrics.upcoming.length} icon={Calendar} items={healthMetrics.upcoming} colorConfig={{ bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'text-blue-500' }} onClick={() => setDrillDownModal({ isOpen: true, title: 'Em breve', tasks: healthMetrics.upcoming, colorClass: 'text-blue-700' })} />
                      <HealthCard title="Pendências" subtitle="Bloqueados" count={healthMetrics.pending.length} icon={PauseCircle} items={healthMetrics.pending} colorConfig={{ bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', icon: 'text-orange-600' }} onClick={() => setDrillDownModal({ isOpen: true, title: 'Pendentes', tasks: healthMetrics.pending, colorClass: 'text-orange-700' })} />
                      <HealthCard title="Validação" subtitle="Em review" count={healthMetrics.validation.length} icon={ListFilter} items={healthMetrics.validation} colorConfig={{ bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: 'text-indigo-500' }} onClick={() => setDrillDownModal({ isOpen: true, title: 'Validação', tasks: healthMetrics.validation, colorClass: 'text-indigo-700' })} />
                      <HealthCard title="Concluídos" subtitle="Total mês" count={healthMetrics.completed.length} icon={CheckCircle2} items={healthMetrics.completed} colorConfig={{ bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'text-emerald-500' }} onClick={() => setDrillDownModal({ isOpen: true, title: 'Concluídos', tasks: healthMetrics.completed, colorClass: 'text-emerald-700' })} />
                   </div>
                   <TeamWorkloadDashboard data={activeGroupedData} />
                </div>
             )}
             {healthSubTab === 'team_pulse' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {activeTeamData.map(m => {
                      const utilization = m.weeklyCapacity > 0 ? (m.totalHours / m.weeklyCapacity) * 100 : 0;
                      const cfg = utilization > 110 ? { label: 'Burnout', color: 'text-rose-600', bar: 'bg-rose-500' } : (utilization > 90 ? { label: 'Atenção', color: 'text-amber-600', bar: 'bg-amber-500' } : (utilization < 60 ? { label: 'Baixa', color: 'text-blue-600', bar: 'bg-blue-500' } : { label: 'Ideal', color: 'text-emerald-600', bar: 'bg-emerald-500' }));
                      return (
                        <div key={m.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                           <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">{m.name.substring(0,2).toUpperCase()}</div><div><h3 className="font-bold text-slate-800 text-sm">{m.name}</h3><span className={`text-[10px] font-black uppercase ${cfg.color}`}>{cfg.label}</span></div></div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Carga</span><span>{utilization.toFixed(0)}%</span></div>
                              <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${cfg.bar}`} style={{ width: `${Math.min(utilization, 100)}%` }}></div></div>
                           </div>
                        </div>
                      );
                   })}
                </div>
             )}
             {healthSubTab === 'data_quality' && <QualityDashboard data={activeGroupedData} />}
          </div>
        )}
      </div>
    </div>
  );
};
