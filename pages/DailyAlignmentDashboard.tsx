
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Info,
  Flag,
  Check,
  Layers,
  GripVertical,
  Pencil,
  X,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  AlertTriangle,
  Minimize2,
  ZoomIn,
  ZoomOut,
  MonitorPlay,
  Plus,
  Palette,
  Trash2,
  Settings,
  Lock,
  ArrowUp,
  ArrowDown,
  Save,
  CheckSquare,
  ListTree,
  Box,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { GroupedData, Task, Project } from '../types';
import { useData } from '../contexts/DataContext';
import Tooltip from '../components/Tooltip';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCachedTags, getCachedStatuses } from '../services/filterService';
import { Tag } from 'lucide-react';

import { SyncControlsBar } from '../components/SyncControlsBar';
import { LocalFilters, createDefaultLocalFilters, applyLocalFilters } from '../components/filters/LocalFilterBar';
import { DailySettingsPanel, DailySettings, createDefaultDailySettings, loadDailySettings, saveDailySettings } from '../components/DailySettingsPanel';
import { userPreferences, initializePreferences, syncPreferencesToCloud } from '../services/userPreferencesService';

// --- TYPES ESTENDIDOS ---
interface ExtendedProject extends Omit<Project, 'stats'> {
  color?: string;
  isCustom?: boolean;
  stats?: { planned: number; logged: number; };
  filterTags?: string[];      // Tags used to filter when creating this box
  filterStatuses?: string[];  // Statuses used to filter when creating this box
}

interface ExtendedGroupedData {
  assignee: string;
  projects: ExtendedProject[];
  weekDates: string[];
}


const AVAILABLE_COLORS = [
  { name: 'Slate', bg: 'bg-slate-600', dot: '#475569' },         // Padrão atual - cinza neutro
  { name: 'Indigo', bg: 'bg-indigo-600', dot: '#4f46e5' },       // Azul padrão (já em uso)
  { name: 'Blue', bg: 'bg-blue-500', dot: '#3b82f6' },           // Azul suave
  { name: 'Sky', bg: 'bg-sky-500', dot: '#0ea5e9' },             // Azul claro
  { name: 'Teal', bg: 'bg-teal-500', dot: '#14b8a6' },           // Verde-azulado suave
  { name: 'Gray', bg: 'bg-gray-500', dot: '#6b7280' },           // Cinza médio
  { name: 'Purple', bg: 'bg-purple-500', dot: '#a855f7' },       // Roxo suave
];

// --- COMPONENTES VISUAIS MELHORADOS ---

// Toggle melhorado para filtros
const ImprovedToggle = ({
  label,
  checked,
  onChange,
  icon: Icon
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  icon?: any;
}) => (
  <button
    onClick={onChange}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${checked
      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
      }`}
  >
    <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
    {Icon && <Icon size={16} className={checked ? 'text-indigo-600' : 'text-slate-400'} />}
    <span className="text-sm font-bold">{label}</span>
  </button>
);

// Badge de status com cores FORTES da referência
const StatusBadge = ({ status }: { status: string }) => {
  const s = status?.toLowerCase().trim() || '';
  let styles = 'bg-slate-100 text-slate-600 border-slate-200'; // Default

  // Cores EXATAS da referência (cores fortes, não pasteis)
  if (s.includes('andamento') || s.includes('progress')) {
    styles = 'bg-[#FFC107] text-[#374151] border-[#e0a800]'; // Amarelo FORTE
  }
  else if (s.includes('conclu') || s.includes('done') || s.includes('complete') || s.includes('closed') || s.includes('finalizado') || s.includes('encerrado')) {
    styles = 'bg-[#22C55E] text-white border-[#16A34A]'; // Verde FORTE
  }
  else if (s.includes('iniciar') || s.includes('novo') || s.includes('fazer')) {
    styles = 'bg-[#334155] text-white border-[#1e293b]'; // Escuro
  }
  else if (s.includes('valida') || s.includes('review') || s.includes('revisão')) {
    styles = 'bg-[#3B82F6] text-white border-[#2563EB]'; // Azul
  }
  else if (s.includes('pendente') || s.includes('blocked') || s.includes('bloqueado')) {
    styles = 'bg-[#DC2626] text-white border-[#B91C1C]'; // Vermelho
  }
  else if (s.includes('backlog')) {
    styles = 'bg-[#64748B] text-white border-[#475569]'; // Cinza médio
  }

  return (
    <span className={`inline-flex items-center justify-center w-[120px] h-7 rounded-full text-[10px] uppercase font-bold tracking-wider border shadow-sm ${styles}`}>
      {status}
    </span>
  );
};

// Bandeira de prioridade colorida COM NÚMERO
const PriorityFlag = ({ priority }: { priority?: string }) => {
  // Configuração padrão (P4 - Sem Prioridade)
  let colorClass = 'text-[#CBD5E1]'; // Cinza Claro
  let label = '4';

  if (!priority) {
    return (
      <div className="flex items-center gap-1.5" title="Prioridade 4">
        <Flag size={14} className={`${colorClass} fill-current`} />
        <span className={`text-xs font-bold ${colorClass}`}>{label}</span>
      </div>
    );
  }

  // Normalização para evitar erros de Case Sensitive
  const p = priority.toLowerCase();

  if (p.includes('0') || p.includes('urgent') || p.includes('urgente')) {
    colorClass = 'text-[#EF4444]'; // Vermelho (P0)
    label = '0';
  }
  else if (p.includes('1') || p.includes('high') || p.includes('alta')) {
    colorClass = 'text-[#F97316]'; // Laranja (P1)
    label = '1';
  }
  else if (p.includes('2') || p.includes('normal')) {
    colorClass = 'text-[#3B82F6]'; // Azul (P2)
    label = '2';
  }
  else if (p.includes('3') || p.includes('low') || p.includes('baixa')) {
    colorClass = 'text-[#64748B]'; // Cinza Escuro (P3)
    label = '3';
  }



  return (
    <div className="flex items-center gap-1.5" title={`Prioridade ${label}`}>
      <Flag size={14} className={`${colorClass} fill-current`} />
      <span className={`text-xs font-bold ${colorClass}`}>{label}</span>
    </div>
  );
};

// Ícone de HORAS EXCEDIDAS piscante
const ExceededHoursIcon = ({ timeLogged, timeEstimate }: { timeLogged?: number; timeEstimate?: number }) => {
  const isOver = (timeLogged || 0) > (timeEstimate || 0);

  if (!isOver || !timeEstimate) return null;

  return (
    <div className="flex items-center gap-1 text-rose-600 font-bold" title="Estouro de Horas">
      <AlertTriangle size={12} className="text-rose-500 animate-pulse" />
      <span className="text-[10px]">Estourado</span>
    </div>
  );
};

// --- COMPONENTE SORTABLE PARA DRAG-DROP (PROJETOS) ---
interface SortableProjectCardProps {
  id: string;
  children: React.ReactNode;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="ml-8">
      <div className="relative group">
        {/* Drag Handle - positioned at left edge of the box */}
        <div
          {...listeners}
          className="absolute -left-6 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 rounded-lg shadow-sm"
          title="Arrastar para reordenar"
        >
          <GripVertical size={16} className="text-slate-400" />
        </div>
        {children}
      </div>
    </div>
  );
};

// --- COMPONENTE SORTABLE PARA MEMBROS (ABAS) ---
interface SortableMemberTabProps {
  id: string;
  isActive: boolean;
  name: string;
  onClick: () => void;
}

const SortableMemberTab: React.FC<SortableMemberTabProps> = ({ id, isActive, name, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    // Restrict to horizontal movement only (zero out Y transform)
    transform: transform ? `translate3d(${transform.x}px, 0, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative group">
      <button
        {...listeners}
        onClick={onClick}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border cursor-pointer active:cursor-grabbing ${isActive
          ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-105'
          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
      >
        {name}
      </button>
    </div>
  );
};

// --- COMPONENTE SORTABLE PARA CUSTOM BOXES ---
interface SortableCustomBoxProps {
  id: string;
  children: React.ReactNode;
}

const SortableCustomBox: React.FC<SortableCustomBoxProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="ml-8">
      <div className="relative group">
        {/* Drag Handle - positioned at left edge of the box */}
        <div
          {...listeners}
          className="absolute -left-6 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 rounded-lg shadow-sm"
          title="Arrastar para reordenar"
        >
          <GripVertical size={16} className="text-slate-400" />
        </div>
        {children}
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const formatDate = (dateString?: string | null | Date) => {
  if (!dateString) return '--/--';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const formatHours = (val?: number) => {
  if (val === undefined || val === 0) return '-';
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  if (m === 0) return `${h}h`;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

const getDaysRemaining = (dueDate?: Date | string | null): number | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

// Helper: Check if task status indicates completion
const isTaskCompleted = (status?: string | null): boolean => {
  if (!status) return false;
  const s = status.toLowerCase();
  return s.includes('conclu') ||
    s.includes('complete') ||
    s.includes('done') ||
    s.includes('closed') ||
    s.includes('finalizado') ||
    s.includes('encerrado');
};

// --- LOCAL STORAGE HELPERS ---
const STORAGE_KEY = 'dailyAlignment_v2_persistence';

interface DailyAlignmentStorage {
  boxOrder: Record<string, string[]>; // { assignee: [projectNames] }
  projectNames: Record<string, string>; // { originalName: customName }
  customBoxes: Array<{
    name: string;
    color: string;
    assignee: string;
    isCustom: true;
    tags?: string[]; // NEW: filter tasks by these tags
    order?: number;  // NEW: custom ordering in list
  }>;
}

const loadStorage = (): DailyAlignmentStorage => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { boxOrder: {}, projectNames: {}, customBoxes: [] };
  } catch (e) {
    console.error('[DAILY] Error loading storage:', e);
    return { boxOrder: {}, projectNames: {}, customBoxes: [] };
  }
};

const saveStorage = (data: Partial<DailyAlignmentStorage>) => {
  try {
    const existing = loadStorage();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...data }));
    console.log('[DAILY] Saved to storage:', data);
  } catch (e) {
    console.error('[DAILY] Error saving storage:', e);
  }
};

// --- MODAL DE GERENCIAMENTO ---
const ManageBoxesModal = ({
  isOpen,
  onClose,
  memberName,
  projects,
  onAdd,
  onDelete,
  readOnly
}: {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  projects: ExtendedProject[];
  onAdd: (name: string, color: string, tags?: string[]) => void; // NEW: tags parameter
  onDelete: (memberName: string, projectName: string) => void;
  readOnly: boolean;
  allTags?: string[]; // NEW: all available tags from tasks
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // NEW: selected tags
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setSelectedTags([]); // NEW: reset tags
      setActiveTab('list');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !readOnly) {
      onAdd(name.trim(), selectedColor.bg, selectedTags); // NEW: pass tags
      setName('');
      setSelectedTags([]);
      setActiveTab('list');
    }
  };

  // NEW: Move project up/down in list (disabled - no reorder handler)
  const moveBox = (index: number, direction: 'up' | 'down') => {
    // Reorder functionality removed - would need onReorder prop to be implemented
    console.log('Move box', index, direction);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <Settings size={20} className="text-slate-500" />
              Gerenciar Boxes
            </h3>
            <p className="text-xs text-slate-500">Colaborador: <span className="font-bold text-slate-700">{memberName}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'list' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`}>Lista Atual</button>
          <button onClick={() => !readOnly && setActiveTab('create')} className={`flex-1 py-3 text-sm font-bold transition-all ${activeTab === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'} ${readOnly ? 'opacity-30 cursor-not-allowed' : ''}`}>Criar Novo</button>
        </div>

        <div className="p-4 max-h-[450px] overflow-y-auto custom-scrollbar bg-slate-50/30">
          {activeTab === 'list' ? (
            <div className="space-y-2">
              {projects.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-10 italic">Nenhum box disponível.</p>
              ) : (
                projects.map((proj, idx) => (
                  <div key={`${proj.name}-${idx}`} className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${proj.color || 'bg-slate-800'}`}></div>
                      <div>
                        <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{proj.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{proj.isCustom ? 'Personalizado' : 'Sistema / ClickUp'}</p>
                      </div>
                    </div>
                    {proj.isCustom && !readOnly ? (
                      <button
                        onClick={() => {
                          if (window.confirm(`Excluir o box "${proj.name}"?`)) {
                            onDelete(memberName, proj.name);
                          }
                        }}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    ) : (
                      <Lock size={16} className="text-slate-200 mr-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleAdd} className="p-4 space-y-5">
              {/* Tabs Visual / Filtros */}
              <div className="flex border-b border-slate-200 mb-2">
                <button type="button" onClick={() => setActiveTab('create')} className="flex-1 py-2 text-xs font-bold text-indigo-600 border-b-2 border-indigo-600">
                  <span className="flex items-center justify-center gap-1"><Palette size={14} /> Visual</span>
                </button>
                <button type="button" onClick={() => setActiveTab('create')} className="flex-1 py-2 text-xs font-bold text-slate-400">
                  <span className="flex items-center justify-center gap-1"><Tag size={14} /> Filtros & Tags</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Box</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Bugs Críticos, Sprint Backlog..."
                  className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cor do Identificador</label>
                <div className="flex flex-wrap gap-3">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${selectedColor.name === c.name ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: c.dot }}
                    >
                      {selectedColor.name === c.name && <Check size={16} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtrar por Tags (do cache) */}
              {(() => {
                const cachedTags = getCachedTags();
                if (cachedTags.length === 0) return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700">
                      <strong>Dica:</strong> Faça um Sync na aba principal para carregar as tags do ClickUp.
                    </p>
                  </div>
                );
                return (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                      Filtrar por Tags
                    </label>
                    <p className="text-[10px] text-slate-400 ml-1">
                      Tarefas com QUALQUER UMA das tags selecionadas serão exibidas
                    </p>
                    <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                      {cachedTags.slice(0, 20).map(tag => {
                        const isSelected = selectedTags.includes(tag.toLowerCase());
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedTags(selectedTags.filter(t => t !== tag.toLowerCase()));
                              } else {
                                setSelectedTags([...selectedTags, tag.toLowerCase()]);
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${isSelected
                              ? 'bg-indigo-100 border-indigo-300 text-indigo-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                          >
                            + {tag}
                          </button>
                        );
                      })}
                    </div>
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Selecionadas:</span>
                        {selectedTags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Criar Box
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
export const DailyAlignmentDashboard: React.FC = () => {
  const { groupedData, syncState, syncIncremental } = useData();
  const isReadOnly = false;
  const [dashboardData, setDashboardData] = useState<ExtendedGroupedData[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [viewScale, setViewScale] = useState(1);

  // ESTADOS PERSISTENTES - Carregados do userPreferences
  const [activeMemberId, setActiveMemberIdState] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjectsState] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIdsState] = useState<Set<string>>(new Set());
  const [isPresentationMode, setIsPresentationModeState] = useState(false);

  // NEW: Daily settings panel state with persistence
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [dailySettings, setDailySettings] = useState<DailySettings>(() => loadDailySettings());
  const [savedSettings, setSavedSettings] = useState<DailySettings>(() => loadDailySettings());
  const hasUnsavedChanges = JSON.stringify(dailySettings) !== JSON.stringify(savedSettings);

  // Todos os toggles sincronizados com dailySettings (persistente + auto-save)
  const showTasks = dailySettings.showTasks;
  const setShowTasks = useCallback((value: boolean) => {
    const newSettings = { ...dailySettings, showTasks: value };
    setDailySettings(newSettings);
    setSavedSettings(newSettings); // Marcar como salvo
    saveDailySettings(newSettings); // Auto-save ao mudar toggle
  }, [dailySettings]);

  const showSubtasks = dailySettings.showSubtasks;
  const setShowSubtasks = useCallback((value: boolean) => {
    const newSettings = { ...dailySettings, showSubtasks: value };
    setDailySettings(newSettings);
    setSavedSettings(newSettings); // Marcar como salvo
    saveDailySettings(newSettings); // Auto-save ao mudar toggle
  }, [dailySettings]);

  const showCompleted = dailySettings.showCompleted;
  const setShowCompleted = useCallback((value: boolean) => {
    const newSettings = { ...dailySettings, showCompleted: value };
    setDailySettings(newSettings);
    setSavedSettings(newSettings); // Marcar como salvo
    saveDailySettings(newSettings); // Auto-save ao mudar toggle
  }, [dailySettings]);

  // NEW: State for advanced features (persistentes)
  const [boxOrder, setBoxOrderState] = useState<Record<string, string[]>>({});
  const [projectNames, setProjectNamesState] = useState<Record<string, string>>({});
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tempProjectName, setTempProjectName] = useState('');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // WRAPPERS para persistir automaticamente
  const setActiveMemberId = useCallback((id: string | null) => {
    setActiveMemberIdState(id);
    userPreferences.setActiveMember(id);
  }, []);

  const setExpandedProjects = useCallback((setter: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setExpandedProjectsState(prev => {
      const next = typeof setter === 'function' ? setter(prev) : setter;
      userPreferences.setExpandedProjects(Array.from(next));
      return next;
    });
  }, []);

  const setExpandedTaskIds = useCallback((setter: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setExpandedTaskIdsState(prev => {
      const next = typeof setter === 'function' ? setter(prev) : setter;
      userPreferences.setExpandedTasks(Array.from(next));
      return next;
    });
  }, []);

  const setBoxOrder = useCallback((order: Record<string, string[]>) => {
    setBoxOrderState(order);
    // Salvar cada membro individualmente
    Object.entries(order).forEach(([memberId, memberOrder]) => {
      userPreferences.setBoxOrder(memberId, memberOrder);
    });
  }, []);

  const setProjectNames = useCallback((names: Record<string, string>) => {
    setProjectNamesState(names);
    Object.entries(names).forEach(([original, custom]) => {
      userPreferences.setProjectName(original, custom);
    });
  }, []);

  const setIsPresentationMode = useCallback((mode: boolean) => {
    setIsPresentationModeState(mode);
    userPreferences.updateDaily({ isPresentationMode: mode });
  }, []);

  // Drag-drop sensors with 500ms delay to allow easy clicking
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 500,       // Must hold for 500ms before drag starts
        tolerance: 5,     // Allow 5px of movement during delay
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Inicialização - usar dados reais do DataContext
  // IMPORTANTE: Sempre atualizar dashboardData quando groupedData mudar (não só no primeiro load)
  useEffect(() => {
    if (groupedData && groupedData.length > 0) {
      const data = JSON.parse(JSON.stringify(groupedData)) as ExtendedGroupedData[];

      // SEMPRE atualizar os dados quando groupedData mudar (inclui sync incremental)
      setDashboardData(data);
      console.log(`[DailyAlignmentDashboard] Updated dashboardData: ${data.length} groups from sync`);

      // Set initial activeMemberId respecting filters AND memberOrder (só se ainda não tiver)
      if (!activeMemberId) {
        // Filter members according to settings
        let filteredMembers = data.filter(group => {
          // Filter out "Não atribuído" if showUnassigned is false
          if (group.assignee === 'Não atribuído' && !dailySettings.showUnassigned) return false;
          // Filter by visibleMembers if defined
          if (dailySettings.visibleMembers.length > 0 && !dailySettings.visibleMembers.includes(group.assignee)) return false;
          return true;
        });

        // Apply memberOrder sorting if defined
        if (dailySettings.memberOrder.length > 0) {
          filteredMembers = [...filteredMembers].sort((a, b) => {
            const indexA = dailySettings.memberOrder.indexOf(a.assignee);
            const indexB = dailySettings.memberOrder.indexOf(b.assignee);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          });
        }

        // Set to first filtered/sorted member, or first member if no filters match
        if (filteredMembers.length > 0) {
          setActiveMemberId(filteredMembers[0].assignee);
        } else if (data.length > 0) {
          setActiveMemberId(data[0].assignee);
        }
      }
    }
  }, [groupedData, dailySettings.showUnassigned, dailySettings.visibleMembers, dailySettings.memberOrder]);

  // Atualizar estado de sync
  useEffect(() => {
    setIsSyncing(syncState.status === 'syncing');
  }, [syncState.status]);

  // CARREGAR PREFERÊNCIAS PERSISTENTES no mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        // Inicializar o serviço de preferências
        await initializePreferences();

        // Carregar preferências do Daily
        const dailyPrefs = userPreferences.getDaily();

        // Restaurar estados salvos
        if (dailyPrefs.activeMemberId) {
          setActiveMemberIdState(dailyPrefs.activeMemberId);
        }

        if (dailyPrefs.expandedProjects && dailyPrefs.expandedProjects.length > 0) {
          setExpandedProjectsState(new Set(dailyPrefs.expandedProjects));
        }

        if (dailyPrefs.expandedTaskIds && dailyPrefs.expandedTaskIds.length > 0) {
          setExpandedTaskIdsState(new Set(dailyPrefs.expandedTaskIds));
        }

        if (dailyPrefs.boxOrder) {
          setBoxOrderState(dailyPrefs.boxOrder);
        }

        if (dailyPrefs.projectNames) {
          setProjectNamesState(dailyPrefs.projectNames);
        }

        if (dailyPrefs.isPresentationMode) {
          setIsPresentationModeState(dailyPrefs.isPresentationMode);
        }

        if (dailyPrefs.presentationScale) {
          setViewScale(dailyPrefs.presentationScale);
        }

        setPreferencesLoaded(true);
        console.log('[DailyAlignmentDashboard] ✅ Preferências carregadas');
      } catch (e) {
        console.error('[DailyAlignmentDashboard] Erro ao carregar preferências:', e);
        // Fallback: carregar do localStorage antigo
        const storage = loadStorage();
        setBoxOrderState(storage.boxOrder || {});
        setProjectNamesState(storage.projectNames || {});
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  // NEW: useMemo para ordenar projects sem causar re-renders
  const activeGroupData = useMemo(() => {
    const group = dashboardData.find(g => g.assignee === activeMemberId);
    if (!group) return null;

    const savedOrder = boxOrder[activeMemberId];
    if (!savedOrder || savedOrder.length === 0) return group;

    // Extract projects to help TypeScript understand it's not null
    const groupProjects = group.projects;
    const ordered: ExtendedProject[] = [];

    savedOrder.forEach(projectName => {
      const proj = groupProjects.find(p => p.name === projectName);
      if (proj) ordered.push(proj);
    });

    // Add new projects not in saved order
    groupProjects.forEach(p => {
      if (!savedOrder.includes(p.name)) ordered.push(p);
    });

    return { ...group, projects: ordered };
  }, [dashboardData, activeMemberId, boxOrder]);

  // NEW: Extract all unique tags from all tasks
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    dashboardData.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          task.tags?.forEach(tag => {
            if (tag) tagSet.add(tag);
          });
        });
      });
    });
    return Array.from(tagSet).sort();
  }, [dashboardData]);

  // NEW: Filter tasks by tags
  const filterTasksByTags = (tasks: Task[], tags?: string[]): Task[] => {
    if (!tags || tags.length === 0) return tasks;
    return tasks.filter(task =>
      task.tags?.some(tag => tags.includes(tag))
    );
  };

  // NEW: Compute custom boxes with filtered tasks (per-member)
  const currentMemberBoxes = useMemo(() => {
    if (!activeMemberId) return [];
    return dailySettings.customBoxesByMember?.[activeMemberId] || [];
  }, [dailySettings.customBoxesByMember, activeMemberId]);

  const computedCustomBoxes = useMemo(() => {
    if (!activeGroupData || currentMemberBoxes.length === 0) return [];

    // Collect all tasks from all projects in the active group
    const allTasks: Task[] = [];
    activeGroupData.projects.forEach(project => {
      project.tasks.forEach(task => allTasks.push(task));
    });

    // For each custom box, filter tasks matching its criteria
    return currentMemberBoxes.map(box => {
      let filteredTasks = [...allTasks];

      // Filter by tags if specified
      if (box.filterTags && box.filterTags.length > 0) {
        filteredTasks = filteredTasks.filter(task => {
          const taskTags = (task.tags || []).map((t: any) =>
            (typeof t === 'string' ? t : t?.name || '').toLowerCase()
          );
          return box.filterTags.some(selectedTag =>
            taskTags.includes(selectedTag.toLowerCase())
          );
        });
      }

      // Filter by status if specified
      if (box.filterStatuses && box.filterStatuses.length > 0) {
        filteredTasks = filteredTasks.filter(task => {
          const taskStatus = (task.status || '').toLowerCase();
          return box.filterStatuses.some(selectedStatus =>
            taskStatus.includes(selectedStatus.toLowerCase())
          );
        });
      }

      return {
        ...box,
        tasks: filteredTasks
      };
    });
  }, [activeGroupData, currentMemberBoxes]);

  // NEW: Set of task IDs in custom boxes (for exclusivity)
  const taskIdsInCustomBoxes = useMemo(() => {
    if (!dailySettings.exclusiveBoxes) return new Set<string>();
    const ids = new Set<string>();
    computedCustomBoxes.forEach(box => {
      box.tasks.forEach((task: Task) => ids.add(task.id));
    });
    return ids;
  }, [computedCustomBoxes, dailySettings.exclusiveBoxes]);

  // activeGroup for combinedSortedItems (uses activeGroupData defined earlier)
  const activeGroup = activeGroupData || dashboardData[0];

  // Combined sorted list of custom boxes and projects for unified rendering
  type CombinedItem =
    | { type: 'custombox'; id: string; data: typeof computedCustomBoxes[0] }
    | { type: 'project'; id: string; data: ExtendedProject };

  const combinedSortedItems = useMemo((): CombinedItem[] => {
    if (!activeGroup) return [];

    const customBoxes = computedCustomBoxes;
    const projects = activeGroup.projects;

    // Get saved order or use default (custom boxes first)
    const savedOrder = dailySettings.combinedOrderByMember?.[activeMemberId] || [];

    // Build items map
    const itemsMap = new Map<string, CombinedItem>();

    customBoxes.forEach(box => {
      const id = `custombox:${box.id}`;
      itemsMap.set(id, { type: 'custombox', id, data: box });
    });

    projects.forEach(project => {
      const id = `project:${project.name}`;
      itemsMap.set(id, { type: 'project', id, data: project });
    });

    // Sort by saved order, then append any new items
    const result: CombinedItem[] = [];
    const used = new Set<string>();

    // First, add items in saved order
    savedOrder.forEach(id => {
      const item = itemsMap.get(id);
      if (item) {
        result.push(item);
        used.add(id);
      }
    });

    // Then add any new items not in saved order (custom boxes first, then projects)
    customBoxes.forEach(box => {
      const id = `custombox:${box.id}`;
      if (!used.has(id)) {
        const item = itemsMap.get(id);
        if (item) result.push(item);
      }
    });

    projects.forEach(project => {
      const id = `project:${project.name}`;
      if (!used.has(id)) {
        const item = itemsMap.get(id);
        if (item) result.push(item);
      }
    });

    return result;
  }, [activeGroup, computedCustomBoxes, activeMemberId, dailySettings.combinedOrderByMember]);

  // Filter combined items to only include those with visible tasks (for SortableContext)
  const visibleCombinedItems = useMemo(() => {
    return combinedSortedItems.filter(item => {
      if (item.type === 'custombox') {
        const box = item.data;
        const visibleTasks = box.tasks.filter((t: Task) => showCompleted || !isTaskCompleted(t.status));
        return visibleTasks.length > 0;
      } else {
        const project = item.data as ExtendedProject;
        const visibleTasks = project.tasks.filter(t => {
          if (dailySettings.exclusiveBoxes && taskIdsInCustomBoxes.has(t.id)) return false;
          if (!showCompleted && isTaskCompleted(t.status)) return false;
          if (dailySettings.localFilters.tags.length > 0) {
            const taskTags = (t.tags || []).map((tag: any) =>
              (typeof tag === 'string' ? tag : tag?.name || '').toLowerCase()
            );
            const hasMatchingTag = dailySettings.localFilters.tags.some(selectedTag =>
              taskTags.includes(selectedTag.toLowerCase())
            );
            if (!hasMatchingTag) return false;
          }
          if (dailySettings.localFilters.statuses.length > 0) {
            const taskStatus = (t.status || '').toLowerCase();
            const hasMatchingStatus = dailySettings.localFilters.statuses.some(selectedStatus =>
              taskStatus.includes(selectedStatus.toLowerCase())
            );
            if (!hasMatchingStatus) return false;
          }
          return true;
        });
        return visibleTasks.length > 0;
      }
    });
  }, [combinedSortedItems, showCompleted, dailySettings.exclusiveBoxes, dailySettings.localFilters, taskIdsInCustomBoxes]);

  // Handlers de Estado
  const handleAddProject = useCallback((name: string, color: string, tags?: string[]) => {
    if (isReadOnly || !activeMemberId) return;
    setDashboardData(prev => {
      const newData = [...prev];
      const mIdx = newData.findIndex(m => m.assignee === activeMemberId);
      if (mIdx === -1) return prev;

      // NEW: If tags provided, filter tasks from existing projects that have any of the tags
      let filteredTasks: ExtendedProject['tasks'] = [];
      if (tags && tags.length > 0) {
        newData[mIdx].projects.forEach(project => {
          project.tasks.forEach(task => {
            // Check if task has any of the selected tags
            const taskTags = (task.tags || []).map((t: any) =>
              (typeof t === 'string' ? t : t.name || '').toLowerCase()
            );
            const hasMatchingTag = tags.some(selectedTag =>
              taskTags.includes(selectedTag.toLowerCase())
            );
            if (hasMatchingTag) {
              filteredTasks.push(task);
            }
          });
        });
        console.log(`[DAILY] Created box "${name}" with ${filteredTasks.length} tasks matching tags:`, tags);
      }

      const newProject: ExtendedProject = {
        name: name.trim(),
        tasks: filteredTasks,
        color: color,
        isCustom: true,
        filterTags: tags // Store the filter tags for future reference
      };

      newData[mIdx] = {
        ...newData[mIdx],
        projects: [newProject, ...newData[mIdx].projects]
      };

      setExpandedProjects(old => new Set(old).add(`${activeMemberId}-${name.trim()}`));
      return newData;
    });
  }, [activeMemberId, isReadOnly]);

  const handleDeleteProject = useCallback((mName: string, pName: string) => {
    if (isReadOnly) return;
    setDashboardData(prev => {
      const newData = [...prev];
      const mIdx = newData.findIndex(m => m.assignee === mName);
      if (mIdx === -1) return prev;

      const targetName = pName.trim();
      const filteredProjects = newData[mIdx].projects.filter(p => p.name.trim() !== targetName);

      newData[mIdx] = { ...newData[mIdx], projects: filteredProjects };
      return newData;
    });
  }, [isReadOnly]);

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTask = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // NEW: Drag-drop handler for boxes (projetos)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeMemberId) return;

    setDashboardData(prev => prev.map(group => {
      if (group.assignee !== activeMemberId) return group;

      const oldIndex = group.projects.findIndex(p => p.name === active.id);
      const newIndex = group.projects.findIndex(p => p.name === over.id);

      if (oldIndex === -1 || newIndex === -1) return group;

      const newProjects = arrayMove(group.projects, oldIndex, newIndex);

      // Save new order to localStorage
      const newOrder = newProjects.map(p => p.name);
      const updatedBoxOrder = { ...boxOrder, [activeMemberId]: newOrder };
      setBoxOrder(updatedBoxOrder);
      saveStorage({ boxOrder: updatedBoxOrder });

      return { ...group, projects: newProjects };
    }));
  };

  // NEW: Drag-drop handler for members (abas de pessoas)
  const handleMemberDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Obter lista atual de membros filtrados
    const filteredMembers = dashboardData
      .filter(group => {
        if (group.assignee === 'Não atribuído' && !dailySettings.showUnassigned) return false;
        if (dailySettings.visibleMembers.length > 0 && !dailySettings.visibleMembers.includes(group.assignee)) return false;
        return true;
      })
      .sort((a, b) => {
        if (dailySettings.memberOrder.length === 0) return 0;
        const indexA = dailySettings.memberOrder.indexOf(a.assignee);
        const indexB = dailySettings.memberOrder.indexOf(b.assignee);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

    const memberNames = filteredMembers.map(m => m.assignee);
    const oldIndex = memberNames.indexOf(active.id as string);
    const newIndex = memberNames.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(memberNames, oldIndex, newIndex);

    // Salvar nova ordem no dailySettings
    const newSettings = { ...dailySettings, memberOrder: newOrder };
    setDailySettings(newSettings);
    setSavedSettings(newSettings);
    saveDailySettings(newSettings);
  };

  // NEW: Unified drag-drop handler for both custom boxes and projects
  const handleCombinedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Get current combined order or build default
    const currentOrder = dailySettings.combinedOrderByMember?.[activeMemberId] || [];

    // Build full list of IDs (custom boxes first, then projects)
    const customBoxes = dailySettings.customBoxesByMember?.[activeMemberId] || [];
    const projects = activeGroup?.projects || [];

    // Create default order if empty
    let orderList = currentOrder.length > 0 ? [...currentOrder] : [
      ...customBoxes.map(b => `custombox:${b.id}`),
      ...projects.map(p => `project:${p.name}`)
    ];

    // Find indices
    const activeId = active.id as string;
    const overId = over.id as string;

    const oldIndex = orderList.indexOf(activeId);
    const newIndex = orderList.indexOf(overId);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder
    const newOrder = arrayMove(orderList, oldIndex, newIndex);

    // Save new order
    const newSettings = {
      ...dailySettings,
      combinedOrderByMember: {
        ...dailySettings.combinedOrderByMember,
        [activeMemberId]: newOrder
      }
    };
    setDailySettings(newSettings);
    setSavedSettings(newSettings);
    saveDailySettings(newSettings);
  };

  // NEW: Start renaming a project
  const startRename = (projectId: string, currentName: string) => {
    setEditingProjectId(projectId);
    setTempProjectName(projectNames[currentName] || currentName);
  };

  // NEW: Save renamed project
  const saveRename = () => {
    if (!editingProjectId || !tempProjectName.trim()) {
      setEditingProjectId(null);
      return;
    }

    const updatedNames = { ...projectNames, [editingProjectId]: tempProjectName.trim() };
    setProjectNames(updatedNames);
    saveStorage({ projectNames: updatedNames });
    setEditingProjectId(null);
    setTempProjectName('');
  };

  // NEW: Cancel rename
  const cancelRename = () => {
    setEditingProjectId(null);
    setTempProjectName('');
  };

  // NEW: Move project up/down
  const moveProject = (direction: 'up' | 'down', projectName: string) => {
    if (!activeMemberId) return;

    setDashboardData(prev => prev.map(group => {
      if (group.assignee !== activeMemberId) return group;

      const idx = group.projects.findIndex(p => p.name === projectName);
      if (idx === -1) return group;
      if (direction === 'up' && idx === 0) return group;
      if (direction === 'down' && idx === group.projects.length - 1) return group;

      const newProjects = [...group.projects];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      [newProjects[idx], newProjects[targetIdx]] = [newProjects[targetIdx], newProjects[idx]];

      return { ...group, projects: newProjects };
    }));
  };

  // Componente recursivo para renderizar tarefas com subtarefas
  const TaskRow = ({ task, depth = 0 }: { task: Task; depth?: number }) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTaskIds.has(task.id);
    const isDone = isTaskCompleted(task.status);
    const effortPct = (task.timeEstimate && task.timeLogged) ? (task.timeLogged / task.timeEstimate) * 100 : 0;
    const isOverdue = !isDone && task.dueDate && new Date(task.dueDate) < new Date();

    // Filtrar subtarefas baseado em showCompleted
    const visibleSubtasks = hasSubtasks ? task.subtasks.filter(sub =>
      showCompleted || !isTaskCompleted(sub.status)
    ) : [];

    return (
      <>
        <tr className={`hover:bg-indigo-50/20 transition-all group ${depth > 0 ? 'bg-slate-50/30' : ''}`}>
          <td className="px-8 py-4">
            <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
              {/* Indicador de subtarefas ou espaçador */}
              {hasSubtasks ? (
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                  className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <span className="w-6" />
              )}

              {/* Hierarquia visual para subtarefas */}
              {depth > 0 && <span className="text-slate-300 text-xs mr-1">└</span>}



              {/* Nome da tarefa */}
              <span className={`text-sm font-bold tracking-tight ${isDone ? 'text-slate-400 line-through' :
                depth > 0 ? 'text-slate-600' : 'text-slate-700'
                }`}>
                {task.name}
              </span>



              {/* Tooltip de Descrição */}
              <Tooltip content={task.description} />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Calendar size={10} /> {formatDate(task.startDate)}
              </span>
              <div className="text-[10px] font-black flex items-center gap-1" title={getDaysRemaining(task.dueDate) !== null ? `Restam ${getDaysRemaining(task.dueDate)} dias` : ''}>
                <Clock size={10} className={isOverdue ? 'text-rose-500' : 'text-slate-500'} />
                <span className={isOverdue ? 'text-rose-500' : 'text-slate-500'}>{formatDate(task.dueDate)}</span>
                {isOverdue && <AlertTriangle size={10} className="text-rose-500" />}
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-col gap-1.5 w-40">
              <div className="flex justify-between text-[10px] font-bold items-center">
                <span className="text-slate-600">{formatHours(task.timeLogged || 0)}</span>
                <span className="text-slate-400">/ {formatHours(task.timeEstimate || 0)}</span>
                <ExceededHoursIcon timeLogged={task.timeLogged} timeEstimate={task.timeEstimate} />
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${effortPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(effortPct, 100)}%` }}
                />
              </div>
              {(() => {
                const remaining = (task.timeEstimate || 0) - (task.timeLogged || 0);
                return remaining > 0 && !isDone ? (
                  <div className="text-[10px] text-slate-500 font-bold">
                    RESTAM {formatHours(remaining)}
                  </div>
                ) : null;
              })()}
            </div>
          </td>
          <td className="px-4 py-4 text-center">
            <StatusBadge status={task.status} />
          </td>
          <td className="px-8 py-4 text-center">
            <div className="flex justify-center">
              <PriorityFlag priority={task.priority} />
            </div>
          </td>
        </tr >

        {/* Renderização recursiva das subtarefas */}
        {
          hasSubtasks && isExpanded && showSubtasks && visibleSubtasks.map(sub => (
            <TaskRow key={sub.id} task={sub} depth={depth + 1} />
          ))
        }
      </>
    );
  };


  if (!activeGroup) return null;

  return (
    <div className={`flex flex-col h-full bg-[#F8FAFC] font-sans transition-all duration-300 ${isPresentationMode ? 'fixed inset-0 z-[100] bg-white p-10' : ''}`}>

      <ManageBoxesModal
        isOpen={showManageModal}
        onClose={() => setShowManageModal(false)}
        memberName={activeGroup.assignee}
        projects={activeGroup.projects}
        onAdd={handleAddProject}
        onDelete={handleDeleteProject}
        readOnly={isReadOnly}
      />

      {/* HEADER LIMPO - Título + Sync + Membros + Engrenagem */}
      <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 shadow-sm">
        {/* Esquerda: Título + Sync */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-slate-800 tracking-tight">Alinhamento Diário</h1>
          <button
            onClick={() => syncIncremental()}
            title="Atualizar dados"
            className={`p-2 rounded-full text-slate-400 hover:bg-slate-50 transition-all ${isSyncing ? 'animate-spin text-indigo-600' : ''}`}
          >
            <RotateCw size={18} />
          </button>
        </div>

        {/* Centro: Tabs de Membros com filtro showUnassigned/visibleMembers - DRAG-DROP */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMemberDragEnd}>
          <SortableContext
            items={dashboardData
              .filter(group => {
                if (group.assignee === 'Não atribuído' && !dailySettings.showUnassigned) return false;
                if (dailySettings.visibleMembers.length > 0 && !dailySettings.visibleMembers.includes(group.assignee)) return false;
                return true;
              })
              .sort((a, b) => {
                if (dailySettings.memberOrder.length === 0) return 0;
                const indexA = dailySettings.memberOrder.indexOf(a.assignee);
                const indexB = dailySettings.memberOrder.indexOf(b.assignee);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              })
              .map(g => g.assignee)
            }
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[60%] pb-1">
              {dashboardData
                .filter(group => {
                  if (group.assignee === 'Não atribuído' && !dailySettings.showUnassigned) return false;
                  if (dailySettings.visibleMembers.length > 0 && !dailySettings.visibleMembers.includes(group.assignee)) return false;
                  return true;
                })
                .sort((a, b) => {
                  if (dailySettings.memberOrder.length === 0) return 0;
                  const indexA = dailySettings.memberOrder.indexOf(a.assignee);
                  const indexB = dailySettings.memberOrder.indexOf(b.assignee);
                  if (indexA === -1 && indexB === -1) return 0;
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                })
                .map(group => (
                  <SortableMemberTab
                    key={group.assignee}
                    id={group.assignee}
                    isActive={activeMemberId === group.assignee}
                    name={group.assignee}
                    onClick={() => setActiveMemberId(group.assignee)}
                  />
                ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Direita: Toggles Globais + Engrenagem */}
        <div className="flex items-center gap-4">
          {/* Toggle: Tarefas */}
          <button
            onClick={() => setShowTasks(!showTasks)}
            className="flex items-center gap-2 cursor-pointer group"
            title="Mostrar/Ocultar Tarefas"
          >
            <div className={`transition-colors ${showTasks ? 'text-sky-500' : 'text-slate-300'}`}>
              {showTasks ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </div>
            <span className={`text-sm font-semibold transition-colors ${showTasks ? 'text-slate-700' : 'text-slate-400'}`}>
              Tarefas
            </span>
          </button>

          {/* Toggle: Subtarefas */}
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-2 cursor-pointer group"
            title="Mostrar/Ocultar Subtarefas"
          >
            <div className={`transition-colors ${showSubtasks ? 'text-sky-500' : 'text-slate-300'}`}>
              {showSubtasks ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </div>
            <span className={`text-sm font-semibold transition-colors ${showSubtasks ? 'text-slate-700' : 'text-slate-400'}`}>
              Subtarefas
            </span>
          </button>

          {/* Toggle: Concluídas */}
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 cursor-pointer group"
            title="Mostrar/Ocultar Concluídas"
          >
            <div className={`transition-colors ${showCompleted ? 'text-sky-500' : 'text-slate-300'}`}>
              {showCompleted ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </div>
            <span className={`text-sm font-semibold transition-colors ${showCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
              Concluídas
            </span>
          </button>

          {/* Engrenagem */}
          <button
            onClick={() => setShowSettingsPanel(true)}
            className="p-2.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-xl transition-all relative group"
            title="Configurações"
          >
            <Settings size={20} />
            {/* Indicador de filtros/boxes ativos */}
            {(dailySettings.localFilters.tags.length > 0 ||
              dailySettings.localFilters.statuses.length > 0 ||
              currentMemberBoxes.length > 0) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
              )}
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8" style={{ zoom: viewScale }}>
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{activeGroup.assignee}</h2>
            </div>
          </div>

          {/* ============================================ */}
          {/* UNIFIED BOXES + PROJECTS - Single drag-and-drop */}
          {/* ============================================ */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCombinedDragEnd}>
            <SortableContext
              items={visibleCombinedItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-6">
                {visibleCombinedItems.map((item) => {
                  if (item.type === 'custombox') {
                    // Render custom box
                    const box = item.data;
                    const boxId = `custom-${box.id}`;
                    const isExpanded = expandedProjects.has(boxId);
                    const filteredTasks = box.tasks.filter((t: Task) => showCompleted || !isTaskCompleted(t.status));

                    // Build filter label inline
                    const filterParts: string[] = [];
                    if (box.filterTags.length > 0) filterParts.push(`${box.filterTags.length} tags`);
                    if (box.filterStatuses?.length > 0) filterParts.push(`${box.filterStatuses.length} status`);
                    const filterLabel = filterParts.length > 0 ? ` (${filterParts.join(', ')})` : '';

                    return (
                      <SortableCustomBox key={item.id} id={item.id}>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                          <div
                            className="px-6 py-4 flex items-center justify-between cursor-pointer"
                            style={{ backgroundColor: box.color || '#7c3aed' }}
                            onClick={() => toggleProject(boxId)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-white/20 rounded-xl text-white">
                                <Box size={20} />
                              </div>
                              <h3 className="text-white font-black text-lg tracking-tight uppercase">
                                {box.name}
                                {filterLabel && <span className="text-white/60 font-normal text-sm ml-2">{filterLabel}</span>}
                              </h3>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-bold">
                                {filteredTasks.length} tarefas
                              </span>
                              {isExpanded ? (
                                <ChevronDown size={24} className="text-white/80" />
                              ) : (
                                <ChevronRight size={24} className="text-white/80" />
                              )}
                            </div>
                          </div>

                          {isExpanded && showTasks && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-4">Nome da Tarefa</th>
                                    <th className="px-4 py-4">Datas</th>
                                    <th className="px-4 py-4">Estimado / Real</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-8 py-4 text-center">PRIORIDADE</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {filteredTasks.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium italic">Nenhuma tarefa encontrada com esses filtros.</td></tr>
                                  ) : (
                                    filteredTasks.map((task: Task) => (
                                      <TaskRow key={task.id} task={task} depth={0} />
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </SortableCustomBox>
                    );
                  } else {
                    // Render project
                    const project = item.data as ExtendedProject;
                    const uniqueId = `${activeGroup.assignee}-${project.name}`;
                    const isExpanded = expandedProjects.has(uniqueId);

                    // Apply exclusivity and filters
                    const filteredTasks = project.tasks.filter(t => {
                      if (dailySettings.exclusiveBoxes && taskIdsInCustomBoxes.has(t.id)) return false;
                      if (!showCompleted && isTaskCompleted(t.status)) return false;

                      if (dailySettings.localFilters.tags.length > 0) {
                        const taskTags = (t.tags || []).map((tag: any) =>
                          (typeof tag === 'string' ? tag : tag?.name || '').toLowerCase()
                        );
                        const hasMatchingTag = dailySettings.localFilters.tags.some(selectedTag =>
                          taskTags.includes(selectedTag.toLowerCase())
                        );
                        if (!hasMatchingTag) return false;
                      }

                      if (dailySettings.localFilters.statuses.length > 0) {
                        const taskStatus = (t.status || '').toLowerCase();
                        const hasMatchingStatus = dailySettings.localFilters.statuses.some(selectedStatus =>
                          taskStatus.includes(selectedStatus.toLowerCase())
                        );
                        if (!hasMatchingStatus) return false;
                      }

                      return true;
                    });

                    const bgHeader = project.color || 'bg-slate-800';
                    const isEditing = editingProjectId === uniqueId;
                    const displayName = projectNames[project.name] || project.name;

                    return (
                      <SortableProjectCard key={item.id} id={item.id}>
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                          <div className={`${bgHeader} px-6 py-4 flex items-center justify-between group`}>
                            <div onClick={() => toggleProject(uniqueId)} className="flex-1 flex items-center gap-4 cursor-pointer">
                              <div className="p-2 bg-white/20 rounded-xl text-white"><Layers size={20} /></div>

                              {isEditing ? (
                                <input
                                  type="text"
                                  value={tempProjectName}
                                  onChange={(e) => setTempProjectName(e.target.value)}
                                  onBlur={saveRename}
                                  onKeyDown={(e) => e.key === 'Enter' ? saveRename() : e.key === 'Escape' && cancelRename()}
                                  className="bg-white/20 text-white font-black text-lg tracking-tight uppercase px-2 py-1 rounded border-2 border-white/40 outline-none"
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <h3 className="text-white font-black text-lg tracking-tight uppercase">{displayName}</h3>
                              )}
                            </div>

                            {!isEditing && (
                              <button
                                onClick={(e) => { e.stopPropagation(); startRename(uniqueId, project.name); }}
                                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                              >
                                <Pencil size={16} />
                              </button>
                            )}

                            <button onClick={() => toggleProject(uniqueId)} className="p-2">
                              <ChevronDown className={`text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {isExpanded && showTasks && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-8 py-4">Nome da Tarefa</th>
                                    <th className="px-4 py-4">Datas</th>
                                    <th className="px-4 py-4">Estimado / Real</th>
                                    <th className="px-4 py-4 text-center">Status</th>
                                    <th className="px-8 py-4 text-center">PRIORIDADE</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                  {filteredTasks.length === 0 ? (
                                    <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium italic">Nenhuma tarefa ativa neste box.</td></tr>
                                  ) : (
                                    filteredTasks.map(task => (
                                      <TaskRow key={task.id} task={task} depth={0} />
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </SortableProjectCard>
                    );
                  }
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {
          isPresentationMode && (
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-slate-900/90 text-white px-6 py-3 rounded-3xl shadow-2xl flex items-center gap-6 backdrop-blur-lg border border-white/10">
              <div className="flex items-center gap-3">
                <button onClick={() => setViewScale(v => Math.max(0.6, v - 0.1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ZoomOut size={20} /></button>
                <span className="text-sm font-black w-12 text-center">{(viewScale * 100).toFixed(0)}%</span>
                <button onClick={() => setViewScale(v => Math.min(2, v + 0.1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ZoomIn size={20} /></button>
              </div>
              <div className="w-px h-6 bg-white/20"></div>
            </div>
          )
        }
      </div>

      {/* CSS para animações */}
      <style>{`
        @keyframes blink {
          0%, 50%, 100% { opacity: 1; }
          25%, 75% { opacity: 0.3; }
        }
        .blink-delay {
          animation: blink 2s infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {/* Daily Settings Panel */}
      <DailySettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={dailySettings}
        onSettingsChange={(newSettings) => {
          setDailySettings(newSettings);
          // showTasks, showCompleted e showSubtasks são derivados de dailySettings
          setViewScale(newSettings.viewScale);
        }}
        onSave={() => {
          saveDailySettings(dailySettings);
          setSavedSettings(dailySettings);
        }}
        onReset={() => {
          const defaults = createDefaultDailySettings();
          setDailySettings(defaults);
          saveDailySettings(defaults);
          setSavedSettings(defaults);
          // showTasks, showCompleted e showSubtasks são derivados de dailySettings
          setViewScale(defaults.viewScale);
        }}
        availableTags={getCachedTags()}
        availableStatuses={getCachedStatuses()}
        availableMembers={dashboardData.map(g => ({ id: g.assignee, name: g.assignee }))}
        activeMemberId={activeMemberId || ''}
        memberName={activeGroup?.assignee || ''}
        hasUnsavedChanges={hasUnsavedChanges}
        onCloudSync={syncPreferencesToCloud}
      />
    </div>
  );
};
