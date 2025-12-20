
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
  Lock
} from 'lucide-react';
import { MOCK_LEGACY_DATA } from '../../constants';
import { GroupedData, Task, Project } from '../../types';
import { useApp } from '../contexts/AppContext';

// --- CONFIGURAÇÕES DE QUALIDADE ---
const PENALTY_WEIGHTS = {
  assignee: 15,
  dueDate: 10,
  priority: 5,
  startDate: 2,
  estimate: 5,
  description: 1
};

// --- TYPES ESTENDIDOS ---
interface ExtendedProject extends Project {
  color?: string;
  isCustom?: boolean; 
}

interface ExtendedGroupedData extends GroupedData {
  projects: ExtendedProject[];
}

const AVAILABLE_COLORS = [
  { name: 'Slate', bg: 'bg-[#1e293b]', dot: '#1e293b' },
  { name: 'Indigo', bg: 'bg-indigo-600', dot: '#4f46e5' },
  { name: 'Emerald', bg: 'bg-emerald-600', dot: '#059669' },
  { name: 'Rose', bg: 'bg-rose-600', dot: '#e11d48' },
  { name: 'Amber', bg: 'bg-amber-600', dot: '#d97706' },
  { name: 'Violet', bg: 'bg-violet-600', dot: '#7c3aed' },
  { name: 'Cyan', bg: 'bg-cyan-600', dot: '#0891b2' },
];

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
  onAdd: (name: string, color: string) => void;
  onDelete: (memberName: string, projectName: string) => void;
  readOnly: boolean;
}) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setActiveTab('list');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !readOnly) {
      onAdd(name.trim(), selectedColor.bg);
      setName('');
      setActiveTab('list');
    }
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
            <form onSubmit={handleAdd} className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Box</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Refatoração, Bugs UX..." 
                  className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                  autoFocus
                />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Cor de Destaque</label>
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
              <button 
                type="submit" 
                disabled={!name.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Adicionar Box
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
  const { isReadOnly } = useApp();
  const [dashboardData, setDashboardData] = useState<ExtendedGroupedData[]>([]);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewScale, setViewScale] = useState(1);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Inicialização
  useEffect(() => {
    const data = JSON.parse(JSON.stringify(MOCK_LEGACY_DATA));
    setDashboardData(data);
    if (data.length > 0) setActiveMemberId(data[0].assignee);
  }, []);

  // Handlers de Estado
  const handleAddProject = useCallback((name: string, color: string) => {
    if (isReadOnly || !activeMemberId) return;
    setDashboardData(prev => {
      const newData = [...prev];
      const mIdx = newData.findIndex(m => m.assignee === activeMemberId);
      if (mIdx === -1) return prev;

      const newProject: ExtendedProject = {
        name: name.trim(),
        tasks: [],
        color: color,
        isCustom: true
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

  // Cálculo de Qualidade
  const qualityStats = useMemo(() => {
    const active = dashboardData.find(g => g.assignee === activeMemberId);
    if (!active) return { score: 0 };

    let totalTasks = 0;
    let penaltyPoints = 0;

    active.projects.forEach(p => {
      p.tasks.forEach(t => {
        if (t.status?.toLowerCase().includes('conclu')) return;
        totalTasks++;
        if (!t.assignee || t.assignee === 'Sem responsável') penaltyPoints += PENALTY_WEIGHTS.assignee;
        if (!t.priority || t.priority === '4') penaltyPoints += PENALTY_WEIGHTS.priority;
        if (!t.dueDate) penaltyPoints += PENALTY_WEIGHTS.dueDate;
        if (!t.timeEstimate) penaltyPoints += PENALTY_WEIGHTS.estimate;
      });
    });

    const score = totalTasks === 0 ? 100 : Math.max(0, Math.round(100 - (penaltyPoints / totalTasks * 2)));
    return { score };
  }, [dashboardData, activeMemberId]);

  const activeGroup = dashboardData.find(g => g.assignee === activeMemberId) || dashboardData[0];

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

      {/* HEADER DE NAVEGAÇÃO ENTRE MEMBROS */}
      <div className="bg-white px-6 py-4 border-b border-slate-100 flex flex-col gap-4 shrink-0 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Alinhamento Diário</h1>
              <button onClick={() => setIsSyncing(true)} className={`p-2 rounded-full text-slate-400 hover:bg-slate-50 transition-all ${isSyncing ? 'animate-spin text-indigo-600' : ''}`}><RotateCw size={18} /></button>
           </div>
           
           <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
              {dashboardData.map(group => (
                <button
                  key={group.assignee}
                  onClick={() => setActiveMemberId(group.assignee)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${activeMemberId === group.assignee ? 'bg-slate-800 border-slate-800 text-white shadow-lg scale-105' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {group.assignee}
                </button>
              ))}
           </div>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button onClick={() => setShowCompleted(!showCompleted)} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${showCompleted ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                {showCompleted ? 'Ocultar Concluídas' : 'Mostrar Concluídas'}
              </button>
           </div>
           <div className="flex items-center gap-2">
              <button onClick={() => setIsPresentationMode(!isPresentationMode)} className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">
                 {isPresentationMode ? <Minimize2 size={14} /> : <MonitorPlay size={14} />}
                 <span>{isPresentationMode ? 'Sair do Modo Foco' : 'Modo Apresentação'}</span>
              </button>
           </div>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8" style={{ zoom: viewScale }}>
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
          
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{activeGroup.assignee}</h2>
                <button onClick={() => setShowManageModal(true)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition-all"><Settings size={20} /></button>
             </div>

             <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Qualidade dos Dados</p>
                   <p className={`text-xl font-black leading-none ${qualityStats.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{qualityStats.score}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                   <div className="w-6 h-6 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow"></div>
                </div>
             </div>
          </div>

          <div className="grid gap-6">
            {activeGroup.projects.map((project, pIdx) => {
              const uniqueId = `${activeGroup.assignee}-${project.name}`;
              const isExpanded = expandedProjects.has(uniqueId);
              const filteredTasks = project.tasks.filter(t => showCompleted || !t.status?.toLowerCase().includes('conclu'));
              const bgHeader = project.color || 'bg-slate-800';

              return (
                <div key={uniqueId} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                   <div 
                     onClick={() => toggleProject(uniqueId)}
                     className={`${bgHeader} px-6 py-4 flex items-center justify-between cursor-pointer group`}
                   >
                      <div className="flex items-center gap-4">
                         <div className="p-2 bg-white/20 rounded-xl text-white"><Layers size={20} /></div>
                         <h3 className="text-white font-black text-lg tracking-tight uppercase">{project.name}</h3>
                         <span className="bg-white/10 text-white/80 text-[10px] font-black px-3 py-1 rounded-full border border-white/10 tracking-widest">{filteredTasks.length} TAREFAS</span>
                      </div>
                      <ChevronDown className={`text-white transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                   </div>

                   {isExpanded && (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                 <th className="px-8 py-4">Nome da Tarefa</th>
                                 <th className="px-4 py-4">Datas</th>
                                 <th className="px-4 py-4">Estimado / Real</th>
                                 <th className="px-4 py-4 text-center">Status</th>
                                 <th className="px-8 py-4 text-right">Prio</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {filteredTasks.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium italic">Nenhuma tarefa ativa neste box.</td></tr>
                              ) : (
                                filteredTasks.map(task => {
                                  const isDone = task.status?.toLowerCase().includes('conclu');
                                  const effortPct = (task.timeEstimate && task.timeLogged) ? (task.timeLogged / task.timeEstimate) * 100 : 0;
                                  
                                  return (
                                    <tr key={task.id} className="hover:bg-indigo-50/20 transition-all group">
                                       <td className="px-8 py-5">
                                          <div className="flex items-center gap-3">
                                             <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]'}`}></div>
                                             <span className={`text-sm font-bold tracking-tight ${isDone ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{task.name}</span>
                                          </div>
                                       </td>
                                       <td className="px-4 py-5">
                                          <div className="flex flex-col gap-1">
                                             <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Calendar size={10}/> {formatDate(task.startDate)}</span>
                                             <span className={`text-[10px] font-black flex items-center gap-1 ${!isDone && task.dueDate && new Date(task.dueDate) < new Date() ? 'text-rose-500' : 'text-slate-500'}`}><Clock size={10}/> {formatDate(task.dueDate)}</span>
                                          </div>
                                       </td>
                                       <td className="px-4 py-5">
                                          <div className="flex flex-col gap-1.5 w-32">
                                             <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-slate-600">{formatHours(task.timeLogged || 0)}</span>
                                                <span className="text-slate-400">/ {formatHours(task.timeEstimate || 0)}</span>
                                             </div>
                                             <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-500 ${effortPct > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(effortPct, 100)}%` }}></div>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-4 py-5 text-center">
                                          <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            {task.status}
                                          </span>
                                       </td>
                                       <td className="px-8 py-5 text-right">
                                          <div className="flex justify-end gap-1">
                                             {Array.from({length: 4 - (parseInt(task.priority || '4'))}).map((_, i) => (
                                               <div key={i} className="w-1.5 h-3 rounded-full bg-rose-500 opacity-80 shadow-sm"></div>
                                             ))}
                                          </div>
                                       </td>
                                    </tr>
                                  );
                                })
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isPresentationMode && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[110] bg-slate-900/90 text-white px-6 py-3 rounded-3xl shadow-2xl flex items-center gap-6 backdrop-blur-lg border border-white/10">
           <div className="flex items-center gap-3">
              <button onClick={() => setViewScale(v => Math.max(0.6, v - 0.1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ZoomOut size={20}/></button>
              <span className="text-sm font-black w-12 text-center">{(viewScale * 100).toFixed(0)}%</span>
              <button onClick={() => setViewScale(v => Math.min(2, v + 0.1))} className="p-2 hover:bg-white/10 rounded-xl transition-all"><ZoomIn size={20}/></button>
           </div>
           <div className="w-px h-6 bg-white/20"></div>
           <button onClick={() => setIsPresentationMode(false)} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black transition-all shadow-lg"><X size={16}/> Sair do Foco</button>
        </div>
      )}
    </div>
  );
};
