
import React, { useState, useMemo, useEffect } from 'react';
import { MOCK_TEAM_DATA, PRIORITY_CONFIG, MOCK_LEGACY_DATA } from '../constants';
import { PriorityType, TeamMemberData, GroupedData } from '../types';
import { MetricCard } from '../components/MetricCard';
import { WorkloadCharts } from '../components/WorkloadCharts';
import { TeamTable } from '../components/TeamTable';
import { CapacityChart } from '../components/CapacityChart';
import { TeamWorkloadDashboard } from '../components/TeamWorkloadDashboard';
import { AllocationDashboard } from '../components/AllocationDashboard'; 
import { fetchClickUpTasks, transformClickUpData, getClickUpConfig } from '../services/clickup';
import { 
  Users, 
  FilterX,
  LayoutList,
  AlertTriangle,
  PieChart,
  BarChart2,
  RefreshCw,
  Database,
} from 'lucide-react';

type AppTabKey = 'general' | 'tactical' | 'allocation';

const formatHours = (value: number) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const ManagementModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTabKey>('general');
  const [filterPriority, setFilterPriority] = useState<PriorityType | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [useRealData, setUseRealData] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [realTeamData, setRealTeamData] = useState<TeamMemberData[]>([]);
  const [realGroupedData, setRealGroupedData] = useState<GroupedData[]>([]);

  useEffect(() => {
    const config = getClickUpConfig();
    const hasKeys = !!(config.clickupApiToken && config.clickupTeamId);
    if (hasKeys) {
      setUseRealData(true);
      handleFetchRealData();
    }
  }, []);

  const handleFetchRealData = async () => {
    setIsLoadingData(true);
    setDataError(null);
    try {
      const rawTasks = await fetchClickUpTasks();
      const { grouped, members } = transformClickUpData(rawTasks);
      setRealGroupedData(grouped);
      setRealTeamData(members);
    } catch (err: any) {
      setDataError(err.message || "Erro ao conectar com ClickUp");
      setUseRealData(false); 
    } finally {
      setIsLoadingData(false);
    }
  };

  const activeTeamData = useRealData && realTeamData.length > 0 ? realTeamData : MOCK_TEAM_DATA;
  const activeGroupedData = useRealData && realGroupedData.length > 0 ? realGroupedData : MOCK_LEGACY_DATA;

  const filteredMetricsData = useMemo(() => {
    return selectedMember ? activeTeamData.filter(m => m.name === selectedMember) : activeTeamData;
  }, [selectedMember, activeTeamData]);

  const metrics = useMemo(() => {
    return Object.values(PriorityType).map(pType => {
      const config = PRIORITY_CONFIG[pType];
      const totalHours = filteredMetricsData.reduce((acc, curr) => {
        if (pType === PriorityType.URGENT) return acc + curr.urgent;
        if (pType === PriorityType.HIGH) return acc + curr.high;
        if (pType === PriorityType.NORMAL) return acc + curr.normal;
        if (pType === PriorityType.LOW) return acc + curr.low;
        if (pType === PriorityType.NONE) return acc + curr.none;
        return acc;
      }, 0);
      const totalLogged = filteredMetricsData.reduce((acc, curr) => {
        if (pType === PriorityType.URGENT) return acc + (curr.urgentLogged || 0);
        if (pType === PriorityType.HIGH) return acc + (curr.highLogged || 0);
        if (pType === PriorityType.NORMAL) return acc + (curr.normalLogged || 0);
        if (pType === PriorityType.LOW) return acc + (curr.lowLogged || 0);
        if (pType === PriorityType.NONE) return acc + (curr.noneLogged || 0);
        return acc;
      }, 0);
      const totalTasks = filteredMetricsData.reduce((acc, curr) => {
        if (pType === PriorityType.URGENT) return acc + curr.urgentTasks;
        if (pType === PriorityType.HIGH) return acc + curr.highTasks;
        if (pType === PriorityType.NORMAL) return acc + curr.normalTasks;
        if (pType === PriorityType.LOW) return acc + curr.lowTasks;
        if (pType === PriorityType.NONE) return acc + curr.noneTasks;
        return acc;
      }, 0);
      return { id: pType, label: config.label, value: totalTasks, hours: totalHours, loggedHours: totalLogged, icon: config.icon, colorConfig: config.metricConfig };
    });
  }, [filteredMetricsData]);

  const tabs = [{ key: 'general', label: 'Visão Geral', icon: PieChart }, { key: 'tactical', label: 'Tático', icon: LayoutList }, { key: 'allocation', label: 'Alocação', icon: BarChart2 }];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
           <div><h1 className="text-xl font-bold text-slate-800">Módulo de Gestão</h1><p className="text-xs text-slate-500">Carga & Capacidade</p></div>
           {selectedMember && <button onClick={() => setSelectedMember(null)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold border border-red-100"><FilterX size={14} /> Limpar Filtros</button>}
        </div>
        <div className="px-6"><nav className="flex space-x-1">{tabs.map((tab) => { const Icon = tab.icon; const isActive = activeTab === tab.key; return (<button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><Icon size={16} /> {tab.label}</button>); })}</nav></div>
      </header>
      <div className="flex-1 overflow-y-auto p-6 w-full custom-scrollbar">
        {activeTab === 'general' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {metrics.map((metric) => (
                <MetricCard key={metric.id} title={metric.label} value={metric.value} subtitle={`${metric.hours.toFixed(0)}h estimadas`} icon={metric.icon} colorConfig={metric.colorConfig} isActive={filterPriority === metric.id} onClick={() => setFilterPriority(filterPriority === metric.id ? null : metric.id as PriorityType)} progress={{ value: metric.loggedHours, total: metric.hours, label: 'Execução' }} />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col"><h3 className="text-lg font-bold text-slate-800">Saúde do Backlog</h3><div className="flex-1 flex items-center justify-center"><CapacityChart data={activeTeamData} onSelectMember={(name) => setSelectedMember(selectedMember === name ? null : name)} selectedMember={selectedMember} /></div></div>
               <div className="lg:col-span-2"><WorkloadCharts data={activeTeamData} filterPriority={filterPriority} selectedMember={selectedMember} onSelectMember={setSelectedMember} onSelectPriority={setFilterPriority} /></div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"><h3 className="font-bold text-slate-700">Matriz Detalhada</h3>{selectedMember && <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">Filtrado: {selectedMember}</span>}</div><TeamTable data={activeTeamData} filterPriority={filterPriority} selectedMember={selectedMember} onSelectMember={setSelectedMember} /></div>
          </div>
        )}
        {activeTab === 'tactical' && <div className="space-y-8 animate-fadeIn"><TeamWorkloadDashboard data={activeGroupedData} /></div>}
        {activeTab === 'allocation' && <AllocationDashboard />}
      </div>
    </div>
  );
};
