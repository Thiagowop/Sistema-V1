import React, { useMemo, useState } from 'react';
import { ClickUpApiTask, processApiTasks, isTaskFullyCompleted } from '../services/clickup';
import { AppConfig, GroupedData, Task } from '../types';
import TaskTable from './TaskTable';
import { Archive, ChevronDown, ChevronRight, User, CheckCircle2, Clock, Layers, Search, X } from 'lucide-react';

interface CompletedProjectsProps {
  rawData: ClickUpApiTask[];
  config: AppConfig;
  onBack: () => void;
}

// Member Card Component
const MemberCard: React.FC<{
  name: string;
  projectCount: number;
  taskCount: number;
  totalHours: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ name, projectCount, taskCount, totalHours, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-full text-left p-4 rounded-2xl border-2 transition-all duration-200
      ${isSelected 
        ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10' 
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }
    `}
  >
    <div className="flex items-center gap-3">
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold
        ${isSelected 
          ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white' 
          : 'bg-slate-100 text-slate-600'
        }
      `}>
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-slate-800 truncate">{name}</h3>
        <p className="text-xs text-slate-500">{projectCount} projetos arquivados</p>
      </div>
    </div>
    
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="bg-slate-50 rounded-lg px-2 py-1.5 flex items-center gap-2">
        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        <div>
          <p className="text-[10px] text-slate-400 uppercase">Tarefas</p>
          <p className="text-sm font-semibold text-slate-700">{taskCount}</p>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg px-2 py-1.5 flex items-center gap-2">
        <Clock className="w-3 h-3 text-sky-500" />
        <div>
          <p className="text-[10px] text-slate-400 uppercase">Horas</p>
          <p className="text-sm font-semibold text-slate-700">{totalHours.toFixed(0)}h</p>
        </div>
      </div>
    </div>
  </button>
);

const CompletedProjects: React.FC<CompletedProjectsProps> = ({ rawData, config, onBack }) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Process data and filter to show ONLY 100% completed tasks
  const groupedData = useMemo(() => {
    const allGroups = processApiTasks(rawData, config);

    const completedGroups: GroupedData[] = allGroups.map(group => {
      const completedProjects = group.projects.map(project => ({
        ...project,
        tasks: project.tasks.filter(task => isTaskFullyCompleted(task))
      })).filter(project => project.tasks.length > 0);

      return {
        ...group,
        projects: completedProjects
      };
    }).filter(group => group.projects.length > 0);

    return completedGroups;
  }, [rawData, config]);

  // Calculate stats for each member
  const memberStats = useMemo(() => {
    return groupedData.map(group => {
      const taskCount = group.projects.reduce((acc, p) => acc + p.tasks.length, 0);
      const totalHours = group.projects.reduce((acc, p) => 
        acc + p.tasks.reduce((sum, t) => sum + t.timeLogged, 0), 0
      );
      return {
        name: group.assignee,
        projectCount: group.projects.length,
        taskCount,
        totalHours
      };
    });
  }, [groupedData]);

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return groupedData;
    const query = searchQuery.toLowerCase();
    return groupedData.map(group => ({
      ...group,
      projects: group.projects.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.tasks.some(t => t.name.toLowerCase().includes(query))
      )
    })).filter(g => g.projects.length > 0);
  }, [groupedData, searchQuery]);

  const selectedGroup = selectedMember 
    ? filteredData.find(g => g.assignee === selectedMember) 
    : null;

  const toggleProject = (projectName: string) => {
    setExpandedProjects(prev => ({ ...prev, [projectName]: !prev[projectName] }));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-4 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white shadow-lg shadow-violet-500/25">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-lg">Projetos Arquivados</h2>
              <p className="text-xs text-slate-500">Histórico de projetos concluídos por membro</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-[1800px] mx-auto">
          {groupedData.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Archive className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-600">Nenhum projeto arquivado</p>
              <p className="text-sm text-slate-400 mt-1">Projetos concluídos aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Members List */}
              <div className="lg:col-span-1 space-y-3">
                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Membros ({memberStats.length})
                </h3>
                <div className="space-y-2">
                  {memberStats.map((member) => (
                    <MemberCard
                      key={member.name}
                      {...member}
                      isSelected={selectedMember === member.name}
                      onClick={() => setSelectedMember(
                        selectedMember === member.name ? null : member.name
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Projects List */}
              <div className="lg:col-span-3">
                {selectedGroup ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        Projetos de {selectedGroup.assignee}
                      </h3>
                      <span className="text-sm text-slate-500">
                        {selectedGroup.projects.length} projetos
                      </span>
                    </div>

                    {selectedGroup.projects.map(project => {
                      const isExpanded = expandedProjects[project.name];
                      const completedCount = project.tasks.length;

                      return (
                        <div key={project.name} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                          <button
                            onClick={() => toggleProject(project.name)}
                            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isExpanded ? 'bg-violet-100' : 'bg-slate-100'}`}>
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-violet-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800">{project.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Concluído
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-slate-700">{completedCount} tarefas</p>
                              <p className="text-xs text-slate-400">
                                {project.stats.logged.toFixed(1)}h registradas
                              </p>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="border-t border-slate-100 animate-fade-in">
                              <TaskTable
                                tasks={project.tasks}
                                weekDates={selectedGroup.weekDates}
                                holidays={config.holidays}
                                showDailyGrid={false}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <User className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-lg font-medium text-slate-600">Selecione um membro</p>
                    <p className="text-sm text-slate-400 mt-1">Clique em um membro para ver seus projetos arquivados</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedProjects;
