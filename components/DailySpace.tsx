/**
 * @id DAILY-SPACE-001
 * @name DailySpace
 * @description Espaço pessoal do gestor com alertas, tarefas e mensagens
 * Migrado de Referencia/components/DailySpace.tsx
 */

import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Bell, CheckSquare, MessageSquare, Calendar, Clock, AlertTriangle,
    ArrowRight, CheckCircle2, Coffee, LayoutDashboard, Ban, Hourglass,
    AlertOctagon, Timer, RefreshCw
} from 'lucide-react';
import { getStatusColorClass, getPriorityColorClass, isCompleted } from '../constants/colors';

type TabKey = 'dashboard' | 'alerts' | 'tasks' | 'messages';

const getDaysDiff = (date1: Date, date2: Date) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

export const DailySpace: React.FC = () => {
    const { groupedData, syncState } = useData();
    const [activeTab, setActiveTab] = useState<TabKey>('dashboard');

    const hasData = groupedData && groupedData.length > 0;

    // Process metrics from real data
    const dashboardMetrics = useMemo(() => {
        const validationItems: any[] = [];
        const blockedItems: any[] = [];
        const overdueItems: any[] = [];
        const today = new Date();

        if (!groupedData) return { validationItems, blockedItems, overdueItems };

        groupedData.forEach(group => {
            group.projects.forEach(proj => {
                proj.tasks.forEach(task => {
                    const statusLower = task.status?.toLowerCase() || '';
                    if (isCompleted(task.status)) return;

                    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
                    const statusDate = task.startDate ? new Date(task.startDate) : new Date();

                    // Validation
                    if (statusLower.includes('valid') || statusLower.includes('review') || statusLower.includes('homolog')) {
                        const daysInValidation = getDaysDiff(today, statusDate);
                        const validationDeadline = dueDate || new Date(statusDate.getTime() + (3 * 24 * 60 * 60 * 1000));
                        const isStalled = today > validationDeadline;

                        validationItems.push({
                            ...task,
                            assignee: group.assignee,
                            projectName: proj.name,
                            daysInStatus: daysInValidation,
                            deadline: validationDeadline,
                            isStalled
                        });
                    }
                    // Blocked
                    else if (statusLower.includes('bloq') || statusLower.includes('block') || statusLower.includes('impedido')) {
                        const daysBlocked = getDaysDiff(today, statusDate);
                        blockedItems.push({
                            ...task,
                            assignee: group.assignee,
                            projectName: proj.name,
                            daysBlocked
                        });
                    }
                    // Overdue
                    else if (dueDate && dueDate < today) {
                        const daysLate = getDaysDiff(today, dueDate);
                        overdueItems.push({
                            ...task,
                            assignee: group.assignee,
                            projectName: proj.name,
                            daysLate
                        });
                    }
                });
            });
        });

        overdueItems.sort((a, b) => b.daysLate - a.daysLate);
        blockedItems.sort((a, b) => b.daysBlocked - a.daysBlocked);

        return { validationItems, blockedItems, overdueItems };
    }, [groupedData]);

    const alertsData = useMemo(() => {
        if (!groupedData) return [];
        const alerts: any[] = [];
        groupedData.forEach(group => {
            group.projects.forEach(proj => {
                proj.tasks.forEach(task => {
                    const priority = (task.priority || '').toLowerCase();
                    const isUrgent = priority.includes('0') || priority.includes('urgent');
                    const isDone = isCompleted(task.status);

                    if (!isDone && isUrgent) {
                        alerts.push({ ...task, source: group.assignee, projectName: proj.name });
                    }
                });
            });
        });
        return alerts;
    }, [groupedData]);

    const myTasksData = useMemo(() => {
        if (!groupedData) return [];
        const tasks: any[] = [];
        groupedData.forEach(group => {
            group.projects.forEach(proj => {
                proj.tasks.forEach(t => {
                    if (!isCompleted(t.status)) {
                        tasks.push({ ...t, project: proj.name, assignee: group.assignee });
                    }
                });
            });
        });
        return tasks.slice(0, 10); // Top 10
    }, [groupedData]);

    // Mock messages
    const messages = [
        { id: 1, from: 'Sistema', text: 'Sincronização realizada com sucesso.', time: 'Agora', unread: true },
        { id: 2, from: 'Daily Flow', text: 'Bem-vindo ao seu espaço pessoal!', time: 'Hoje', unread: false },
    ];
    const unreadMessages = messages.filter(m => m.unread).length;

    const TabButton = ({ id, label, badge, icon: Icon }: { id: TabKey, label: string, badge?: number, icon: any }) => {
        const isActive = activeTab === id;
        return (
            <button
                onClick={() => setActiveTab(id)}
                className={`
                    relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                    ${isActive
                        ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                    }
                `}
            >
                <Icon size={16} className={isActive ? 'text-indigo-600' : ''} />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                    <span className={`
                        flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full leading-none transition-colors
                        ${isActive ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"}
                    `}>
                        {badge > 99 ? "99+" : badge}
                    </span>
                )}
            </button>
        );
    };

    if (syncState?.status === 'syncing') {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw size={48} className="mx-auto text-indigo-500 animate-spin mb-4" />
                    <p className="text-slate-600 font-medium">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center max-w-md">
                    <Coffee size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Sem dados para exibir</h3>
                    <p className="text-slate-500 text-sm">Sincronize na aba "Sync" para visualizar seu dashboard.</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Validation */}
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-indigo-50 bg-indigo-50/50 flex justify-between items-center">
                                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                    <CheckCircle2 className="text-indigo-600" size={20} />
                                    Em Validação / Homologação
                                </h3>
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                    {dashboardMetrics.validationItems.length} itens
                                </span>
                            </div>
                            <div className="divide-y divide-indigo-50/50 max-h-[300px] overflow-y-auto">
                                {dashboardMetrics.validationItems.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">
                                        Nenhum projeto em validação no momento.
                                    </div>
                                ) : (
                                    dashboardMetrics.validationItems.slice(0, 5).map((item, idx) => (
                                        <div key={idx} className="p-4 hover:bg-indigo-50/30 transition-colors flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                                                    <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border">{item.projectName}</span>
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> Há <strong>{item.daysInStatus} dias</strong>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {item.isStalled ? (
                                                    <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                                        <AlertOctagon size={14} />
                                                        <span className="text-xs font-bold">Atrasado</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                                        <Timer size={14} />
                                                        <span className="text-xs font-bold">No Prazo</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Blocked */}
                            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-rose-50 bg-rose-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-rose-900 flex items-center gap-2">
                                        <Ban className="text-rose-600" size={20} />
                                        Bloqueados / Impedidos
                                    </h3>
                                    <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {dashboardMetrics.blockedItems.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-rose-50/50 max-h-[250px] overflow-y-auto">
                                    {dashboardMetrics.blockedItems.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-sm">Nenhum bloqueio.</div>
                                    ) : (
                                        dashboardMetrics.blockedItems.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="p-4 hover:bg-rose-50/30 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-700 text-sm line-clamp-1">{item.name}</span>
                                                    <span className="text-xs font-bold text-rose-600">Há {item.daysBlocked} dias</span>
                                                </div>
                                                <p className="text-xs text-slate-500">{item.projectName} • {item.assignee}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Overdue */}
                            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-amber-50 bg-amber-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-amber-900 flex items-center gap-2">
                                        <AlertTriangle className="text-amber-600" size={20} />
                                        Projetos Atrasados
                                    </h3>
                                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                                        {dashboardMetrics.overdueItems.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-amber-50/50 max-h-[250px] overflow-y-auto">
                                    {dashboardMetrics.overdueItems.length === 0 ? (
                                        <div className="p-6 text-center text-slate-400 text-sm">Tudo em dia!</div>
                                    ) : (
                                        dashboardMetrics.overdueItems.slice(0, 5).map((item, idx) => (
                                            <div key={idx} className="p-4 hover:bg-amber-50/30 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-slate-700 text-sm line-clamp-1">{item.name}</span>
                                                    <span className="text-xs font-bold text-amber-600">+{item.daysLate} dias</span>
                                                </div>
                                                <p className="text-xs text-slate-500 mb-2">{item.projectName} • {item.assignee}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Calendar size={12} />
                                                    Era para: {item.dueDate ? new Date(item.dueDate).toLocaleDateString('pt-BR') : '-'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'alerts':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="text-rose-500" />
                                Atenção Necessária
                            </h2>
                        </div>

                        <div className="grid gap-3">
                            {alertsData.length === 0 ? (
                                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                                    <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-200" />
                                    Tudo tranquilo. Sem alertas críticos.
                                </div>
                            ) : (
                                alertsData.slice(0, 5).map((alert, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-start gap-4">
                                        <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                                            <AlertTriangle size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800 text-sm">{alert.name}</h4>
                                                <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">URGENTE</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{alert.projectName} • {alert.source}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'tasks':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <CheckSquare className="text-indigo-500" />
                                Tarefas Recentes
                            </h2>
                        </div>

                        <div className="grid gap-3">
                            {myTasksData.length === 0 ? (
                                <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 flex flex-col items-center">
                                    <Coffee size={40} className="mb-3 text-slate-300" />
                                    <p>Nenhuma tarefa pendente.</p>
                                </div>
                            ) : (
                                myTasksData.map((task, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 transition-all">
                                        <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-700 text-sm">{task.name}</h4>
                                            <p className="text-xs text-slate-500">{task.project} • {task.assignee}</p>
                                        </div>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColorClass(task.status)}`}>
                                            {task.status || 'Novo'}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                );

            case 'messages':
                return (
                    <div className="space-y-4 animate-fadeIn">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <MessageSquare className="text-sky-500" />
                            Comunicações
                        </h2>

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors ${msg.unread ? 'bg-sky-50/30' : ''}`}>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                                        {msg.from.substring(0, 2)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className={`text-sm font-bold ${msg.unread ? 'text-slate-900' : 'text-slate-600'}`}>{msg.from}</span>
                                            <span className="text-[10px] text-slate-400">{msg.time}</span>
                                        </div>
                                        <p className={`text-xs mt-1 ${msg.unread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                                            {msg.text}
                                        </p>
                                    </div>
                                    {msg.unread && <div className="w-2 h-2 rounded-full bg-sky-500 self-center"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#F8FAFC] animate-fadeIn p-6 md:p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Bom dia, Gestor.</h1>
                <p className="text-slate-500 text-sm">Aqui está o resumo do que requer sua atenção hoje.</p>
            </div>

            <div className="max-w-4xl">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100/80 rounded-2xl w-fit">
                    <TabButton id="dashboard" label="Dashboard" icon={LayoutDashboard} />
                    <TabButton id="alerts" label="Alertas & Riscos" badge={alertsData.length} icon={Bell} />
                    <TabButton id="tasks" label="Minhas Tarefas" badge={myTasksData.length} icon={CheckSquare} />
                    <TabButton id="messages" label="Mensagens" badge={unreadMessages} icon={MessageSquare} />
                </div>

                {/* Content */}
                <div>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default DailySpace;
