
import React, { useState } from 'react';
import { TeamWorkloadDashboard } from '../TeamWorkloadDashboard';
import { ManagementDashboard } from '../gestao/ManagementDashboard';
import { WeeklyTimesheet } from './WeeklyTimesheet';
import { GeneralTeamDashboard } from '../GeneralTeamDashboard';
import { BackupVersions } from './BackupVersions';
import { PriorityDistributionProto } from './PriorityDistributionProto';
import { ProjectAllocationDashboard } from './ProjectAllocationDashboard'; 
import { BI_Playground } from './BI_Playground'; 
import { PredictiveDelaysView } from './PredictiveDelaysView'; 
import { MOCK_LEGACY_DATA } from '../../constants';
import { 
  FlaskConical, 
  Info,
  KanbanSquare,
  BarChart3,
  History,
  Activity,
  ListFilter,
  LayoutGrid,
  BrainCircuit,
  TrendingUp 
} from 'lucide-react';

// Tipagem limpa apenas com o que restou de funcional
type PrototypeTab = 'workload' | 'management' | 'weekly' | 'evolution' | 'backup' | 'priority_new' | 'allocation_ref' | 'bi_playground' | 'predictive';

export const PrototypeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrototypeTab>('predictive'); 

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
      
      {/* Header do Laboratório */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <FlaskConical size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Laboratório & Labs</h1>
            <p className="text-xs text-slate-500 font-medium">Componentes experimentais e BI avançado</p>
          </div>
        </div>

        {/* Navigation Tabs (Pill Style) */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          
          <button
            onClick={() => setActiveTab('predictive')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'predictive' 
                ? 'bg-rose-600 text-white shadow-md ring-1 ring-rose-700' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <TrendingUp size={14} /> 
            Predição de Atrasos
          </button>

          <button
            onClick={() => setActiveTab('bi_playground')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bi_playground' 
                ? 'bg-purple-600 text-white shadow-md ring-1 ring-purple-700' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <BrainCircuit size={14} /> 
            BI Avançado
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1 my-auto"></div>

          <button
            onClick={() => setActiveTab('allocation_ref')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'allocation_ref' 
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <LayoutGrid size={14} /> 
            Alocação (Ref)
          </button>

          <button
            onClick={() => setActiveTab('priority_new')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'priority_new' 
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <ListFilter size={14} /> 
            Prioridades
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'backup' 
                ? 'bg-amber-100 text-amber-800 shadow-sm ring-1 ring-amber-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <History size={14} /> 
            Backup
          </button>

          <button
            onClick={() => setActiveTab('management')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'management' 
                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 size={14} /> 
            Gestão
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'evolution' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Activity size={14} /> 
            Evolutivo
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'weekly' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Activity size={14} /> 
            Weekly
          </button>

          <button
            onClick={() => setActiveTab('workload')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'workload' 
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <KanbanSquare size={14} /> 
            Visual
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 flex items-start gap-3">
           <Info size={16} className="text-violet-600 mt-0.5 shrink-0" />
           <p className="text-xs text-violet-800 leading-relaxed">
             <strong>Atenção:</strong> Esta área contém apenas protótipos ativos e funcionais. Componentes legados e visões duplicadas foram removidos permanentemente para otimização do sistema.
           </p>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-hidden flex flex-col ${activeTab === 'management' ? 'p-0' : 'p-6'}`}>
        <div className={`flex-1 bg-white overflow-hidden flex flex-col relative ${activeTab === 'management' || activeTab === 'priority_new' || activeTab === 'allocation_ref' || activeTab === 'bi_playground' || activeTab === 'predictive' ? 'border-t border-slate-200' : 'rounded-2xl border border-slate-200 shadow-sm'}`}>
           {activeTab === 'predictive' && <PredictiveDelaysView />}
           {activeTab === 'bi_playground' && <BI_Playground />}
           {activeTab === 'allocation_ref' && <ProjectAllocationDashboard />}
           {activeTab === 'priority_new' && <PriorityDistributionProto />}
           {activeTab === 'backup' && <BackupVersions />}
           {activeTab === 'weekly' && <WeeklyTimesheet />}
           {activeTab === 'evolution' && <GeneralTeamDashboard data={MOCK_LEGACY_DATA} />}
           {activeTab === 'workload' && <TeamWorkloadDashboard data={MOCK_LEGACY_DATA} />}
           {activeTab === 'management' && <ManagementDashboard />}
        </div>
      </div>

    </div>
  );
};
