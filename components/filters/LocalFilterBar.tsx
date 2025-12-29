/**
 * @id FILTER-LOCAL-001
 * @name LocalFilterBar
 * @description Barra de filtros locais reutilizável para qualquer view
 * Não afeta dados globais - filtra apenas localmente na visualização atual
 */

import React, { useState, useMemo } from 'react';
import { Filter, Tag, CheckCircle, Users, Flag, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

// Tipos para os filtros locais
export interface LocalFilters {
    tags: string[];
    statuses: string[];
    assignees: string[];
    priorities: string[];
}

export const createDefaultLocalFilters = (): LocalFilters => ({
    tags: [],
    statuses: [],
    assignees: [],
    priorities: []
});

// Contagem de filtros ativos
export const countActiveFilters = (filters: LocalFilters): number => {
    return filters.tags.length + filters.statuses.length + filters.assignees.length + filters.priorities.length;
};

// Função helper para aplicar filtros a uma lista de tasks
export const applyLocalFilters = <T extends {
    tags?: (string | { name: string })[];
    status?: { status: string } | string;
    assignees?: { username?: string; email?: string }[];
    priority?: { priority: string } | string | number;
}>(tasks: T[], filters: LocalFilters): T[] => {
    if (countActiveFilters(filters) === 0) return tasks;

    return tasks.filter(task => {
        // Tag filter (OR logic)
        if (filters.tags.length > 0) {
            const taskTags = task.tags?.map(t => typeof t === 'string' ? t : t.name) || [];
            if (!filters.tags.some(tag => taskTags.includes(tag))) {
                return false;
            }
        }

        // Status filter (OR logic)
        if (filters.statuses.length > 0) {
            const taskStatus = typeof task.status === 'object' ? task.status?.status : task.status;
            if (!taskStatus || !filters.statuses.includes(taskStatus.toLowerCase())) {
                return false;
            }
        }

        // Assignee filter (OR logic)
        if (filters.assignees.length > 0) {
            const taskAssignees = task.assignees?.map(a => a.username || a.email || '') || [];
            if (!filters.assignees.some(assignee => taskAssignees.includes(assignee))) {
                return false;
            }
        }

        // Priority filter (OR logic)
        if (filters.priorities.length > 0) {
            const taskPriority = typeof task.priority === 'object'
                ? task.priority?.priority
                : String(task.priority);
            if (!taskPriority || !filters.priorities.includes(taskPriority.toLowerCase())) {
                return false;
            }
        }

        return true;
    });
};

// Props do componente
interface LocalFilterBarProps {
    filters: LocalFilters;
    onFiltersChange: (filters: LocalFilters) => void;
    availableTags?: string[];
    availableStatuses?: string[];
    availableAssignees?: string[];
    availablePriorities?: string[];
    compact?: boolean; // Modo compacto para espaços menores
    className?: string;
}

export const LocalFilterBar: React.FC<LocalFilterBarProps> = ({
    filters,
    onFiltersChange,
    availableTags = [],
    availableStatuses = [],
    availableAssignees = [],
    availablePriorities = ['urgent', 'high', 'normal', 'low'],
    compact = false,
    className = ''
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

    const toggleFilter = (category: keyof LocalFilters, value: string) => {
        const current = filters[category];
        const lower = value.toLowerCase();
        const updated = current.includes(lower)
            ? current.filter(v => v !== lower)
            : [...current, lower];

        onFiltersChange({
            ...filters,
            [category]: updated
        });
    };

    const clearAll = () => {
        onFiltersChange(createDefaultLocalFilters());
    };

    const FilterChip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${selected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
        >
            {label}
        </button>
    );

    const FilterSection = ({
        title,
        icon: Icon,
        items,
        selected,
        category,
        color
    }: {
        title: string;
        icon: any;
        items: string[];
        selected: string[];
        category: keyof LocalFilters;
        color: string;
    }) => {
        if (items.length === 0) return null;

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Icon size={14} className={color} />
                    <span className="text-xs font-bold text-slate-500 uppercase">{title}</span>
                    {selected.length > 0 && (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${color.replace('text-', 'bg-').replace('-600', '-100')} ${color}`}>
                            {selected.length}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {items.map(item => (
                        <FilterChip
                            key={item}
                            label={item}
                            selected={selected.includes(item.toLowerCase())}
                            onClick={() => toggleFilter(category, item)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // Modo compacto: apenas um botão com dropdown
    if (compact) {
        return (
            <div className={`relative ${className}`}>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeCount > 0
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                >
                    <Filter size={16} />
                    Filtros
                    {activeCount > 0 && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                            {activeCount}
                        </span>
                    )}
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isExpanded && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 space-y-4">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">Filtros Locais</span>
                            {activeCount > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
                                >
                                    <RotateCcw size={12} />
                                    Limpar
                                </button>
                            )}
                        </div>

                        {/* Filter Sections */}
                        <FilterSection
                            title="Tags"
                            icon={Tag}
                            items={availableTags}
                            selected={filters.tags}
                            category="tags"
                            color="text-indigo-600"
                        />
                        <FilterSection
                            title="Status"
                            icon={CheckCircle}
                            items={availableStatuses}
                            selected={filters.statuses}
                            category="statuses"
                            color="text-emerald-600"
                        />
                        <FilterSection
                            title="Responsável"
                            icon={Users}
                            items={availableAssignees}
                            selected={filters.assignees}
                            category="assignees"
                            color="text-purple-600"
                        />
                        <FilterSection
                            title="Prioridade"
                            icon={Flag}
                            items={availablePriorities}
                            selected={filters.priorities}
                            category="priorities"
                            color="text-amber-600"
                        />

                        {/* Info */}
                        <p className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
                            Filtros aplicados apenas nesta visualização
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Modo expandido: barra horizontal com todos os filtros visíveis
    return (
        <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-indigo-600" />
                    <span className="font-bold text-slate-800">Filtros Locais</span>
                    {activeCount > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {activeCount} ativo{activeCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {activeCount > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-sm text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                    >
                        <RotateCcw size={14} />
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Filter Sections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FilterSection
                    title="Tags"
                    icon={Tag}
                    items={availableTags}
                    selected={filters.tags}
                    category="tags"
                    color="text-indigo-600"
                />
                <FilterSection
                    title="Status"
                    icon={CheckCircle}
                    items={availableStatuses}
                    selected={filters.statuses}
                    category="statuses"
                    color="text-emerald-600"
                />
                <FilterSection
                    title="Responsável"
                    icon={Users}
                    items={availableAssignees}
                    selected={filters.assignees}
                    category="assignees"
                    color="text-purple-600"
                />
                <FilterSection
                    title="Prioridade"
                    icon={Flag}
                    items={availablePriorities}
                    selected={filters.priorities}
                    category="priorities"
                    color="text-amber-600"
                />
            </div>

            {/* Active Filters Preview */}
            {activeCount > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                    {filters.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium">
                            #{tag}
                            <button onClick={() => toggleFilter('tags', tag)} className="hover:text-rose-600">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {filters.statuses.map(status => (
                        <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium">
                            {status}
                            <button onClick={() => toggleFilter('statuses', status)} className="hover:text-rose-600">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {filters.assignees.map(assignee => (
                        <span key={assignee} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                            @{assignee}
                            <button onClick={() => toggleFilter('assignees', assignee)} className="hover:text-rose-600">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {filters.priorities.map(priority => (
                        <span key={priority} className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                            {priority}
                            <button onClick={() => toggleFilter('priorities', priority)} className="hover:text-rose-600">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Info text */}
            <p className="text-xs text-slate-400 mt-3">
                💡 Estes filtros são aplicados apenas nesta visualização e não afetam outras telas.
            </p>
        </div>
    );
};

export default LocalFilterBar;
