/**
 * @id LIB-BROWSER-001
 * @name LibraryBrowser
 * @description Component library browser with functional preview
 */

import React, { useState, Suspense, lazy, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import {
    LIBRARY_REGISTRY,
    CATEGORIES,
    LibraryComponent,
    ComponentCategory,
    ComponentStatus
} from '../library/registry';
import {
    Layers, Eye, X, RefreshCw, AlertCircle, ChevronLeft,
    Trash2, Search, Filter as FilterIcon, Maximize2, Minimize2,
    CheckCircle2, Clock, AlertTriangle, Archive
} from 'lucide-react';

// Dynamic component loader
const loadComponent = (fileName: string) => {
    return lazy(() => import(`../library/components/${fileName}.tsx`).catch(() => ({
        default: () => (
            <div className="h-full flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <AlertCircle size={48} className="mx-auto mb-4 text-amber-500" />
                    <p className="font-bold">Componente não carregado</p>
                    <p className="text-sm">Arquivo: {fileName}.tsx</p>
                </div>
            </div>
        )
    })));
};

const getStatusConfig = (status: ComponentStatus) => {
    switch (status) {
        case 'ready': return { label: 'Pronto', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
        case 'pending': return { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
        case 'error': return { label: 'Erro', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: AlertTriangle };
        case 'deprecated': return { label: 'Obsoleto', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Archive };
        default: return { label: 'N/A', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: AlertCircle };
    }
};

const getCategoryColor = (category: ComponentCategory) => {
    switch (category) {
        case 'Dashboard': return 'bg-indigo-500';
        case 'Utility': return 'bg-emerald-500';
        case 'Timesheet': return 'bg-blue-500';
        case 'Admin': return 'bg-amber-500';
        case 'Prototype': return 'bg-violet-500';
        case 'Other': return 'bg-slate-500';
        default: return 'bg-slate-500';
    }
};

// Preview Modal Component
const PreviewModal: React.FC<{
    component: LibraryComponent;
    onClose: () => void;
    isFullscreen: boolean;
    onToggleFullscreen: () => void;
}> = ({ component, onClose, isFullscreen, onToggleFullscreen }) => {
    const { groupedData } = useData();
    const DynamicComponent = useMemo(() => loadComponent(component.fileName), [component.fileName]);

    return (
        <div className={`fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 ${isFullscreen ? 'p-0' : 'p-4'}`}>
            <div className={`bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col ${isFullscreen ? 'w-full h-full rounded-none' : 'w-[95%] max-w-6xl h-[85vh]'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className={`p-2 rounded-xl ${getCategoryColor(component.category)} text-white`}>
                            <component.icon size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800">{component.name}</h2>
                            <p className="text-xs text-slate-500">{component.id} • {component.category} • {component.size}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleFullscreen}
                            className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
                            title={isFullscreen ? 'Sair Fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-xl text-slate-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden bg-slate-100">
                    <ErrorBoundary componentName={component.name}>
                        <Suspense fallback={
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw size={32} className="text-indigo-500 animate-spin" />
                            </div>
                        }>
                            <div className="h-full overflow-auto">
                                {component.needsData ? (
                                    <DynamicComponent data={groupedData} />
                                ) : (
                                    <DynamicComponent />
                                )}
                            </div>
                        </Suspense>
                    </ErrorBoundary>
                </div>
            </div>
        </div>
    );
};

export const LibraryBrowser: React.FC = () => {
    const { groupedData, syncState } = useData();
    const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<ComponentStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewComponent, setPreviewComponent] = useState<LibraryComponent | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const hasData = groupedData && groupedData.length > 0;

    const filteredItems = useMemo(() => {
        let items = LIBRARY_REGISTRY;

        if (selectedCategory !== 'all') {
            items = items.filter(c => c.category === selectedCategory);
        }
        if (selectedStatus !== 'all') {
            items = items.filter(c => c.status === selectedStatus);
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query) ||
                c.id.toLowerCase().includes(query)
            );
        }

        return items;
    }, [selectedCategory, selectedStatus, searchQuery]);

    const stats = useMemo(() => ({
        total: LIBRARY_REGISTRY.length,
        ready: LIBRARY_REGISTRY.filter(c => c.status === 'ready').length,
        pending: LIBRARY_REGISTRY.filter(c => c.status === 'pending').length,
        error: LIBRARY_REGISTRY.filter(c => c.status === 'error').length,
    }), []);

    return (
        <div className="h-full bg-slate-50 overflow-y-auto">
            {/* Preview Modal */}
            {previewComponent && (
                <PreviewModal
                    component={previewComponent}
                    onClose={() => setPreviewComponent(null)}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                />
            )}

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600">
                                <Layers size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-800">Biblioteca de Componentes</h1>
                                <p className="text-sm text-slate-500">Clique em qualquer card para visualizar funcionalmente</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                <span className="font-bold text-emerald-700">{stats.ready} Prontos</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                <Clock size={14} className="text-amber-600" />
                                <span className="font-bold text-amber-700">{stats.pending} Pendentes</span>
                            </div>
                            <div className="px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-600">{stats.total} Total</span>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar componente..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Todos
                            </button>
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as ComponentStatus | 'all')}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">Todos Status</option>
                            <option value="ready">Pronto</option>
                            <option value="pending">Pendente</option>
                            <option value="error">Erro</option>
                        </select>
                    </div>
                </div>

                {/* Data Warning */}
                {!hasData && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <AlertCircle className="text-amber-600 shrink-0" size={20} />
                        <div>
                            <p className="text-sm font-bold text-amber-800">Dados não sincronizados</p>
                            <p className="text-xs text-amber-700">
                                Componentes que precisam de dados funcionarão parcialmente. Sincronize na aba "Sync" para dados completos.
                            </p>
                        </div>
                    </div>
                )}

                {/* Components Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => {
                        const statusConfig = getStatusConfig(item.status);
                        const StatusIcon = statusConfig.icon;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setPreviewComponent(item)}
                                className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-indigo-200 transition-all group cursor-pointer text-left"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2.5 rounded-xl ${getCategoryColor(item.category)} text-white group-hover:scale-110 transition-transform`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${statusConfig.color} flex items-center gap-1`}>
                                        <StatusIcon size={10} />
                                        {statusConfig.label}
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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                                            {item.category}
                                        </span>
                                        <span className="text-[10px] text-slate-300">•</span>
                                        <span className="text-[10px] text-slate-400">{item.size}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye size={12} /> Preview
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Empty State */}
                {filteredItems.length === 0 && (
                    <div className="text-center py-16">
                        <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600">Nenhum componente encontrado</h3>
                        <p className="text-sm text-slate-400">Ajuste os filtros ou a busca</p>
                    </div>
                )}

                {/* Info Footer */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs">
                    <h4 className="font-black text-slate-400 uppercase mb-2">Como usar</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-500">
                        <div className="flex items-start gap-2">
                            <Eye size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                            <span><strong>Preview:</strong> Clique em qualquer card para ver o componente funcionando</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Trash2 size={14} className="text-rose-500 shrink-0 mt-0.5" />
                            <span><strong>Deletar:</strong> Apague o arquivo em library/components/ para remover</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                            <span><strong>Status:</strong> Pronto = funcional, Pendente = precisa adaptar</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryBrowser;
