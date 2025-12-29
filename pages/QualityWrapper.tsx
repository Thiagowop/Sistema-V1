/**
 * @id QUALITY-WRAP-001
 * @name QualityWrapper
 * @description Wrapper que conecta QualityDashboard ao DataContext
 */

import React from 'react';
import { useData } from '../contexts/DataContext';
import { QualityDashboard } from './QualityDashboard';
import { RefreshCw, AlertCircle } from 'lucide-react';

export const QualityWrapper: React.FC = () => {
    const { groupedData, syncState, syncFull } = useData();
    const isLoading = syncState.status === 'syncing';
    const hasData = groupedData && groupedData.length > 0;

    if (!hasData && !isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum dado para auditoria</h3>
                <p className="text-slate-500 mb-6">Sincronize com o ClickUp para carregar os dados.</p>
                <button
                    onClick={() => syncFull()}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    Sincronizar
                </button>
            </div>
        );
    }

    if (isLoading && !hasData) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-12">
                <RefreshCw size={48} className="text-indigo-500 animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Carregando...</p>
            </div>
        );
    }

    return (
        <div className="p-6 overflow-y-auto h-full">
            <QualityDashboard data={groupedData} />
        </div>
    );
};

export default QualityWrapper;
