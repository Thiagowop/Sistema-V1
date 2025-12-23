/**
 * @id APP-001
 * @name App
 * @description Daily Flow v2.0 with Responsive Sidebar
 * @dependencies DataProvider, AuthProvider, LoginScreen
 * @status active
 * @version 2.2.0
 */

import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GlobalFilterProvider } from './contexts/GlobalFilterContext';
import { LoginScreen } from './components/LoginScreen';
import { SyncDashboard } from './pages/SyncDashboard';
import { DailyAlignmentDashboard } from './pages/DailyAlignmentDashboard';
import { ProjectsDashboard } from './pages/ProjectsDashboard';
import { TimesheetWrapper } from './pages/TimesheetWrapper';
import { QualityWrapper } from './pages/QualityWrapper';
import { AdminDashboard } from './pages/AdminDashboard';
import {
    RefreshCw, Users, FolderOpen, Clock, Shield, Settings,
    LogOut, X, Menu
} from 'lucide-react';
import { AuthorizedUser } from './services/supabaseService';

// Configuração inicial
const getInitialConfig = () => {
    const saved = localStorage.getItem('dailyFlow_config_v2');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.warn('[APP-001] Failed to parse saved config');
        }
    }
    return {
        clickupApiToken: import.meta.env.VITE_CLICKUP_API_TOKEN || '',
        clickupTeamId: import.meta.env.VITE_CLICKUP_TEAM_ID || '',
        clickupListId: import.meta.env.VITE_CLICKUP_LIST_ID || '',
        proxyUrl: import.meta.env.VITE_PROXY_URL || '',
        teamMembers: [],
        nameMappings: {},
        holidays: []
    };
};

type ActiveView = 'sync' | 'daily' | 'projects' | 'gestao' | 'quality' | 'admin';

// Componente para itens do sidebar
const SidebarItem = ({
    icon: Icon,
    label,
    isActive,
    onClick
}: {
    icon: any,
    label: string,
    isActive: boolean,
    onClick: () => void
}) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${isActive
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
    >
        <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
        <span className={`text-sm flex-1 text-left ${isActive ? 'font-bold' : 'font-medium'} md:hidden lg:block`}>{label}</span>

        {/* Tooltip for tablet (collapsed) view */}
        <div className="hidden md:block lg:hidden absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {label}
        </div>
    </button>
);

// Componente para seções
const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] md:hidden lg:block">
        {label}
    </div>
);

// ============================================
// APP CONTENT
// ============================================

const AppContent: React.FC = () => {
    const { auth, logoutUser } = useAuth();
    const initialConfig = getInitialConfig();
    const [activeView, setActiveView] = useState<ActiveView>('sync');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Loading state
    if (auth.isLoading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    // Not authenticated
    if (!auth.isAuthenticated || !auth.user) {
        return (
            <LoginScreen
                onLogin={(user: AuthorizedUser) => {
                    console.log('[APP-001] User logged in:', user.name);
                }}
            />
        );
    }

    const handleNavClick = (view: ActiveView) => {
        setActiveView(view);
        setSidebarOpen(false); // Fecha sidebar no mobile
    };

    return (
        <DataProvider initialConfig={initialConfig}>
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
                            icon={RefreshCw}
                            label="Atualizar Dados"
                            isActive={activeView === 'sync'}
                            onClick={() => handleNavClick('sync')}
                        />

                        <SectionHeader label="Visualização" />
                        <SidebarItem
                            icon={Users}
                            label="Alinhamento Diário"
                            isActive={activeView === 'daily'}
                            onClick={() => handleNavClick('daily')}
                        />
                        <SidebarItem
                            icon={FolderOpen}
                            label="Projetos"
                            isActive={activeView === 'projects'}
                            onClick={() => handleNavClick('projects')}
                        />
                        <SidebarItem
                            icon={Clock}
                            label="Gestão"
                            isActive={activeView === 'gestao'}
                            onClick={() => handleNavClick('gestao')}
                        />
                        <SidebarItem
                            icon={Shield}
                            label="Qualidade"
                            isActive={activeView === 'quality'}
                            onClick={() => handleNavClick('quality')}
                        />

                        {auth.user?.role === 'admin' && (
                            <>
                                <SectionHeader label="Sistema" />
                                <SidebarItem
                                    icon={Settings}
                                    label="Admin"
                                    isActive={activeView === 'admin'}
                                    onClick={() => handleNavClick('admin')}
                                />
                            </>
                        )}
                    </nav>

                    {/* Footer da Sidebar (User Info + Logout) */}
                    <div className="p-4 border-t border-slate-800/50">
                        {/* User Info (desktop only) */}
                        <div className="mb-3 px-4 py-2 bg-slate-800/30 rounded-lg hidden lg:block">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <p className="text-white text-xs font-bold truncate">{auth.user.name}</p>
                                    <p className="text-slate-400 text-[10px] truncate">{auth.user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => logoutUser()}
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
                        {activeView === 'sync' && <SyncDashboard />}
                        {activeView === 'daily' && <DailyAlignmentDashboard />}
                        {activeView === 'projects' && <ProjectsDashboard />}
                        {activeView === 'gestao' && <TimesheetWrapper />}
                        {activeView === 'quality' && <QualityWrapper />}
                        {activeView === 'admin' && <AdminDashboard />}
                    </div>
                </main>
            </div>

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
        </DataProvider>
    );
};

// ============================================
// ROOT APP COMPONENT
// ============================================

const App: React.FC = () => {
    return (
        <AuthProvider>
            <GlobalFilterProvider>
                <AppContent />
            </GlobalFilterProvider>
        </AuthProvider>
    );
};

export default App;
