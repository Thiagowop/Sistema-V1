/**
 * @id FILTER-ASSIGNEE-001
 * @name AssigneeSelector
 * @description Componente reutilizável para seleção de responsáveis/membros da equipe
 * Inclui avatar placeholder e busca
 */

import React, { useState, useMemo } from 'react';
import { Users, Search, X, Check, User } from 'lucide-react';

// Gerar iniciais do nome
const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Gerar cor baseada no nome (consistente)
const getAvatarColor = (name: string): string => {
    const colors = [
        'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
        'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500',
        'bg-amber-500', 'bg-orange-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
};

export interface AssigneeSelectorProps {
    selectedAssignees: string[];
    availableAssignees: string[];
    onAssigneesChange: (assignees: string[]) => void;
    placeholder?: string;
    maxHeight?: string;
    showSearch?: boolean;
    showSelectedCount?: boolean;
    variant?: 'default' | 'compact' | 'avatars';
    className?: string;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
    selectedAssignees,
    availableAssignees,
    onAssigneesChange,
    placeholder = 'Buscar membros...',
    maxHeight = '200px',
    showSearch = true,
    showSelectedCount = true,
    variant = 'default',
    className = ''
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAssignees = useMemo(() => {
        if (!searchTerm) return availableAssignees;
        const lower = searchTerm.toLowerCase();
        return availableAssignees.filter(a => a.toLowerCase().includes(lower));
    }, [availableAssignees, searchTerm]);

    const toggleAssignee = (assignee: string) => {
        const lower = assignee.toLowerCase();
        if (selectedAssignees.includes(lower)) {
            onAssigneesChange(selectedAssignees.filter(a => a !== lower));
        } else {
            onAssigneesChange([...selectedAssignees, lower]);
        }
    };

    const clearAll = () => {
        onAssigneesChange([]);
    };

    // Variant: Compact (simple list)
    if (variant === 'compact') {
        return (
            <div className={`flex flex-wrap gap-1.5 ${className}`}>
                {availableAssignees.map(assignee => {
                    const isSelected = selectedAssignees.includes(assignee.toLowerCase());
                    return (
                        <button
                            key={assignee}
                            onClick={() => toggleAssignee(assignee)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all ${isSelected
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            @{assignee}
                        </button>
                    );
                })}
            </div>
        );
    }

    // Variant: Avatars (circular avatars)
    if (variant === 'avatars') {
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                {availableAssignees.map(assignee => {
                    const isSelected = selectedAssignees.includes(assignee.toLowerCase());
                    const initials = getInitials(assignee);
                    const color = getAvatarColor(assignee);
                    return (
                        <button
                            key={assignee}
                            onClick={() => toggleAssignee(assignee)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all ${isSelected
                                    ? 'bg-purple-50 border-purple-500'
                                    : 'bg-white border-slate-200 hover:border-purple-300'
                                }`}
                            title={assignee}
                        >
                            <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>
                                {initials}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-purple-700' : 'text-slate-600'}`}>
                                {assignee}
                            </span>
                            {isSelected && <Check size={14} className="text-purple-500" />}
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
                    <Users size={18} className="text-purple-600" />
                    <span className="font-bold text-slate-800">Responsáveis</span>
                    {showSelectedCount && selectedAssignees.length > 0 && (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                            {selectedAssignees.length}
                        </span>
                    )}
                </div>
                {selectedAssignees.length > 0 && (
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
                            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                        />
                    </div>
                </div>
            )}

            {/* Assignees List */}
            <div className="p-2" style={{ maxHeight, overflowY: 'auto' }}>
                {filteredAssignees.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                        {searchTerm ? 'Nenhum membro encontrado' : 'Nenhum membro disponível'}
                    </p>
                ) : (
                    <div className="space-y-1">
                        {filteredAssignees.map(assignee => {
                            const isSelected = selectedAssignees.includes(assignee.toLowerCase());
                            const initials = getInitials(assignee);
                            const color = getAvatarColor(assignee);
                            return (
                                <button
                                    key={assignee}
                                    onClick={() => toggleAssignee(assignee)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isSelected
                                            ? 'bg-purple-50'
                                            : 'hover:bg-slate-50'
                                        }`}
                                >
                                    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                        {initials}
                                    </div>
                                    <span className={`font-medium text-left ${isSelected ? 'text-purple-700' : 'text-slate-700'}`}>
                                        {assignee}
                                    </span>
                                    {isSelected && (
                                        <Check size={18} className="ml-auto text-purple-500" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selected Preview */}
            {selectedAssignees.length > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">Selecionados:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {selectedAssignees.map(assignee => (
                            <span
                                key={assignee}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                            >
                                @{assignee}
                                <button onClick={() => toggleAssignee(assignee)} className="hover:text-rose-600">
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

export default AssigneeSelector;
