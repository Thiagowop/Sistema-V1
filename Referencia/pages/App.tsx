
import React, { useState } from 'react';
import { 
  BarChart2, 
  KanbanSquare, 
  Layers, 
  Database, 
  Settings, 
  ShieldCheck, 
  FlaskConical,
  LogOut,
  Menu,
  X,
  LayoutGrid,
  LayoutDashboard
} from 'lucide-react';
import { ManagementModule } from './ManagementModule';
import { Management2Dashboard } from '../components/Management2Dashboard';
import { DailyAlignmentDashboard } from '../components/DailyAlignmentDashboard';
import { ProjectsDashboard } from '../components/ProjectsDashboard';
import { ImportSyncView } from '../components/ImportSyncView';
import { SettingsDashboard } from '../components/SettingsDashboard';
import { AdminDashboard } from '../components/AdminDashboard';
import { PrototypeDashboard } from '../components/prototype/PrototypeDashboard';
import { LoginScreen } from './LoginScreen';
import { AppProvider } from '../contexts/AppContext';

type ViewType = 'sync' | 'daily' | 'projects' | 'management' | 'management2' | 'prototype' | 'settings' | 'admin';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  isActive, 
  onClick,
  isBeta = false 
}: { 
  icon: any, 
  label: string, 
  isActive: boolean, 
  onClick: () => void,
  isBeta?: boolean
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
      isActive 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
    <span className={`text-sm flex-1 text-left ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
    {isBeta && (
      <span className={`
        text-[9px] font-black px-2 py-0.5 rounded-full tracking-tighter
        ${isActive 
          ? 'bg-blue-400/30 text-white border border-white/20' 
          : 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
        }
      `}>
        BETA
      </span>
    )}
  </button>
);

const SectionHeader = ({ label }: { label: string }) => (
  <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] md:hidden lg:block">
    {label}
  </div>
);

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('management2'); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'sync': return <ImportSyncView />;
      case 'daily': return <DailyAlignmentDashboard />;
      case 'projects': return <ProjectsDashboard />;
      case 'management': return <ManagementModule />;
      case 'management2': return <Management2Dashboard />;
      case 'prototype': return <PrototypeDashboard />;
      case 'settings': return <SettingsDashboard />;
      case 'admin': return <AdminDashboard />;
      default: return <Management2Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {!isSidebarOpen && (
        <div className="md:hidden fixed top-4 left-4 z-50">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 bg-white rounded-lg shadow-md text-slate-600"
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      <aside 
        className={`
          fixed md:relative z-40 h-full w-64 bg-[#050c1b] border-r border-slate-800/50 flex flex-col transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'}
        `}
      >
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-black text-lg shrink-0 shadow-lg shadow-blue-900/20">
              M
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-white tracking-tight whitespace-nowrap">
                MCSA Tecnologia
              </span>
              <span className="text-[10px] text-slate-500 font-medium leading-none">Gestão de Projetos</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 custom-scrollbar">
          <SectionHeader label="Dados" />
          <SidebarItem 
            icon={Database} 
            label="Atualizar Dados" 
            isActive={currentView === 'sync'} 
            onClick={() => setCurrentView('sync')} 
          />
          
          <SectionHeader label="Visualização" />
          <SidebarItem 
            icon={KanbanSquare} 
            label="Alinhamento Diário" 
            isActive={currentView === 'daily'} 
            onClick={() => setCurrentView('daily')} 
          />
          <SidebarItem 
            icon={Layers} 
            label="Projetos" 
            isActive={currentView === 'projects'} 
            onClick={() => setCurrentView('projects')} 
          />
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Gestão" 
            isActive={currentView === 'management'} 
            onClick={() => setCurrentView('management')} 
          />
          <SidebarItem 
            icon={LayoutGrid} 
            label="Gestão 2" 
            isBeta={true}
            isActive={currentView === 'management2'} 
            onClick={() => setCurrentView('management2')} 
          />
          
          <SectionHeader label="Sistema" />
          <SidebarItem 
            icon={FlaskConical} 
            label="Protótipo & Labs" 
            isActive={currentView === 'prototype'} 
            onClick={() => setCurrentView('prototype')}
          />
          <SidebarItem 
            icon={Settings} 
            label="Configurações" 
            isActive={currentView === 'settings'} 
            onClick={() => setCurrentView('settings')} 
          />
          <SidebarItem 
            icon={ShieldCheck} 
            label="Admin" 
            isActive={currentView === 'admin'} 
            onClick={() => setCurrentView('admin')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-800/50">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 transition-colors group"
          >
            <LogOut size={18} />
            <span className="font-bold text-xs uppercase tracking-wider md:hidden lg:block text-left">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden relative w-full h-full bg-slate-50">
        {renderView()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
