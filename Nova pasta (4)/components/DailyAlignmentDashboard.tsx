import React, { useState } from 'react';
import { 
  CalendarRange, ChevronDown, ChevronRight, Info, Flag, Check, Layers, GripVertical,
  Pencil, X, RotateCcw, Sparkles, Filter, RotateCw, CornerDownRight, ListTree,
  Circle, CheckCircle2, AlertCircle, ArrowRight, Calendar, Clock, AlertTriangle,
  Flame, Zap, Maximize2, Minimize2, ZoomIn, ZoomOut, MonitorPlay, Plus, Palette,
  Box, Trash2, Settings, Lock, CheckSquare, Square, Tag, SlidersHorizontal
} from 'lucide-react';

// Tipos atualizados para suportar filtros
interface FilterConfig {
  tags: string[];
  statuses: string[];
}

interface Task {
  id: string;
  name: string;
  status: string;
  startDate?: string;
  dueDate?: string;
  timeEstimate?: number;
  timeLogged?: number;
  priority?: string;
  assignee?: string;
  description?: string;
  subtasks?: Task[];
  tags?: string[]; // Novas tags na tarefa
}

interface Project {
  name: string;
  tasks: Task[];
  color?: string;
  isCustom?: boolean;
  filterConfig?: FilterConfig; // Configuração de filtro do box
}

interface GroupedData {
  assignee: string;
  projects: Project[];
}

const AVAILABLE_COLORS = [
  { name: 'Slate', bg: 'bg-slate-700', dot: '#475569' },
  { name: 'Indigo', bg: 'bg-indigo-600', dot: '#4f46e5' },
  { name: 'Emerald', bg: 'bg-emerald-600', dot: '#059669' },
  { name: 'Rose', bg: 'bg-rose-600', dot: '#e11d48' },
  { name: 'Amber', bg: 'bg-amber-600', dot: '#d97706' },
  { name: 'Violet', bg: 'bg-violet-600', dot: '#7c3aed' },
  { name: 'Cyan', bg: 'bg-cyan-600', dot: '#0891b2' },
  { name: 'Pink', bg: 'bg-pink-600', dot: '#db2777' },
];

const PREDEFINED_STATUSES = ['A Fazer', 'Em Andamento', 'Em Revisão', 'Concluído', 'Bloqueado'];
const SUGGESTED_TAGS = ['Urgente', 'Backend', 'Frontend', 'Design', 'Bug', 'Feature', 'Débito Técnico'];

// Modal Avançado para criar boxes com filtros
const CreateBoxModal = ({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (name: string, color: string, filters: FilterConfig) => void;
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'visual' | 'filters'>('visual');
  
  // Estado dos Filtros
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddTag = (tagToAdd: string) => {
    const tag = tagToAdd.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setTagInput('');
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name, selectedColor.bg, {
        tags: selectedTags,
        statuses: selectedStatuses
      });
      // Reset
      setName('');
      setSelectedTags([]);
      setSelectedStatuses([]);
      setActiveTab('visual');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        {/* Header do Modal */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Plus size={24} className="text-indigo-600" />
              Novo Box Inteligente
            </h3>
            <p className="text-xs text-slate-500 mt-1">Crie agrupamentos automáticos de tarefas</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs de Navegação */}
        <div className="flex border-b border-slate-100 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('visual')}
            className={`pb-3 pt-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'visual' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Palette size={16} /> Visual
          </button>
          <button
            onClick={() => setActiveTab('filters')}
            className={`pb-3 pt-4 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'filters' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <SlidersHorizontal size={16} /> Filtros & Tags
            {(selectedTags.length > 0 || selectedStatuses.length > 0) && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 block animate-pulse" />
            )}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            
            {activeTab === 'visual' ? (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Nome do Box</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Bugs Críticos, Sprint Backlog..." 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2">
                    <Palette size={14} /> Cor do Identificador
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`w-10 h-10 rounded-full transition-all flex items-center justify-center relative ${
                          selectedColor.name === color.name ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: color.dot }}
                        title={color.name}
                      >
                        {selectedColor.name === color.name && <Check size={16} className="text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Seção de Status */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-2">
                    <Filter size={14} /> Filtrar por Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_STATUSES.map(status => {
                      const isSelected = selectedStatuses.includes(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => toggleStatus(status)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isSelected 
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                              : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          {status}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seção de Tags */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-2">
                    <Tag size={14} /> Filtrar por Tags
                  </label>
                  
                  {/* Input de Tag */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag(tagInput))}
                      placeholder="Digite uma tag e Enter..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag(tagInput)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>

                  {/* Sugestões */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SUGGESTED_TAGS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddTag(tag)}
                        className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-md transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>

                  {/* Tags Selecionadas */}
                  {selectedTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {selectedTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 pl-2 pr-1 py-1 bg-white border border-slate-200 rounded-md text-xs font-bold text-slate-700 shadow-sm">
                          {tag}
                          <button 
                            type="button" 
                            onClick={() => removeTag(tag)}
                            className="p-0.5 hover:bg-rose-50 hover:text-rose-500 rounded transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                      Nenhuma tag selecionada
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer com Ação */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0">
          <button 
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            {activeTab === 'visual' && name.trim() && (selectedTags.length > 0 || selectedStatuses.length > 0) ? (
              <>
                Criar Box com {selectedTags.length + selectedStatuses.length} Filtros <ArrowRight size={16} />
              </>
            ) : (
              <>
                <Plus size={16} /> Criar Box
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Toggle melhorado
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
    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 ${
      checked 
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

export const DailyAlignmentDashboard = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const [showSubtasks, setShowSubtasks] = useState(true);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Mock data atualizado
  const [dashboardData, setDashboardData] = useState<GroupedData[]>([
    {
      assignee: 'Brozinga',
      projects: [
        {
          name: 'Migração Legado (Titanic)',
          color: 'bg-slate-700',
          isCustom: false,
          tasks: [
            {
              id: '1',
              name: 'Mapeamento Banco de Dados',
              status: 'EM ANDAMENTO',
              startDate: '2025-12-12',
              dueDate: '2026-01-11',
              timeEstimate: 50,
              timeLogged: 42.5,
              priority: 'Urgent',
              tags: ['Backend', 'DB']
            },
            {
              id: '2',
              name: 'Refatoração Core',
              status: 'EM ANDAMENTO',
              startDate: '2025-12-15',
              dueDate: '2026-01-26',
              timeEstimate: 80,
              timeLogged: 10,
              priority: 'Alta',
              tags: ['Core', 'Débito Técnico']
            }
          ]
        },
        {
          name: 'Bugs Críticos',
          color: 'bg-rose-600',
          isCustom: true,
          filterConfig: { tags: ['Urgente', 'Bug'], statuses: [] }, // Exemplo de box filtrado
          tasks: [
            {
              id: '3',
              name: 'Correção Login Timeout',
              status: 'A FAZER',
              dueDate: '2025-11-01',
              timeEstimate: 4,
              tags: ['Urgente', 'Bug']
            }
          ]
        }
      ]
    }
  ]);

  const [activeMemberId, setActiveMemberId] = useState('Brozinga');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['Brozinga-Migração Legado (Titanic)']));

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 1500);
  };

  const handleAddBox = (name: string, color: string, filters: FilterConfig) => {
    setDashboardData(prev => {
      const memberIdx = prev.findIndex(m => m.assignee === activeMemberId);
      if (memberIdx === -1) return prev;
      
      const newData = [...prev];
      const newProject: Project = {
        name,
        color,
        isCustom: true,
        filterConfig: filters,
        tasks: [] // Em um app real, aqui você filtraria as tarefas existentes com base nas tags/status
      };
      
      newData[memberIdx].projects = [newProject, ...newData[memberIdx].projects];
      return newData;
    });
  };

  const handleDeleteBox = (projectIdx: number) => {
    setDashboardData(prev => {
      const memberIdx = prev.findIndex(m => m.assignee === activeMemberId);
      if (memberIdx === -1) return prev;
      
      const newData = [...prev];
      newData[memberIdx].projects.splice(projectIdx, 1);
      return newData;
    });
  };

  const handleToggleTaskComplete = (projectIdx: number, taskId: string) => {
    setDashboardData(prev => {
      const memberIdx = prev.findIndex(m => m.assignee === activeMemberId);
      if (memberIdx === -1) return prev;
      
      const newData = [...prev];
      const task = newData[memberIdx].projects[projectIdx].tasks.find(t => t.id === taskId);
      if (task) {
        task.status = task.status.includes('CONCLUÍ') ? 'EM ANDAMENTO' : 'CONCLUÍDO';
      }
      return newData;
    });
  };

  const toggleProject = (id: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const activeGroup = dashboardData.find(g => g.assignee === activeMemberId);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <CreateBoxModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onAdd={handleAddBox}
      />

      {/* Header compacto */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800">Alinhamento Diário</h1>
            
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`relative p-2.5 rounded-xl transition-all duration-500 ${
                isSyncing 
                  ? 'bg-indigo-50 text-indigo-600' 
                  : 'bg-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <RotateCw size={18} className={isSyncing ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isEditMode
                  ? 'bg-amber-50 text-amber-700 border-2 border-amber-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Pencil size={14} />
              {isEditMode ? 'Modo Edição' : 'Editar'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {dashboardData.map(group => (
              <button
                key={group.assignee}
                onClick={() => setActiveMemberId(group.assignee)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  group.assignee === activeMemberId
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {group.assignee}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ImprovedToggle 
            label="Tarefas" 
            checked={showTasks} 
            onChange={() => setShowTasks(!showTasks)}
            icon={CheckSquare}
          />
          <ImprovedToggle 
            label="Subtarefas" 
            checked={showSubtasks} 
            onChange={() => setShowSubtasks(!showSubtasks)}
            icon={ListTree}
          />
          <ImprovedToggle 
            label="Concluídas" 
            checked={showCompleted} 
            onChange={() => setShowCompleted(!showCompleted)}
            icon={CheckCircle2}
          />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header do membro */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-slate-800">{activeGroup?.assignee}</h2>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-all group"
            >
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
              Novo Box
            </button>
          </div>

          {/* Lista de boxes */}
          <div className="space-y-4">
            {activeGroup?.projects.map((project, idx) => {
              const uniqueId = `${activeGroup.assignee}-${project.name}`;
              const isExpanded = expandedProjects.has(uniqueId);
              const filteredTasks = project.tasks.filter(t => 
                showCompleted || !t.status.includes('CONCLUÍ')
              );

              return (
                <div 
                  key={uniqueId}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Header do box */}
                  <div 
                    className={`${project.color || 'bg-slate-700'} px-4 py-3 flex items-center justify-between cursor-pointer group hover:opacity-90 transition-opacity`}
                    onClick={() => toggleProject(uniqueId)}
                  >
                    <div className="flex items-center gap-3">
                      {isEditMode && <GripVertical size={16} className="text-white/50 cursor-grab" />}
                      <Layers size={18} className="text-white/80" />
                      
                      <div className="flex flex-col">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                          {project.name}
                        </h3>
                        {/* Visualização de Filtros Ativos no Header */}
                        {project.filterConfig && (project.filterConfig.tags.length > 0 || project.filterConfig.statuses.length > 0) && (
                           <div className="flex items-center gap-1 mt-0.5">
                             <Filter size={10} className="text-white/60" />
                             {project.filterConfig.tags.map(tag => (
                               <span key={tag} className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded flex items-center">
                                 {tag}
                               </span>
                             ))}
                             {project.filterConfig.statuses.length > 0 && (
                               <span className="text-[9px] text-white/70 ml-1">
                                 + {project.filterConfig.statuses.length} status
                               </span>
                             )}
                           </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-white/10 text-white/90 px-3 py-1 rounded-full font-bold">
                        {filteredTasks.length} tarefas
                      </span>
                      
                      {isEditMode && project.isCustom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Deletar "${project.name}"?`)) {
                              handleDeleteBox(idx);
                            }
                          }}
                          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} className="text-white/70" />
                        </button>
                      )}
                      
                      <ChevronDown size={16} className={`text-white transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {/* Tabela de tarefas */}
                  {isExpanded && (
                    <div className="p-4">
                      {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                           <Box size={32} className="mb-2 opacity-20" />
                           <p className="text-sm font-medium">Nenhuma tarefa corresponde aos filtros deste box.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredTasks.map(task => {
                            const isCompleted = task.status.includes('CONCLUÍ');
                            
                            return (
                              <div 
                                key={task.id}
                                className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                                  isCompleted 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleTaskComplete(idx, task.id)}
                                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-500 border-emerald-500'
                                      : 'border-slate-300 hover:border-emerald-500'
                                  }`}
                                >
                                  {isCompleted && <Check size={16} className="text-white" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                      {task.name}
                                    </p>
                                    {/* Renderização de Tags na Tarefa */}
                                    {task.tags && task.tags.map(tag => (
                                      <span key={tag} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-100">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {task.dueDate || '--/--'}</span>
                                    <span className="flex items-center gap-1"><Clock size={10} /> {task.timeEstimate || 0}h est.</span>
                                    <span className={`flex items-center gap-1 ${(task.timeLogged || 0) > (task.timeEstimate || 0) ? 'text-rose-600 font-bold' : ''}`}>
                                      <CheckCircle2 size={10} /> {task.timeLogged || 0}h
                                    </span>
                                  </div>
                                </div>

                                {isEditMode && (
                                  <GripVertical size={16} className="text-slate-300 cursor-grab" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};