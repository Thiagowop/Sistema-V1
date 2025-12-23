/**
 * @id COMP-SYNCBAR-001
 * @name SyncControlsBar
 * @description Barra compacta com controles de sync, cache e filtros
 * @dependencies DataContext, GlobalFilterContext
 */

import React, { useState } from 'react';
import { RefreshCw, Trash2, Check, Clock, Database, ToggleRight, ToggleLeft } from 'lucide-react';
import { useData } from '../contexts/DataContext';

export const SyncControlsBar: React.FC<{ className?: string }> = ({ className = '' }) => {
    const {
        syncState,
        syncIncremental,
        clearCache,
        groupedData
    } = useData();
    const [autoSync, setAutoSync] = useState(() => {
        try {
            return localStorage.getItem('dailyFlow_autoSync_v2') === 'true';
        } catch {
            return false;
        }
    });

    const handleSync = async () => {
        if (syncState.status === 'syncing') return;
        await syncIncremental();
    };

    const handleClearCache = () => {
        if (confirm('Limpar cache de DADOS? (Configurações e filtros serão mantidos)')) {
            if (clearCache) clearCache();
            localStorage.removeItem('dailyFlow_cache_v2');
            localStorage.removeItem('dailyFlow_rawCache_v2');
            localStorage.removeItem('dailyFlow_metadata_v3');
            localStorage.removeItem('dailyFlow_processed_v3');
            localStorage.removeItem('dailyFlow_processed_v3_data');
            alert('✅ Cache limpo! Faça uma nova sincronização.');
        }
    };

    const toggleAutoSync = () => {
        const newValue = !autoSync;
        setAutoSync(newValue);
        localStorage.setItem('dailyFlow_autoSync_v2', String(newValue));
    };

    const taskCount = groupedData?.reduce((sum, g) =>
        sum + g.projects.reduce((pSum, p) => pSum + p.tasks.length, 0)
        , 0) || 0;

    const lastSync = syncState.lastSync;
    const timeSinceSync = lastSync ? getTimeSince(new Date(lastSync)) : null;

    const isSyncing = syncState.status === 'syncing';

    return (
        <div className={`bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-xl px-4 py-3 flex items-center justify-between gap-4 shadow-lg ${className}`}>
            {/* Left Side: Actions */}
            <div className="flex items-center gap-2">
                {/* Sync Button */}
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${isSyncing
                        ? 'bg-indigo-500/50 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                        }`}
                >
                    <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                </button>

                {/* Clear Cache Button */}
                <button
                    onClick={handleClearCache}
                    className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-all flex items-center gap-2"
                    title="Limpar cache de dados"
                >
                    <Trash2 size={14} />
                    <span className="hidden md:inline">Limpar</span>
                </button>
            </div>

            {/* Right Side: Info */}
            <div className="flex items-center gap-4 text-xs">
                {/* Task Count */}
                {taskCount > 0 && (
                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                        <Database size={12} />
                        <span className="font-bold">{taskCount.toLocaleString()}</span>
                        <span className="text-slate-300">tarefas</span>
                    </div>
                )}

                {/* Last Sync */}
                {timeSinceSync && (
                    <div className="flex items-center gap-1.5 text-slate-300">
                        <Clock size={12} />
                        <span>{timeSinceSync}</span>
                    </div>
                )}

                {/* Auto-Sync Toggle */}
                <button
                    onClick={toggleAutoSync}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
                    title={`Auto-sync: ${autoSync ? 'Ativo' : 'Inativo'}`}
                >
                    {autoSync ? (
                        <>
                            <ToggleRight size={16} className="text-emerald-400" />
                            <span className="hidden lg:inline text-emerald-400 font-medium">Auto-Sync</span>
                        </>
                    ) : (
                        <>
                            <ToggleLeft size={16} className="text-slate-400" />
                            <span className="hidden lg:inline text-slate-400">Auto-Sync</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// Helper function
function getTimeSince(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days}d`;
}

export default SyncControlsBar;
