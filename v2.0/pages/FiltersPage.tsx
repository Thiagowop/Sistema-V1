import React, { useState, useMemo, useEffect } from 'react';
import { ClickUpApiTask, extractFilterMetadata } from '../services/clickup';
import { FilterState, FilterConfig, FilterGroup } from '../types/FilterConfig';
import { FilterService } from '../services/filterService';
import { Save, Trash2, Check, X, Plus, Tag, Calendar, Users as UsersIcon, Layers, FolderOpen, AlertCircle, ChevronUp, ChevronDown, ChevronRight, RotateCcw, Flag } from 'lucide-react';
import { AppConfig } from '../types';

interface FiltersProps {
    rawData: ClickUpApiTask[];
    filterState: FilterState;
    onFilterStateChange: (newState: FilterState) => void;
    config: AppConfig;
    onConfigChange: (newConfig: AppConfig) => void;
}

const Filters: React.FC<FiltersProps> = ({ rawData, filterState, onFilterStateChange, config, onConfigChange }) => {
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [showNewGroupForm, setShowNewGroupForm] = useState(false);

    // Extract metadata from raw data
    const metadata = useMemo(() => extractFilterMetadata(rawData, config.nameMappings), [rawData, config.nameMappings]);

    const initialOrder = useMemo(() => {
        if (config.teamMemberOrder && config.teamMemberOrder.length > 0) return config.teamMemberOrder;
        return metadata.assignees;
    }, [config.teamMemberOrder, metadata.assignees]);
    const [memberOrder, setMemberOrder] = useState<string[]>(initialOrder);
    useEffect(() => { setMemberOrder(initialOrder); }, [initialOrder]);

    const move = (from: number, to: number) => {
        const next = [...memberOrder];
        const [m] = next.splice(from, 1);
        next.splice(to, 0, m);
        setMemberOrder(next);
    };
    const moveUp = (idx: number) => { if (idx > 0) move(idx, idx - 1); };
    const moveDown = (idx: number) => { if (idx < memberOrder.length - 1) move(idx, idx + 1); };
    const resetOrder = () => setMemberOrder(metadata.assignees);
    const applyOrder = () => onConfigChange({ ...config, teamMemberOrder: memberOrder });

    const [openTags, setOpenTags] = useState(false);
    const [openStatus, setOpenStatus] = useState(false);
    const [openAssignees, setOpenAssignees] = useState(false);
    const [openProjects, setOpenProjects] = useState(false);
    const [openTaskType, setOpenTaskType] = useState(false);
    const [openOrder, setOpenOrder] = useState(false);
    const [openPriority, setOpenPriority] = useState(false);

    const setAllOpen = (v: boolean) => {
        setOpenTags(v);
        setOpenStatus(v);
        setOpenAssignees(v);
        setOpenProjects(v);
        setOpenTaskType(v);
        setOpenOrder(v);
        setOpenPriority(v);
    };

    const formatDateForInput = (d?: Date | null) => {
        if (!d) return '';
        // Ensure d is a valid Date object
        const date = d instanceof Date ? d : new Date(d);
        if (isNaN(date.getTime())) return '';
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    };

    // Current filters shorthand
    const filters = filterState.currentFilters;

    // Update a filter property
    const updateFilter = <K extends keyof FilterConfig>(key: K, value: FilterConfig[K]) => {
        const newFilters = { ...filters, [key]: value };
        const newState = FilterService.updateCurrentFilters(filterState, newFilters);
        onFilterStateChange(newState);
    };

    // Toggle item in array filter (tags, statuses, etc.)
    const toggleArrayItem = (key: keyof FilterConfig, item: string) => {
        const currentArray = filters[key] as string[];
        const newArray = currentArray.includes(item)
            ? currentArray.filter(i => i !== item)
            : [...currentArray, item];
        updateFilter(key, newArray as any);
    };

    // Save current filters as a new group
    const handleSaveGroup = () => {
        if (!newGroupName.trim()) {
            alert('Por favor, insira um nome para o grupo de filtros.');
            return;
        }

        const newGroup = FilterService.createFilterGroup(
            newGroupName.trim(),
            filters,
            newGroupDescription.trim() || undefined
        );

        const newState = FilterService.addFilterGroup(filterState, newGroup);
        onFilterStateChange(newState);

        // Reset form
        setNewGroupName('');
        setNewGroupDescription('');
        setShowNewGroupForm(false);
    };

    // Load a saved filter group
    const handleLoadGroup = (groupId: string) => {
        const newState = FilterService.loadFilterGroup(filterState, groupId);
        onFilterStateChange(newState);
    };

    // Delete a filter group
    const handleDeleteGroup = (groupId: string) => {
        if (confirm('Tem certeza que deseja deletar este grupo de filtros?')) {
            const newState = FilterService.deleteFilterGroup(filterState, groupId);
            onFilterStateChange(newState);
        }
    };

    // Reset filters to default
    const handleResetFilters = () => {
        if (confirm('Resetar todos os filtros para os valores padrão?')) {
            const newState = FilterService.resetFilters(filterState);
            onFilterStateChange(newState);
        }
    };

    // Count tasks that match current filters (for preview)
    const matchingTasksCount = useMemo(() => {
        // This is a simple approximation - actual count happens in App.tsx
        // We just show if filters are active
        const hasActiveFilters =
            filters.requiredTags.length > 0 ||
            filters.excludedTags.length > 0 ||
            filters.includedStatuses.length > 0 ||
            filters.excludeClosed ||
            filters.dateRange !== null ||
            filters.includedAssignees.length > 0 ||
            !filters.showParentTasks ||
            !filters.showSubtasks ||
            filters.includedProjects.length > 0;

        return { hasActiveFilters, total: rawData.length };
    }, [filters, rawData]);

    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-emerald-900">Como funciona</h4>
                        <p className="text-sm text-emerald-700 mt-1">
                            ✅ Todos os {rawData.length.toLocaleString()} dados foram carregados do ClickUp
                            <br />
                            💾 Filtros são salvos automaticamente entre sessões
                            <br />
                            ⚡ Filtragem instantânea no navegador (sem nova chamada API)
                        </p>
                    </div>
                </div>
            </div>

            {/* Active Filters Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                            Status dos Filtros
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                            {matchingTasksCount.hasActiveFilters
                                ? `Filtros ativos - ${matchingTasksCount.total} tarefas brutas disponíveis`
                                : 'Sem filtros ativos - todas as tarefas serão processadas'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setAllOpen(true)}
                            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Expandir tudo
                        </button>
                        <button
                            onClick={() => setAllOpen(false)}
                            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Recolher tudo
                        </button>
                        <button
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Resetar Tudo
                        </button>
                    </div>
                </div>
            </div>

            {/* Saved Filter Groups */}
            {filterState.savedGroups.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-emerald-600" />
                        Grupos de Filtros Salvos
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                        {filterState.savedGroups.map(group => (
                            <div
                                key={group.id}
                                className={`border rounded-lg p-4 transition-all ${filterState.activeGroupId === group.id
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                                            {group.name}
                                            {filterState.activeGroupId === group.id && (
                                                <Check className="w-4 h-4 text-emerald-600" />
                                            )}
                                        </h4>
                                        {group.description && (
                                            <p className="text-xs text-slate-500 mt-1">{group.description}</p>
                                        )}
                                        <p className="text-xs text-slate-400 mt-2">
                                            Criado: {new Date(group.createdAt).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 ml-2">
                                        <button
                                            onClick={() => handleLoadGroup(group.id)}
                                            className="p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors"
                                            title="Carregar filtros"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group.id)}
                                            className="p-2 hover:bg-red-50 rounded text-red-600 transition-colors"
                                            title="Deletar grupo"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Save New Group */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-indigo-600" />
                    Salvar Filtros Atuais como Grupo
                </h3>

                {!showNewGroupForm ? (
                    <button
                        onClick={() => setShowNewGroupForm(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Novo Grupo de Filtros
                    </button>
                ) : (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Grupo *</label>
                            <input
                                type="text"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                placeholder="Ex: Tarefas Urgentes"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (opcional)</label>
                            <input
                                type="text"
                                value={newGroupDescription}
                                onChange={(e) => setNewGroupDescription(e.target.value)}
                                placeholder="Ex: Apenas tarefas com tag urgente e não concluídas"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveGroup}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Salvar Grupo
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewGroupForm(false);
                                    setNewGroupName('');
                                    setNewGroupDescription('');
                                }}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Controls */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Tags Filter */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Tag className="w-5 h-5 text-purple-600" />
                            Filtrar por Tags
                        </h3>
                        <button onClick={() => setOpenTags(v => !v)} className="p-2 rounded hover:bg-slate-100">
                            {openTags ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                    {openTags && (
                        <div className="mt-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Tags Requeridas 
                                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        Pelo menos UMA (OR)
                                    </span>
                                </label>
                                <p className="text-xs text-slate-500 mb-3">
                                    💡 Tarefas que tiverem QUALQUER UMA das tags selecionadas serão exibidas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleArrayItem('requiredTags', tag)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filters.requiredTags.includes(tag)
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                                {metadata.tags.length === 0 && (
                                    <p className="text-sm text-slate-400 italic">Nenhuma tag encontrada nos dados</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Tags Excluídas (NÃO deve ter)</label>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleArrayItem('excludedTags', tag)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${filters.excludedTags.includes(tag)
                                                ? 'bg-red-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Status Filter */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-blue-600" />
                            Filtrar por Status
                        </h3>
                        <button onClick={() => setOpenStatus(v => !v)} className="p-2 rounded hover:bg-slate-100">
                            {openStatus ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                    {openStatus && (
                        <div className="mt-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Status Incluídos (vazio = todos)</label>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.statuses.map(status => (
                                        <button
                                            key={status}
                                            onClick={() => toggleArrayItem('includedStatuses', status)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${filters.includedStatuses.includes(status)
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={filters.excludeClosed}
                                        onChange={(e) => updateFilter('excludeClosed', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    Excluir tarefas concluídas
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Priority Filter */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Flag className="w-5 h-5 text-red-600" />
                            Filtrar por Prioridade
                        </h3>
                        <button onClick={() => setOpenPriority(v => !v)} className="p-2 rounded hover:bg-slate-100">
                            {openPriority ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                    {openPriority && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Prioridades incluídas (vazio = todas)</label>
                            <div className="flex flex-wrap gap-2">
                                {metadata.priorities.map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => toggleArrayItem('includedPriorities', priority)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${filters.includedPriorities.includes(priority)
                                            ? 'bg-red-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {priority}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Assignees Filter */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <UsersIcon className="w-5 h-5 text-emerald-600" />
                            Filtrar por Responsável
                        </h3>
                        <button onClick={() => setOpenAssignees(v => !v)} className="p-2 rounded hover:bg-slate-100">
                            {openAssignees ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                    {openAssignees && (
                        <div className="mt-4">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Responsáveis (vazio = todos)</label>
                                <div className="flex flex-wrap gap-2">
                                    {metadata.assignees.map(assignee => (
                                        <button
                                            key={assignee}
                                            onClick={() => toggleArrayItem('includedAssignees', assignee)}
                                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${filters.includedAssignees.includes(assignee)
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {assignee}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={filters.includeUnassigned}
                                        onChange={(e) => updateFilter('includeUnassigned', e.target.checked)}
                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                                    />
                                    Incluir tarefas não atribuídas
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Projects Filter */}
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-orange-600" />
                            Filtrar por Projeto (Lista)
                        </h3>
                        <button onClick={() => setOpenProjects(v => !v)} className="p-2 rounded hover:bg-slate-100">
                            {openProjects ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                    {openProjects && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Projetos (vazio = todos)</label>
                            <div className="flex flex-wrap gap-2">
                                {metadata.projects.map(project => (
                                    <button
                                        key={project}
                                        onClick={() => toggleArrayItem('includedProjects', project)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${filters.includedProjects.includes(project)
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {project}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Task Type Filter */}
                <div className="bg-white border border-slate-200 rounded-lg p-4 md:col-span-2">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            Tipos de Tarefa
                        </h3>
                        <button onClick={() => setOpenTaskType(v => !v)} className="p-2 rounded hover:bg-slate-100">
                            {openTaskType ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                    {openTaskType && (
                        <div className="mt-4 flex flex-wrap gap-6">
                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.showParentTasks ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {filters.showParentTasks && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.showParentTasks}
                                        onChange={(e) => updateFilter('showParentTasks', e.target.checked)}
                                        className="hidden"
                                    />
                                    Tarefas
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.showSubtasks ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {filters.showSubtasks && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.showSubtasks}
                                        onChange={(e) => updateFilter('showSubtasks', e.target.checked)}
                                        className="hidden"
                                    />
                                    Subtarefas
                                </label>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${!filters.excludeClosed ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                        {!filters.excludeClosed && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={!filters.excludeClosed}
                                        onChange={(e) => updateFilter('excludeClosed', !e.target.checked)}
                                        className="hidden"
                                    />
                                    Mostrar Fechadas
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${filters.showArchivedTasks ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                        {filters.showArchivedTasks && <Check className="w-3.5 h-3.5 text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={filters.showArchivedTasks}
                                        onChange={(e) => {
                                            updateFilter('showArchivedTasks', e.target.checked);
                                            onConfigChange({ ...config, includeArchived: e.target.checked });
                                        }}
                                        className="hidden"
                                    />
                                    Mostrar Arquivadas
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-pink-600" />
                        Filtrar por Período
                    </h3>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                        <input
                            type="date"
                            value={formatDateForInput(filters.dateRange?.start || null)}
                            onChange={(e) => {
                                const val = e.target.value;
                                const start = val ? new Date(val + 'T00:00:00') : null;
                                const end = filters.dateRange?.end || null;
                                updateFilter('dateRange', (start || end) ? { start, end } : null);
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                        <input
                            type="date"
                            value={formatDateForInput(filters.dateRange?.end || null)}
                            onChange={(e) => {
                                const val = e.target.value;
                                const end = val ? new Date(val + 'T23:59:59') : null;
                                const start = filters.dateRange?.start || null;
                                updateFilter('dateRange', (start || end) ? { start, end } : null);
                            }}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pink-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Ordem de Exibição dos Responsáveis */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-emerald-600" />
                        Ordem de Exibição dos Responsáveis
                    </h3>
                    <button onClick={() => setOpenOrder(v => !v)} className="p-2 rounded hover:bg-slate-100">
                        {openOrder ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
                {openOrder && (
                    <div className="mt-4">
                        <p className="text-sm text-slate-600 mb-4">Arraste com botões para ordenar. Clique em Salvar para aplicar na apresentação.</p>
                        <ul className="space-y-2">
                            {memberOrder.map((name, idx) => (
                                <li key={name} className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2">
                                    <span className="text-sm font-medium text-slate-800">{name}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => moveUp(idx)} className="p-2 rounded bg-slate-100 hover:bg-slate-200">
                                            <ChevronUp className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => moveDown(idx)} className="p-2 rounded bg-slate-100 hover:bg-slate-200">
                                            <ChevronDown className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 mt-4">
                            <button onClick={applyOrder} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                Salvar ordem
                            </button>
                            <button onClick={resetOrder} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium flex items-center gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Resetar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Filters;