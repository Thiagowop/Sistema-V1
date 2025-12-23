/**
 * @id COMP-GFBAR-001
 * @name GlobalFilterBar
 * @description Barra visual indicando filtros globais ativos com opção de limpar
 * @dependencies GlobalFilterContext
 * @status active
 */

import React from 'react';
import { useGlobalFilters } from '../contexts/GlobalFilterContext';
import { X, Filter, Tag, CheckCircle, User, Folder } from 'lucide-react';

interface GlobalFilterBarProps {
    className?: string;
}

export const GlobalFilterBar: React.FC<GlobalFilterBarProps> = ({ className = '' }) => {
    const {
        filters,
        hasActiveFilters,
        setTagFilter,
        setStatusFilter,
        setProjectFilter,
        setAssigneeFilter,
        clearAllFilters
    } = useGlobalFilters();

    if (!hasActiveFilters) return null;

    const removeTag = (tag: string) => {
        setTagFilter(filters.tags.filter(t => t !== tag));
    };

    const removeStatus = (status: string) => {
        setStatusFilter(filters.statuses.filter(s => s !== status));
    };

    const removeProject = (project: string) => {
        setProjectFilter(filters.projects.filter(p => p !== project));
    };

    const removeAssignee = (assignee: string) => {
        setAssigneeFilter(filters.assignees.filter(a => a !== assignee));
    };

    return (
        <div className={`bg-indigo-50/80 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-3 flex-wrap ${className}`}>
            <div className="flex items-center gap-2 text-indigo-600">
                <Filter size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Filtros Ativos</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Tags */}
                {filters.tags.map(tag => (
                    <span
                        key={`tag-${tag}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium group cursor-pointer hover:bg-indigo-200 transition-colors"
                        onClick={() => removeTag(tag)}
                    >
                        <Tag size={12} />
                        {tag}
                        <X size={12} className="opacity-50 group-hover:opacity-100" />
                    </span>
                ))}

                {/* Statuses */}
                {filters.statuses.map(status => (
                    <span
                        key={`status-${status}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium group cursor-pointer hover:bg-emerald-200 transition-colors"
                        onClick={() => removeStatus(status)}
                    >
                        <CheckCircle size={12} />
                        {status}
                        <X size={12} className="opacity-50 group-hover:opacity-100" />
                    </span>
                ))}

                {/* Projects */}
                {filters.projects.map(project => (
                    <span
                        key={`project-${project}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium group cursor-pointer hover:bg-amber-200 transition-colors"
                        onClick={() => removeProject(project)}
                    >
                        <Folder size={12} />
                        {project}
                        <X size={12} className="opacity-50 group-hover:opacity-100" />
                    </span>
                ))}

                {/* Assignees */}
                {filters.assignees.map(assignee => (
                    <span
                        key={`assignee-${assignee}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium group cursor-pointer hover:bg-purple-200 transition-colors"
                        onClick={() => removeAssignee(assignee)}
                    >
                        <User size={12} />
                        {assignee}
                        <X size={12} className="opacity-50 group-hover:opacity-100" />
                    </span>
                ))}
            </div>

            {/* Clear All Button */}
            <button
                onClick={clearAllFilters}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1"
            >
                <X size={14} />
                Limpar Todos
            </button>
        </div>
    );
};

export default GlobalFilterBar;
