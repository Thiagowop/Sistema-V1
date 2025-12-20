import React, { useState } from 'react';
import { UnifiedTimesheet } from './UnifiedTimesheet';
import { AttendanceDashboard } from './AttendanceDashboard';
import { TimesheetDashboard } from './TimesheetDashboard';
import { OperationalHub } from './OperationalHub';
import { TeamWorkloadDashboard } from './TeamWorkloadDashboard';
import { ManagementDashboard } from './gestao/ManagementDashboard';
import { WeeklyTimesheet } from './WeeklyTimesheet';
import { GeneralTeamDashboard } from './GeneralTeamDashboard';
import { BackupVersions } from './BackupVersions';
import { MOCK_LEGACY_DATA } from '../../constants';
import { 
  FlaskConical, 
  Grid, 
  CalendarRange, 
  CalendarDays, 
  Info,
  Layout,
  Hammer,
  KanbanSquare,
  BarChart3,
  Calendar,
  Activity,
  History
} from 'lucide-react';

type PrototypeTab = 'unified' | 'agenda' | 'scale' | 'classic' | 'quality' | 'workload' | 'management' | 'weekly' | 'evolution' | 'backup';

export const PrototypeDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrototypeTab>('backup'); // Default to backup for immediate relief

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
      
      {/* Header do Laboratório */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
            <FlaskConical size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Laboratório & Legado</h1>
            <p className="text-xs text-slate-500 font-medium">Área de componentes antigos, experimentais e legados</p>
          </div>
        </div>

        {/* Navigation Tabs (Pill Style) */}
        <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'backup' 
                ? 'bg-amber-100 text-amber-800 shadow-sm ring-1 ring-amber-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <History size={14} className={activeTab === 'backup' ? 'text-amber-700' : ''} /> 
            Backup & Versões
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1 my-auto"></div>

          <button
            onClick={() => setActiveTab('management')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'management' 
                ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 size={14} className={activeTab === 'management' ? 'text-slate-900' : ''} /> 
            Gestão Completa
          </button>

          <button
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'evolution' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Activity size={14} className={activeTab === 'evolution' ? 'text-indigo-600' : ''} /> 
            Painel Evolutivo (Novo)
          </button>

          <button
            onClick={() => setActiveTab('weekly')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'weekly' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Calendar size={14} className={activeTab === 'weekly' ? 'text-indigo-600' : ''} /> 
            Timesheet Semanal
          </button>

          <button
            onClick={() => setActiveTab('unified')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'unified' 
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Grid size={14} className={activeTab === 'unified' ? 'text-violet-600' : ''} /> 
            Unificada
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'agenda' 
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <CalendarRange size={14} className={activeTab === 'agenda' ? 'text-violet-600' : ''} /> 
            Agenda
          </button>

          <button
            onClick={() => setActiveTab('scale')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'scale' 
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <CalendarDays size={14} className={activeTab === 'scale' ? 'text-violet-600' : ''} /> 
            Escala
          </button>

          <div className="w-px h-4 bg-slate-300 mx-1 my-auto"></div>

          <button
            onClick={() => setActiveTab('workload')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'workload' 
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <KanbanSquare size={14} className={activeTab === 'workload' ? 'text-teal-600' : ''} /> 
            Gestão Visual
          </button>

          <button
            onClick={() => setActiveTab('classic')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'classic' 
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Layout size={14} className={activeTab === 'classic' ? 'text-indigo-600' : ''} /> 
            Timesheet (Grid)
          </button>

          <button
            onClick={() => setActiveTab('quality')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'quality' 
                ? 'bg-white text-amber-700 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <Hammer size={14} className={activeTab === 'quality' ? 'text-amber-600' : ''} /> 
            Qualidade
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-6 pt-4 pb-0">
        <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 flex items-start gap-3">
           <Info size={16} className="text-violet-600 mt-0.5 shrink-0" />
           <p className="text-xs text-violet-800 leading-relaxed">
             <strong>Arquivo Morto & Laboratório:</strong> O antigo "Painel de Gestão" agora está disponível aqui como "Gestão Completa".
             Use as abas acima para navegar entre as diferentes visões legadas.
           </p>
        </div>
      </div>

      {/* Content Area */}
      <div className={`flex-1 overflow-hidden flex flex-col ${activeTab === 'management' ? 'p-0' : 'p-6'}`}>
        <div className={`flex-1 bg-white overflow-hidden flex flex-col relative ${activeTab === 'management' ? 'border-t border-slate-200' : 'rounded-2xl border border-slate-200 shadow-sm'}`}>
           {activeTab === 'backup' && <BackupVersions />}
           {activeTab === 'unified' && <UnifiedTimesheet initialLayout="horizontal" />}
           {activeTab === 'agenda' && <UnifiedTimesheet initialLayout="agenda" />}
           {activeTab === 'scale' && <AttendanceDashboard />}
           {activeTab === 'classic' && <TimesheetDashboard />}
           {activeTab === 'weekly' && <WeeklyTimesheet />}
           {activeTab === 'evolution' && <GeneralTeamDashboard data={MOCK_LEGACY_DATA} />}
           {activeTab === 'workload' && <TeamWorkloadDashboard data={MOCK_LEGACY_DATA} />}
           {activeTab === 'management' && <ManagementDashboard />}
           {activeTab === 'quality' && (
             <div className="p-6 overflow-y-auto custom-scrollbar">
               <OperationalHub />
             </div>
           )}
        </div>
      </div>

    </div>
  );
};
