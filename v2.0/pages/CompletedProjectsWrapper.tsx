/**
 * @id COMPLETED-001
 * @name CompletedProjectsWrapper
 * @description Wrapper for completed projects using DataContext
 */

import React from 'react';
import { useData } from '../contexts/DataContext';
import { Archive, RefreshCw, AlertCircle } from 'lucide-react';

// Re-export the original component with DataContext integration
export const CompletedProjectsWrapper: React.FC = () => {
    const { groupedData, syncState } = useData();

    const hasData = groupedData && groupedData.length > 0;

    // Filter to only show completed tasks
    const completedData = React.useMemo(() => {
        if (!groupedData) return [];

        return groupedData.map(group => ({
            ...group,
            projects: group.projects.map(project => ({
                ...project,
                tasks: project.tasks.filter(task => {
                    const statusLower = task.status?.toLowerCase() || '';
                    return statusLower.includes('conclu') ||
                        statusLower.includes('done') ||
                        statusLower.includes('complete') ||
                        statusLower.includes('finalizado');
                })
            })).filter(project => project.tasks.length > 0)
        })).filter(group => group.projects.length > 0);
    }, [groupedData]);

    const [selectedMember, setSelectedMember] = React.useState<string | null>(null);
    const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = React.useState('');

    const toggleProject = (id: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Stats
    const memberStats = React.useMemo(() => {
        return completedData.map(group => {
            const taskCount = group.projects.reduce((acc, p) => acc + p.tasks.length, 0);
            const totalHours = group.projects.reduce((acc, p) =>
                acc + p.tasks.reduce((sum, t) => sum + (t.timeLogged || 0), 0), 0
            );
            return {
                name: group.assignee,
                projectCount: group.projects.length,
                taskCount,
                totalHours
            };
        });
    }, [completedData]);

    const filteredData = React.useMemo(() => {
        if (!searchQuery.trim()) return completedData;
        const query = searchQuery.toLowerCase();
        return completedData.map(group => ({
            ...group,
            projects: group.projects.filter(p =>
                p.name.toLowerCase().includes(query) ||
                p.tasks.some(t => t.name.toLowerCase().includes(query))
            )
        })).filter(g => g.projects.length > 0);
    }, [completedData, searchQuery]);

    const selectedGroup = selectedMember
        ? filteredData.find(g => g.assignee === selectedMember)
        : null;

    if (syncState.status === 'syncing') {
        return (
            <div className="h-full flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <RefreshCw size={48} className="mx-auto text-violet-500 animate-spin mb-4" />
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
                    <p className="text-slate-500 text-sm">Sincronize com o ClickUp na aba "Sync" primeiro.</p>
                </div>
            </div>
        );
    }

    const formatHours = (val: number) => {
        if (!val) return '-';
        return `${val.toFixed(0)}h`;
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-violet-100 rounded-xl text-violet-600">
                                <Archive size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">Projetos Arquivados</h1>
                                <p className="text-sm text-slate-500">Tarefas concluídas por membro</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative max-w-xs w-full">
                            <input
                                type="text"
                                placeholder="Buscar projetos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>
                </div>

                {completedData.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Archive className="w-10 h-10 text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">Nenhum projeto arquivado</p>
                        <p className="text-sm text-slate-400 mt-1">Tarefas concluídas aparecerão aqui</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Members List */}
                        <div className="lg:col-span-1 space-y-3">
                            <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">
                                Membros ({memberStats.length})
                            </h3>
                            <div className="space-y-2">
                                {memberStats.map((member) => (
                                    <button
                                        key={member.name}
                                        onClick={() => setSelectedMember(
                                            selectedMember === member.name ? null : member.name
                                        )}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${selectedMember === member.name
                                                ? 'border-violet-500 bg-violet-50 shadow-lg'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${selectedMember === member.name
                                                    ? 'bg-violet-500 text-white'
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {member.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 truncate">{member.name}</h4>
                                                <p className="text-xs text-slate-500">{member.projectCount} projetos</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                                                <p className="text-[10px] text-slate-400 uppercase">Tarefas</p>
                                                <p className="font-bold text-emerald-600">{member.taskCount}</p>
                                            </div>
                                            <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                                                <p className="text-[10px] text-slate-400 uppercase">Horas</p>
                                                <p className="font-bold text-sky-600">{formatHours(member.totalHours)}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Projects List */}
                        <div className="lg:col-span-3">
                            {selectedGroup ? (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-700">
                                        Projetos de {selectedGroup.assignee} ({selectedGroup.projects.length})
                                    </h3>

                                    {selectedGroup.projects.map(project => {
                                        const uniqueId = `${selectedGroup.assignee}-${project.name}`;
                                        const isExpanded = expandedProjects.has(uniqueId);
                                        const totalLogged = project.tasks.reduce((sum, t) => sum + (t.timeLogged || 0), 0);

                                        return (
                                            <div key={uniqueId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                                <button
                                                    onClick={() => toggleProject(uniqueId)}
                                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            <Archive size={16} />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-800">{project.name}</span>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                                    ✓ Concluído
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-slate-700">{project.tasks.length} tarefas</p>
                                                        <p className="text-xs text-slate-400">{totalLogged.toFixed(1)}h registradas</p>
                                                    </div>
                                                </button>

                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 p-4 space-y-2">
                                                        {project.tasks.map(task => (
                                                            <div key={task.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                                                                    <span className="text-sm text-slate-600">{task.name}</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-400">{formatHours(task.timeLogged || 0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center bg-white rounded-2xl border border-slate-200">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <Archive className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-lg font-medium text-slate-600">Selecione um membro</p>
                                    <p className="text-sm text-slate-400 mt-1">Clique em um membro para ver projetos arquivados</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompletedProjectsWrapper;
