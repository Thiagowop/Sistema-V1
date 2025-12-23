/**
 * @id FILTER-TAG-001
 * @name TagSelector
 * @description Componente reutilizável para seleção de tags
 * Pode ser usado em qualquer contexto (sync filters, local filters, etc)
 */

import React, { useState, useMemo } from 'react';
import { Tag, Search, X, Check } from 'lucide-react';

export interface TagSelectorProps {
    selectedTags: string[];
    availableTags: string[];
    onTagsChange: (tags: string[]) => void;
    placeholder?: string;
    maxHeight?: string;
    showSearch?: boolean;
    showSelectedCount?: boolean;
    variant?: 'default' | 'compact' | 'inline';
    className?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
    selectedTags,
    availableTags,
    onTagsChange,
    placeholder = 'Buscar tags...',
    maxHeight = '200px',
    showSearch = true,
    showSelectedCount = true,
    variant = 'default',
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTags = useMemo(() => {
        if (!searchTerm) return availableTags;
        const lower = searchTerm.toLowerCase();
        return availableTags.filter(tag => tag.toLowerCase().includes(lower));
    }, [availableTags, searchTerm]);

    const toggleTag = (tag: string) => {
        const lower = tag.toLowerCase();
        if (selectedTags.includes(lower)) {
            onTagsChange(selectedTags.filter(t => t !== lower));
        } else {
            onTagsChange([...selectedTags, lower]);
        }
    };

    const clearAll = () => {
        onTagsChange([]);
    };

    // Variant: Compact (chips only)
    if (variant === 'compact') {
        return (
            <div className={`flex flex-wrap gap-1.5 ${className}`}>
                {availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.toLowerCase());
                    return (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${isSelected
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            #{tag}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Variant: Inline (horizontal scrollable)
    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-2 overflow-x-auto pb-1 ${className}`}>
                <Tag size={16} className="text-slate-400 shrink-0" />
                {availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.toLowerCase());
                    return (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all ${isSelected
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300'
                                }`}
                        >
                            #{tag}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Variant: Default (full card with search)
    return (
        <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Tag size={18} className="text-indigo-600" />
                    <span className="font-bold text-slate-800">Tags</span>
                    {showSelectedCount && selectedTags.length > 0 && (
                        <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {selectedTags.length}
                        </span>
                    )}
                </div>
                {selectedTags.length > 0 && (
                    <button
                        onClick={clearAll}
                        className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1"
                    >
                        <X size={12} />
                        Limpar
                    </button>
                )}
            </div>

            {/* Search */}
            {showSearch && (
                <div className="px-4 py-2 border-b border-slate-100">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={placeholder}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}

            {/* Tags List */}
            <div className="p-4" style={{ maxHeight, overflowY: 'auto' }}>
                {filteredTags.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                        {searchTerm ? 'Nenhuma tag encontrada' : 'Nenhuma tag disponível'}
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {filteredTags.map(tag => {
                            const isSelected = selectedTags.includes(tag.toLowerCase());
                            return (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`group flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition-all ${isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
                                        }`}
                                >
                                    {isSelected && <Check size={14} />}
                                    <span>#{tag}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selected Preview */}
            {selectedTags.length > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Selecionadas:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedTags.map(tag => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                            >
                                #{tag}
                                <button onClick={() => toggleTag(tag)} className="hover:text-rose-600">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TagSelector;
