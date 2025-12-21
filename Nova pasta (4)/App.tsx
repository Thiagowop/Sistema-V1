import React, { useState } from 'react';
import { DailyAlignmentDashboard } from './components/DailyAlignmentDashboard';
import { LoginScreen } from './components/LoginScreen';
import { 
  Database, KanbanSquare, Layers, LayoutDashboard, LayoutGrid, 
  FlaskConical, Settings, ShieldCheck, LogOut, X, Menu, Clock
} from 'lucide-react';

// Sub-componente para os itens individuais do menu
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
    <span className={`text-sm flex-1 text-left ${isActive ? 'font-bold' : 'font-medium'} md:hidden lg:block`}>{label}</span>
    {isBeta && (
      <span className={`
        text-[9px] font-black px-2 py-0.5 rounded-full tracking-tighter md:hidden lg:block
        ${isActive 
          ? 'bg-blue-400/30 text-white border border-white/20' 
          : 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
        }
      `}>
        BETA
      </span>
    )}
    
    {/* Tooltip for tablet (collapsed) view */}
    <div className="hidden md:block lg:hidden absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
      {label}
    </div>
  </button>
);

// Sub-componente para os títulos das seções
const SectionHeader = ({ label }: { label: string }) => (
  <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] md:hidden lg:block">
    {label}
  </div>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default true per request to bypass login
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('daily');
  const [projectView, setProjectView] = useState('timesheet');

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden w-full">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed md:relative z-40 h-full w-64 bg-[#050c1b] border-r border-slate-800/50 flex flex-col transition-all duration-300 ease-in-out shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'}
        `}
      >
        {/* Logo / Branding */}
        <div className="h-20 flex items-center px-6 border-b border-slate-800/50 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Ícone Removido. Apenas Texto agora. */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="font-black text-xl text-white tracking-tight whitespace-nowrap">
                  MCSA
                </span>
                <span className="font-normal text-slate-400 text-sm md:hidden lg:inline-block">
                  Tecnologia
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium leading-none md:hidden lg:block mt-0.5">
                Gestão de Projetos
              </span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Navegação Principal */}
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
          
          <SectionHeader label="Sistema" />
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

        {/* Footer da Sidebar (Logout) */}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full overflow-hidden">
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2">
             <span className="font-black text-xl text-slate-800 tracking-tight">MCSA <span className="font-normal text-slate-500 text-base">Tecnologia</span></span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Content Render */}
        <div className="flex-1 overflow-hidden h-full">
          {currentView === 'daily' ? (
            <DailyAlignmentDashboard />
          ) : currentView === 'projects' ? (
            <div className="flex flex-col h-full">
              {/* Project View Tabs */}
              <div className="bg-white border-b border-slate-200 px-6 pt-4 pb-0 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-6">
                  <h1 className="text-xl font-bold text-slate-800 mb-4">Projetos</h1>
                  <div className="flex gap-6">
                    <button 
                      onClick={() => setProjectView('overview')}
                      className={`pb-4 text-sm font-medium border-b-2 transition-colors relative ${
                        projectView === 'overview' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Visão Geral
                    </button>
                    <button 
                      onClick={() => setProjectView('timesheet')}
                      className={`pb-4 text-sm font-medium border-b-2 transition-colors relative ${
                        projectView === 'timesheet' 
                          ? 'border-blue-600 text-blue-600' 
                          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Timesheet
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden bg-slate-50">
                {projectView === 'timesheet' ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                      <Clock size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-600">Timesheet</h2>
                    <p className="text-sm mt-2">Este módulo foi removido, mas a referência permanece.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                      <Layers size={32} className="text-slate-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-600">Visão Geral</h2>
                    <p className="text-sm mt-2">Selecione "Timesheet" para ver a gestão de horas.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                <Settings size={32} className="text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-600">Em Desenvolvimento</h2>
              <p className="text-sm">A visualização "{currentView}" estará disponível em breve.</p>
            </div>
          )}
        </div>
      </main>
      
      <style>{`
        /* Custom scrollbar for sidebar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
};

export default App;