import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderOpen,
  Archive,
  Trash2,
  Edit2,
  Save,
  X,
  Plus,
  GripVertical,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  Undo2,
  Search,
  Flag,
  Calendar,
  ChevronDown,
  Lock,
  Unlock,
  Layers,
  User,
  XCircle
} from 'lucide-react';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../constants';
import { Task, Project } from '../types';

// --- TYPES ---
interface ExtendedProject extends Project {
  id: string;
  isArchived: boolean;
  isCompleted: boolean;
  owner: string;
  priority: '0' | '1' | '2' | '3' | '4';
}

// --- HELPERS ---
const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case '0': return { label: 'PRIORIDADE 0', color: 'bg-rose-100 text-rose-700 border-rose-200', icon: Flag };
    case '1': return { label: 'PRIORIDADE 1', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Flag };
    case '2': return { label: 'PRIORIDADE 2', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Flag };
    case '3': return { label: 'PRIORIDADE 3', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: Flag };
    case '4': return { label: 'PRIORIDADE 4', color: 'bg-gray-50 text-gray-400 border-gray-100', icon: Flag };
    default: return { label: 'SEM PRIORIDADE', color: 'bg-gray-50 text-gray-400 border-gray-100', icon: Flag };
  }
};

const formatHours = (val: number) => {
  const h = Math.floor(val);
  return `${h}h`;
};

export const ProjectsDashboard: React.FC = () => {
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [viewState, setViewState] = useState<'active' | 'completed' | 'archived'>('active');
  const [selectedMember, setSelectedMember] = useState<string>('Todos');
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Inicializar dados
  useEffect(() => {
    const initial: ExtendedProject[] = [];
    MOCK_LEGACY_DATA.forEach((group, gIdx) => {
      group.projects.forEach((proj, pIdx) => {
        const totalTasks = proj.tasks.length;
        const doneTasks = proj.tasks.filter(t => t.status?.includes('conclu') || t.status === 'completed').length;
        
        initial.push({
          ...proj,
          id: `p-${gIdx}-${pIdx}-${Math.random().toString(36).substr(2, 5)}`,
          isArchived: false,
          isCompleted: totalTasks > 0 && doneTasks === totalTasks,
          owner: group.assignee,
          priority: (proj.tasks.some(t => t.priority === '0') ? '0' : '2') as any
        });
      });
    });
    setProjects(initial);
  }, []);

  // --- ACTIONS ---

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const createNewProject = () => {
    const newProj: ExtendedProject = {
      id: `p-new-${Date.now()}`,
      name: 'Novo Projeto / Box',
      tasks: [],
      owner: selectedMember !== 'Todos' ? selectedMember : 'Gestor',
      isArchived: false,
      isCompleted: false,
      priority: '2'
    };
    setProjects([newProj, ...projects]);
    setEditingProjectId(newProj.id);
    setTempName(newProj.name);
  };

  const deleteProject = (id: string) => {
    if (confirm('Excluir este card permanentemente?')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  const updateStatus = (id: string, updates: Partial<ExtendedProject>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // --- DRAG AND DROP ---
  const onDragStart = (e: React.DragEvent, taskId: string, fromProjectId: string) => {
    if (!isEditMode) return;
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('fromProjectId', fromProjectId);
    e.currentTarget.classList.add('opacity-40');
  };

  const onDrop = (e: React.DragEvent, toProjectId: string) => {
    e.preventDefault();
    if (!isEditMode) return;
    const taskId = e.dataTransfer.getData('taskId');
    const fromProjectId = e.dataTransfer.getData('fromProjectId');
    if (fromProjectId === toProjectId) return;

    setProjects(prev => {
      const sourceProj = prev.find(p => p.id === fromProjectId);
      const targetProj = prev.find(p => p.id === toProjectId);
      if (!sourceProj || !targetProj) return prev;
      const taskToMove = sourceProj.tasks.find(t => t.id === taskId);
      if (!taskToMove) return prev;
      return prev.map(p => {
        if (p.id === fromProjectId) return { ...p, tasks: p.tasks.filter(t => t.id !== taskId) };
        if (p.id === toProjectId) return { ...p, tasks: [...p.tasks, taskToMove] };
        return p;
      });
    });
  };

  // --- FILTRAGEM ---
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesTab = 
        viewState === 'active' ? (!p.isArchived && !p.isCompleted) :
        viewState === 'completed' ? (p.isCompleted && !p.isArchived) : p.isArchived;
      
      const matchesMember = selectedMember === 'Todos' || p.owner === selectedMember;
      
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.owner.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesTab && matchesMember && matchesSearch;
    });
  }, [projects, viewState, selectedMember, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
      
      {/* HEADER DINÂMICO */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-xl text-white shadow-lg">
            <Layers size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Boxes de Alocação</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de Projetos por Membro</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Membro */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
             <div className="flex items-center gap-2 px-3 py-1.5">
                <User size={14} className="text-slate-400" />
                <select 
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="Todos">Toda a Equipe</option>
                  {MOCK_TEAM_DATA.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </select>
             </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar box..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none w-40 lg:w-56 transition-all"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1"></div>

          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border shadow-sm ${
              isEditMode 
                ? 'bg-amber-50 border-amber-600 text-white' 
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isEditMode ? <Unlock size={14} /> : <Lock size={14} />}
            {isEditMode ? 'EDIÇÃO ATIVA' : 'LEITURA'}
          </button>

          <button 
            onClick={createNewProject}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus size={14} /> NOVO BOX
          </button>
        </div>
      </div>

      {/* ABAS DE ESTADO */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between">
        <div className="flex bg-slate-100 p-1 rounded-xl">
           {(['active', 'completed', 'archived'] as const).map(tab => (
             <button
               key={tab}
               onClick={() => setViewState(tab)}
               className={`px-6 py-1.5 rounded-lg text-xs font-bold transition-all ${
                 viewState === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
               }`}
             >
               {tab === 'active' ? 'Ativos' : tab === 'completed' ? 'Concluídos' : 'Arquivados'}
             </button>
           ))}
        </div>
        {selectedMember !== 'Todos' && (
          <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
             FILTRADO: {selectedMember.toUpperCase()}
             <button onClick={() => setSelectedMember('Todos')}><XCircle size={12} /></button>
          </div>
        )}
      </div>

      {/* GRID DE CARDS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {filteredProjects.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 text-slate-300">
             <FolderOpen size={48} className="opacity-20 mb-3" />
             <p className="font-bold text-sm">Nenhum box encontrado para esta seleção.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 items-start">
            {filteredProjects.map(project => {
              const isExpanded = expandedIds.has(project.id);
              const prio = getPriorityConfig(project.priority);
              
              const totalEst = project.tasks.reduce((a, b) => a + (b.timeEstimate || 0), 0);
              const totalLog = project.tasks.reduce((a, b) => a + (b.timeLogged || 0), 0);
              const progress = totalEst > 0 ? Math.round((totalLog / totalEst) * 100) : 0;

              return (
                <div 
                  key={project.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, project.id)}
                  className={`
                    bg-white rounded-2xl border transition-all duration-300 flex flex-col group
                    ${isEditMode ? 'border-amber-200 shadow-md ring-1 ring-amber-50' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'}
                    ${project.isArchived ? 'grayscale opacity-75' : ''}
                  `}
                >
                  {/* CABEÇALHO (Visível) */}
                  <div className="p-5 relative">
                     <div className="flex justify-between items-start mb-3">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase border ${prio.color}`}>
                           <prio.icon size={12} /> {prio.label}
                        </div>

                        <div className={`flex items-center gap-1 ${isEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                           {project.isArchived ? (
                             <button onClick={() => updateStatus(project.id, { isArchived: false })} className="p-1 text-slate-400 hover:text-emerald-600"><Undo2 size={16} /></button>
                           ) : (
                             <>
                               {!project.isCompleted && (
                                 /* Fixed: Changed CheckCircle to CheckCircle2 to match imported component from lucide-react */
                                 <button onClick={() => updateStatus(project.id, { isCompleted: true })} className="p-1 text-slate-400 hover:text-emerald-600"><CheckCircle2 size={16} /></button>
                               )}
                               <button onClick={() => { setEditingProjectId(project.id); setTempName(project.name); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                               <button onClick={() => updateStatus(project.id, { isArchived: true })} className="p-1 text-slate-400 hover:text-amber-600"><Archive size={16} /></button>
                             </>
                           )}
                           <button onClick={() => deleteProject(project.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                        </div>
                     </div>

                     <h3 className="text-base font-black text-slate-800 line-clamp-1 leading-tight group-hover:text-indigo-700 transition-colors" title={project.name}>{project.name}</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Dono: {project.owner}</p>

                     <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div 
                             className={`h-full transition-all duration-700 ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                             style={{ width: `${Math.min(progress, 100)}%` }}
                           ></div>
                        </div>
                        <span className="text-[10px] font-black text-slate-400">{progress}%</span>
                     </div>

                     {/* RESUMO RÁPIDO */}
                     <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex gap-4">
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Tarefas</span>
                              <span className="text-xs font-bold text-slate-700">{project.tasks.length}</span>
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Total</span>
                              <span className="text-xs font-bold text-slate-700">{formatHours(totalLog)} / {formatHours(totalEst)}</span>
                           </div>
                        </div>
                        
                        <button 
                          onClick={() => toggleExpand(project.id)}
                          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-[10px] font-bold ${isExpanded ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100 hover:text-indigo-600'}`}
                        >
                          {isExpanded ? 'FECHAR' : 'ABRIR'}
                          <ChevronDown size={12} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                     </div>
                  </div>

                  {/* DRILL DOWN (Oculto por padrão) */}
                  {isExpanded && (
                    <div className="flex-1 bg-slate-50/50 p-2 border-t border-slate-100 animate-fadeIn">
                       <div className="space-y-1.5 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                          {project.tasks.length === 0 ? (
                            <p className="text-[10px] text-center text-slate-400 py-4 italic">Sem tarefas.</p>
                          ) : (
                            project.tasks.map(task => (
                              <div 
                                key={task.id}
                                draggable={isEditMode}
                                onDragStart={(e) => onDragStart(e, task.id, project.id)}
                                onDragEnd={(e) => e.currentTarget.classList.remove('opacity-40')}
                                className={`
                                  bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col gap-1 transition-all relative group/task
                                  ${isEditMode ? 'cursor-grab hover:border-amber-300' : 'hover:border-indigo-300'}
                                `}
                              >
                                 <div className="flex items-start gap-2 pr-4">
                                    <div className="mt-1 shrink-0">
                                       {task.status?.includes('conclu') ? <CheckCircle2 size={12} className="text-emerald-500" /> : <Clock size={12} className="text-slate-300" />}
                                    </div>
                                    <p className={`text-[11px] font-bold leading-tight ${task.status?.includes('conclu') ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                      {task.name}
                                    </p>
                                 </div>
                                 <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase pl-5">
                                    <span>{task.timeLogged?.toFixed(1) || 0}h / {task.timeEstimate?.toFixed(1) || 0}h</span>
                                    {isEditMode && <GripVertical size={10} className="text-slate-200 group-hover/task:text-amber-400" />}
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProjectsDashboard;