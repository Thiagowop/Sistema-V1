
import React, { useState, useEffect } from 'react';
import { 
  Filter, 
  Calendar, 
  RotateCcw, 
  Save, 
  Search, 
  Check, 
  Tag, 
  User, 
  Briefcase, 
  Flag 
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// --- MOCK DATA ---
const TEAM_MEMBERS = [
  'Brozinga', 'Paresqui', 'Alvaro', 'Rafael', 'Pedro', 'Thiago', 'Soares'
];

const PROJECTS = [
  'Agentes', 'Alinhamento', 'Assertiva', 'Autoatendimento', 'Autojur', 
  'Automação 3c+', 'Batimentos', 'Blip', 'Chamados', 'Dashboards', 
  'Emccamp', 'FIDC', 'Gestão', 'GoTo', 'Hyperflow', 'Indicadores', 
  'Max Smart', 'Planejamento', 'Preambulo', 'Relatórios', 'Tenda'
];

const TAGS = [
  'bug', 'feature', 'hotfix', 'melhoria', 'reunião', 'suporte', 
  'documentação', 'infra', 'deploy', 'design'
];

const PRIORITIES = [
  { id: '0', label: 'Urgente', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: '1', label: 'Alta', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: '2', label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { id: '3', label: 'Baixa', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: '4', label: 'Sem Prioridade', color: 'bg-gray-100 text-gray-600 border-gray-200' }
];

export const FilterDashboard: React.FC = () => {
  const { filters, setFilters, clearFilters } = useApp();
  
  // Local state to manage changes before applying
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [projectSearch, setProjectSearch] = useState('');

  // Sync local state with global state on mount
  useEffect(() => {
    setSelectedMembers(filters.members);
    setSelectedProjects(filters.projects);
    setSelectedTags(filters.tags);
    setDateRange(filters.dateRange);
  }, [filters]);

  const toggleItem = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleApply = () => {
    setFilters({
      members: selectedMembers,
      projects: selectedProjects,
      tags: selectedTags,
      dateRange: dateRange
    });
    alert('Filtros globais aplicados com sucesso! Verifique o painel de Gestão.');
  };

  const handleClear = () => {
    clearFilters();
    // Reset local state as well
    setSelectedMembers([]);
    setSelectedProjects([]);
    setSelectedTags([]);
    setDateRange({ start: '', end: '' });
    setProjectSearch('');
  };

  const filteredProjects = PROJECTS.filter(p => 
    p.toLowerCase().includes(projectSearch.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Filter className="text-indigo-600" />
            Central de Filtros Globais
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Esses filtros serão aplicados em <strong>todas</strong> as telas do sistema.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <RotateCcw size={16} /> Limpar
          </button>
          <button 
            onClick={handleApply}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Save size={16} /> Aplicar Filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Context & Date */}
        <div className="space-y-6">
          {/* Date Range */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              Período Global
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Início</label>
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Fim</label>
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Priorities (Visual Only in this Mock, requires logic update elsewhere if needed globally) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm opacity-50 pointer-events-none">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <Flag size={18} className="text-slate-400" />
                 Prioridade
               </h3>
               <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded">Em breve</span>
            </div>
            <p className="text-xs text-slate-400">Filtro de prioridade global será ativado na próxima versão.</p>
          </div>
        </div>

        {/* Middle Column: Projects */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="text-slate-400" />
            Projetos
          </h3>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar projeto..." 
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-1">
            {filteredProjects.length > 0 ? filteredProjects.map(project => {
              const isSelected = selectedProjects.includes(project);
              return (
                <button
                  key={project}
                  onClick={() => toggleItem(project, selectedProjects, setSelectedProjects)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                    isSelected 
                      ? 'bg-indigo-50 text-indigo-700 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {project}
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </button>
              );
            }) : (
              <p className="text-center text-slate-400 text-sm mt-4">Nenhum projeto encontrado.</p>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
            <span>{selectedProjects.length} selecionados</span>
            {selectedProjects.length > 0 && (
              <button onClick={() => setSelectedProjects([])} className="hover:text-slate-600">Limpar</button>
            )}
          </div>
        </div>

        {/* Right Column: People & Tags */}
        <div className="space-y-6">
          {/* People */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User size={18} className="text-slate-400" />
              Equipe
            </h3>
            <div className="flex flex-wrap gap-2">
              {TEAM_MEMBERS.map(member => {
                const isSelected = selectedMembers.includes(member);
                return (
                  <button
                    key={member}
                    onClick={() => toggleItem(member, selectedMembers, setSelectedMembers)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {member}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Tag size={18} className="text-slate-400" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto custom-scrollbar">
              {TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleItem(tag, selectedTags, setSelectedTags)}
                    className={`px-3 py-1 rounded-lg text-xs border transition-all flex items-center gap-1 ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
