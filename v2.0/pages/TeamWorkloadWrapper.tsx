/**
 * @id TEAM-WORKLOAD-WRAP-001
 * @name TeamWorkloadWrapper
 * @description Wrapper component that connects TeamWorkloadDashboard to DataContext
 */

import React from 'react';
import { useData } from '../contexts/DataContext';
import { TeamWorkloadDashboard } from './TeamWorkloadDashboard';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const TeamWorkloadWrapper: React.FC = () => {
    const { groupedData, syncState, syncFull } = useData();
    const isLoading = syncState.status === 'syncing';
    const hasData = groupedData && groupedData.length > 0;

    if (!hasData && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum dado disponível</h3>
                <p className="text-slate-500 mb-6">Sincronize com o ClickUp para carregar os dados da equipe.</p>
                <button
                    onClick={() => syncFull()}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    Sincronizar Agora
                </button>
            </div>
        );
    }

    if (isLoading && !hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12">
                <RefreshCw size={48} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Carregando dados...</p>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-y-auto h-full">
            <TeamWorkloadDashboard data={groupedData} />
        </div>
    );
};

export default TeamWorkloadWrapper;
