/**
 * @id DAILY-SETTINGS-001
 * @name DailySettingsPanel
 * @description Painel de configurações slide-in para o DailyAlignmentDashboard
 * Contém: Filtros, Gerenciamento de Boxes, Comportamento de duplicatas
 */

import React, { useState, useMemo } from 'react';
import {
    X,
    Settings,
    Eye,
    EyeOff,
    Layers,
    Filter,
    Box,
    Plus,
    Trash2,
    Edit2,
    Check,
    Palette,
    Tag,
    AlertCircle,
    ZoomIn,
    ZoomOut,
    CheckSquare,
    ListTree,
    Copy,
    Ban
} from 'lucide-react';
import { LocalFilters, createDefaultLocalFilters } from './filters/LocalFilterBar';
import { TagSelector } from './filters/TagSelector';
import { StatusSelector } from './filters/StatusSelector';

// Cores disponíveis para boxes
const AVAILABLE_COLORS = [
    { name: 'Slate', bg: 'bg-[#1e293b]', hex: '#1e293b' },
    { name: 'Indigo', bg: 'bg-indigo-600', hex: '#4f46e5' },
    { name: 'Emerald', bg: 'bg-emerald-600', hex: '#059669' },
    { name: 'Rose', bg: 'bg-rose-600', hex: '#e11d48' },
    { name: 'Amber', bg: 'bg-amber-600', hex: '#d97706' },
    { name: 'Violet', bg: 'bg-violet-600', hex: '#7c3aed' },
    { name: 'Cyan', bg: 'bg-cyan-600', hex: '#0891b2' },
];

// Interface para Box customizado
export interface CustomBox {
    id: string;
    name: string;
    color: string;
    filterTags: string[];
    order: number;
}

// Interface para as configurações do Daily
export interface DailySettings {
    // Visualização
    showTasks: boolean;
    showSubtasks: boolean;
    showCompleted: boolean;
    viewScale: number;

    // Comportamento
    exclusiveBoxes: boolean; // true = tarefa exclusiva por box, false = permite duplicatas

    // Filtros locais
    localFilters: LocalFilters;

    // Boxes customizados
    customBoxes: CustomBox[];
}

export const createDefaultDailySettings = (): DailySettings => ({
    showTasks: true,
    showSubtasks: true,
    showCompleted: false,
    viewScale: 1,
    exclusiveBoxes: true, // Default: tarefa exclusiva por box
    localFilters: createDefaultLocalFilters(),
    customBoxes: []
});

interface DailySettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    settings: DailySettings;
    onSettingsChange: (settings: DailySettings) => void;
    availableTags: string[];
    availableStatuses: string[];
    memberName: string;
}

export const DailySettingsPanel: React.FC<DailySettingsPanelProps> = ({
    isOpen,
    onClose,
    settings,
    onSettingsChange,
    availableTags,
    availableStatuses,
    memberName
}) => {
    // Estado para novo box
    const [newBoxName, setNewBoxName] = useState('');
    const [newBoxColor, setNewBoxColor] = useState(AVAILABLE_COLORS[1].hex);
    const [newBoxTags, setNewBoxTags] = useState<string[]>([]);
    const [showNewBoxForm, setShowNewBoxForm] = useState(false);
    const [editingBoxId, setEditingBoxId] = useState<string | null>(null);

    // Helpers
    const updateSetting = <K extends keyof DailySettings>(key: K, value: DailySettings[K]) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const updateLocalFilters = (filters: LocalFilters) => {
        onSettingsChange({ ...settings, localFilters: filters });
    };

    // Box management
    const addBox = () => {
        if (!newBoxName.trim()) return;

        const newBox: CustomBox = {
            id: `box-${Date.now()}`,
            name: newBoxName.trim(),
            color: newBoxColor,
            filterTags: newBoxTags,
            order: settings.customBoxes.length
        };

        updateSetting('customBoxes', [...settings.customBoxes, newBox]);
        setNewBoxName('');
        setNewBoxTags([]);
        setShowNewBoxForm(false);
    };

    const deleteBox = (boxId: string) => {
        updateSetting('customBoxes', settings.customBoxes.filter(b => b.id !== boxId));
    };

    const moveBox = (boxId: string, direction: 'up' | 'down') => {
        const boxes = [...settings.customBoxes];
        const index = boxes.findIndex(b => b.id === boxId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= boxes.length) return;

        [boxes[index], boxes[newIndex]] = [boxes[newIndex], boxes[index]];
        updateSetting('customBoxes', boxes);
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
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`fixed right-0 top-0 h-full w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Settings size={24} className="text-white" />
                        <div>
                            <h2 className="text-lg font-bold text-white">Configurações</h2>
                            <p className="text-xs text-slate-400">{memberName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="h-[calc(100%-80px)] overflow-y-auto">
                    {/* ============================================ */}
                    {/* SEÇÃO 1: VISUALIZAÇÃO */}
                    {/* ============================================ */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Eye size={18} className="text-indigo-600" />
                            <h3 className="font-bold text-slate-800">Visualização</h3>
                        </div>

                        <div className="space-y-3">
                            {/* Toggle: Mostrar Tarefas */}
                            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={16} className="text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Mostrar Tarefas</span>
                                </div>
                                <button
                                    onClick={() => updateSetting('showTasks', !settings.showTasks)}
                                    className={`w-10 h-6 rounded-full transition-colors ${settings.showTasks ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.showTasks ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </label>

                            {/* Toggle: Mostrar Subtarefas */}
                            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <ListTree size={16} className="text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Mostrar Subtarefas</span>
                                </div>
                                <button
                                    onClick={() => updateSetting('showSubtasks', !settings.showSubtasks)}
                                    className={`w-10 h-6 rounded-full transition-colors ${settings.showSubtasks ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.showSubtasks ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </label>

                            {/* Toggle: Mostrar Concluídas */}
                            <label className="flex items-center justify-between p-3 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-slate-500" />
                                    <span className="text-sm font-medium text-slate-700">Mostrar Concluídas</span>
                                </div>
                                <button
                                    onClick={() => updateSetting('showCompleted', !settings.showCompleted)}
                                    className={`w-10 h-6 rounded-full transition-colors ${settings.showCompleted ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${settings.showCompleted ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </label>

                            {/* Zoom Slider */}
                            <div className="p-3 rounded-lg border border-slate-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <ZoomIn size={16} className="text-slate-500" />
                                        <span className="text-sm font-medium text-slate-700">Zoom</span>
                                    </div>
                                    <span className="text-sm font-bold text-indigo-600">{Math.round(settings.viewScale * 100)}%</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateSetting('viewScale', Math.max(0.5, settings.viewScale - 0.1))}>
                                        <ZoomOut size={16} className="text-slate-400" />
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
                                    <button onClick={() => updateSetting('viewScale', Math.min(1.5, settings.viewScale + 0.1))}>
                                        <ZoomIn size={16} className="text-slate-400" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* SEÇÃO 2: FILTROS */}
                    {/* ============================================ */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Filter size={18} className="text-emerald-600" />
                                <h3 className="font-bold text-slate-800">Filtros</h3>
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

                        {/* Tags Filter */}
                        <div className="mb-4">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Tags</p>
                            <TagSelector
                                selectedTags={settings.localFilters.tags}
                                availableTags={availableTags}
                                onTagsChange={(tags) => updateLocalFilters({ ...settings.localFilters, tags })}
                                variant="compact"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Status</p>
                            <StatusSelector
                                selectedStatuses={settings.localFilters.statuses}
                                availableStatuses={availableStatuses}
                                onStatusesChange={(statuses) => updateLocalFilters({ ...settings.localFilters, statuses })}
                                variant="compact"
                            />
                        </div>
                    </div>

                    {/* ============================================ */}
                    {/* SEÇÃO 3: BOXES CUSTOMIZADOS */}
                    {/* ============================================ */}
                    <div className="p-6 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Box size={18} className="text-purple-600" />
                                <h3 className="font-bold text-slate-800">Boxes Customizados</h3>
                            </div>
                            <button
                                onClick={() => setShowNewBoxForm(!showNewBoxForm)}
                                className="p-1.5 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {/* Formulário de novo box */}
                        {showNewBoxForm && (
                            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <p className="text-sm font-bold text-slate-700 mb-3">Novo Box</p>

                                <input
                                    type="text"
                                    value={newBoxName}
                                    onChange={(e) => setNewBoxName(e.target.value)}
                                    placeholder="Nome do box..."
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                                />

                                {/* Seletor de cor */}
                                <p className="text-xs font-bold text-slate-500 mb-2">Cor</p>
                                <div className="flex gap-2 mb-3">
                                    {AVAILABLE_COLORS.map(color => (
                                        <button
                                            key={color.hex}
                                            onClick={() => setNewBoxColor(color.hex)}
                                            className={`w-7 h-7 rounded-full transition-all ${newBoxColor === color.hex ? 'ring-2 ring-offset-2 ring-purple-500 scale-110' : ''}`}
                                            style={{ backgroundColor: color.hex }}
                                        />
                                    ))}
                                </div>

                                {/* Seletor de tags para filtrar */}
                                <p className="text-xs font-bold text-slate-500 mb-2">Filtrar por Tags (opcional)</p>
                                <TagSelector
                                    selectedTags={newBoxTags}
                                    availableTags={availableTags}
                                    onTagsChange={setNewBoxTags}
                                    variant="compact"
                                    className="mb-3"
                                />

                                <div className="flex gap-2">
                                    <button
                                        onClick={addBox}
                                        disabled={!newBoxName.trim()}
                                        className="flex-1 py-2 bg-purple-600 text-white text-sm font-bold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Criar Box
                                    </button>
                                    <button
                                        onClick={() => setShowNewBoxForm(false)}
                                        className="px-4 py-2 bg-slate-200 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-300"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Lista de boxes */}
                        {settings.customBoxes.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">
                                Nenhum box customizado criado
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {settings.customBoxes.map((box, index) => (
                                    <div
                                        key={box.id}
                                        className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg"
                                    >
                                        <div
                                            className="w-4 h-4 rounded-full shrink-0"
                                            style={{ backgroundColor: box.color }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{box.name}</p>
                                            {box.filterTags.length > 0 && (
                                                <p className="text-xs text-slate-400 truncate">
                                                    Tags: {box.filterTags.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => moveBox(box.id, 'up')}
                                                disabled={index === 0}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                onClick={() => moveBox(box.id, 'down')}
                                                disabled={index === settings.customBoxes.length - 1}
                                                className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                                            >
                                                ↓
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

                    {/* ============================================ */}
                    {/* SEÇÃO 4: COMPORTAMENTO */}
                    {/* ============================================ */}
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle size={18} className="text-amber-600" />
                            <h3 className="font-bold text-slate-800">Comportamento</h3>
                        </div>

                        <div className="space-y-3">
                            {/* Opção: Tarefa exclusiva */}
                            <label
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${settings.exclusiveBoxes
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                onClick={() => updateSetting('exclusiveBoxes', true)}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${settings.exclusiveBoxes ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                                    }`}>
                                    {settings.exclusiveBoxes && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Ban size={16} className="text-amber-600" />
                                        <span className="font-bold text-slate-800">Tarefa exclusiva por box</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Se uma tarefa está em um box customizado, ela NÃO aparece nos boxes originais por projeto
                                    </p>
                                </div>
                            </label>

                            {/* Opção: Permitir duplicatas */}
                            <label
                                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${!settings.exclusiveBoxes
                                        ? 'border-amber-500 bg-amber-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                onClick={() => updateSetting('exclusiveBoxes', false)}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${!settings.exclusiveBoxes ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                                    }`}>
                                    {!settings.exclusiveBoxes && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Copy size={16} className="text-amber-600" />
                                        <span className="font-bold text-slate-800">Permitir duplicatas</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Mesma tarefa pode aparecer em múltiplos boxes
                                    </p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DailySettingsPanel;
