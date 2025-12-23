/**
 * @id FILTER-DATE-001
 * @name DateRangePicker
 * @description Componente reutilizável para seleção de período de datas
 * Inclui presets comuns e inputs manuais
 */

import React, { useState, useMemo } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';

// Presets de período
const DATE_PRESETS = [
    { label: 'Hoje', value: 'today', days: 0 },
    { label: 'Últimos 7 dias', value: 'last7', days: 7 },
    { label: 'Últimos 30 dias', value: 'last30', days: 30 },
    { label: 'Este mês', value: 'thisMonth', days: null },
    { label: 'Mês passado', value: 'lastMonth', days: null },
    { label: 'Este ano', value: 'thisYear', days: null },
];

// Calcular datas baseado no preset
const calculatePresetDates = (preset: string): { startDate: string; endDate: string } | null => {
    const today = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
        case 'today':
            return { startDate: format(today), endDate: format(today) };
        case 'last7': {
            const start = new Date(today);
            start.setDate(start.getDate() - 7);
            return { startDate: format(start), endDate: format(today) };
        }
        case 'last30': {
            const start = new Date(today);
            start.setDate(start.getDate() - 30);
            return { startDate: format(start), endDate: format(today) };
        }
        case 'thisMonth': {
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return { startDate: format(start), endDate: format(today) };
        }
        case 'lastMonth': {
            const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return { startDate: format(start), endDate: format(end) };
        }
        case 'thisYear': {
            const start = new Date(today.getFullYear(), 0, 1);
            return { startDate: format(start), endDate: format(today) };
        }
        default:
            return null;
    }
};

export interface DateRange {
    startDate: string | null;
    endDate: string | null;
}

export interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    showPresets?: boolean;
    variant?: 'default' | 'compact' | 'inline';
    className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
    dateRange,
    onDateRangeChange,
    showPresets = true,
    variant = 'default',
    className = ''
}) => {
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

    const hasDateRange = dateRange.startDate || dateRange.endDate;

    const handlePresetClick = (preset: string) => {
        const dates = calculatePresetDates(preset);
        if (dates) {
            setSelectedPreset(preset);
            onDateRangeChange(dates);
        }
    };

    const handleStartDateChange = (value: string) => {
        setSelectedPreset(null);
        onDateRangeChange({ ...dateRange, startDate: value || null });
    };

    const handleEndDateChange = (value: string) => {
        setSelectedPreset(null);
        onDateRangeChange({ ...dateRange, endDate: value || null });
    };

    const clearAll = () => {
        setSelectedPreset(null);
        onDateRangeChange({ startDate: null, endDate: null });
    };

    // Format display label
    const formatDateLabel = () => {
        if (!hasDateRange) return 'Selecionar período';
        if (selectedPreset) {
            return DATE_PRESETS.find(p => p.value === selectedPreset)?.label || 'Período personalizado';
        }
        if (dateRange.startDate && dateRange.endDate) {
            return `${dateRange.startDate} → ${dateRange.endDate}`;
        }
        if (dateRange.startDate) return `A partir de ${dateRange.startDate}`;
        if (dateRange.endDate) return `Até ${dateRange.endDate}`;
        return 'Período personalizado';
    };

    // Variant: Compact (button with dropdown)
    if (variant === 'compact') {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${hasDateRange
                            ? 'bg-amber-100 text-amber-700 border border-amber-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <Calendar size={16} />
                    {formatDateLabel()}
                    <ChevronDown size={14} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50">
                        {/* Presets */}
                        {showPresets && (
                            <div className="mb-4">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Presets</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {DATE_PRESETS.map(preset => (
                                        <button
                                            key={preset.value}
                                            onClick={() => handlePresetClick(preset.value)}
                                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${selectedPreset === preset.value
                                                    ? 'bg-amber-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {preset.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual inputs */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Data Inicial</label>
                                <input
                                    type="date"
                                    value={dateRange.startDate || ''}
                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Data Final</label>
                                <input
                                    type="date"
                                    value={dateRange.endDate || ''}
                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                                />
                            </div>
                        </div>

                        {/* Clear button */}
                        {hasDateRange && (
                            <button
                                onClick={clearAll}
                                className="mt-4 w-full text-center text-xs text-slate-500 hover:text-rose-600"
                            >
                                Limpar período
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    // Variant: Inline (horizontal)
    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                <Calendar size={16} className="text-slate-400" />
                <input
                    type="date"
                    value={dateRange.startDate || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <span className="text-slate-400">→</span>
                <input
                    type="date"
                    value={dateRange.endDate || ''}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                {hasDateRange && (
                    <button onClick={clearAll} className="text-slate-400 hover:text-rose-600">
                        <X size={16} />
                    </button>
                )}
            </div>
        );
    }

    // Variant: Default (full card)
    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-amber-600" />
                    <span className="font-bold text-slate-800">Período</span>
                    {hasDateRange && (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            Ativo
                        </span>
                    )}
                </div>
                {hasDateRange && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                    >
                        <X size={12} />
                        Limpar
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Presets */}
                {showPresets && (
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase mb-2">Períodos Rápidos</p>
                        <div className="flex flex-wrap gap-2">
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => handlePresetClick(preset.value)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-all ${selectedPreset === preset.value
                                            ? 'bg-amber-600 border-amber-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Manual Date Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">Data Inicial</label>
                        <input
                            type="date"
                            value={dateRange.startDate || ''}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2">Data Final</label>
                        <input
                            type="date"
                            value={dateRange.endDate || ''}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;
