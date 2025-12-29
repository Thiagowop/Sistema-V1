/**
 * @id LIB-001
 * @name ComponentLibrary
 * @description Biblioteca de componentes disponíveis para seleção
 */

import React, { useState, Suspense, lazy } from 'react';
import { useData } from '../contexts/DataContext';
import {
    Layers, Eye, EyeOff, RefreshCw, AlertCircle,
    Folder, BarChart2, Calendar, Users, Target, Settings,
    TrendingUp, Clock, Shield, Layout
} from 'lucide-react';

// Definição dos componentes disponíveis com metadados
const LIBRARY_ITEMS = [
    // === JÁ MIGRADOS ===
    { id: 'LIB-101', name: 'DailyAlignmentDashboard', category: 'Core', status: 'active', icon: Users, description: 'Alinhamento diário por membro' },
    { id: 'LIB-102', name: 'ProjectsDashboard', category: 'Core', status: 'active', icon: Folder, description: 'Boxes de projetos por membro' },
    { id: 'LIB-103', name: 'TeamWorkloadDashboard', category: 'Core', status: 'active', icon: BarChart2, description: 'Carga de trabalho da equipe' },
    { id: 'LIB-104', name: 'QualityDashboard', category: 'Core', status: 'active', icon: Shield, description: 'Auditoria de qualidade dos dados' },

    // === PENDENTES DE MIGRAÇÃO ===
    { id: 'LIB-201', name: 'GeneralTeamDashboard', category: 'Gestão', status: 'pending', icon: Layout, description: 'Visão geral consolidada da equipe' },
    { id: 'LIB-202', name: 'AllocationDashboard', category: 'Gestão', status: 'pending', icon: Target, description: 'Alocação de recursos' },
    { id: 'LIB-203', name: 'PriorityDashboard', category: 'Gestão', status: 'pending', icon: TrendingUp, description: 'Distribuição de prioridades' },
    { id: 'LIB-204', name: 'AttendanceDashboard', category: 'Gestão', status: 'pending', icon: Calendar, description: 'Controle de presença' },
    { id: 'LIB-205', name: 'SettingsDashboard', category: 'Admin', status: 'pending', icon: Settings, description: 'Configurações do sistema' },

    // === PROTÓTIPOS ===
    { id: 'LIB-301', name: 'BI_Playground', category: 'Prototype', status: 'prototype', icon: BarChart2, description: 'Playground de BI experimental' },
    { id: 'LIB-302', name: 'OrbitViewProto', category: 'Prototype', status: 'prototype', icon: Layers, description: 'Visualização orbital' },
    { id: 'LIB-303', name: 'PredictiveDelaysView', category: 'Prototype', status: 'prototype', icon: Clock, description: 'Previsão de atrasos' },
    { id: 'LIB-304', name: 'StrategicViewProto', category: 'Prototype', status: 'prototype', icon: Target, description: 'Visão estratégica' },
    { id: 'LIB-305', name: 'MonthlyTimesheetGrid', category: 'Prototype', status: 'prototype', icon: Calendar, description: 'Timesheet mensal em grid' },
    { id: 'LIB-306', name: 'PriorityDistributionProto', category: 'Prototype', status: 'prototype', icon: TrendingUp, description: 'Distribuição de prioridades proto' },
    { id: 'LIB-307', name: 'ProjectAllocationDashboard', category: 'Prototype', status: 'prototype', icon: Folder, description: 'Alocação por projeto' },
];

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Core': return 'bg-emerald-500';
        case 'Gestão': return 'bg-indigo-500';
        case 'Admin': return 'bg-amber-500';
        case 'Prototype': return 'bg-violet-500';
        default: return 'bg-slate-500';
    }
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'active': return { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        case 'pending': return { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        case 'prototype': return { label: 'Protótipo', color: 'bg-violet-100 text-violet-700 border-violet-200' };
        default: return { label: 'N/A', color: 'bg-slate-100 text-slate-500 border-slate-200' };
    }
};

export const ComponentLibrary: React.FC = () => {
    const { groupedData, syncState } = useData();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [previewComponent, setPreviewComponent] = useState<string | null>(null);

    const hasData = groupedData && groupedData.length > 0;
    const categories = ['all', 'Core', 'Gestão', 'Admin', 'Prototype'];

    const filteredItems = selectedCategory === 'all'
        ? LIBRARY_ITEMS
        : LIBRARY_ITEMS.filter(item => item.category === selectedCategory);

    const stats = {
        total: LIBRARY_ITEMS.length,
        active: LIBRARY_ITEMS.filter(i => i.status === 'active').length,
        pending: LIBRARY_ITEMS.filter(i => i.status === 'pending').length,
        prototype: LIBRARY_ITEMS.filter(i => i.status === 'prototype').length,
    };

    return (
        <div className="h-full bg-slate-50 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">Biblioteca de Componentes</h1>
                                <p className="text-sm text-slate-500">Explore e selecione dashboards disponíveis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="font-bold text-emerald-700">{stats.active} Ativos</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className="font-bold text-amber-700">{stats.pending} Pendentes</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-50 rounded-lg border border-violet-100">
                                <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                <span className="font-bold text-violet-700">{stats.prototype} Protótipos</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat
                                        ? 'bg-slate-800 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat === 'all' ? 'Todos' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Status Warning */}
                {!hasData && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="text-amber-600" size={20} />
                        <p className="text-sm text-amber-800">
                            <strong>Dados não carregados.</strong> Sincronize na aba "Sync" para ver os componentes com dados reais.
                        </p>
                    </div>
                )}

                {/* Components Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const statusBadge = getStatusBadge(item.status);
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all group cursor-pointer"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-xl ${getCategoryColor(item.category)} text-white`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${statusBadge.color}`}>
                                        {statusBadge.label}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="mb-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        {item.id}
                                    </p>
                                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                        {item.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        {item.category}
                                    </span>
                                    {item.status === 'active' ? (
                                        <button className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                            <Eye size={12} /> Disponível
                                        </button>
                                    ) : (
                                        <button className="flex items-center gap-1 text-xs font-bold text-slate-400">
                                            <EyeOff size={12} /> Migrar
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase mb-3">Legenda de Status</h4>
                    <div className="flex flex-wrap gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span><strong>Ativo:</strong> Já migrado e funcionando no v2.0</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span><strong>Pendente:</strong> Disponível para migração</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                            <span><strong>Protótipo:</strong> Experimental, pode necessitar ajustes</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ComponentLibrary;
