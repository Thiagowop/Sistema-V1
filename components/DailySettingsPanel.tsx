/**
 * @id DAILY-SETTINGS-002
 * @name DailySettingsPanel
 * @description Painel de configurações slide-in para o DailyAlignmentDashboard
 * V2: Persistência, Status filter em boxes, Rename, Save/Reset buttons
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    X,
    Settings,
    Eye,
    Filter,
    Box,
    Plus,
    Trash2,
    Edit2,
    Check,
    AlertCircle,
    ZoomIn,
    ZoomOut,
    CheckSquare,
    ListTree,
    Copy,
    Ban,
    Save,
    RotateCcw,
    Pencil,
    UserX,
    Users,
    ArrowUpAZ,
    ArrowUp,
    ArrowDown,
    GripVertical,
    Cloud,
    CloudOff,
    Loader2
} from 'lucide-react';
import { LocalFilters, createDefaultLocalFilters } from './filters/LocalFilterBar';
import { TagSelector } from './filters/TagSelector';
import { StatusSelector } from './filters/StatusSelector';
import { globalSettings } from '../services/globalSettingsService';

// Abas do painel
type SettingsTab = 'geral' | 'boxes' | 'filtros' | 'membros';

// Cores disponíveis para boxes (expandido)
const AVAILABLE_COLORS = [
    { name: 'Slate', hex: '#1e293b' },
    { name: 'Indigo', hex: '#4f46e5' },
    { name: 'Purple', hex: '#7c3aed' },
    { name: 'Emerald', hex: '#059669' },
    { name: 'Teal', hex: '#0d9488' },
    { name: 'Rose', hex: '#e11d48' },
    { name: 'Amber', hex: '#d97706' },
    { name: 'Orange', hex: '#ea580c' },
    { name: 'Cyan', hex: '#0891b2' },
    { name: 'Pink', hex: '#db2777' },
    { name: 'Blue', hex: '#2563eb' },
    { name: 'Red', hex: '#dc2626' },
];

// Storage key for persistence
const STORAGE_KEY = 'daily-settings-v3';  // v3: per-member boxes

// Interface para Box customizado - COM COR
export interface CustomBox {
    id: string;
    name: string;
    color: string;  // Restaurado
    filterTags: string[];
    filterStatuses: string[];
    order: number;
}

// Interface para as configurações do Daily
export interface DailySettings {
    // Visualização GLOBAL (fora da engrenagem)
    showTasks: boolean;
    showSubtasks: boolean;
    showCompleted: boolean;

    // Configurações (dentro da engrenagem)
    viewScale: number;
    exclusiveBoxes: boolean;
    sortProjectsAlphabetically: boolean;  // Ordenar projetos alfabeticamente

    // Cores dos projetos (por nome do projeto)
    projectColors: { [projectName: string]: string };

    // Filtro de Membros
    visibleMembers: string[];  // IDs dos membros visíveis (vazio = todos)
    showUnassigned: boolean;   // Mostrar "Não atribuído"
    memberOrder: string[];     // Ordem personalizada dos membros (vazio = ordem padrão)

    // Boxes POR MEMBRO
    customBoxesByMember: {
        [memberId: string]: CustomBox[]
    };

    // Ordem combinada de boxes e projetos por membro (IDs como 'custombox:id' ou 'project:name')
    combinedOrderByMember: {
        [memberId: string]: string[]
    };

    // Filtros locais
    localFilters: LocalFilters;

    // DEPRECATED - manter para migração
    customBoxes?: CustomBox[];
}

export const createDefaultDailySettings = (): DailySettings => ({
    showTasks: true,
    showSubtasks: true,
    showCompleted: false,
    viewScale: 1,
    exclusiveBoxes: true,
    sortProjectsAlphabetically: true,  // Ordenar projetos por padrão
    projectColors: {},  // Cores customizadas por projeto
    visibleMembers: [],  // Vazio = mostrar todos
    showUnassigned: true,
    memberOrder: [],  // Vazio = ordem original
    customBoxesByMember: {},
    combinedOrderByMember: {},  // Ordem combinada boxes + projetos
    localFilters: createDefaultLocalFilters()
});

// Persistence helpers
export const loadDailySettings = (): DailySettings => {
    try {
        // Primeiro tenta carregar do localStorage (rápido)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle new fields
            return { ...createDefaultDailySettings(), ...parsed };
        }

        // Se não tem localStorage, tenta carregar do Supabase GLOBAL
        const globalDailySettings = globalSettings.getDailySettings();
        const globalBoxOrder = globalSettings.getBoxOrder();

        if (globalDailySettings || Object.keys(globalBoxOrder).length > 0) {
            console.log('[DailySettingsPanel] ☁️ Carregando configurações do Supabase (GLOBAL)');
            const settings = createDefaultDailySettings();
            if (globalDailySettings) {
                Object.assign(settings, globalDailySettings);
            }
            if (Object.keys(globalBoxOrder).length > 0) {
                settings.combinedOrderByMember = globalBoxOrder;
            }
            // Salvar localmente para próxima vez
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            return settings;
        }
    } catch (e) {
        console.warn('Failed to load daily settings:', e);
    }
    return createDefaultDailySettings();
};

export const saveDailySettings = (settings: DailySettings): void => {
    try {
        // 1. Salvar localmente (rápido)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

        // 2. Salvar no Supabase (GLOBAL - todos veem igual)
        globalSettings.updateAll({
            dailySettings: settings as any,
            boxOrder: settings.combinedOrderByMember || {},
        }, 'admin').then(success => {
            if (success) {
                console.log('[DailySettingsPanel] ☁️ Configurações salvas no Supabase (GLOBAL)');
            } else {
                console.warn('[DailySettingsPanel] ⚠️ Falha ao salvar no Supabase');
            }
        }).catch(err => {
            console.error('[DailySettingsPanel] ❌ Erro ao salvar no Supabase:', err);
        });
    } catch (e) {
        console.warn('Failed to save daily settings:', e);
    }
};

interface DailySettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: DailySettings;
    onSettingsChange: (settings: DailySettings) => void;
    onSave: () => void;
    onReset: () => void;
    availableTags: string[];
    availableStatuses: string[];
    availableMembers: { id: string; name: string }[];  // NOVO
    activeMemberId: string;  // NOVO
    memberName: string;
    hasUnsavedChanges: boolean;
    onCloudSync?: () => Promise<boolean>;  // Sync para Supabase
}

export const DailySettingsPanel: React.FC<DailySettingsPanelProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    onSave,
    onReset,
    availableTags,
    availableStatuses,
    availableMembers,
    activeMemberId,
    memberName,
    hasUnsavedChanges,
    onCloudSync
}) => {
    // Estado para abas
    const [activeTab, setActiveTab] = useState<SettingsTab>('geral');

    // Estado para sync na nuvem
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleCloudSync = async () => {
        if (!onCloudSync || isCloudSyncing) return;

        setIsCloudSyncing(true);
        setCloudSyncStatus('idle');

        try {
            const success = await onCloudSync();
            setCloudSyncStatus(success ? 'success' : 'error');

            // Resetar status após 3 segundos
            setTimeout(() => setCloudSyncStatus('idle'), 3000);
        } catch (e) {
            setCloudSyncStatus('error');
            setTimeout(() => setCloudSyncStatus('idle'), 3000);
        } finally {
            setIsCloudSyncing(false);
        }
    };

    // Estado para novo/editar box
    const [boxFormMode, setBoxFormMode] = useState<'create' | 'edit' | null>(null);
    const [editingBoxId, setEditingBoxId] = useState<string | null>(null);
    const [boxName, setBoxName] = useState('');
    const [boxColor, setBoxColor] = useState(AVAILABLE_COLORS[1].hex);
    const [boxTags, setBoxTags] = useState<string[]>([]);
    const [boxStatuses, setBoxStatuses] = useState<string[]>([]);

    // Helper: Get boxes for current member
    const currentMemberBoxes = useMemo(() => {
        return settings.customBoxesByMember[activeMemberId] || [];
    }, [settings.customBoxesByMember, activeMemberId]);

    // Helpers
    const updateSetting = <K extends keyof DailySettings>(key: K, value: DailySettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const updateLocalFilters = (filters: LocalFilters) => {
        onSettingsChange({ ...settings, localFilters: filters });
    };

    // Box form management
    const openCreateForm = () => {
        setBoxFormMode('create');
        setEditingBoxId(null);
        setBoxName('');
        setBoxColor(AVAILABLE_COLORS[1].hex);
        setBoxTags([]);
        setBoxStatuses([]);
    };

    const openEditForm = (box: CustomBox) => {
        setBoxFormMode('edit');
        setEditingBoxId(box.id);
        setBoxName(box.name);
        setBoxColor(box.color || AVAILABLE_COLORS[1].hex);
        setBoxTags(box.filterTags);
        setBoxStatuses(box.filterStatuses || []);
    };

    const closeForm = () => {
        setBoxFormMode(null);
        setEditingBoxId(null);
        setBoxName('');
        setBoxColor(AVAILABLE_COLORS[1].hex);
        setBoxTags([]);
        setBoxStatuses([]);
    };

    // Helper: Update boxes for current member
    const updateMemberBoxes = (newBoxes: CustomBox[]) => {
        onSettingsChange({
            ...settings,
            customBoxesByMember: {
                ...settings.customBoxesByMember,
                [activeMemberId]: newBoxes
            }
        });
    };

    const saveBox = () => {
        if (!boxName.trim()) return;

        if (boxFormMode === 'create') {
            const newBox: CustomBox = {
                id: `box-${Date.now()}`,
                name: boxName.trim(),
                color: boxColor,
                filterTags: boxTags,
                filterStatuses: boxStatuses,
                order: currentMemberBoxes.length
            };
            updateMemberBoxes([...currentMemberBoxes, newBox]);
        } else if (boxFormMode === 'edit' && editingBoxId) {
            const updatedBoxes = currentMemberBoxes.map(b =>
                b.id === editingBoxId
                    ? { ...b, name: boxName.trim(), color: boxColor, filterTags: boxTags, filterStatuses: boxStatuses }
                    : b
            );
            updateMemberBoxes(updatedBoxes);
        }

        closeForm();
    };

    const deleteBox = (boxId: string) => {
        updateMemberBoxes(currentMemberBoxes.filter(b => b.id !== boxId));
    };

    // Contagem de filtros ativos
    const activeFilterCount = useMemo(() => {
        const { localFilters } = settings;
        return localFilters.tags.length + localFilters.statuses.length +
            localFilters.assignees.length + localFilters.priorities.length;
    }, [settings.localFilters]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed right-0 top-0 h-full w-[440px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-3 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Settings size={22} className="text-white" />
                        <div>
                            <h2 className="text-base font-bold text-white">Configurações</h2>
                            <p className="text-xs text-slate-400">{memberName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {hasUnsavedChanges && (
                            <span className="text-xs text-amber-400 font-medium">Não salvo</span>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={18} className="text-white" />
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                    {(['geral', 'boxes', 'filtros', 'membros'] as SettingsTab[]).map((tab) => {
                        const isActive = activeTab === tab;
                        const labels: Record<SettingsTab, { icon: React.ReactNode; label: string }> = {
                            geral: { icon: <Eye size={14} />, label: 'Geral' },
                            boxes: { icon: <Box size={14} />, label: 'Boxes' },
                            filtros: { icon: <Filter size={14} />, label: 'Filtros' },
                            membros: { icon: <Users size={14} />, label: 'Membros' }
                        };
                        const tabInfo = labels[tab];
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all border-b-2 ${isActive
                                    ? 'border-indigo-600 text-indigo-700 bg-white'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                {tabInfo.icon}
                                {tabInfo.label}
                                {tab === 'boxes' && currentMemberBoxes.length > 0 && (
                                    <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                        {currentMemberBoxes.length}
                                    </span>
                                )}
                                {tab === 'filtros' && activeFilterCount > 0 && (
                                    <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                        {activeFilterCount}
                                    </span>
                                )}
                                {tab === 'membros' && settings.visibleMembers.length > 0 && (
                                    <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                                        {settings.visibleMembers.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-5">
                    {/* ============================================ */}
                    {/* TAB: GERAL */}
                    {/* ============================================ */}
                    {activeTab === 'geral' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Eye size={18} className="text-indigo-600" />
                                <h3 className="font-bold text-slate-800">Configurações de Visualização</h3>
                            </div>

                            <div className="space-y-2">
                                {/* Toggle: Sem Responsável (Não atribuído) */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <UserX size={16} className="text-slate-500" />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Mostrar "Não atribuído"</span>
                                            <p className="text-xs text-slate-400">Exibir aba de tarefas sem responsável</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateSetting('showUnassigned', !settings.showUnassigned)}
                                        className={`w-10 h-6 rounded-full transition-colors ${settings.showUnassigned ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.showUnassigned ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Toggle: Ordenar Alfabeticamente */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <ArrowUpAZ size={16} className="text-slate-500" />
                                        <div>
                                            <span className="text-sm font-medium text-slate-700">Ordenar A-Z</span>
                                            <p className="text-xs text-slate-400">Ordenar projetos alfabeticamente</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => updateSetting('sortProjectsAlphabetically', !settings.sortProjectsAlphabetically)}
                                        className={`w-10 h-6 rounded-full transition-colors ${settings.sortProjectsAlphabetically ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.sortProjectsAlphabetically ? 'translate-x-5' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {/* Zoom Slider */}
                                <div className="p-3 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-slate-700">Zoom</span>
                                        <span className="text-sm font-bold text-indigo-600">{Math.round(settings.viewScale * 100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateSetting('viewScale', Math.max(0.5, settings.viewScale - 0.1))} className="p-1">
                                            <ZoomOut size={14} className="text-slate-400" />
                                        </button>
                                        <input
                                            type="range"
                                            min="0.5"
                                            max="1.5"
                                            step="0.1"
                                            value={settings.viewScale}
                                            onChange={(e) => updateSetting('viewScale', parseFloat(e.target.value))}
                                            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <button onClick={() => updateSetting('viewScale', Math.min(1.5, settings.viewScale + 0.1))} className="p-1">
                                            <ZoomIn size={14} className="text-slate-400" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* TAB: MEMBROS */}
                    {/* ============================================ */}
                    {activeTab === 'membros' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Users size={18} className="text-blue-600" />
                                <h3 className="font-bold text-slate-800">Ordem dos Membros</h3>
                                {settings.memberOrder.length > 0 && (
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                        Customizada
                                    </span>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 mb-3">
                                Arraste ou use as setas para ordenar os membros. Deixe vazio para ordem padrão.
                            </p>

                            <div className="space-y-1 max-h-64 overflow-y-auto">
                                {(() => {
                                    // Get ordered members
                                    const orderedMembers = settings.memberOrder.length > 0
                                        ? [...availableMembers].sort((a, b) => {
                                            const indexA = settings.memberOrder.indexOf(a.id);
                                            const indexB = settings.memberOrder.indexOf(b.id);
                                            if (indexA === -1 && indexB === -1) return 0;
                                            if (indexA === -1) return 1;
                                            if (indexB === -1) return -1;
                                            return indexA - indexB;
                                        })
                                        : availableMembers;

                                    const moveMember = (memberId: string, direction: 'up' | 'down') => {
                                        // Initialize order if empty
                                        let currentOrder = settings.memberOrder.length > 0
                                            ? [...settings.memberOrder]
                                            : availableMembers.map(m => m.id);

                                        const currentIndex = currentOrder.indexOf(memberId);
                                        if (currentIndex === -1) return;

                                        const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
                                        if (newIndex < 0 || newIndex >= currentOrder.length) return;

                                        // Swap
                                        [currentOrder[currentIndex], currentOrder[newIndex]] = [currentOrder[newIndex], currentOrder[currentIndex]];
                                        updateSetting('memberOrder', currentOrder);
                                    };

                                    return orderedMembers.map((member, index) => {
                                        const isVisible = settings.visibleMembers.length === 0 || settings.visibleMembers.includes(member.id);
                                        return (
                                            <div
                                                key={member.id}
                                                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isVisible ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        onClick={() => moveMember(member.id, 'up')}
                                                        disabled={index === 0}
                                                        className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                                        title="Mover para cima"
                                                    >
                                                        <ArrowUp size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveMember(member.id, 'down')}
                                                        disabled={index === orderedMembers.length - 1}
                                                        className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                                        title="Mover para baixo"
                                                    >
                                                        <ArrowDown size={12} />
                                                    </button>
                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={isVisible}
                                                    onChange={() => {
                                                        let newMembers = [...settings.visibleMembers];
                                                        if (settings.visibleMembers.length === 0) {
                                                            newMembers = availableMembers.map(m => m.id).filter(id => id !== member.id);
                                                        } else if (newMembers.includes(member.id)) {
                                                            newMembers = newMembers.filter(id => id !== member.id);
                                                            if (newMembers.length === availableMembers.length - 1) newMembers = [];
                                                        } else {
                                                            newMembers.push(member.id);
                                                            if (newMembers.length === availableMembers.length) newMembers = [];
                                                        }
                                                        updateSetting('visibleMembers', newMembers);
                                                    }}
                                                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                                />

                                                <span className={`text-sm flex-1 ${isVisible ? 'font-medium text-blue-700' : 'text-slate-500'}`}>
                                                    {member.name}
                                                </span>

                                                <span className="text-xs text-slate-400">#{index + 1}</span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            <div className="flex gap-2 mt-2">
                                {settings.visibleMembers.length > 0 && (
                                    <button
                                        onClick={() => updateSetting('visibleMembers', [])}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Mostrar todos
                                    </button>
                                )}
                                {settings.memberOrder.length > 0 && (
                                    <button
                                        onClick={() => updateSetting('memberOrder', [])}
                                        className="text-xs text-slate-500 hover:text-rose-600 font-medium"
                                    >
                                        Resetar ordem
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* TAB: FILTROS */}
                    {/* ============================================ */}
                    {activeTab === 'filtros' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Filter size={18} className="text-emerald-600" />
                                    <h3 className="font-bold text-slate-800">Filtros da View</h3>
                                    {activeFilterCount > 0 && (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </div>
                                {activeFilterCount > 0 && (
                                    <button
                                        onClick={() => updateLocalFilters(createDefaultLocalFilters())}
                                        className="text-xs text-slate-500 hover:text-rose-600"
                                    >
                                        Limpar
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 mb-3">
                                Filtros aplicados a TODOS os boxes desta view
                            </p>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Tags</p>
                                    <TagSelector
                                        selectedTags={settings.localFilters.tags}
                                        availableTags={availableTags}
                                        onTagsChange={(tags) => updateLocalFilters({ ...settings.localFilters, tags })}
                                        variant="compact"
                                    />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1.5">Status</p>
                                    <StatusSelector
                                        selectedStatuses={settings.localFilters.statuses}
                                        availableStatuses={availableStatuses}
                                        onStatusesChange={(statuses) => updateLocalFilters({ ...settings.localFilters, statuses })}
                                        variant="compact"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ============================================ */}
                    {/* TAB: BOXES */}
                    {/* ============================================ */}
                    {activeTab === 'boxes' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Box size={18} className="text-purple-600" />
                                    <h3 className="font-bold text-slate-800">Boxes Customizados</h3>
                                    {currentMemberBoxes.length > 0 && (
                                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                            {currentMemberBoxes.length}
                                        </span>
                                    )}
                                </div>
                                {!boxFormMode && (
                                    <button
                                        onClick={openCreateForm}
                                        className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                )}
                            </div>

                            <p className="text-xs text-slate-500 mb-3">
                                Crie boxes para agrupar tarefas por critérios específicos
                            </p>

                            {/* Formulário de criar/editar box */}
                            {boxFormMode && (
                                <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
                                    <p className="text-sm font-bold text-purple-800 mb-3">
                                        {boxFormMode === 'create' ? '+ Novo Box' : '✏️ Editar Box'}
                                    </p>

                                    <input
                                        type="text"
                                        value={boxName}
                                        onChange={(e) => setBoxName(e.target.value)}
                                        placeholder="Nome do box..."
                                        className="w-full px-3 py-2 text-sm border border-purple-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500/30 bg-white"
                                        autoFocus
                                    />

                                    {/* Cor do Box */}
                                    <p className="text-xs font-bold text-purple-600 mb-2">Cor do Box</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {AVAILABLE_COLORS.map(color => (
                                            <button
                                                key={color.hex}
                                                onClick={() => setBoxColor(color.hex)}
                                                title={color.name}
                                                className={`w-7 h-7 rounded-lg transition-all ${boxColor === color.hex ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : 'hover:scale-105'}`}
                                                style={{ backgroundColor: color.hex }}
                                            />
                                        ))}
                                    </div>

                                    {/* Filtrar por Tags */}
                                    <p className="text-xs font-bold text-purple-600 mb-2">Filtrar por Tags</p>
                                    <div className="mb-3">
                                        <TagSelector
                                            selectedTags={boxTags}
                                            availableTags={availableTags}
                                            onTagsChange={setBoxTags}
                                            variant="compact"
                                        />
                                    </div>

                                    {/* Filtrar por Status */}
                                    <p className="text-xs font-bold text-purple-600 mb-2">Filtrar por Status</p>
                                    <div className="mb-4">
                                        <StatusSelector
                                            selectedStatuses={boxStatuses}
                                            availableStatuses={availableStatuses}
                                            onStatusesChange={setBoxStatuses}
                                            variant="compact"
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={saveBox}
                                            disabled={!boxName.trim()}
                                            className="flex-1 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <Check size={16} />
                                            {boxFormMode === 'create' ? 'Criar' : 'Salvar'}
                                        </button>
                                        <button
                                            onClick={closeForm}
                                            className="px-4 py-2 bg-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-300"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Lista de boxes */}
                            {currentMemberBoxes.length === 0 && !boxFormMode ? (
                                <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                                    Nenhum box customizado para {memberName}
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {currentMemberBoxes.map((box, index) => (
                                        <div
                                            key={box.id}
                                            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                                        >
                                            <Box size={16} className="text-purple-500 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{box.name}</p>
                                                <div className="flex gap-2 text-xs text-slate-400">
                                                    {box.filterTags.length > 0 && (
                                                        <span>{box.filterTags.length} tags</span>
                                                    )}
                                                    {box.filterStatuses?.length > 0 && (
                                                        <span>{box.filterStatuses.length} status</span>
                                                    )}
                                                    {box.filterTags.length === 0 && (!box.filterStatuses || box.filterStatuses.length === 0) && (
                                                        <span className="italic">Sem filtros</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-0.5">
                                                <button
                                                    onClick={() => openEditForm(box)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteBox(box.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer - Botões de Ação */}
                <div className="shrink-0 px-5 py-4 bg-slate-50 border-t border-slate-200 space-y-3">
                    {/* Botão Backup na Nuvem (se disponível) */}
                    {onCloudSync && (
                        <button
                            onClick={handleCloudSync}
                            disabled={isCloudSyncing}
                            className={`w-full py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${cloudSyncStatus === 'success'
                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                    : cloudSyncStatus === 'error'
                                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                                        : 'bg-sky-100 text-sky-700 border border-sky-300 hover:bg-sky-200'
                                }`}
                        >
                            {isCloudSyncing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : cloudSyncStatus === 'success' ? (
                                <Check size={16} />
                            ) : cloudSyncStatus === 'error' ? (
                                <CloudOff size={16} />
                            ) : (
                                <Cloud size={16} />
                            )}
                            {isCloudSyncing
                                ? 'Salvando na Nuvem...'
                                : cloudSyncStatus === 'success'
                                    ? 'Salvo na Nuvem!'
                                    : cloudSyncStatus === 'error'
                                        ? 'Erro ao Salvar'
                                        : 'Backup na Nuvem (Supabase)'
                            }
                        </button>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onReset}
                            className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={16} />
                            Resetar
                        </button>
                        <button
                            onClick={() => {
                                onSave();
                                onClose();
                            }}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 ${hasUnsavedChanges
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                        >
                            <Save size={16} />
                            {hasUnsavedChanges ? 'Salvar' : 'Salvar e Fechar'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DailySettingsPanel;

