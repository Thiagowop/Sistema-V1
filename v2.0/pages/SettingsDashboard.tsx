/**
 * @id SETT-001
 * @name SettingsDashboard
 * @description Dashboard de configurações do sistema
 */

import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Settings, Save, Key, Users, Calendar, RefreshCw,
    CheckCircle2, AlertCircle, Eye, EyeOff, Trash2,
    Database, Clock, Shield, Info, Download, RotateCcw, AlertTriangle
} from 'lucide-react';

interface ConfigState {
    clickupApiToken: string;
    clickupTeamId: string;
    clickupListIds: string;
    corsProxy: string;
}

const CONFIG_KEY = 'dailyFlow_config_v2';

export const SettingsDashboard: React.FC = () => {
    const { config, setConfig, syncState, clearCache } = useData();
    const [formData, setFormData] = useState<ConfigState>({
        clickupApiToken: '',
        clickupTeamId: '',
        clickupListIds: '',
        corsProxy: ''
    });
    const [showToken, setShowToken] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [activeTab, setActiveTab] = useState<'api' | 'cache' | 'admin' | 'about'>('api');

    // Load config on mount
    useEffect(() => {
        if (config) {
            setFormData({
                clickupApiToken: config.clickupApiToken || '',
                clickupTeamId: config.clickupTeamId || '',
                clickupListIds: config.clickupListIds || '',
                corsProxy: config.corsProxy || ''
            });
        }
    }, [config]);

    const handleChange = (field: keyof ConfigState, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setSaveStatus('idle');
    };

    const handleSave = () => {
        setSaveStatus('saving');
        try {
            // Save to localStorage
            const currentConfig = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
            const newConfig = { ...currentConfig, ...formData };
            localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));

            // Update context
            if (setConfig && config) {
                setConfig({ ...config, ...formData });
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (error) {
            setSaveStatus('error');
        }
    };

    const handleClearCache = () => {
        if (window.confirm('Tem certeza que deseja limpar todo o cache? Você precisará sincronizar novamente.')) {
            if (clearCache) {
                clearCache();
            }
            localStorage.removeItem('dailyFlow_cache_v2');
            localStorage.removeItem('dailyFlow_rawCache_v2');
            alert('Cache limpo com sucesso!');
        }
    };

    const isConfigured = formData.clickupApiToken && formData.clickupTeamId;

    return (
        <div className="h-full bg-slate-50 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-800 rounded-xl text-white">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">Configurações</h1>
                            <p className="text-sm text-slate-500">Configure a integração com ClickUp e gerencie o sistema</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1">
                    {[
                        { key: 'api', label: 'API ClickUp', icon: Key },
                        { key: 'cache', label: 'Cache', icon: Database },
                        { key: 'admin', label: 'Admin', icon: Shield },
                        { key: 'about', label: 'Sobre', icon: Info },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.key
                                ? 'bg-slate-800 text-white'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* API Tab */}
                {activeTab === 'api' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Key className="text-indigo-600" size={20} />
                                    <h2 className="text-lg font-bold text-slate-800">Credenciais ClickUp</h2>
                                </div>
                                {isConfigured ? (
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                                        <CheckCircle2 size={14} /> Configurado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                                        <AlertCircle size={14} /> Pendente
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* API Token */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                                    <Key size={12} /> API Token *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showToken ? 'text' : 'password'}
                                        value={formData.clickupApiToken}
                                        onChange={(e) => handleChange('clickupApiToken', e.target.value)}
                                        placeholder="pk_xxxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                                    />
                                    <button
                                        onClick={() => setShowToken(!showToken)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400">
                                    Obtenha em: ClickUp → Settings → Apps → API Token
                                </p>
                            </div>

                            {/* Team ID */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                                    <Users size={12} /> Team ID *
                                </label>
                                <input
                                    type="text"
                                    value={formData.clickupTeamId}
                                    onChange={(e) => handleChange('clickupTeamId', e.target.value)}
                                    placeholder="9012345678"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-400">
                                    Encontre na URL: app.clickup.com/{'{team_id}'}/...
                                </p>
                            </div>

                            {/* List IDs (Optional) */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider">
                                    <Calendar size={12} /> List IDs (opcional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.clickupListIds}
                                    onChange={(e) => handleChange('clickupListIds', e.target.value)}
                                    placeholder="901234567890"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <p className="text-xs text-slate-400">
                                    Se vazio, busca todas as listas do Team
                                </p>
                            </div>

                            {/* Save Button */}
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={handleSave}
                                    disabled={saveStatus === 'saving'}
                                    className={`flex items-center justify-center gap-2 w-full py-4 rounded-xl text-sm font-bold transition-all ${saveStatus === 'saved'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-800 text-white hover:bg-slate-900'
                                        }`}
                                >
                                    {saveStatus === 'saving' && <RefreshCw size={16} className="animate-spin" />}
                                    {saveStatus === 'saved' && <CheckCircle2 size={16} />}
                                    {saveStatus === 'idle' && <Save size={16} />}
                                    {saveStatus === 'error' && <AlertCircle size={16} />}
                                    {saveStatus === 'saving' ? 'Salvando...' :
                                        saveStatus === 'saved' ? 'Salvo com Sucesso!' :
                                            saveStatus === 'error' ? 'Erro ao Salvar' : 'Salvar Configurações'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Cache Tab */}
                {activeTab === 'cache' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <Database className="text-indigo-600" size={20} />
                                    <h2 className="text-lg font-bold text-slate-800">Gerenciamento de Cache</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Cache Status */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Status Sync</p>
                                        <p className="text-lg font-black text-slate-700 capitalize">{syncState?.status || 'idle'}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Última Sync</p>
                                        <p className="text-lg font-black text-slate-700">
                                            {syncState?.lastSync ? new Date(syncState.lastSync).toLocaleTimeString('pt-BR') : 'Nunca'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Progresso</p>
                                        <p className="text-lg font-black text-slate-700">{syncState?.progress || 0}%</p>
                                    </div>
                                </div>

                                {/* Clear Cache */}
                                <div className="pt-4 border-t border-slate-100">
                                    <button
                                        onClick={handleClearCache}
                                        className="flex items-center justify-center gap-2 w-full py-4 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all"
                                    >
                                        <Trash2 size={16} />
                                        Limpar Todo o Cache
                                    </button>
                                    <p className="text-xs text-slate-400 text-center mt-2">
                                        Remove dados locais. Você precisará sincronizar novamente.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Admin Tab */}
                {activeTab === 'admin' && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <Shield className="text-purple-600" size={20} />
                                    <h2 className="text-lg font-bold text-slate-800">Administração Avançada</h2>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                {/* Reset Filters */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg">
                                            <RotateCcw className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 mb-1">Resetar Filtros</h4>
                                            <p className="text-xs text-slate-500 mb-3">
                                                Remove todos os filtros salvos e volta ao estado padrão.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Resetar todos os filtros?')) {
                                                        localStorage.removeItem('dailyFlow_filters_v2');
                                                        alert('Filtros resetados!');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors"
                                            >
                                                Resetar Filtros
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Export Data */}
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg">
                                            <Download className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-800 mb-1">Exportar Configurações</h4>
                                            <p className="text-xs text-slate-500 mb-3">
                                                Baixe um backup das suas configurações.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    const config = localStorage.getItem('dailyFlow_config_v2');
                                                    if (config) {
                                                        const blob = new Blob([config], { type: 'application/json' });
                                                        const url = URL.createObjectURL(blob);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = `dailyflow_config_${new Date().toISOString().split('T')[0]}.json`;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    } else {
                                                        alert('Nenhuma configuração encontrada.');
                                                    }
                                                }}
                                                className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                                            >
                                                Exportar JSON
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-white rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-rose-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-rose-800 mb-1">Reset Completo</h4>
                                            <p className="text-xs text-rose-600 mb-3">
                                                Remove TODAS as configurações e dados. Essa ação não pode ser desfeita.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    if (confirm('ATENÇÃO! Isso vai apagar TODAS as configurações. Continuar?')) {
                                                        const keys = [];
                                                        for (let i = 0; i < localStorage.length; i++) {
                                                            const key = localStorage.key(i);
                                                            if (key && key.includes('dailyFlow')) keys.push(key);
                                                        }
                                                        keys.forEach(k => localStorage.removeItem(k));
                                                        alert('Reset completo! A página será recarregada.');
                                                        window.location.reload();
                                                    }
                                                }}
                                                className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors"
                                            >
                                                ⚠️ Reset Tudo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* About Tab */}
                {activeTab === 'about' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div className="text-center space-y-4">
                            <div className="inline-flex p-4 bg-indigo-100 rounded-2xl text-indigo-600">
                                <Shield size={40} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">Daily Flow v2.0</h2>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Sistema de gestão de tarefas e acompanhamento de equipe integrado com ClickUp.
                            </p>

                            <div className="pt-6 border-t border-slate-100 space-y-2 text-sm text-slate-500">
                                <p><strong>Versão:</strong> 2.0.0</p>
                                <p><strong>Build:</strong> 2025-12-17</p>
                                <p><strong>Stack:</strong> React + TypeScript + Vite</p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SettingsDashboard;
