/**
 * @id PAGE-SYNC-001
 * @name SyncDashboard
 * @description Dashboard de sincronização com ClickUp usando DataContext
 * @dependencies CTX-DATA-001, lucide-react
 * @status active
 * @version 2.0.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Database,
    RefreshCw,
    CheckCircle2,
    ToggleRight,
    ToggleLeft,
    Clock,
    DownloadCloud,
    HardDrive,
    Activity,
    Loader2,
    FileCheck,
    Layers,
    Users,
    ArrowRight,
    AlertTriangle,
    Trash2,
    Zap,
    Filter,
    Tag,
    ChevronDown,
    ChevronUp,
    X,
    Settings2
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { SyncFilters, SYNC_FILTER_PRESETS, createDefaultSyncFilters } from '../services/filterService';

// Chave para persistir configuração do AutoSync
const AUTOSYNC_KEY = 'dailyFlow_autoSync_v2';

// Helper para carregar autoSync do localStorage
const loadAutoSyncSetting = (): boolean => {
    try {
        const saved = localStorage.getItem(AUTOSYNC_KEY);
        if (saved !== null) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.warn('[PAGE-SYNC-001] Erro ao carregar autoSync:', e);
    }
    return false; // Default: desativado para não fazer sync automático sem o usuário querer
};

// Helper para salvar autoSync no localStorage
const saveAutoSyncSetting = (value: boolean): void => {
    try {
        localStorage.setItem(AUTOSYNC_KEY, JSON.stringify(value));
        console.log(`[PAGE-SYNC-001] AutoSync ${value ? 'ativado' : 'desativado'} e salvo`);
    } catch (e) {
        console.warn('[PAGE-SYNC-001] Erro ao salvar autoSync:', e);
    }
};

export const SyncDashboard: React.FC = () => {
    const {
        syncState,
        syncFull,
        syncIncremental,
        loadFromCache,
        clearCache,
        metadata,
        groupedData,
        isInitialized,
        hasCacheData,
        syncFilters,
        setSyncFilters
    } = useData();

    // Persistir hasAttemptedAutoSync na sessão para não repetir sync ao navegar
    const getSessionAutoSyncFlag = (): boolean => {
        try {
            return sessionStorage.getItem('hasAttemptedAutoSync') === 'true';
        } catch {
            return false;
        }
    };

    const setSessionAutoSyncFlag = (value: boolean) => {
        try {
            sessionStorage.setItem('hasAttemptedAutoSync', String(value));
        } catch (e) {
            console.warn('[PAGE-SYNC-001] Erro ao salvar flag de auto-sync:', e);
        }
    };

    // Carregar autoSync do localStorage na inicialização
    const [autoSync, setAutoSync] = useState<boolean>(loadAutoSyncSetting);
    const [logs, setLogs] = useState<string[]>([]);
    const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(getSessionAutoSyncFlag);

    // Modais para seleção de filtros (cards clicáveis)
    const [showTagsModal, setShowTagsModal] = useState(false);
    const [showTeamModal, setShowTeamModal] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Salvar autoSync quando muda
    const handleToggleAutoSync = () => {
        const newValue = !autoSync;
        setAutoSync(newValue);
        saveAutoSyncSetting(newValue);
    };

    // Auto-scroll terminal
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Add log helper
    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    };

    // AUTO-SYNC: Executar sync automático quando ativado e app inicializado
    useEffect(() => {
        // Só executar uma vez, quando app está inicializado e autoSync está ativado
        if (!hasAttemptedAutoSync && isInitialized && autoSync) {
            setHasAttemptedAutoSync(true);
            setSessionAutoSyncFlag(true); // Persistir na sessão

            // Se não tem cache ou cache está vazio, fazer sync completo
            // Se tem cache, fazer sync incremental (mais rápido)
            if (hasCacheData && syncState.lastSync) {
                addLog("🔄 Auto-sync incremental iniciado...");
                syncIncremental();
            } else if (!hasCacheData) {
                addLog("🔄 Auto-sync completo iniciado (sem cache)...");
                syncFull();
            }
        }
    }, [hasAttemptedAutoSync, isInitialized, autoSync, hasCacheData, syncState.lastSync, syncIncremental, syncFull]);

    // Watch sync state changes
    useEffect(() => {
        if (syncState.status === 'syncing') {
            addLog(`Sincronizando... ${syncState.progress}%`);
        } else if (syncState.status === 'success') {
            addLog(`✓ Sincronização completa: ${syncState.taskCount} tarefas`);
        } else if (syncState.status === 'error' && syncState.error) {
            addLog(`✗ Erro: ${syncState.error}`);
        }
    }, [syncState.status, syncState.progress, syncState.taskCount, syncState.error]);

    const handleSync = async (incremental: boolean = false) => {
        setLogs([]);
        addLog(incremental ? "Iniciando sync incremental..." : "Iniciando sync completo...");

        // Log active filters
        if (syncFilters.tags.length > 0) {
            addLog(`🏷️  Filtros de tags: ${syncFilters.tags.join(', ')}`);
        }
        if (syncFilters.assignees.length > 0) {
            addLog(`👥 Filtros de membros: ${syncFilters.assignees.join(', ')}`);
        }
        if (!hasActiveFilters) {
            addLog("📦 Sem filtros - buscando todas as tarefas");
        }

        try {
            if (incremental && syncState.lastSync) {
                addLog(`Buscando tarefas modificadas desde ${new Date(syncState.lastSync).toLocaleString('pt-BR')}...`);
                await syncIncremental();
            } else {
                addLog("Conectando ao ClickUp...");
                await syncFull();
            }
        } catch (e: any) {
            addLog(`ERRO: ${e.message}`);
        }
    };

    const handleClearCache = async () => {
        addLog("Limpando cache local...");
        await clearCache();
        addLog("✓ Cache limpo com sucesso");
    };

    const handleReset = () => {
        setLogs([]);
    };

    // Filter handlers
    const handleAddTag = (tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !syncFilters.tags.includes(trimmedTag)) {
            setSyncFilters({
                ...syncFilters,
                tags: [...syncFilters.tags, trimmedTag]
            });
        }
        setTagInput('');
    };

    const handleRemoveTag = (tag: string) => {
        setSyncFilters({
            ...syncFilters,
            tags: syncFilters.tags.filter(t => t !== tag)
        });
    };

    const handleApplyPreset = (preset: typeof SYNC_FILTER_PRESETS[0]) => {
        setSyncFilters(preset.filters);
        addLog(`📋 Preset "${preset.name}" aplicado`);
    };

    const handleClearFilters = () => {
        setSyncFilters(createDefaultSyncFilters());
        addLog('🗑️ Filtros limpos');
    };

    const hasActiveFilters = syncFilters.tags.length > 0 || syncFilters.assignees.length > 0;

    const isLoading = syncState.status === 'syncing';

    // --- SUB-COMPONENTS ---

    const MetricItem = ({ icon: Icon, label, value, color, onClick, badge }: {
        icon: any,
        label: string,
        value: string | number,
        color: string,
        onClick?: () => void,
        badge?: number
    }) => (
        <div
            onClick={onClick}
            className={`flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm flex-1 transition-all group relative
                ${onClick ? 'cursor-pointer hover:bg-slate-700/70 hover:border-slate-600 hover:scale-[1.02]' : 'hover:bg-slate-800/80'}`}
        >
            {badge !== undefined && badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {badge}
                </div>
            )}
            <div className={`p-2 rounded-lg bg-opacity-20 mb-2 transition-transform group-hover:scale-110 duration-300 ${color.replace('text-', 'bg-')}`}>
                <Icon size={18} className={color} />
            </div>
            <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-white">{value}</span>
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 opacity-70">{label}</span>
            {onClick && <span className="text-[8px] text-indigo-400 mt-1">clique para filtrar</span>}
        </div>
    );

    // Calcular métricas reais
    const taskCount = syncState.taskCount || 0;
    const projectCount = metadata?.projects?.length || 0;
    const teamCount = metadata?.assignees?.length || 0;
    const tagCount = metadata?.tags?.length || 0;
    const activeTagsCount = syncFilters.tags.length;
    const activeAssigneesCount = syncFilters.assignees.length;

    return (
        <div className="flex-1 h-full overflow-hidden bg-slate-50 flex items-center justify-center p-6 animate-fadeIn">

            <div className="w-full max-w-2xl relative group">

                {/* Background Glow */}
                <div className={`absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 rounded-[2rem] opacity-20 blur-2xl transition duration-1000 ${isLoading ? 'opacity-50 animate-pulse' : ''}`}></div>

                <div className="relative bg-[#0f172a] rounded-3xl shadow-2xl flex flex-col border border-slate-800 overflow-hidden">

                    {/* Decorative Background Icon */}
                    <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] pointer-events-none">
                        <Database size={300} className="text-white transform rotate-12" />
                    </div>

                    {/* Card Body */}
                    <div className="p-8 pb-6">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${isLoading ? 'bg-indigo-500/20' : 'bg-indigo-600 shadow-indigo-900/50'}`}>
                                    <RefreshCw size={32} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-2xl font-bold text-white tracking-tight">Sincronização v2.0</h3>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">DataContext</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : syncState.status === 'error' ? 'bg-rose-500' : syncState.status === 'success' ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                                        <span className={`text-xs font-bold uppercase tracking-wide ${isLoading ? 'text-amber-400' : syncState.status === 'error' ? 'text-rose-400' : syncState.status === 'success' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                            {isLoading ? `Sincronizando ${syncState.progress}%` :
                                                syncState.status === 'error' ? 'Erro de Conexão' :
                                                    syncState.status === 'success' ? 'Dados Atualizados' :
                                                        taskCount > 0 ? 'Cache Disponível' : 'Aguardando'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end">
                                <button
                                    onClick={() => !isLoading && handleToggleAutoSync()}
                                    className={`group/toggle cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    title={autoSync ? "Desativar Auto-Sync (não vai sincronizar ao iniciar)" : "Ativar Auto-Sync (sincroniza automaticamente ao iniciar)"}
                                >
                                    <div className={`transition-colors duration-300 ${autoSync ? 'text-indigo-400' : 'text-slate-600'}`}>
                                        {autoSync ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                    </div>
                                </button>
                                <span className={`text-[10px] font-bold uppercase mt-1 mr-1 ${autoSync ? 'text-indigo-400' : 'text-slate-500'}`}>
                                    Auto-Sync {autoSync ? 'ON' : 'OFF'}
                                </span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {isLoading && (
                            <div className="mb-6 relative z-10">
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                                        style={{ width: `${syncState.progress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1 text-xs text-slate-500">
                                    <span>Progresso</span>
                                    <span>{syncState.progress}%</span>
                                </div>
                            </div>
                        )}

                        {/* CONSOLE / TERMINAL VIEW */}
                        {logs.length > 0 ? (
                            <div className={`rounded-xl border p-5 font-mono text-xs mb-8 overflow-y-auto custom-scrollbar h-[200px] shadow-inner relative flex flex-col ${syncState.status === 'error' ? 'bg-rose-950/20 border-rose-900/50 text-rose-200' : 'bg-black/40 border-slate-700/50 text-slate-300'}`}>
                                <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
                                    <span className="font-bold uppercase text-[10px] opacity-70">Logs do Sistema</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                        <div className="w-2 h-2 rounded-full bg-white/20"></div>
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1 overflow-y-auto">
                                    {logs.map((log, i) => (
                                        <div key={i} className="animate-fadeIn break-all">{log}</div>
                                    ))}
                                    {isLoading && (
                                        <div className="animate-pulse text-indigo-400">_</div>
                                    )}
                                    <div ref={logsEndRef} />
                                </div>
                            </div>
                        ) : (
                            /* Metrics Grid - Cards Clicáveis */
                            <div className="grid grid-cols-4 gap-3 mb-8 relative z-10 mt-auto h-[200px] items-center">
                                <MetricItem icon={FileCheck} label="Tarefas" value={taskCount || '--'} color="text-blue-400" />
                                <MetricItem icon={Layers} label="Projetos" value={projectCount || '--'} color="text-violet-400" />
                                <MetricItem
                                    icon={Tag}
                                    label="Tags"
                                    value={tagCount || '--'}
                                    color="text-amber-400"
                                    onClick={() => setShowTagsModal(true)}
                                    badge={activeTagsCount}
                                />
                                <MetricItem
                                    icon={Users}
                                    label="Equipe"
                                    value={teamCount || '--'}
                                    color="text-emerald-400"
                                    onClick={() => setShowTeamModal(true)}
                                    badge={activeAssigneesCount}
                                />
                            </div>
                        )}

                        {/* Tags Modal - Aparece quando clica no card TAGS */}
                        {showTagsModal && (
                            <div className="relative z-10 mb-4 animate-fadeIn">
                                <div className="p-4 bg-slate-800/80 rounded-xl border border-amber-500/30 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Tag size={16} className="text-amber-400" />
                                            <span className="text-sm font-bold text-white">Selecionar Tags</span>
                                            {syncFilters.tags.length > 0 && (
                                                <span className="text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded">
                                                    {syncFilters.tags.length} selecionada(s)
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={() => setShowTagsModal(false)} className="text-slate-400 hover:text-white">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Tags disponíveis */}
                                    {metadata?.tags && metadata.tags.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            {metadata.tags.map(tag => {
                                                const isSelected = syncFilters.tags.includes(tag.toLowerCase());
                                                return (
                                                    <button
                                                        key={tag}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                handleRemoveTag(tag.toLowerCase());
                                                            } else {
                                                                handleAddTag(tag);
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isSelected
                                                            ? 'bg-amber-500/30 border-amber-500/50 text-amber-200'
                                                            : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            {isSelected && <CheckCircle2 size={12} />}
                                                            #{tag}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500">Faça um sync primeiro para carregar as tags do ClickUp</p>
                                    )}

                                    {/* Ações */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                                        <button
                                            onClick={handleClearFilters}
                                            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                                        >
                                            <Trash2 size={12} /> Limpar tags
                                        </button>
                                        <button
                                            onClick={() => setShowTagsModal(false)}
                                            className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-500/30"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Team Modal - Aparece quando clica no card EQUIPE */}
                        {showTeamModal && (
                            <div className="relative z-10 mb-4 animate-fadeIn">
                                <div className="p-4 bg-slate-800/80 rounded-xl border border-emerald-500/30 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users size={16} className="text-emerald-400" />
                                            <span className="text-sm font-bold text-white">Selecionar Membros</span>
                                            {syncFilters.assignees.length > 0 && (
                                                <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded">
                                                    {syncFilters.assignees.length} selecionado(s)
                                                </span>
                                            )}
                                        </div>
                                        <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-white">
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Membros disponíveis */}
                                    {metadata?.assignees && metadata.assignees.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                                            {metadata.assignees.map(member => {
                                                const isSelected = syncFilters.assignees.includes(member);
                                                return (
                                                    <button
                                                        key={member}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSyncFilters({
                                                                    ...syncFilters,
                                                                    assignees: syncFilters.assignees.filter(a => a !== member)
                                                                });
                                                            } else {
                                                                setSyncFilters({
                                                                    ...syncFilters,
                                                                    assignees: [...syncFilters.assignees, member]
                                                                });
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${isSelected
                                                            ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200'
                                                            : 'bg-slate-700/30 border-slate-600/30 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        <span className="flex items-center gap-1.5">
                                                            {isSelected && <CheckCircle2 size={12} />}
                                                            {member}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500">Faça um sync primeiro para carregar os membros do ClickUp</p>
                                    )}

                                    {/* Ações */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                                        <button
                                            onClick={() => setSyncFilters({ ...syncFilters, assignees: [] })}
                                            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                                        >
                                            <Trash2 size={12} /> Limpar membros
                                        </button>
                                        <button
                                            onClick={() => setShowTeamModal(false)}
                                            className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg font-medium hover:bg-emerald-500/30"
                                        >
                                            Aplicar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Active Filters Summary - Mostra quando há filtros ativos */}
                        {hasActiveFilters && !showTagsModal && !showTeamModal && (
                            <div className="relative z-10 mb-4 flex items-center justify-between px-4 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
                                <div className="flex items-center gap-2 text-xs text-indigo-300">
                                    <Filter size={14} />
                                    <span>
                                        {syncFilters.tags.length > 0 && `${syncFilters.tags.length} tag(s)`}
                                        {syncFilters.tags.length > 0 && syncFilters.assignees.length > 0 && ' • '}
                                        {syncFilters.assignees.length > 0 && `${syncFilters.assignees.length} membro(s)`}
                                    </span>
                                </div>
                                <button onClick={handleClearFilters} className="text-xs text-rose-400 hover:text-rose-300">
                                    <X size={14} />
                                </button>
                            </div>
                        )}

                        {/* Action Button Area - Sempre Visível */}
                        <div className="relative z-10 space-y-3">
                            {/* Status Message (Success/Error) */}
                            {syncState.status === 'success' && !isLoading && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3 animate-fadeIn">
                                    <CheckCircle2 className="text-emerald-400" size={20} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">Dados Atualizados!</p>
                                        <p className="text-xs text-emerald-400/80">{taskCount} tarefas sincronizadas</p>
                                    </div>
                                </div>
                            )}
                            {syncState.status === 'error' && (
                                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-3 animate-fadeIn">
                                    <AlertTriangle className="text-rose-400" size={20} />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">Erro na Sincronização</p>
                                        <p className="text-xs text-rose-400/80">{syncState.error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Buttons - Sempre visíveis */}
                            <div className="flex gap-3">
                                {/* Sync Completo */}
                                <button
                                    onClick={() => handleSync(false)}
                                    disabled={isLoading}
                                    className={`
                                        flex-1 group/btn relative flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-xl transition-all transform
                                        ${isLoading
                                            ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700'
                                            : 'bg-white hover:bg-indigo-50 text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:scale-[0.98]'
                                        }
                                    `}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin text-indigo-500" /> Sincronizando...
                                        </>
                                    ) : (
                                        <>
                                            <DownloadCloud size={20} className="text-indigo-600" />
                                            {hasActiveFilters ? 'Sync Filtrado' : 'Sync Completo'}
                                        </>
                                    )}
                                </button>

                                {/* Sync Incremental */}
                                {syncState.lastSync && (
                                    <button
                                        onClick={() => handleSync(true)}
                                        disabled={isLoading}
                                        className={`
                                            group/btn relative flex items-center justify-center gap-2 font-bold py-4 px-4 rounded-xl transition-all transform
                                            ${isLoading
                                                ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700'
                                                : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:-translate-y-1 active:scale-[0.98]'
                                            }
                                        `}
                                        title="Buscar apenas tarefas modificadas"
                                    >
                                        <Zap size={18} className="text-amber-400" />
                                    </button>
                                )}

                                {/* Limpar Cache */}
                                <button
                                    onClick={handleClearCache}
                                    disabled={isLoading}
                                    className={`
                                        group/btn relative flex items-center justify-center gap-2 font-bold py-4 px-4 rounded-xl transition-all transform
                                        ${isLoading
                                            ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700'
                                            : 'bg-slate-800 hover:bg-rose-900/50 text-white border border-slate-600 hover:-translate-y-1 active:scale-[0.98]'
                                        }
                                    `}
                                    title="Limpar cache local"
                                >
                                    <Trash2 size={18} className="text-rose-400" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Information / Status Bar */}
                    <div className="bg-slate-900/50 border-t border-slate-800 p-4 grid grid-cols-2 gap-4 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
                                <HardDrive size={14} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Cache</span>
                                <span className="text-xs font-mono text-slate-300 font-medium">
                                    {taskCount > 0 ? `${taskCount} tarefas` : 'Vazio'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 justify-end text-right">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Última Sync</span>
                                <span className="text-xs font-mono text-emerald-400 font-bold">
                                    {syncState.lastSync
                                        ? new Date(syncState.lastSync).toLocaleString('pt-BR', { timeStyle: 'short', dateStyle: 'short' })
                                        : 'Nunca'}
                                </span>
                            </div>
                            <div className="p-2 bg-slate-800 rounded-lg text-emerald-500 border border-slate-700">
                                <Activity size={14} />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SyncDashboard;
