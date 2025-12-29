/**
 * @id PAGE-SYNC-001
 * @name SyncDashboard
 * @description Dashboard de sincronização estilo "Command Center"
 * @dependencies CTX-DATA-001, lucide-react
 * @status active
 * @version 2.3.1 (Title Localization)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Database,
    RefreshCw,
    CheckCircle2,
    ToggleRight,
    ToggleLeft,
    DownloadCloud,
    Activity,
    Loader2,
    Layers,
    Users,
    AlertTriangle,
    Trash2,
    Zap,
    Filter,
    Tag,
    X,
    Play,
    Terminal,
    Search,
    WifiOff,
    ShieldAlert,
    FileWarning,
    RefreshCcw,
    HelpCircle,
    StopCircle
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { createDefaultSyncFilters } from '../services/filterService';

const AUTOSYNC_KEY = 'dailyFlow_autoSync_v2';

const loadAutoSyncSetting = (): boolean => {
    try {
        const saved = localStorage.getItem(AUTOSYNC_KEY);
        if (saved !== null) return JSON.parse(saved);
    } catch (e) { console.warn(e); }
    return false;
};

const saveAutoSyncSetting = (value: boolean): void => {
    try {
        localStorage.setItem(AUTOSYNC_KEY, JSON.stringify(value));
    } catch (e) { console.warn(e); }
};

// --- Error Handling Helpers ---
interface ErrorDetail {
    title: string;
    message: string;
    solution: string;
    icon: React.ElementType;
    color: string;
}

const getErrorDetails = (errorMsg: string = ''): ErrorDetail => {
    const err = errorMsg.toLowerCase();

    if (err.includes('network') || err.includes('fetch') || err.includes('internet')) {
        return {
            title: 'Falha de Conexão',
            message: 'Não foi possível contatar o servidor.',
            solution: 'Verifique sua conexão Wi-Fi ou VPN e tente novamente.',
            icon: WifiOff,
            color: 'text-rose-500'
        };
    }

    if (err.includes('auth') || err.includes('401') || err.includes('403') || err.includes('token')) {
        return {
            title: 'Sessão Expirada',
            message: 'Suas credenciais de acesso são inválidas.',
            solution: 'Faça logout e login novamente para renovar o token.',
            icon: ShieldAlert,
            color: 'text-amber-500'
        };
    }

    if (err.includes('timeout') || err.includes('504')) {
        return {
            title: 'Tempo Excedido',
            message: 'O servidor demorou muito para responder.',
            solution: 'Tente uma sincronização incremental (mais leve).',
            icon: Activity,
            color: 'text-orange-500'
        };
    }

    if (err.includes('json') || err.includes('parse')) {
        return {
            title: 'Dados Corrompidos',
            message: 'A resposta do servidor veio em formato inválido.',
            solution: 'Limpe o cache local usando o botão de lixeira.',
            icon: FileWarning,
            color: 'text-purple-500'
        };
    }

    return {
        title: 'Erro no Processo',
        message: errorMsg || 'Ocorreu um erro desconhecido.',
        solution: 'Tente novamente. Se persistir, contate o suporte.',
        icon: AlertTriangle,
        color: 'text-rose-500'
    };
};

export const SyncDashboard: React.FC = () => {
    const {
        syncState,
        syncFull,
        syncIncremental,
        cancelSync,
        clearCache,
        metadata,
        isInitialized,
        hasCacheData,
        syncFilters,
        setSyncFilters,
        saveToSharedCache
    } = useData();

    const { auth } = useAuth();

    // Session logic for auto-sync
    const getSessionAutoSyncFlag = () => sessionStorage.getItem('hasAttemptedAutoSync') === 'true';
    const setSessionAutoSyncFlag = (value: boolean) => sessionStorage.setItem('hasAttemptedAutoSync', String(value));

    const [autoSync, setAutoSync] = useState<boolean>(loadAutoSyncSetting);
    const [logs, setLogs] = useState<string[]>([]);
    const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(getSessionAutoSyncFlag);
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);

    const logsEndRef = useRef<HTMLDivElement>(null);

    const handleToggleAutoSync = () => {
        const newValue = !autoSync;
        setAutoSync(newValue);
        saveAutoSyncSetting(newValue);
    };

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    // Auto-Sync Logic
    useEffect(() => {
        if (!hasAttemptedAutoSync && isInitialized && autoSync) {
            setHasAttemptedAutoSync(true);
            setSessionAutoSyncFlag(true);

            if (hasCacheData && syncState.lastSync) {
                addLog("🔄 Auto-sync incremental iniciado...");
                syncIncremental();
            } else if (!hasCacheData) {
                addLog("🔄 Auto-sync completo iniciado...");
                syncFull();
            }
        }
    }, [hasAttemptedAutoSync, isInitialized, autoSync, hasCacheData, syncState.lastSync]);

    // Status Watcher & Error Logger
    useEffect(() => {
        if (syncState.status === 'syncing') {
            addLog(`Sincronizando... ${syncState.progress}%`);
        } else if (syncState.status === 'success') {
            addLog(`✓ Sincronização completa: ${syncState.taskCount} tarefas`);
        } else if (syncState.status === 'error' && syncState.error) {
            const diagnosis = getErrorDetails(syncState.error);
            addLog(`✗ FALHA: ${diagnosis.title}`);
            addLog(`! RECOMENDAÇÃO: ${diagnosis.solution}`);
        }
    }, [syncState.status, syncState.progress, syncState.taskCount, syncState.error]);

    // Auto-save to shared cache after successful sync (for team access)
    useEffect(() => {
        const saveToCloud = async () => {
            if (syncState.status === 'success' && syncState.taskCount > 0 && auth.user) {
                addLog('☁️ Salvando dados no cache compartilhado...');
                try {
                    const success = await saveToSharedCache(auth.user.name);
                    if (success) {
                        addLog('✓ Dados salvos no cache compartilhado para a equipe');
                    } else {
                        addLog('⚠️ Falha ao salvar no cache compartilhado');
                    }
                } catch (error: any) {
                    addLog(`⚠️ Erro ao salvar no cache: ${error.message}`);
                }
            }
        };

        saveToCloud();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncState.status, syncState.taskCount]);

    const handleSync = async (incremental: boolean = false) => {
        setLogs([]); // Clear logs on new attempt
        addLog(incremental ? "Iniciando sync incremental..." : "Iniciando sync completo...");

        if (syncFilters.tags.length > 0) addLog(`🏷️  Tags: ${syncFilters.tags.join(', ')}`);
        if (syncFilters.assignees.length > 0) addLog(`👥 Membros: ${syncFilters.assignees.join(', ')}`);

        try {
            if (incremental && syncState.lastSync) {
                await syncIncremental();
            } else {
                await syncFull();
            }
        } catch (e: any) {
            // Usually caught by context, but extra safety here
            const diag = getErrorDetails(e.message);
            addLog(`ERRO CRÍTICO: ${diag.message}`);
        }
    };

    const handleAddTag = (tag: string) => {
        const t = tag.trim().toLowerCase();
        if (t && !syncFilters.tags.includes(t)) {
            setSyncFilters({ ...syncFilters, tags: [...syncFilters.tags, t] });
        }
    };

    const handleRemoveTag = (tag: string) => {
        setSyncFilters({ ...syncFilters, tags: syncFilters.tags.filter(t => t !== tag) });
    };

    const isLoading = syncState.status === 'syncing';
    const isError = syncState.status === 'error';
    const errorDetails = isError ? getErrorDetails(syncState.error) : null;
    const hasActiveFilters = syncFilters.tags.length > 0 || syncFilters.assignees.length > 0;

    // Métricas
    const taskCount = syncState.taskCount || 0;
    const projectCount = metadata?.projects?.length || 0;
    const teamCount = metadata?.assignees?.length || 0;

    return (
        <div className="h-full w-full bg-slate-50 flex items-center justify-center p-4 md:p-8 overflow-y-auto">

            {/* Main Command Center Card - Fixed Height on Desktop */}
            <div className={`w-full max-w-5xl bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden border flex flex-col md:flex-row md:h-[600px] animate-fadeIn transition-all duration-500 ${isError ? 'border-rose-900/50 shadow-rose-900/10' : 'border-slate-800'}`}>

                {/* LEFT COLUMN: Controls & Visuals */}
                <div className="w-full md:w-5/12 bg-gradient-to-b from-[#0f172a] to-[#1e293b] p-6 flex flex-col border-r border-slate-800 relative shrink-0">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${isError ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                <Database size={20} />
                            </div>
                            <div>
                                <h2 className="text-white font-bold text-lg leading-tight">Sincronização</h2>
                                <p className="text-slate-500 text-xs">Gerenciador de Dados</p>
                            </div>
                        </div>
                        <button
                            onClick={handleToggleAutoSync}
                            className={`flex flex-col items-end group ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 group-hover:text-indigo-400 transition-colors">Auto-Sync</span>
                            {autoSync
                                ? <ToggleRight className="text-indigo-500" size={28} />
                                : <ToggleLeft className="text-slate-600" size={28} />
                            }
                        </button>
                    </div>

                    {/* Status Visualizer */}
                    <div className="flex-1 flex flex-col items-center justify-center mb-8 relative min-h-[200px]">
                        {/* Rings Animation */}
                        {isLoading && (
                            <>
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-ping opacity-20"></div>
                                <div className="absolute inset-4 border-4 border-purple-500/20 rounded-full animate-ping opacity-20 animation-delay-500"></div>
                            </>
                        )}

                        <div className="relative z-10">
                            <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${isLoading ? 'border-indigo-500 bg-slate-900' :
                                syncState.status === 'success' ? 'border-emerald-500 bg-emerald-500/10' :
                                    isError ? 'border-rose-500 bg-rose-500/10' :
                                        'border-slate-700 bg-slate-800'
                                }`}>
                                {isLoading ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 size={32} className="text-indigo-400 animate-spin mb-2" />
                                        <span className="text-lg font-bold text-white">{Math.round(syncState.progress)}%</span>
                                    </div>
                                ) : syncState.status === 'success' ? (
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                ) : isError ? (
                                    // Dynamic Error Icon based on type
                                    errorDetails ? <errorDetails.icon size={48} className={errorDetails.color} /> : <AlertTriangle size={48} className="text-rose-500" />
                                ) : (
                                    <Play size={48} className="text-slate-600 ml-2" />
                                )}
                            </div>

                            {/* Status Badge */}
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold border whitespace-nowrap transition-colors duration-300 ${isLoading ? 'bg-indigo-900 border-indigo-500 text-indigo-200' :
                                syncState.status === 'success' ? 'bg-emerald-900 border-emerald-500 text-emerald-200' :
                                    isError ? 'bg-rose-900 border-rose-500 text-rose-200' :
                                        'bg-slate-700 border-slate-600 text-slate-300'
                                }`}>
                                {isLoading ? 'SINCRONIZANDO' :
                                    syncState.status === 'success' ? 'ATUALIZADO' :
                                        isError ? 'FALHA' : 'AGUARDANDO'}
                            </div>
                        </div>

                        {/* Last Sync Info OR Diagnosis */}
                        <div className="mt-6 text-center w-full px-4">
                            {isError && errorDetails ? (
                                <div className="animate-fadeIn">
                                    <p className={`text-sm font-bold ${errorDetails.color} mb-1 flex items-center justify-center gap-2`}>
                                        {errorDetails.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                                        {errorDetails.solution}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Última Atualização</p>
                                    <p className="text-sm font-mono text-slate-200 mt-1">
                                        {syncState.lastSync ? new Date(syncState.lastSync).toLocaleString('pt-BR') : '--'}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metrics Grid (Compact) - Hidden on Error to reduce noise */}
                    {!isError ? (
                        <div className="grid grid-cols-3 gap-3 mb-6 shrink-0 animate-fadeIn">
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
                                <span className="text-xl font-bold text-white">{taskCount}</span>
                                <span className="text-[9px] text-slate-400 uppercase mt-1">Tarefas</span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
                                <span className="text-xl font-bold text-white">{projectCount}</span>
                                <span className="text-[9px] text-slate-400 uppercase mt-1">Projetos</span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 flex flex-col items-center">
                                <span className="text-xl font-bold text-white">{teamCount}</span>
                                <span className="text-[9px] text-slate-400 uppercase mt-1">Membros</span>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6 p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl shrink-0 animate-fadeIn text-center">
                            <p className="text-xs text-rose-300 font-medium">
                                Verifique os logs do sistema à direita para detalhes técnicos.
                            </p>
                        </div>
                    )}

                    {/* Primary Actions */}
                    <button
                        onClick={() => isLoading ? cancelSync() : handleSync(false)}
                        className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 ${isLoading
                            ? 'bg-rose-600 hover:bg-rose-500 text-white hover:shadow-rose-500/25 active:scale-[0.98]'
                            : isError
                                ? 'bg-rose-600 hover:bg-rose-500 text-white hover:shadow-rose-500/25 active:scale-[0.98]'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/25 active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? (
                            <StopCircle size={18} />
                        ) : isError ? (
                            <RefreshCcw size={18} />
                        ) : (
                            <DownloadCloud size={18} />
                        )}

                        {isLoading ? 'Parar Sincronização' : isError ? 'Tentar Novamente' : 'Sincronizar Agora'}
                    </button>

                </div>

                {/* RIGHT COLUMN: Terminal & Filters */}
                <div className="w-full md:w-7/12 flex flex-col bg-[#0b1221] md:h-full overflow-hidden">

                    {/* Terminal Window */}
                    <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Terminal size={16} />
                                <span className="text-xs font-mono uppercase tracking-wider">System Logs</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                                <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                            </div>
                        </div>

                        {/* Log Area */}
                        <div className={`flex-1 rounded-xl border p-4 font-mono text-xs overflow-y-auto custom-scrollbar shadow-inner transition-colors duration-300 ${isError ? 'bg-[#0f0505] border-rose-900/30' : 'bg-[#0f172a] border-slate-800'}`}>
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2 opacity-50">
                                    <Activity size={24} />
                                    <p>Aguardando comando...</p>
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {logs.map((log, i) => (
                                        <div key={i} className="break-all animate-fadeIn">
                                            <span className="text-slate-600 mr-2">{log.split(']')[0]}]</span>
                                            <span className={
                                                log.includes('ERRO') || log.includes('FALHA') ? 'text-rose-400 font-bold' :
                                                    log.includes('RECOMENDAÇÃO') ? 'text-indigo-300 italic' :
                                                        log.includes('completa') || log.includes('✓') ? 'text-emerald-400' :
                                                            log.includes('tags') || log.includes('membros') ? 'text-amber-400' :
                                                                'text-slate-300'
                                            }>
                                                {log.split(']').slice(1).join(']')}
                                            </span>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Secondary Controls Panel */}
                    <div className="p-6 pt-0 border-t border-slate-800/50 bg-[#0f172a] shrink-0">
                        <div className="flex items-center justify-between mb-3 mt-4">
                            <h3 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                                <Filter size={14} /> Filtros de Sync
                            </h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={() => setSyncFilters(createDefaultSyncFilters())}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1"
                                >
                                    <X size={10} /> Limpar
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                                onClick={() => setShowTagsModal(true)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${syncFilters.tags.length > 0
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Tag size={16} />
                                    <span className="text-xs font-bold">Tags</span>
                                </div>
                                {syncFilters.tags.length > 0 && (
                                    <span className="text-[10px] bg-amber-500 text-slate-900 px-1.5 rounded font-bold">{syncFilters.tags.length}</span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowTeamModal(true)}
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${syncFilters.assignees.length > 0
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    <span className="text-xs font-bold">Time</span>
                                </div>
                                {syncFilters.assignees.length > 0 && (
                                    <span className="text-[10px] bg-emerald-500 text-slate-900 px-1.5 rounded font-bold">{syncFilters.assignees.length}</span>
                                )}
                            </button>
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-slate-800">
                            <button
                                onClick={() => handleSync(true)}
                                disabled={isLoading || !syncState.lastSync}
                                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <Zap size={14} className="text-amber-400" /> Incremental
                            </button>
                            <button
                                onClick={clearCache}
                                disabled={isLoading}
                                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/20 text-slate-400 hover:text-rose-400 text-xs font-bold border border-slate-700 transition-colors disabled:opacity-50"
                                title="Limpar Cache"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALS (Reusable logic, kept same styling but adjusted z-index context) */}
            {/* Tags Modal */}
            {
                showTagsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowTagsModal(false)}>
                        <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden m-4" onClick={e => e.stopPropagation()}>
                            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2"><Tag size={16} className="text-amber-500" /> Selecionar Tags</h3>
                                <button onClick={() => setShowTagsModal(false)}><X size={18} className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <div className="p-4 max-h-[50vh] overflow-y-auto bg-slate-900">
                                <div className="flex flex-wrap gap-2">
                                    {metadata?.tags?.map(tag => {
                                        const isSelected = syncFilters.tags.includes(tag.toLowerCase());
                                        return (
                                            <button
                                                key={tag}
                                                onClick={() => isSelected ? handleRemoveTag(tag.toLowerCase()) : handleAddTag(tag)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${isSelected
                                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                {isSelected && <span className="mr-1 text-amber-400">✓</span>} #{tag}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
                                <button onClick={() => setShowTagsModal(false)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs">OK</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Team Modal */}
            {
                showTeamModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setShowTeamModal(false)}>
                        <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden m-4" onClick={e => e.stopPropagation()}>
                            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                                <h3 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16} className="text-emerald-500" /> Selecionar Time</h3>
                                <button onClick={() => setShowTeamModal(false)}><X size={18} className="text-slate-400 hover:text-white" /></button>
                            </div>
                            <div className="p-4 max-h-[50vh] overflow-y-auto bg-slate-900">
                                <div className="flex flex-col gap-2">
                                    {metadata?.assignees?.map(member => {
                                        const isSelected = syncFilters.assignees.includes(member);
                                        return (
                                            <button
                                                key={member}
                                                onClick={() => {
                                                    if (isSelected) setSyncFilters({ ...syncFilters, assignees: syncFilters.assignees.filter(a => a !== member) });
                                                    else setSyncFilters({ ...syncFilters, assignees: [...syncFilters.assignees, member] });
                                                }}
                                                className={`w-full px-3 py-2 text-xs font-bold rounded-lg border flex items-center justify-between transition-all ${isSelected
                                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <span>{member}</span>
                                                {isSelected && <CheckCircle2 size={14} className="text-emerald-400" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
                                <button onClick={() => setShowTeamModal(false)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs">OK</button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
            `}</style>
        </div >
    );
};

export default SyncDashboard;