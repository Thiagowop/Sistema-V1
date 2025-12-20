/**
 * @id FILTERS-001
 * @name FiltersWrapper
 * @description Wrapper for filters page using DataContext and raw data
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Filter, Tag, Calendar, Users, Flag, Layers, FolderOpen,
    ChevronDown, ChevronUp, Save, Trash2, RotateCcw, CheckCircle2,
    AlertCircle, RefreshCw
} from 'lucide-react';

interface FilterConfig {
    includedStatuses: string[];
    excludeClosed: boolean;
    includedPriorities: string[];
    includedAssignees: string[];
    includedProjects: string[];
    requiredTags: string[];
    showParentTasks: boolean;
    showSubtasks: boolean;
}

const DEFAULT_FILTERS: FilterConfig = {
    includedStatuses: [],
    excludeClosed: false,
    includedPriorities: [],
    includedAssignees: [],
    includedProjects: [],
    requiredTags: [],
    showParentTasks: true,
    showSubtasks: true,
};

// Save filters to localStorage
const saveFilters = (filters: FilterConfig) => {
    localStorage.setItem('dailyFlow_filters_v2', JSON.stringify(filters));
};

// Load filters from localStorage
const loadFilters = (): FilterConfig => {
    const saved = localStorage.getItem('dailyFlow_filters_v2');
    if (saved) {
        try {
            return { ...DEFAULT_FILTERS, ...JSON.parse(saved) };
        } catch {
            return DEFAULT_FILTERS;
        }
    }
    return DEFAULT_FILTERS;
};

export const FiltersWrapper: React.FC = () => {
    const { groupedData, syncState, config } = useData();
    const [filters, setFilters] = useState<FilterConfig>(loadFilters);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['status', 'priority', 'assignee']));

    const hasData = groupedData && groupedData.length > 0;

    // Extract available options from data
    const metadata = useMemo(() => {
        if (!groupedData) return { statuses: [], priorities: [], assignees: [], projects: [], tags: [] };

        const statuses = new Set<string>();
        const priorities = new Set<string>();
        const assignees = new Set<string>();
        const projects = new Set<string>();
        const tags = new Set<string>();

        groupedData.forEach(group => {
            assignees.add(group.assignee);
            group.projects.forEach(project => {
                projects.add(project.name);
                project.tasks.forEach(task => {
                    if (task.status) statuses.add(task.status);
                    if (task.priority) priorities.add(task.priority);
                    if (task.tags) task.tags.forEach(t => tags.add(t));
                });
            });
        });

        return {
            statuses: Array.from(statuses).sort(),
            priorities: Array.from(priorities).sort(),
            assignees: Array.from(assignees).sort(),
            projects: Array.from(projects).sort(),
            tags: Array.from(tags).sort()
        };
    }, [groupedData]);

    // Toggle array item
    const toggleArrayFilter = (key: keyof FilterConfig, value: string) => {
        setFilters(prev => {
            const arr = prev[key] as string[];
            const newArr = arr.includes(value)
                ? arr.filter(v => v !== value)
                : [...arr, value];
            const updated = { ...prev, [key]: newArr };
            saveFilters(updated);
            return updated;
        });
    };

    // Toggle boolean
    const toggleBooleanFilter = (key: keyof FilterConfig) => {
        setFilters(prev => {
            const updated = { ...prev, [key]: !prev[key] };
            saveFilters(updated);
            return updated;
        });
    };

    // Reset filters
    const resetFilters = () => {
        setFilters(DEFAULT_FILTERS);
        saveFilters(DEFAULT_FILTERS);
    };

    // Toggle section
    const toggleSection = (section: string) => {
        setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(section)) next.delete(section);
            else next.add(section);
            return next;
        });
    };

    // Calculate active filter count
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (filters.includedStatuses.length > 0) count++;
        if (filters.includedPriorities.length > 0) count++;
        if (filters.includedAssignees.length > 0) count++;
        if (filters.includedProjects.length > 0) count++;
        if (filters.requiredTags.length > 0) count++;
        if (filters.excludeClosed) count++;
        return count;
    }, [filters]);

    if (syncState.status === 'syncing') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <RefreshCw size={48} className="mx-auto text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md">
                    <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum dado disponível</h3>
                    <p className="text-slate-500 text-sm">Sincronize com o ClickUp na aba "Sync" primeiro para usar os filtros.</p>
                </div>
            </div>
        );
    }

    const FilterSection = ({
        id,
        label,
        icon: Icon,
        items,
        selectedItems,
        filterKey
    }: {
        id: string;
        label: string;
        icon: React.ElementType;
        items: string[];
        selectedItems: string[];
        filterKey: keyof FilterConfig;
    }) => {
        const isExpanded = expandedSections.has(id);

        return (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${selectedItems.length > 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Icon size={18} />
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-slate-800">{label}</span>
                            {selectedItems.length > 0 && (
                                <span className="ml-2 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                                    {selectedItems.length} selecionados
                                </span>
                            )}
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>

                {isExpanded && (
                    <div className="px-5 pb-4 border-t border-slate-100">
                        <div className="pt-4 flex flex-wrap gap-2">
                            {items.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Nenhum item disponível</p>
                            ) : (
                                items.map(item => {
                                    const isSelected = selectedItems.includes(item);
                                    return (
                                        <button
                                            key={item}
                                            onClick={() => toggleArrayFilter(filterKey, item)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSelected
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {isSelected && <span className="mr-1">✓</span>}
                                            {item}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                                <Filter size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">Filtros</h1>
                                <p className="text-sm text-slate-500">Configure filtros para refinar os dados exibidos</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {activeFilterCount > 0 && (
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-3 py-1.5 rounded-xl">
                                    {activeFilterCount} filtro(s) ativo(s)
                                </span>
                            )}
                            <button
                                onClick={resetFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                            >
                                <RotateCcw size={16} />
                                Limpar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filter Sections */}
                <div className="space-y-4">
                    <FilterSection
                        id="status"
                        label="Status"
                        icon={Layers}
                        items={metadata.statuses}
                        selectedItems={filters.includedStatuses}
                        filterKey="includedStatuses"
                    />

                    <FilterSection
                        id="priority"
                        label="Prioridade"
                        icon={Flag}
                        items={metadata.priorities}
                        selectedItems={filters.includedPriorities}
                        filterKey="includedPriorities"
                    />

                    <FilterSection
                        id="assignee"
                        label="Responsável"
                        icon={Users}
                        items={metadata.assignees}
                        selectedItems={filters.includedAssignees}
                        filterKey="includedAssignees"
                    />

                    <FilterSection
                        id="project"
                        label="Projeto/Lista"
                        icon={FolderOpen}
                        items={metadata.projects}
                        selectedItems={filters.includedProjects}
                        filterKey="includedProjects"
                    />

                    <FilterSection
                        id="tags"
                        label="Tags"
                        icon={Tag}
                        items={metadata.tags}
                        selectedItems={filters.requiredTags}
                        filterKey="requiredTags"
                    />
                </div>

                {/* Task Type Toggles */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        Tipo de Tarefa
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Mostrar Tarefas Pai</span>
                            <button
                                onClick={() => toggleBooleanFilter('showParentTasks')}
                                className={`w-11 h-6 rounded-full transition-colors ${filters.showParentTasks ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${filters.showParentTasks ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Mostrar Subtarefas</span>
                            <button
                                onClick={() => toggleBooleanFilter('showSubtasks')}
                                className={`w-11 h-6 rounded-full transition-colors ${filters.showSubtasks ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${filters.showSubtasks ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">Excluir Concluídas</span>
                            <button
                                onClick={() => toggleBooleanFilter('excludeClosed')}
                                className={`w-11 h-6 rounded-full transition-colors ${filters.excludeClosed ? 'bg-rose-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${filters.excludeClosed ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                        </label>
                    </div>
                </div>

                {/* Info */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                    <p className="font-bold mb-1">📌 Nota</p>
                    <p>Os filtros são salvos automaticamente e persistem entre sessões. Os filtros afetam todas as visualizações.</p>
                </div>
            </div>
        </div>
    );
};

export default FiltersWrapper;
