/**
 * @id WRAP-GEN-001
 * @name GeneralTeamWrapper
 * @description Wrapper to connect GeneralTeamDashboard to DataContext
 */

import React from 'react';
import { useData } from '../contexts/DataContext';
import { GeneralTeamDashboard } from './GeneralTeamDashboard';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const GeneralTeamWrapper: React.FC = () => {
    const { groupedData, syncState } = useData();

    const hasData = groupedData && groupedData.length > 0;

    if (syncState.status === 'syncing') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <RefreshCw size={48} className="text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Sincronizando dados...</p>
                    <p className="text-sm text-slate-400">{syncState.progress}%</p>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md p-8">
                    <AlertCircle size={48} className="text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Dados não disponíveis</h3>
                    <p className="text-sm text-slate-500">
                        Execute a sincronização na aba "Sync" para carregar dados do ClickUp.
                    </p>
                </div>
            </div>
        );
    }

    // Pass real data to GeneralTeamDashboard
    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <GeneralTeamDashboard data={groupedData} />
        </div>
    );
};

export default GeneralTeamWrapper;
