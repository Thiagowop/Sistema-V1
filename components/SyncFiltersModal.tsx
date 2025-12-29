/**
 * @id COMP-SYNCFILTERS-001
 * @name SyncFiltersModal
 * @description Modal para configuração de filtros de sincronização com estado completo
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import {
    X, Tag, Users, CheckCircle, AlertTriangle,
    Settings2, Save, Database, RotateCcw
} from 'lucide-react';
import { FilterMetadata } from '../types/FilterConfig';
import { SyncFilters, createDefaultSyncFilters } from '../services/filterService';

interface SyncFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filterMetadata: FilterMetadata | null;
    currentFilters: SyncFilters;
    onSave: (filters: SyncFilters) => void;
}

export const SyncFiltersModal: React.FC<SyncFiltersModalProps> = ({
    isOpen,
    onClose,
    filterMetadata,
    currentFilters,
    onSave
}) => {
    // Estado interno do modal - inicializa com filtros atuais
    const [filters, setFilters] = useState<SyncFilters>(currentFilters);

    // Sincronizar com filtros externos quando modal abre
    useEffect(() => {
        if (isOpen) {
            setFilters(currentFilters);
        }
    }, [isOpen, currentFilters]);

    if (!isOpen) return null;

    // Helpers para toggle de arrays
    const toggleArrayItem = (field: keyof SyncFilters, item: string) => {
        const current = filters[field] as string[];
        if (current.includes(item)) {
            setFilters({ ...filters, [field]: current.filter(i => i !== item) });
        } else {
            setFilters({ ...filters, [field]: [...current, item] });
        }
    };

    // Helpers para toggle de booleans
    const toggleBoolean = (field: keyof SyncFilters) => {
        setFilters({ ...filters, [field]: !filters[field] });
    };

    // Reset para defaults
    const handleReset = () => {
        setFilters(createDefaultSyncFilters());
    };

    // Salvar e fechar
    const handleSave = () => {
        onSave(filters);
        onClose();
    };

    // Contar filtros ativos
    const activeFilterCount =
        filters.tags.length +
        filters.assignees.length +
        filters.statuses.length +
        filters.priorities.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database size={28} />
                        <div>
                            <h2 className="text-2xl font-bold">Filtros de Sincronização</h2>
                            <p className="text-indigo-100 text-sm mt-1">
                                Configure quais dados importar da API do ClickUp
                            </p>
                        </div>
                        {activeFilterCount > 0 && (
                            <span className="ml-4 bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                                {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''} ativo{activeFilterCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* ============================================ */}
                    {/* 1. TAGS FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100">
                            <div className="flex items-center gap-3">
                                <Tag size={18} className="text-indigo-600" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Tags</h4>
                                    <p className="text-xs text-slate-500">
                                        Vazio = importa todas • Selecionado = importa apenas essas
                                    </p>
                                </div>
                                {filters.tags.length > 0 && (
                                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filters.tags.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            {filterMetadata && filterMetadata.tags.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {filterMetadata.tags.map(tag => (
                                        <label
                                            key={tag}
                                            className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${filters.tags.includes(tag)
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.tags.includes(tag)}
                                                onChange={() => toggleArrayItem('tags', tag)}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <span className="font-medium truncate">#{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-3 text-sm">
                                    Nenhuma tag disponível. Faça um sync primeiro.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 2. ASSIGNEES FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-purple-50 px-5 py-3 border-b border-purple-100">
                            <div className="flex items-center gap-3">
                                <Users size={18} className="text-purple-600" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Responsáveis</h4>
                                    <p className="text-xs text-slate-500">
                                        Vazio = importa de todos • Selecionado = importa apenas desses
                                    </p>
                                </div>
                                {filters.assignees.length > 0 && (
                                    <span className="bg-purple-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filters.assignees.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            {filterMetadata && filterMetadata.assignees.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {filterMetadata.assignees.map(assignee => (
                                        <label
                                            key={assignee}
                                            className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${filters.assignees.includes(assignee)
                                                    ? 'border-purple-500 bg-purple-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.assignees.includes(assignee)}
                                                onChange={() => toggleArrayItem('assignees', assignee)}
                                                className="w-4 h-4 text-purple-600"
                                            />
                                            <span className="font-medium truncate">{assignee}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-3 text-sm">
                                    Nenhum responsável disponível.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 3. STATUS FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={18} className="text-emerald-600" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Status</h4>
                                    <p className="text-xs text-slate-500">
                                        Vazio = importa todos • Selecionado = importa apenas esses
                                    </p>
                                </div>
                                {filters.statuses.length > 0 && (
                                    <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filters.statuses.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            {filterMetadata && filterMetadata.statuses.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {filterMetadata.statuses.map(status => (
                                        <label
                                            key={status}
                                            className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${filters.statuses.includes(status)
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={filters.statuses.includes(status)}
                                                onChange={() => toggleArrayItem('statuses', status)}
                                                className="w-4 h-4 text-emerald-600"
                                            />
                                            <span className="font-medium truncate">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-3 text-sm">
                                    Nenhum status disponível.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 4. PRIORITY FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-amber-50 px-5 py-3 border-b border-amber-100">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={18} className="text-amber-600" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">Prioridade</h4>
                                    <p className="text-xs text-slate-500">
                                        Vazio = importa todas • Selecionado = importa apenas essas
                                    </p>
                                </div>
                                {filters.priorities.length > 0 && (
                                    <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                        {filters.priorities.length}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['urgent', 'high', 'normal', 'low'].map(priority => (
                                    <label
                                        key={priority}
                                        className={`flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-all text-sm ${filters.priorities.includes(priority)
                                                ? 'border-amber-500 bg-amber-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={filters.priorities.includes(priority)}
                                            onChange={() => toggleArrayItem('priorities', priority)}
                                            className="w-4 h-4 text-amber-600"
                                        />
                                        <span className="font-medium capitalize">{priority}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 5. ADDITIONAL OPTIONS */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <Settings2 size={18} className="text-slate-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">Opções Adicionais</h4>
                                    <p className="text-xs text-slate-500">
                                        Marcado = inclui • Desmarcado = exclui
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${filters.includeSubtasks ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'
                                }`}>
                                <input
                                    type="checkbox"
                                    checked={filters.includeSubtasks}
                                    onChange={() => toggleBoolean('includeSubtasks')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Subtarefas</span>
                                    <span className="text-xs text-slate-500">Importar subtasks</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${filters.includeArchived ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'
                                }`}>
                                <input
                                    type="checkbox"
                                    checked={filters.includeArchived}
                                    onChange={() => toggleBoolean('includeArchived')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Arquivadas</span>
                                    <span className="text-xs text-slate-500">Incluir tarefas arquivadas</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${filters.includeUnassigned ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'
                                }`}>
                                <input
                                    type="checkbox"
                                    checked={filters.includeUnassigned}
                                    onChange={() => toggleBoolean('includeUnassigned')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Sem Responsável</span>
                                    <span className="text-xs text-slate-500">Tarefas não atribuídas</span>
                                </div>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${filters.includeCompleted ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200'
                                }`}>
                                <input
                                    type="checkbox"
                                    checked={filters.includeCompleted}
                                    onChange={() => toggleBoolean('includeCompleted')}
                                    className="w-4 h-4 text-indigo-600"
                                />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Concluídas</span>
                                    <span className="text-xs text-slate-500">Tarefas em status concluído</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                            <Database size={16} />
                            Como Funcionam os Filtros
                        </h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>🎯 <strong>Seleções vazias = Importa TUDO</strong> daquela categoria</li>
                            <li>✅ <strong>Algo selecionado = Importa APENAS</strong> os itens marcados</li>
                            <li>⚡ <strong>Performance:</strong> Menos dados = sync mais rápido</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 bg-slate-50 px-6 py-4 border-t border-slate-200 rounded-b-2xl">
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <RotateCcw size={16} />
                        Resetar
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2 border-2 border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Save size={16} />
                            Salvar Filtros
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyncFiltersModal;
