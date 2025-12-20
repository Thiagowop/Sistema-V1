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
    ToggleLeft, Download, RotateCcw, Database, Settings, BookOpen
} from 'lucide-react';
import { DailySpace } from '../components/DailySpace';
import { FilterMetadata } from '../types/FilterConfig';
import { extractFilterMetadata } from '../services/clickup';

const DEV_DEFAULTS = {
    apiKey: "",
    teamId: "",
    viewId: "",
    listIds: "",
    proxy: "https://corsproxy.io/?"
};

type AdminTab = 'api' | 'security' | 'team' | 'data' | 'filters' | 'diario';

export const AdminDashboard: React.FC = () => {
    const { config, setConfig, clearCache } = useData();
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
        if (confirm('Limpar todo o cache? Você precisará sincronizar novamente.')) {
            if (clearCache) clearCache();
            localStorage.removeItem('dailyFlow_cache_v2');
            localStorage.removeItem('dailyFlow_rawCache_v2');
            localStorage.removeItem('dailyFlow_filters_v2');
            alert('✅ Cache limpo com sucesso!');
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
                    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn p-4 md:p-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Filtros de Sincronização</h3>
                            <p className="text-sm text-slate-500">Configure quais tags serão incluídas na sincronização com ClickUp API</p>
                        </div>

                        {/* API Tag Filters */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                                    <Settings size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 mb-1">🏷️ Filtros de Tags (API)</h4>
                                    <p className="text-sm text-slate-500">
                                        Selecione as tags para filtrar diretamente na API do ClickUp.
                                        Apenas tarefas com pelo menos UMA dessas tags serão importadas.
                                        {apiTagFilters.length > 0 && (
                                            <strong className="block mt-2 text-indigo-600">
                                                {apiTagFilters.length} tag{apiTagFilters.length > 1 ? 's' : ''} selecionada{apiTagFilters.length > 1 ? 's' : ''}
                                            </strong>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {filterMetadata && filterMetadata.tags.length > 0 ? (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-1">
                                        {filterMetadata.tags.map(tag => (
                                            <label
                                                key={tag}
                                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                                                    ${apiTagFilters.includes(tag)
                                                        ? 'border-indigo-500 bg-indigo-50'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={apiTagFilters.includes(tag)}
                                                    onChange={() => toggleTag(tag)}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">{tag}</span>
                                            </label>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 mt-6 pt-6 border-t border-slate-200">
                                        <button
                                            onClick={handleSaveFilters}
                                            className="flex-1 px-6 py-3 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Save size={16} />
                                            Salvar Filtros
                                        </button>
                                        <button
                                            onClick={() => setApiTagFilters([])}
                                            className="px-6 py-3 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            Limpar Todos
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-slate-400 text-sm">
                                        Nenhuma tag disponível. Sincronize dados primeiro para ver as tags disponíveis.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} />
                                Como Funciona
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-2">
                                <li>✅ <strong>Filtro API:</strong> Tags selecionadas são enviadas direto para ClickUp API</li>
                                <li>⚡ <strong>Performance:</strong> 10-50x mais rápido ao filtrar por tags</li>
                                <li>🎯 <strong>Lógica OR:</strong> Tarefas com pelo menos UMA tag selecionada serão importadas</li>
                                <li>💾 <strong>Automático:</strong> Filtros são aplicados automaticamente no próximo sync</li>
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

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-700 text-sm">
                                Privilégios do Sistema
                            </div>

                            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl ${isReadOnly ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                        {isReadOnly ? <Lock size={24} /> : <Unlock size={24} />}
                                    </div>
                                    <div>
                                        <p className="text-base font-bold text-slate-800">Modo Somente Leitura (Global)</p>
                                        <p className="text-sm text-slate-500 max-w-md">Bloqueia edições para evitar alterações acidentais.</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsReadOnly(!isReadOnly)} className={isReadOnly ? 'text-amber-600' : 'text-slate-300'}>
                                    {isReadOnly ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* API Tab */}
                {activeTab === 'api' && (
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
                )}

                {/* Team Tab */}
                {activeTab === 'team' && (
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
                )}

                {/* Data Tab */}
                {activeTab === 'data' && (
                    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn p-4 md:p-8">
                        <h3 className="text-xl font-bold text-slate-800">Manutenção de Dados</h3>

                        {/* Export Config */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                    <Download size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 mb-1">Exportar Configurações</h4>
                                    <p className="text-sm text-slate-500 mb-4">Baixe um backup das suas configurações.</p>
                                    <button
                                        onClick={handleExportConfig}
                                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                                    >
                                        Exportar JSON
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Clear Cache */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                                    <Database size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 mb-1">Limpar Cache</h4>
                                    <p className="text-sm text-slate-500 mb-4">Remove dados em cache e filtros salvos.</p>
                                    <button
                                        onClick={handleClearCache}
                                        className="px-4 py-2 bg-amber-600 text-white text-sm font-bold rounded-lg hover:bg-amber-700 transition-colors"
                                    >
                                        Limpar Cache
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="pt-4 border-t border-slate-200">
                            <h3 className="text-xl font-bold text-rose-600 flex items-center gap-2">
                                <AlertTriangle size={20} /> Zona de Perigo
                            </h3>
                            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                                <div>
                                    <h4 className="font-bold text-rose-800 text-sm">Resetar Sistema Completo</h4>
                                    <p className="text-xs text-rose-600 mt-1">Remove TODAS as configurações, cache e dados. Esta ação não pode ser desfeita.</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg text-sm hover:bg-rose-600 hover:text-white transition-colors"
                                >
                                    ⚠️ Resetar Tudo
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
