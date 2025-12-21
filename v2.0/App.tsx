/**
 * @id APP-001
 * @name App
 * @description Entry point principal do Daily Flow v2.0
 * @dependencies DataProvider, AuthProvider, LoginScreen
 * @status active
 * @version 2.1.0
 */

import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { SyncDashboard } from './pages/SyncDashboard';
import { DailyAlignmentDashboard } from './pages/DailyAlignmentDashboard';
import { ProjectsDashboard } from './pages/ProjectsDashboard'; // Clean version
import { TeamWorkloadWrapper } from './pages/TeamWorkloadWrapper';
import { QualityWrapper } from './pages/QualityWrapper';
import { AdminDashboard } from './pages/AdminDashboard';
import { TimesheetDashboard } from './pages/TimesheetDashboard'; // Componente correto segundo seu branch
import { GeneralTeamWrapper } from './pages/GeneralTeamWrapper';
import { FiltersWrapper } from './pages/FiltersWrapper';
import { CompletedProjectsWrapper } from './pages/CompletedProjectsWrapper';
import { RefreshCw, Users, FolderOpen, BarChart2, Shield, LayoutDashboard, Filter, Archive, Clock, LogOut } from 'lucide-react';
import { AuthorizedUser } from './services/supabaseService';

// Configuração inicial (pode vir de .env ou localStorage)
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

const NAV_ITEMS = [
    { key: 'sync' as const, label: 'Sync', icon: RefreshCw },
    { key: 'daily' as const, label: 'Diário', icon: Users },
    { key: 'projects' as const, label: 'Projetos', icon: FolderOpen },
    { key: 'gestao' as const, label: 'Gestão', icon: Clock },
    { key: 'quality' as const, label: 'Qualidade', icon: Shield },
    { key: 'admin' as const, label: 'Admin', icon: Shield, adminOnly: true },
];

// ============================================
// APP CONTENT (usa useAuth)
// ============================================

const AppContent: React.FC = () => {
    const { auth, logoutUser } = useAuth();
    const initialConfig = getInitialConfig();
    const [activeView, setActiveView] = useState<ActiveView>('sync');

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

    // Not authenticated - show login
    if (!auth.isAuthenticated || !auth.user) {
        return (
            <LoginScreen
                onLogin={(user: AuthorizedUser) => {
                    // O login já foi processado pelo AuthContext
                    // O estado vai mudar e o componente re-renderizar automaticamente
                    console.log('[APP-001] User logged in:', user.name);
                }}
            />
        );
    }

    // Authenticated - show app
    const visibleNavItems = NAV_ITEMS.filter(item => {
        if (item.adminOnly && auth.user?.role !== 'admin') return false;
        return true;
    });

    return (
        <DataProvider initialConfig={initialConfig}>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
                {/* Navigation Header */}
                <nav className="bg-slate-900/50 border-b border-slate-700/50 px-6 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h1 className="text-white font-bold text-lg">Daily Flow v2.0</h1>
                            <div className="flex gap-2 ml-6">
                                {visibleNavItems.map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveView(item.key)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === item.key
                                            ? 'bg-white/10 text-white border border-white/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        <item.icon size={16} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {/* User info & Logout */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-white text-sm font-medium">{auth.user.name}</p>
                                <p className="text-slate-400 text-xs">{auth.user.email}</p>
                            </div>
                            <button
                                onClick={logoutUser}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                                title="Sair"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden">
                    {activeView === 'sync' && <SyncDashboard />}
                    {activeView === 'daily' && <DailyAlignmentDashboard />}
                    {activeView === 'projects' && <ProjectsDashboard />}
                    {activeView === 'gestao' && <TimesheetDashboard />}
                    {activeView === 'quality' && <QualityWrapper />}
                    {activeView === 'admin' && <AdminDashboard />}
                </main>
            </div>
        </DataProvider>
    );
};

// ============================================
// APP ROOT (fornece AuthProvider)
// ============================================

export const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
