/**
 * @id FILTER-STATUS-001
 * @name StatusSelector
 * @description Componente reutilizável para seleção de status
 * Inclui cores visuais para cada status
 */

import React, { useMemo } from 'react';
import { CheckCircle, X, Circle } from 'lucide-react';

// Cores padrão para status comuns
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'a fazer': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    'to do': { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    'em andamento': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'in progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    'em revisão': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    'review': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    'concluído': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    'concluida': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    'done': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    'complete': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    'bloqueado': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
    'blocked': { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
    'cancelado': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' },
    'cancelled': { bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-300' },
};

const getStatusColor = (status: string) => {
    const lower = status.toLowerCase();
    return STATUS_COLORS[lower] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
};

export interface StatusSelectorProps {
    selectedStatuses: string[];
    availableStatuses: string[];
    onStatusesChange: (statuses: string[]) => void;
    showSelectedCount?: boolean;
    variant?: 'default' | 'compact' | 'pills';
    className?: string;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
    selectedStatuses,
    availableStatuses,
    onStatusesChange,
    showSelectedCount = true,
    variant = 'default',
    className = ''
}) => {
    const toggleStatus = (status: string) => {
        const lower = status.toLowerCase();
        if (selectedStatuses.includes(lower)) {
            onStatusesChange(selectedStatuses.filter(s => s !== lower));
        } else {
            onStatusesChange([...selectedStatuses, lower]);
        }
    };

    const clearAll = () => {
        onStatusesChange([]);
    };

    // Variant: Compact (simple chips)
    if (variant === 'compact') {
        return (
            <div className={`flex flex-wrap gap-1.5 ${className}`}>
                {availableStatuses.map(status => {
                    const isSelected = selectedStatuses.includes(status.toLowerCase());
                    const colors = getStatusColor(status);
                    return (
                        <button
                            key={status}
                            onClick={() => toggleStatus(status)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${isSelected
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : `${colors.bg} ${colors.text}`
                                }`}
                        >
                            {status}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Variant: Pills (colored badges)
    if (variant === 'pills') {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                {availableStatuses.map(status => {
                    const isSelected = selectedStatuses.includes(status.toLowerCase());
                    const colors = getStatusColor(status);
                    return (
                        <button
                            key={status}
                            onClick={() => toggleStatus(status)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-full border-2 transition-all ${isSelected
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : `${colors.bg} ${colors.border} ${colors.text}`
                                }`}
                        >
                            <Circle size={8} className={isSelected ? 'fill-current' : ''} />
                            {status}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Variant: Default (card with list)
    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <span className="font-bold text-slate-800">Status</span>
                    {showSelectedCount && selectedStatuses.length > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {selectedStatuses.length}
                        </span>
                    )}
                </div>
                {selectedStatuses.length > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                    >
                        <X size={12} />
                        Limpar
                    </button>
                )}
            </div>

            {/* Status List */}
            <div className="p-4">
                {availableStatuses.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                        Nenhum status disponível
                    </p>
                ) : (
                    <div className="space-y-2">
                        {availableStatuses.map(status => {
                            const isSelected = selectedStatuses.includes(status.toLowerCase());
                            const colors = getStatusColor(status);
                            return (
                                <button
                                    key={status}
                                    onClick={() => toggleStatus(status)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg border-2 transition-all ${isSelected
                                            ? 'bg-emerald-50 border-emerald-500'
                                            : `bg-white ${colors.border} hover:border-emerald-300`
                                        }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-emerald-500' : colors.bg}`} />
                                    <span className={`font-medium ${isSelected ? 'text-emerald-700' : colors.text}`}>
                                        {status}
                                    </span>
                                    {isSelected && (
                                        <CheckCircle size={16} className="ml-auto text-emerald-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusSelector;
