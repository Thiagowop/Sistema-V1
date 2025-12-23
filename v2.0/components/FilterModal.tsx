/**
 * @id COMP-FILTMODAL-001
 * @name FilterModal
 * @description Modal limpo e organizado para seleção de filtros globais
 * @dependencies GlobalFilterContext
 */

import React, { useState, useMemo } from 'react';
import { X, Search, Tag, CheckCircle, Users, FolderOpen, RotateCcw } from 'lucide-react';
import { useGlobalFilters } from '../contexts/GlobalFilterContext';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type FilterTab = 'tags' | 'status' | 'assignees' | 'projects';

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose }) => {
    const {
        filters,
        availableOptions,
        setTagFilter,
        setStatusFilter,
        setAssigneeFilter,
        setProjectFilter,
        clearAllFilters,
        hasActiveFilters
    } = useGlobalFilters();

    const [activeTab, setActiveTab] = useState<FilterTab>('tags');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const toggleItem = (list: string[], item: string, setter: (items: string[]) => void) => {
        const lower = item.toLowerCase();
        if (list.includes(lower)) {
            setter(list.filter(i => i !== lower));
        } else {
            setter([...list, lower]);
        }
    };

    // Filter items based on search
    const filterItems = (items: string[]) => {
        if (!searchQuery) return items;
        return items.filter(item =>
            item.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const tabs = [
        { id: 'tags' as FilterTab, label: 'Tags', icon: Tag, color: 'indigo', count: filters.tags.length },
        { id: 'status' as FilterTab, label: 'Status', icon: CheckCircle, color: 'emerald', count: filters.statuses.length },
        { id: 'assignees' as FilterTab, label: 'Equipe', icon: Users, color: 'purple', count: filters.assignees.length },
        { id: 'projects' as FilterTab, label: 'Projetos', icon: FolderOpen, color: 'amber', count: filters.projects.length },
    ];

    const currentTab = tabs.find(t => t.id === activeTab)!;
    const totalFilters = filters.tags.length + filters.statuses.length + filters.assignees.length + filters.projects.length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Filtros Globais</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Selecione os filtros para aplicar em todas as views
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasActiveFilters && (
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                                {totalFilters} ativo{totalFilters > 1 ? 's' : ''}
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 px-6 pt-4 border-b border-slate-200">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchQuery('');
                            }}
                            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all relative ${activeTab === tab.id
                                    ? 'text-slate-800'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                                        ? `bg-${tab.color}-100 text-${tab.color}-700`
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-${tab.color}-600`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="px-6 pt-4">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={`Buscar ${currentTab.label.toLowerCase()}...`}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'tags' && (
                        <FilterSection
                            items={filterItems(availableOptions?.tags || [])}
                            selectedItems={filters.tags}
                            onToggle={(item) => toggleItem(filters.tags, item, setTagFilter)}
                            color={currentTab.color}
                            emptyMessage="Nenhuma tag disponível. Faça um sync primeiro."
                            prefix="#"
                        />
                    )}

                    {activeTab === 'status' && (
                        <FilterSection
                            items={filterItems(availableOptions?.statuses || [])}
                            selectedItems={filters.statuses}
                            onToggle={(item) => toggleItem(filters.statuses, item, setStatusFilter)}
                            color={currentTab.color}
                            emptyMessage="Nenhum status disponível. Faça um sync primeiro."
                        />
                    )}

                    {activeTab === 'assignees' && (
                        <FilterSection
                            items={filterItems(availableOptions?.assignees || [])}
                            selectedItems={filters.assignees}
                            onToggle={(item) => toggleItem(filters.assignees, item, setAssigneeFilter)}
                            color={currentTab.color}
                            emptyMessage="Nenhum membro disponível. Faça um sync primeiro."
                        />
                    )}

                    {activeTab === 'projects' && (
                        <FilterSection
                            items={filterItems(availableOptions?.projects || [])}
                            selectedItems={filters.projects}
                            onToggle={(item) => toggleItem(filters.projects, item, setProjectFilter)}
                            color={currentTab.color}
                            emptyMessage="Nenhum projeto disponível. Faça um sync primeiro."
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={clearAllFilters}
                        disabled={!hasActiveFilters}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <RotateCcw size={14} />
                        Limpar Todos
                    </button>

                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                            ✓ Salvos automaticamente
                        </span>
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for filter sections
const FilterSection: React.FC<{
    items: string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    color: string;
    emptyMessage: string;
    prefix?: string;
}> = ({ items, selectedItems, onToggle, color, emptyMessage, prefix = '' }) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-400">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {items.map(item => {
                const isSelected = selectedItems.includes(item.toLowerCase());
                return (
                    <button
                        key={item}
                        onClick={() => onToggle(item)}
                        className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${isSelected
                                ? `bg-${color}-500 border-${color}-500 text-white`
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                    >
                        {prefix}{item}
                    </button>
                );
            })}
        </div>
    );
};

export default FilterModal;
