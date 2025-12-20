/**
 * @id DAILY-DASH-001
 * @name DailyDashboard
 * @description Dashboard completo de alinhamento diário com todos os recursos
 * Baseado em DailyAlignmentDashboard do Referencia + TaskTable da raiz
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
    ChevronDown, AlertTriangle, Calendar, Clock, Flag, Layers,
    CheckCircle2, Settings, Plus, RotateCw, Info
} from 'lucide-react';
import { getStatusColorClass, getPriorityColorClass, isCompleted } from '../constants/colors';
import Tooltip from './Tooltip';

// Helper functions
const formatDate = (dateString?: string | null | Date) => {
    if (!dateString) return '--/--';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatHours = (val?: number) => {
    if (val === undefined || val === 0) return '-';
    const h = Math.floor(val);
    const m = Math.round((val - h) * 60);
    if (m === 0) return `${h}h`;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
};

const getDaysRemaining = (dueDate?: Date | string | null): number | null => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
};

export const DailyDashboard: React.FC = () => {
    const { groupedData, syncState } = useData();
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
    const [showTasks, setShowTasks] = useState(true);
    const [showSubtasks, setShowSubtasks] = useState(true);
    const [showCompleted, setShowCompleted] = useState(false);

    const hasData = groupedData && groupedData.length > 0;

    const toggleProject = (id: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Filter tasks based on toggles
    const filterTasks = (tasks: any[]) => {
        return tasks.filter(task => {
            const isDone = isCompleted(task.status);
            const isSubtask = task.isSubtask;

            if (isDone && !showCompleted) return false;
            if (isSubtask && !showSubtasks) return false;
            if (!isSubtask && !showTasks) return false;

            return true;
        });
    };

    if (syncState?.status === 'syncing') {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <RotateCw size={48} className="mx-auto text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                    <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Sem dados para exibir</h3>
                    <p className="text-slate-500 text-sm">Sincronize na aba "Sync" para visualizar as tarefas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] font-sans">
            {/* HEADER */}
            <div className="bg-white px-6 py-4 border-b border-slate-100 flex flex-col gap-4 shrink-0 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">Alinhamento Diário</h1>
                        <button
                            onClick={() => window.location.reload()}
                            className="p-2 rounded-full text-slate-400 hover:bg-slate-50 transition-all hover:rotate-180 duration-500"
                        >
                            <RotateCw size={18} />
                        </button>
                    </div>

                    {/* Toggles */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Tarefas</span>
                            <button
                                onClick={() => setShowTasks(!showTasks)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showTasks ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showTasks ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Subtarefas</span>
                            <button
                                onClick={() => setShowSubtasks(!showSubtasks)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showSubtasks ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showSubtasks ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500">Concluídas</span>
                            <button
                                onClick={() => setShowCompleted(!showCompleted)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showCompleted ? 'bg-indigo-600' : 'bg-slate-200'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCompleted ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid gap-6">
                    {groupedData.map((group, groupIdx) => (
                        group.projects.map((project, projIdx) => {
                            const uniqueId = `${group.assignee}-${project.name}`;
                            const isExpanded = expandedProjects.has(uniqueId);

                            // Flatten tasks with subtasks
                            const allTasks: any[] = [];
                            project.tasks.forEach(task => {
                                allTasks.push(task);
                                if (task.subtasks && task.subtasks.length > 0) {
                                    task.subtasks.forEach((sub: any) => {
                                        allTasks.push({ ...sub, isSubtask: true, parentName: task.name });
                                    });
                                }
                            });

                            const filteredTasks = filterTasks(allTasks);

                            if (filteredTasks.length === 0) return null;

                            return (
                                <div key={uniqueId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                    {/* Project Header */}
                                    <div
                                        onClick={() => toggleProject(uniqueId)}
                                        className="bg-slate-800 px-6 py-4 flex items-center justify-between cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white/20 rounded-xl text-white">
                                                <Layers size={20} />
                                            </div>
                                            <h3 className="text-white font-black text-lg tracking-tight uppercase">
                                                {project.name}
                                            </h3>
                                            <span className="bg-white/10 text-white/80 text-[10px] font-black px-3 py-1 rounded-full border border-white/10 tracking-widest">
                                                {filteredTasks.length} TAREFAS
                                            </span>
                                            <span className="bg-white/10 text-white/80 text-[10px] font-black px-3 py-1 rounded-full border border-white/10">
                                                {group.assignee}
                                            </span>
                                        </div>
                                        <ChevronDown className={`text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>

                                    {/* Tasks Table */}
                                    {isExpanded && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        <th className="px-8 py-4">Nome da Tarefa</th>
                                                        <th className="px-4 py-4">Cronograma</th>
                                                        <th className="px-4 py-4">Tempo Estimado/Gasto</th>
                                                        <th className="px-4 py-4 text-center">Status</th>
                                                        <th className="px-8 py-4 text-right">Prio</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {filteredTasks.map((task, taskIdx) => {
                                                        const isDone = isCompleted(task.status);
                                                        const effortPct = (task.timeEstimate && task.timeLogged)
                                                            ? (task.timeLogged / task.timeEstimate) * 100
                                                            : 0;
                                                        const overflow = (task.timeLogged || 0) - (task.timeEstimate || 0);
                                                        const remaining = (task.timeEstimate || 0) - (task.timeLogged || 0);
                                                        const daysLeft = getDaysRemaining(task.dueDate);
                                                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

                                                        return (
                                                            <tr key={task.id || taskIdx} className="hover:bg-indigo-50/20 transition-all group">
                                                                {/* Task Name + Tooltip */}
                                                                <td className="px-8 py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]'}`} />
                                                                        <span className={`text-sm font-bold tracking-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                                                            {task.isSubtask && '└ '}{task.name}
                                                                        </span>
                                                                        <Tooltip content={task.description} />
                                                                    </div>
                                                                </td>

                                                                {/* Dates with tooltip */}
                                                                <td className="px-4 py-5">
                                                                    <div className="flex flex-col gap-1">
                                                                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                                            <Calendar size={10} /> {formatDate(task.startDate)}
                                                                        </span>
                                                                        <div
                                                                            className={`text-[10px] font-black flex items-center gap-1 ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}
                                                                            title={daysLeft !== null ? `Restam ${daysLeft} dias` : ''}
                                                                        >
                                                                            <Clock size={10} />
                                                                            {formatDate(task.dueDate)}
                                                                            {isOverdue && <span className="ml-1 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-black">ATRASADO</span>}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                {/* Time with progress bar, overflow badge, and RESTAM */}
                                                                <td className="px-4 py-5">
                                                                    <div className="flex flex-col gap-1.5 w-40">
                                                                        <div className="flex justify-between text-[10px] font-bold items-center">
                                                                            <span className="text-slate-600">{formatHours(task.timeLogged || 0)}</span>
                                                                            <span className="text-slate-400">/ {formatHours(task.timeEstimate || 0)}</span>
                                                                            {overflow > 0 && (
                                                                                <div className="flex items-center gap-0.5 bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md ml-2">
                                                                                    <AlertTriangle size={10} />
                                                                                    <span className="text-[9px] font-black">+{formatHours(overflow)}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full transition-all duration-500 ${effortPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                                                                style={{ width: `${Math.min(effortPct, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        {remaining > 0 && !isDone && (
                                                                            <div className="text-[10px] text-slate-500 font-bold">
                                                                                RESTAM {formatHours(remaining)}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                {/* Status Badge */}
                                                                <td className="px-4 py-5 text-center">
                                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColorClass(task.status)}`}>
                                                                        {task.status}
                                                                    </span>
                                                                </td>

                                                                {/* Priority Bars */}
                                                                <td className="px-8 py-5 text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        {Array.from({ length: 4 - parseInt(task.priority || '4') }).map((_, i) => (
                                                                            <div key={i} className="w-1.5 h-3 rounded-full bg-rose-500 opacity-80 shadow-sm" />
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DailyDashboard;
