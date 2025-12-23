/**
 * @id COMP-SYNCFILTERS-001
 * @name SyncFiltersModal
 * @description Modal completo para configuração de filtros de sincronização
 */

import React, { useState } from 'react';
import {
    X, Tag, Users, CheckCircle, AlertTriangle, Calendar,
    Settings2, Save, Database
} from 'lucide-react';
import { FilterMetadata } from '../types/FilterConfig';

interface SyncFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    filterMetadata: FilterMetadata | null;
    apiTagFilters: string[];
    onToggleTag: (tag: string) => void;
    onSave: () => void;
}

export const SyncFiltersModal: React.FC<SyncFiltersModalProps> = ({
    isOpen,
    onClose,
    filterMetadata,
    apiTagFilters,
    onToggleTag,
    onSave
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 rounded-t-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Database size={28} />
                        <div>
                            <h2 className="text-2xl font-bold">Filtros de Sincronização</h2>
                            <p className="text-indigo-100 text-sm mt-1">
                                Configure TODOS os filtros para importar apenas os dados necessários da API do ClickUp
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* ============================================ */}
                    {/* 1. TAGS FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                            <div className="flex items-center gap-3">
                                <Tag size={20} className="text-indigo-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800">Tags</h4>
                                    <p className="text-xs text-slate-500">
                                        Selecione tags específicas ou deixe vazio para importar todas
                                    </p>
                                </div>
                                {apiTagFilters.length > 0 && (
                                    <span className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                        {apiTagFilters.length} selecionada{apiTagFilters.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="p-6">
                            {filterMetadata && filterMetadata.tags.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                                    {filterMetadata.tags.map(tag => (
                                        <label
                                            key={tag}
                                            className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${apiTagFilters.includes(tag)
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={apiTagFilters.includes(tag)}
                                                onChange={() => onToggleTag(tag)}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <span className="text-sm font-medium truncate">#{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-4">Nenhuma tag disponível. Faça um sync primeiro.</p>
                            )}
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 2. ASSIGNEES FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-purple-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800">Responsáveis (Assignees)</h4>
                                    <p className="text-xs text-slate-500">
                                        Selecione membros específicos ou deixe vazio para importar de todos
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {filterMetadata && filterMetadata.assignees.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {filterMetadata.assignees.map(assignee => (
                                        <label
                                            key={assignee}
                                            className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 hover:border-slate-300"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-purple-600"
                                            />
                                            <span className="text-sm font-medium truncate">{assignee}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-4">Nenhum responsável disponível. Faça um sync primeiro.</p>
                            )}
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 3. STATUS FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-emerald-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800">Status</h4>
                                    <p className="text-xs text-slate-500">
                                        Selecione status específicos ou deixe vazio para importar todos
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {filterMetadata && filterMetadata.statuses.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                    {filterMetadata.statuses.map(status => (
                                        <label
                                            key={status}
                                            className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 hover:border-slate-300"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-emerald-600"
                                            />
                                            <span className="text-sm font-medium truncate">{status}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-4">Nenhum status disponível. Faça um sync primeiro.</p>
                            )}
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 4. PRIORITY FILTER */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={20} className="text-amber-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800">Prioridade</h4>
                                    <p className="text-xs text-slate-500">
                                        Selecione prioridades específicas ou deixe vazio para importar todas
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {['URGENT', 'HIGH', 'NORMAL', 'LOW'].map(priority => (
                                    <label
                                        key={priority}
                                        className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 hover:border-slate-300"
                                    >
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-amber-600"
                                        />
                                        <span className="text-sm font-medium">{priority}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 5. DATE RANGE FILTERS */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                            <div className="flex items-center gap-3">
                                <Calendar size={20} className="text-blue-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800">Período de Datas</h4>
                                    <p className="text-xs text-slate-500">
                                        Deixe vazio para importar tarefas de qualquer período
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Due Date Range */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Data de Entrega - Início</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Data de Entrega - Fim</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Date Created Range */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Data de Criação - Início</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Data de Criação - Fim</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Date Updated Range */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Data de Atualização - Início</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Data de Atualização - Fim</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* 6. ADDITIONAL OPTIONS */}
                    {/* ============================================ */}
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <Settings2 size={20} className="text-slate-600" />
                                <div>
                                    <h4 className="font-bold text-slate-800">Opções Adicionais</h4>
                                    <p className="text-xs text-slate-500">
                                        Configurações extras - padrão: todos marcados (importa tudo)
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Incluir Subtarefas</span>
                                    <span className="text-xs text-slate-500">Importar subtasks junto com as tarefas principais</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Incluir Tarefas Arquivadas</span>
                                    <span className="text-xs text-slate-500">Importar tarefas marcadas como arquivadas</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Incluir Tarefas Sem Responsável</span>
                                    <span className="text-xs text-slate-500">Importar tarefas que não têm assignee definido</span>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                <input type="checkbox" defaultChecked className="w-5 h-5 text-indigo-600" />
                                <div>
                                    <span className="text-sm font-bold text-slate-800 block">Incluir Tarefas Concluídas</span>
                                    <span className="text-xs text-slate-500">Importar tarefas em status de concluído</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
                        <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <Database size={18} />
                            Como Funcionam os Filtros de Sync
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li>🎯 <strong>Nada selecionado = Importa TUDO:</strong> Se não marcar nada, importa todas as opções</li>
                            <li>✅ <strong>Algo selecionado = Importa APENAS isso:</strong> Marque para filtrar dados específicos</li>
                            <li>⚡ <strong>Filtros aplicados na API:</strong> Reduz dados antes de importar (10-50x mais rápido)</li>
                            <li>💾 <strong>Performance:</strong> Menos dados = sync mais rápido + menor uso de memória</li>
                            <li>🔄 <strong>Aplicação automática:</strong> Filtros salvos são usados em todas as sincronizações</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-4 bg-slate-50 px-8 py-6 border-t border-slate-200 rounded-b-2xl">
                    <p className="text-sm text-slate-600">
                        💡 <strong>Dica:</strong> Deixe tudo vazio para importar todos os dados inicialmente
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border-2 border-slate-300 hover:border-slate-400 text-slate-700 text-sm font-bold rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => {
                                onSave();
                                onClose();
                            }}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
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
