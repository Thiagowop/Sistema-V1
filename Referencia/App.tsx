import React, { useState, useMemo } from 'react';
import { MOCK_TEAM_DATA, PRIORITY_CONFIG, MOCK_LEGACY_DATA } from './constants';
import { PriorityType, TabKey } from './types';
import { MetricCard } from './components/MetricCard';
import { WorkloadCharts } from './components/WorkloadCharts';
import { TeamTable } from './components/TeamTable';
import { CapacityChart } from './components/CapacityChart';
// Updated import to reflect the new location in prototype folder
import TestDashboard from './components/prototype/LegacyDashboard';
import GovernanceDashboard from './components/GovernanceDashboard';
import { TimesheetDashboard } from './components/TimesheetDashboard';
import { AttendanceDashboard } from './components/AttendanceDashboard';
import { TeamWorkloadDashboard } from './components/TeamWorkloadDashboard';
import { LoginScreen } from './components/LoginScreen';
import { analyzeWorkload } from './services/geminiService';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  BarChart3, 
  Download,
  FilterX,
  History,
  ShieldCheck,
  LogOut,
  CalendarClock,
  CalendarDays,
  LayoutList
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // Defini 'visual_management' como padrão temporariamente para você ver a mudança
  const [activeTab, setActiveTab] = useState<TabKey>('visual_management');
  const [filterPriority, setFilterPriority] = useState<PriorityType | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Filter Data based on selection to calculate Top-Level Metrics
  const filteredMetricsData = useMemo(() => {
    return selectedMember 
      ? MOCK_TEAM_DATA.filter(m => m.name === selectedMember)
      : MOCK_TEAM_DATA;
  }, [selectedMember]);

  // Calculate top-level metrics for cards
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

      const totalTasks = filteredMetricsData.reduce((acc, curr) => {
        if (pType === PriorityType.URGENT) return acc + curr.urgentTasks;
        if (pType === PriorityType.HIGH) return acc + curr.highTasks;
        if (pType === PriorityType.NORMAL) return acc + curr.normalTasks;
        if (pType === PriorityType.LOW) return acc + curr.lowTasks;
        if (pType === PriorityType.NONE) return acc + curr.noneTasks;
        return acc;
      }, 0);

      return {
        id: pType,
        label: config.label,
        value: totalTasks,
        hours: totalHours,
        icon: config.icon,
        colorConfig: config.metricConfig
      };
    });
  }, [filteredMetricsData]);

  const handleRunAnalysis = async () => {
    setActiveTab('ai_analysis');
    if (!aiAnalysis) {
      setIsAnalyzing(true);
      const result = await analyzeWorkload(MOCK_TEAM_DATA);
      setAiAnalysis(result);
      setIsAnalyzing(false);
    }
  };

  const clearFilters = () => {
    setFilterPriority(null);
    setSelectedMember(null);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('overview');
    clearFilters();
  };

  const tabs = [
    { key: 'overview', label: 'Painel Executivo', icon: LayoutDashboard },
    { key: 'team', label: 'Tabela Detalhada', icon: Users },
    { key: 'visual_management', label: 'Gestão Visual', icon: LayoutList },
    { key: 'ai_analysis', label: 'Inteligência Artificial', icon: Sparkles },
    { key: 'governance', label: 'Governança 4.0', icon: ShieldCheck },
    { key: 'timesheet', label: 'Timesheet & Planejamento', icon: CalendarClock },
    { key: 'attendance', label: 'Escala & Presença', icon: CalendarDays },
  ];

  const hasFilters = filterPriority !== null || selectedMember !== null;

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                <BarChart3 size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
                <p className="text-xs text-slate-500 font-medium">Overview de Capacidade & Alocação</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
               {hasFilters && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors border border-red-100"
                >
                  <FilterX size={14} />
                  Limpar Filtros
                </button>
              )}

              <button 
                onClick={handleRunAnalysis}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-semibold transition-colors"
              >
                <Sparkles size={16} className={isAnalyzing ? "animate-spin" : ""} />
                {isAnalyzing ? "Analisando..." : "AI Analyst"}
              </button>

              <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto no-scrollbar" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`
                    group inline-flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-all whitespace-nowrap
                    ${isActive 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon size={16} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Interactive KPI Cards Row - Only show on main dashboard tabs (overview, team) to prevent clutter on specific views */}
        {(activeTab === 'overview' || activeTab === 'team') && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                title={metric.label}
                value={metric.value}
                subtitle={`${metric.hours.toFixed(0)}h totais`}
                icon={metric.icon}
                colorConfig={metric.colorConfig}
                isActive={filterPriority === metric.id}
                onClick={() => setFilterPriority(filterPriority === metric.id ? null : metric.id as PriorityType)}
              />
            ))}
          </div>
        )}

        {/* Tab Content */}
        <div className="space-y-6">
          
          {/* EXECUTIVE DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Capacity Analysis */}
                 <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800">Saúde do Backlog</h3>
                    <p className="text-xs text-slate-500 mb-4">Semanas estimadas de trabalho (Total / Capacidade Semanal)</p>
                    <div className="flex-1 flex items-center justify-center">
                      <CapacityChart 
                        data={MOCK_TEAM_DATA} 
                        onSelectMember={(name) => setSelectedMember(selectedMember === name ? null : name)}
                        selectedMember={selectedMember}
                      />
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400">
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>OK</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div>Atenção (+2 sem)</span>
                       <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div>Crítico (+4 sem)</span>
                    </div>
                 </div>

                 {/* Workload Distribution */}
                 <div className="lg:col-span-2">
                   <WorkloadCharts 
                    data={MOCK_TEAM_DATA} 
                    filterPriority={filterPriority} 
                    selectedMember={selectedMember}
                    onSelectMember={setSelectedMember}
                    onSelectPriority={setFilterPriority}
                   />
                 </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-700">Matriz de Detalhamento</h3>
                  </div>
                  {selectedMember && (
                    <span className="text-xs font-semibold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">
                      Filtrado: {selectedMember}
                    </span>
                  )}
                </div>
                <TeamTable 
                  data={MOCK_TEAM_DATA} 
                  filterPriority={filterPriority} 
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                />
              </div>
            </div>
          )}

          {/* TEAM TAB (Simplified Table View) */}
          {activeTab === 'team' && (
            <div className="animate-fadeIn">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Dados Brutos da Equipe</h3>
                 <TeamTable 
                  data={MOCK_TEAM_DATA} 
                  filterPriority={filterPriority} 
                  selectedMember={selectedMember}
                  onSelectMember={setSelectedMember}
                />
               </div>
            </div>
          )}

          {/* VISUAL MANAGEMENT TAB (NEW) */}
          {activeTab === 'visual_management' && (
             <TeamWorkloadDashboard data={MOCK_LEGACY_DATA} />
          )}

          {/* AI ANALYSIS TAB */}
          {activeTab === 'ai_analysis' && (
            <div className="animate-fadeIn max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 text-center">
                   <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                     <Sparkles className="text-white w-8 h-8" />
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2">Tech Lead Assistant</h2>
                   <p className="text-indigo-100">Análise de gargalos e desvios de função com Gemini 2.5</p>
                </div>
                
                <div className="p-8">
                  {!aiAnalysis ? (
                    <div className="text-center py-12">
                      <p className="text-slate-500 mb-6">Clique abaixo para analisar os dados atuais do ClickUp.</p>
                      <button
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                      >
                        {isAnalyzing ? (
                          <>
                            <Sparkles className="animate-spin w-5 h-5" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            Gerar Relatório de Risco
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600">
                      <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={() => setAiAnalysis(null)}
                          className="text-sm text-slate-400 hover:text-slate-600 font-medium"
                        >
                          Limpar análise
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LEGACY DASHBOARD TAB */}
          {activeTab === 'legacy' && (
             <div className="animate-fadeIn">
               <TestDashboard 
                  data={MOCK_LEGACY_DATA} 
                  config={{ teamMembers: [], nameMappings: {}, holidays: [] }} 
               />
             </div>
          )}

          {/* GOVERNANCE 4.0 DASHBOARD TAB */}
          {activeTab === 'governance' && (
             <div className="animate-fadeIn">
               <GovernanceDashboard />
             </div>
          )}

          {/* TIMESHEET DASHBOARD TAB */}
          {activeTab === 'timesheet' && (
             <div className="animate-fadeIn">
               <TimesheetDashboard />
             </div>
          )}

          {/* ATTENDANCE DASHBOARD TAB */}
          {activeTab === 'attendance' && (
             <div className="animate-fadeIn">
               <AttendanceDashboard />
             </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;