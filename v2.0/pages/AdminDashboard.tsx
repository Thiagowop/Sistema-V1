/**
 * @id ADMIN-001
 * @name AdminDashboard
 * @description Dashboard de administração com layout de sidebar lateral
 * Migrado de Referencia/components/AdminDashboard.tsx
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Save, Key, Plus, Trash2, Upload, HardDrive, Eye, EyeOff, Check,
    Shield, AlertTriangle, Users, Globe, Lock, Unlock, ToggleRight,
    ToggleLeft, Download, RotateCcw, Database, Settings, BookOpen, FolderOpen, Settings2, Calendar,
    Construction, Zap
} from 'lucide-react';
import { referenceData, getEquipTags, getTeamMembers, getProjects } from '../services/referenceDataService';
import { DailySpace } from '../components/DailySpace';
import { FilterMetadata } from '../types/FilterConfig';
import { extractFilterMetadata } from '../services/clickup';
import { getCachedMetadata, saveSyncFilters } from '../services/filterService';

import { Tag, CheckCircle, Filter } from 'lucide-react';
import { SyncFiltersModal } from '../components/SyncFiltersModal';

const DEV_DEFAULTS = {
    apiKey: "",
    teamId: "",
    viewId: "",
    listIds: "",
    proxy: "https://corsproxy.io/?"
};

type AdminTab = 'api' | 'security' | 'team' | 'data' | 'filters' | 'diario';

// GlobalFiltersSection completely removed - using SyncFiltersModal instead

export const AdminDashboard: React.FC = () => {
    const { config, setConfig, clearCache, syncFilters, setSyncFilters, metadata } = useData();
    const [activeTab, setActiveTab] = useState<AdminTab>('api');
    const [isReadOnly, setIsReadOnly] = useState(false);

    const [apiKey, setApiKey] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);
    const [listIds, setListIds] = useState('');
    const [teamId, setTeamId] = useState('');
    const [viewId, setViewId] = useState('');
    const [corsProxy, setCorsProxy] = useState('');

    const [mappings, setMappings] = useState<{ original: string; display: string; role: string }[]>([]);
    const [isSaved, setIsSaved] = useState(true);

    // NEW: Filters state
    const [apiTagFilters, setApiTagFilters] = useState<string[]>([]);
    const [filterMetadata, setFilterMetadata] = useState<FilterMetadata | null>(null);
    const [showFiltersModal, setShowFiltersModal] = useState(false);

    // Emergency extract state
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractResult, setExtractResult] = useState<{ tags: number; members: number; projects: number } | null>(null);

    // Load from config on mount
    useEffect(() => {
        if (config) {
            setApiKey(config.clickupApiToken || DEV_DEFAULTS.apiKey);
            setTeamId(config.clickupTeamId || DEV_DEFAULTS.teamId);
            setListIds(config.clickupListIds || DEV_DEFAULTS.listIds);
            setCorsProxy(config.corsProxy || DEV_DEFAULTS.proxy);

            // Load saved filters
            const savedFilters = localStorage.getItem('api_tag_filters');
            if (savedFilters) {
                try {
                    setApiTagFilters(JSON.parse(savedFilters));
                } catch (e) {
                    console.error('Failed to parse saved filters', e);
                }
            }
        }
    }, [config]);

    // NEW: Load filter metadata from cache on mount
    useEffect(() => {
        const loadMetadata = () => {
            const cached = getCachedMetadata();
            if (cached) {
                setFilterMetadata(cached);
            }
        };
        loadMetadata();
    }, []);

    const handleSave = () => {
        if (isReadOnly) return;

        const newConfig = {
            ...config,
            clickupApiToken: apiKey,
            clickupTeamId: teamId,
            clickupListIds: listIds,
            corsProxy: corsProxy,
        };

        // Save to localStorage
        localStorage.setItem('dailyFlow_config_v2', JSON.stringify(newConfig));

        // Update context
        if (setConfig) {
            setConfig(newConfig);
        }


        setIsSaved(true);
        setTimeout(() => alert('✅ Configurações salvas com sucesso!'), 100);
    };

    const markUnsaved = () => setIsSaved(false);

    const updateMapping = (index: number, field: string, value: string) => {
        if (isReadOnly) return;
        const newMappings = [...mappings];
        (newMappings[index] as any)[field] = value;
        setMappings(newMappings);
        markUnsaved();
    };

    const addMapping = () => {
        if (isReadOnly) return;
        setMappings([...mappings, { original: '', display: '', role: '' }]);
        markUnsaved();
    };

    const removeMapping = (index: number) => {
        if (isReadOnly) return;
        const newMappings = [...mappings];
        newMappings.splice(index, 1);
        setMappings(newMappings);
        markUnsaved();
    };

    const handleExportConfig = () => {
        const configData = localStorage.getItem('dailyFlow_config_v2');
        if (configData) {
            const blob = new Blob([configData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dailyflow_config_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    const handleClearCache = () => {
        if (confirm('Limpar cache de DADOS? (Configurações e filtros serão MANTIDOS)')) {
            if (clearCache) clearCache();
            // Limpar apenas dados de sync, NÃO configurações
            localStorage.removeItem('dailyFlow_cache_v2');
            localStorage.removeItem('dailyFlow_rawCache_v2');
            // NÃO APAGAR: dailyFlow_config_v2, dailyFlow_syncFilters_v2, api_tag_filters
            // localStorage.removeItem('dailyFlow_filters_v2'); // REMOVIDO - manter filtros
            alert('✅ Cache de dados limpo! Configurações e filtros foram mantidos.');
        }
    };

    const handleReset = () => {
        if (confirm('⚠️ ATENÇÃO! Isso vai apagar TODAS as configurações. Continuar?')) {
            const keys: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('dailyFlow')) keys.push(key);
            }
            keys.forEach(k => localStorage.removeItem(k));
            alert('Reset completo! A página será recarregada.');
            window.location.reload();
        }
    };

    // Emergency Extract Reference Data
    const handleEmergencyExtract = async () => {
        setIsExtracting(true);
        setExtractResult(null);

        try {
            // Get raw tasks from cache or context
            const { rawTasks } = useData ? { rawTasks: [] } : { rawTasks: [] };

            // Try to extract from filterMetadata if rawTasks not available
            if (filterMetadata) {
                // Extract tags
                const tagsToSave = filterMetadata.tags.map(tag => ({
                    id: `tag_${tag.toLowerCase().replace(/\s+/g, '_')}`,
                    name: tag,
                    displayName: tag,
                    tagType: 'custom' as const,
                    isEquipment: tag.toLowerCase().includes('equip')
                }));
                await referenceData.mergeItems('equip_tags', tagsToSave, 'manual');

                // Extract team members
                const membersToSave = filterMetadata.assignees.map(name => ({
                    id: `member_${name.toLowerCase().replace(/\s+/g, '_')}`,
                    name: name,
                    displayName: name,
                    email: '',
                    active: true
                }));
                await referenceData.mergeItems('team_members', membersToSave, 'manual');

                // Extract projects
                const projectsToSave = filterMetadata.projects.map(name => ({
                    id: `project_${name.toLowerCase().replace(/\s+/g, '_')}`,
                    name: name,
                    displayName: name
                }));
                await referenceData.mergeItems('projects', projectsToSave, 'manual');

                setExtractResult({
                    tags: tagsToSave.length,
                    members: membersToSave.length,
                    projects: projectsToSave.length
                });

                // Sync to Supabase
                await referenceData.syncToSupabase();

                alert(`✅ Extração concluída!\n\n📌 ${tagsToSave.length} tags\n👥 ${membersToSave.length} membros\n📁 ${projectsToSave.length} projetos\n\nDados salvos no armazenamento persistente e sincronizados com Supabase.`);
            } else {
                alert('⚠️ Nenhum metadado disponível. Faça uma sincronização primeiro.');
            }
        } catch (error) {
            console.error('Emergency extract error:', error);
            alert('❌ Erro na extração. Verifique o console.');
        } finally {
            setIsExtracting(false);
        }
    };

    // NEW: Filter handlers
    const toggleTag = (tag: string) => {
        setApiTagFilters(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const handleSaveFilters = () => {
        localStorage.setItem('api_tag_filters', JSON.stringify(apiTagFilters));
        alert(`Filtros salvos! ${apiTagFilters.length} tags selecionadas.`);
    };

    const TabButton = ({ id, label, icon: Icon }: { id: AdminTab, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap
                w-auto md:w-full
                ${activeTab === id
                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                    : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'
                }
            `}
        >
            <Icon size={18} className={activeTab === id ? 'text-indigo-600' : 'text-slate-400'} />
            {label}
        </button>
    );

    return (
        <div className="flex flex-col md:flex-row h-full bg-white overflow-hidden">

            {/* Sidebar */}
            <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
                <div className="p-4 pb-2 md:pb-6">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Shield size={20} className="text-indigo-600" />
                        Administração
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 hidden md:block">Configurações globais</p>
                </div>

                <div className="flex-1 overflow-x-auto md:overflow-y-auto px-4 pb-4 md:pb-0 custom-scrollbar">
                    <div className="flex flex-row md:flex-col gap-1 md:space-y-1">
                        <TabButton id="api" label="Conexão & API" icon={Key} />
                        <TabButton id="security" label="Segurança" icon={Shield} />
                        <TabButton id="team" label="Equipe & Mapeamento" icon={Users} />
                        <TabButton id="data" label="Dados & Manutenção" icon={HardDrive} />
                        <TabButton id="filters" label="Filtros de Sync" icon={Settings} />

                        {/* Separator */}
                        <div className="hidden md:block pt-4 mt-4 border-t border-slate-200">
                            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Área Restrita</p>
                        </div>
                        <div className="w-px h-6 bg-slate-200 mx-2 md:hidden"></div>
                        <TabButton id="diario" label="Meu Diário" icon={BookOpen} />
                    </div>
                </div>

                {/* Footer */}
                <div className="hidden md:block mt-auto p-4 border-t border-slate-200 bg-white">
                    {isReadOnly && (
                        <div className="mb-3 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                                <Lock size={12} /> Somente Leitura
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <div className={`w-2 h-2 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                        <span className="text-xs font-bold text-slate-600">{isSaved ? 'Sincronizado' : 'Pendências'}</span>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaved || isReadOnly}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 
                            ${isSaved || isReadOnly
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5'
                            }`}
                    >
                        <Save size={14} /> Salvar Tudo
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">

                {/* Filters Tab */}
                {activeTab === 'filters' && (
                    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn p-4 md:p-8">
                        {/* Em Construção Banner */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Construction size={32} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        Em Construção
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">v2.1</span>
                                    </h3>
                                    <p className="text-amber-100 text-sm mt-1">
                                        Esta funcionalidade está sendo desenvolvida. Use os filtros na aba de <strong>Sincronização</strong> por enquanto.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white opacity-50">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <div className="flex items-center gap-3">
                                    <Settings size={28} />
                                    <div>
                                        <h3 className="text-2xl font-bold">Filtros de Sincronização</h3>
                                        <p className="text-indigo-100 text-sm mt-1">
                                            Configure TODOS os filtros para importar apenas os dados necessários da API do ClickUp
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowFiltersModal(true)}
                                    disabled
                                    className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl flex items-center gap-2 border border-white/30 cursor-not-allowed"
                                >
                                    <Filter size={18} />
                                    Em Breve
                                </button>
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* 1. TAGS FILTER */}
                        {/* ============================================ */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                                <div className="flex items-center gap-3">
                                    <Tag size={20} className="text-indigo-600" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Tags</h4>
                                        <p className="text-xs text-slate-500">
                                            Filtrar tarefas por tags específicas (OR logic - qualquer tag selecionada)
                                        </p>
                                    </div>
                                    {apiTagFilters.length > 0 && (
                                        <span className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                                            {apiTagFilters.length} selecionada{apiTagFilters.length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-6">
                                {filterMetadata && filterMetadata.tags.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                        {filterMetadata.tags.map(tag => (
                                            <label
                                                key={tag}
                                                className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${apiTagFilters.includes(tag)
                                                    ? 'border-indigo-500 bg-indigo-50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={apiTagFilters.includes(tag)}
                                                    onChange={() => toggleTag(tag)}
                                                    className="w-4 h-4 text-indigo-600"
                                                />
                                                <span className="text-sm font-medium">#{tag}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-4">Nenhuma tag disponível. Faça um sync primeiro.</p>
                                )}
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* 2. ASSIGNEES/RESPONSÁVEIS FILTER */}
                        {/* ============================================ */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
                                <div className="flex items-center gap-3">
                                    <Users size={20} className="text-purple-600" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Responsáveis (Assignees)</h4>
                                        <p className="text-xs text-slate-500">
                                            Filtrar apenas tarefas de membros específicos da equipe
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {filterMetadata && filterMetadata.assignees.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {filterMetadata.assignees.map(assignee => (
                                            <label
                                                key={assignee}
                                                className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 hover:border-slate-300"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-purple-600"
                                                />
                                                <span className="text-sm font-medium">{assignee}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-4">Nenhum responsável disponível. Faça um sync primeiro.</p>
                                )}
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* 3. STATUS FILTER */}
                        {/* ============================================ */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className="text-emerald-600" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Status</h4>
                                        <p className="text-xs text-slate-500">
                                            Filtrar tarefas por status específicos
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                {filterMetadata && filterMetadata.statuses.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {filterMetadata.statuses.map(status => (
                                            <label
                                                key={status}
                                                className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 hover:border-slate-300"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 text-emerald-600"
                                                />
                                                <span className="text-sm font-medium">{status}</span>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-slate-400 py-4">Nenhum status disponível. Faça um sync primeiro.</p>
                                )}
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* 4. PRIORITY FILTER */}
                        {/* ============================================ */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={20} className="text-amber-600" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Prioridade</h4>
                                        <p className="text-xs text-slate-500">
                                            Filtrar tarefas por nível de prioridade
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['URGENT', 'HIGH', 'NORMAL', 'LOW'].map(priority => (
                                        <label
                                            key={priority}
                                            className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all border-slate-200 hover:border-slate-300"
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-amber-600"
                                            />
                                            <span className="text-sm font-medium">{priority}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* 5. DATE RANGE FILTERS */}
                        {/* ============================================ */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                                <div className="flex items-center gap-3">
                                    <Calendar size={20} className="text-blue-600" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Período de Datas</h4>
                                        <p className="text-xs text-slate-500">
                                            Filtrar tarefas por datas de criação, atualização ou entrega
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {/* Due Date Range */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Data de Entrega - Início</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Data de Entrega - Fim</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Date Created Range */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Data de Criação - Início</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Data de Criação - Fim</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Date Updated Range */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Data de Atualização - Início</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 mb-2">Data de Atualização - Fim</label>
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* 6. ADDITIONAL OPTIONS */}
                        {/* ============================================ */}
                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <Settings2 size={20} className="text-slate-600" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Opções Adicionais</h4>
                                        <p className="text-xs text-slate-500">
                                            Configurações extras para refinar a sincronização
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">Incluir Subtarefas</span>
                                        <span className="text-xs text-slate-500">Importar subtasks junto com as tarefas principais</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">Incluir Tarefas Arquivadas</span>
                                        <span className="text-xs text-slate-500">Importar tarefas marcadas como arquivadas</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">Incluir Tarefas Sem Responsável</span>
                                        <span className="text-xs text-slate-500">Importar tarefas que não têm assignee definido</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-slate-200 cursor-pointer hover:border-slate-300 transition-all">
                                    <input type="checkbox" className="w-5 h-5 text-indigo-600" />
                                    <div>
                                        <span className="text-sm font-bold text-slate-800 block">Apenas Tarefas Abertas</span>
                                        <span className="text-xs text-slate-500">Filtrar apenas tarefas que não estão concluídas</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* ============================================ */}
                        {/* SAVE BUTTON */}
                        {/* ============================================ */}
                        <div className="flex items-center justify-between gap-4 bg-white rounded-2xl border-2 border-slate-200 p-6">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Salvar Configuração de Filtros</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Essas configurações serão aplicadas na próxima sincronização
                                </p>
                            </div>
                            <button
                                onClick={handleSaveFilters}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Save size={16} />
                                Salvar Filtros
                            </button>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                <Database size={18} />
                                Como Funcionam os Filtros de Sync
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li>🎯 <strong>Filtros aplicados na API:</strong> Reduzem dados antes de importar (10-50x mais rápido)</li>
                                <li>🔗 <strong>Lógica OR (OU):</strong> Tarefas com QUALQUER filtro selecionado serão importadas</li>
                                <li>💾 <strong>Performance:</strong> Menos dados = sync mais rápido + menor uso de memória</li>
                                <li>⚡ <strong>Aplicação automática:</strong> Filtros salvos são usados em todas as sincronizações</li>
                                <li>🔄 <strong>Sync incremental:</strong> Atualizações respeitam os mesmos filtros</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Meu Diário Tab - Full height */}
                {activeTab === 'diario' && (
                    <div className="h-full w-full animate-fadeIn">
                        <DailySpace />
                    </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn p-4 md:p-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Segurança & Permissões</h3>
                            <p className="text-sm text-slate-500">Controle de acesso e restrições globais.</p>
                        </div>

                        {/* Em Construção */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <Construction size={32} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold flex items-center gap-2">
                                        Em Construção
                                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">v2.1</span>
                                    </h3>
                                    <p className="text-amber-100 text-sm mt-1">
                                        Sistema de permissões e roles será implementado em breve.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
                }

                {/* API Tab */}
                {
                    activeTab === 'api' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn p-4 md:p-8">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Conexão ClickUp API</h3>
                                    <p className="text-sm text-slate-500">Gerencie as chaves de acesso.</p>
                                </div>
                                <div className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${apiKey && apiKey.length > 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                    <Check size={12} /> {apiKey && apiKey.length > 20 ? 'Online' : 'Offline'}
                                </div>
                            </div>

                            <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">API Token</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Key size={16} className="text-slate-400" />
                                        </div>
                                        <input
                                            type={showApiKey ? "text" : "password"}
                                            value={apiKey}
                                            onChange={(e) => { setApiKey(e.target.value); markUnsaved(); }}
                                            placeholder="pk_..."
                                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                        <button
                                            onClick={() => setShowApiKey(!showApiKey)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        >
                                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team ID</label>
                                        <input
                                            type="text"
                                            value={teamId}
                                            onChange={(e) => { setTeamId(e.target.value); markUnsaved(); }}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: 9015..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">View ID</label>
                                        <input
                                            type="text"
                                            value={viewId}
                                            onChange={(e) => { setViewId(e.target.value); markUnsaved(); }}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: 8c9k-..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                                        CORS Proxy URL <Globe size={12} />
                                    </label>
                                    <input
                                        type="text"
                                        value={corsProxy}
                                        onChange={(e) => { setCorsProxy(e.target.value); markUnsaved(); }}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="https://corsproxy.io/?"
                                    />
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Team Tab */}
                {
                    activeTab === 'team' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn p-4 md:p-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Mapeamento de Equipe</h3>
                                <p className="text-sm text-slate-500">Padronize nomes e funções.</p>
                            </div>

                            <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left min-w-[600px]">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                                            <tr>
                                                <th className="px-6 py-3">Original (ClickUp)</th>
                                                <th className="px-6 py-3">Exibição</th>
                                                <th className="px-6 py-3">Função</th>
                                                <th className="px-6 py-3 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {mappings.length === 0 && (
                                                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Nenhum mapeamento configurado.</td></tr>
                                            )}
                                            {mappings.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-3 font-mono text-slate-600">
                                                        <input type="text" value={item.original} onChange={(e) => updateMapping(idx, 'original', e.target.value)} className="w-full bg-transparent outline-none" placeholder="Nome ClickUp" />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <input type="text" value={item.display} onChange={(e) => updateMapping(idx, 'display', e.target.value)} className="w-full bg-transparent outline-none font-bold" placeholder="Nome exibido" />
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <input type="text" value={item.role || ''} onChange={(e) => updateMapping(idx, 'role', e.target.value)} className="w-full bg-transparent outline-none" placeholder="Cargo/Função" />
                                                    </td>
                                                    <td className="px-6 py-3 text-right">
                                                        <button onClick={() => removeMapping(idx)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-200">
                                    <button onClick={addMapping} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700">
                                        <Plus size={16} /> Adicionar Mapeamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Data Tab */}
                {
                    activeTab === 'data' && (
                        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn p-4 md:p-8">

                            {/* Header Section - Agora Indigo Standard */}
                            <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                    <HardDrive size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
                                            <Database size={24} className="text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold tracking-tight">Dados & Manutenção</h3>
                                    </div>
                                    <p className="text-indigo-100 max-w-xl text-sm leading-relaxed">
                                        Gerencie o armazenamento local, faça backups das configurações e mantenha o sistema limpo.
                                        Ações nesta área afetam diretamente a performance do Daily Flow.
                                    </p>
                                </div>
                            </div>

                            {/* Actions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                {/* Export Config - Indigo Theme */}
                                <div className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                                            <Download size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Backup</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">Exportar Configurações</h4>
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                        Baixe um arquivo JSON contendo todas as suas chaves de API, IDs e mapeamentos.
                                    </p>
                                    <button
                                        onClick={handleExportConfig}
                                        className="w-full py-3 bg-white border-2 border-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-50"
                                    >
                                        <Download size={16} />
                                        Baixar Backup JSON
                                    </button>
                                </div>

                                {/* Emergency Extract - Amber Theme */}
                                <div className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                                            <Zap size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">Emergência</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-amber-700 transition-colors">Extrair Dados de Referência</h4>
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                        Salva tags, equipe e projetos de forma persistente no IndexedDB + Supabase.
                                    </p>
                                    <button
                                        onClick={handleEmergencyExtract}
                                        disabled={isExtracting || !filterMetadata}
                                        className={`w-full py-3 bg-white border-2 border-slate-100 text-slate-600 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${isExtracting || !filterMetadata ? 'opacity-50 cursor-not-allowed' : 'hover:border-amber-600 hover:text-amber-600 group-hover:bg-amber-50'}`}
                                    >
                                        {isExtracting ? (
                                            <>
                                                <RotateCcw size={16} className="animate-spin" />
                                                Extraindo...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Extrair & Salvar
                                            </>
                                        )}
                                    </button>
                                    {extractResult && (
                                        <div className="mt-3 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg text-center">
                                            ✅ {extractResult.tags} tags, {extractResult.members} membros, {extractResult.projects} projetos
                                        </div>
                                    )}
                                </div>

                                {/* Clear Cache - Slate Theme */}
                                <div className="group bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-500/10 transition-all duration-300">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 rounded-xl bg-slate-100 text-slate-600 group-hover:scale-110 transition-transform duration-300">
                                            <RotateCcw size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Otimização</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors">Limpar Cache Local</h4>
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                        Remove dados temporários. Credenciais e dados de referência são mantidos.
                                    </p>
                                    <button
                                        onClick={handleClearCache}
                                        className="w-full py-3 bg-white border-2 border-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:border-slate-600 hover:text-slate-700 transition-all flex items-center justify-center gap-2 group-hover:bg-slate-50"
                                    >
                                        <RotateCcw size={16} />
                                        Limpar Dados Temporários
                                    </button>
                                </div>
                            </div>

                            {/* Danger Zone - Subtle Red (Kept for semantics but muted) */}
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group hover:border-rose-200 transition-colors">
                                    <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none grayscale group-hover:grayscale-0 transition-all">
                                        <AlertTriangle size={150} className="text-rose-600" />
                                    </div>

                                    <div className="relative z-10 flex items-start gap-4 max-w-2xl">
                                        <div className="p-3 rounded-xl bg-white text-slate-400 shadow-sm shrink-0 mt-1 group-hover:text-rose-500 transition-colors">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-700 mb-1 group-hover:text-rose-700 transition-colors">Zona de Perigo</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed group-hover:text-rose-600/80 transition-colors">
                                                Esta ação apagará <strong>permanentemente</strong> todas as configurações. O sistema voltará ao estado inicial.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleReset}
                                        className="relative z-10 whitespace-nowrap px-6 py-3 bg-white border-2 border-slate-200 text-slate-500 font-bold rounded-xl text-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={16} />
                                        Resetar Sistema
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            </main >
            {/* SyncFiltersModal */}
            <SyncFiltersModal
                isOpen={showFiltersModal}
                onClose={() => setShowFiltersModal(false)}
                filterMetadata={filterMetadata || metadata}
                currentFilters={syncFilters}
                onSave={(newFilters) => {
                    setSyncFilters(newFilters);
                    saveSyncFilters(newFilters);
                }}
            />
        </div >
    );
};

export default AdminDashboard;
