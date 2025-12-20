/**
 * @id APP-001
 * @name App
 * @description Entry point principal do Daily Flow v2.0
 * @dependencies DataProvider, AuthProvider
 * @status active
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider } from './contexts/AuthContext';
import { SyncDashboard } from './pages/SyncDashboard';
import { DailyAlignmentDashboard } from './pages/DailyAlignmentDashboard';
import { ProjectsDashboard } from './pages/ProjectsDashboard'; // Clean version
import { TeamWorkloadWrapper } from './pages/TeamWorkloadWrapper';
import { QualityWrapper } from './pages/QualityWrapper';
import { LibraryBrowser } from './pages/LibraryBrowser';
import { AdminDashboard } from './pages/AdminDashboard';
import TimesheetDashboard from './pages/TimesheetDashboard'; // NEW: Timesheet (default export)
import { GeneralTeamWrapper } from './pages/GeneralTeamWrapper';
import { FiltersWrapper } from './pages/FiltersWrapper';
import { CompletedProjectsWrapper } from './pages/CompletedProjectsWrapper';
import { RefreshCw, Users, FolderOpen, BarChart2, Shield, Library, LayoutDashboard, Filter, Archive, Clock } from 'lucide-react';

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

type ActiveView = 'sync' | 'daily' | 'projects' | 'gestao' | 'quality' | 'library' | 'admin';

const NAV_ITEMS = [
    { key: 'sync' as const, label: 'Sync', icon: RefreshCw },
    { key: 'daily' as const, label: 'Diário', icon: Users },
    { key: 'projects' as const, label: 'Projetos', icon: FolderOpen },
    { key: 'gestao' as const, label: 'Gestão', icon: Clock },
    { key: 'quality' as const, label: 'Qualidade', icon: Shield },
    { key: 'library' as const, label: 'Biblioteca', icon: Library },
    { key: 'admin' as const, label: 'Admin', icon: Shield },
];

export const App: React.FC = () => {
    const initialConfig = getInitialConfig();
    const [activeView, setActiveView] = useState<ActiveView>('sync');

    return (
        <AuthProvider>
            <DataProvider initialConfig={initialConfig}>
                <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
                    {/* Navigation Header */}
                    <nav className="bg-slate-900/50 border-b border-slate-700/50 px-6 py-3">
                        <div className="flex items-center gap-4">
                            <h1 className="text-white font-bold text-lg">Daily Flow v2.0</h1>
                            <div className="flex gap-2 ml-6">
                                {NAV_ITEMS.map(item => (
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
                    </nav>

                    {/* Main Content */}
                    <main className="flex-1 overflow-hidden">
                        {activeView === 'sync' && <SyncDashboard />}
                        {activeView === 'daily' && <DailyAlignmentDashboard />}
                        {activeView === 'projects' && <ProjectsDashboard />}
                        {activeView === 'gestao' && <TimesheetDashboard />}
                        {activeView === 'quality' && <QualityWrapper />}
                        {activeView === 'library' && <LibraryBrowser />}
                        {activeView === 'admin' && <AdminDashboard />}
                    </main>
                </div>
            </DataProvider>
        </AuthProvider>
    );
};

export default App;
