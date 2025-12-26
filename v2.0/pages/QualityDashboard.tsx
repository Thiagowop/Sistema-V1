import React, { useState, useMemo } from 'react';
import {
  Users,
  Flag,
  Play,
  Calendar,
  Clock,
  FileText,
  X,
  Zap,
  FilterX,
  Target,
  CheckCircle2,
  Settings,
  SlidersHorizontal,
  RotateCcw,
  Save
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { GroupedData, Task } from '../types';

interface QualityDashboardProps {
  data: GroupedData[];
}

// Pesos Padrão solicitados na imagem
const DEFAULT_WEIGHTS = {
  assignee: 15,
  dueDate: 8,
  priority: 6,
  startDate: 6,
  estimate: 10,
  description: 12
};

// --- COMPONENTE DE SCORE CIRCULAR ---
const CircularScore = ({
  score,
  size = 48,
  strokeWidth = 4
}: {
  score: number,
  size?: number,
  strokeWidth?: number
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let color = '#10b981';
  if (score < 60) color = '#ef4444';
  else if (score < 70) color = '#eab308';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={strokeWidth} fill="transparent" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="white"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold leading-none text-slate-700 tracking-tight" style={{ fontSize: size * 0.3 }}>
          {score}%
        </span>
      </div>
    </div>
  );
};

export const QualityDashboard: React.FC<QualityDashboardProps> = ({ data }) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Estado reativo dos pesos
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // --- ENGINE DE CÁLCULO GERAL (RANKING) ---
  const rankings = useMemo(() => {
    const memberStats = new Map<string, {
      name: string;
      totalTasks: number;
      penaltyPoints: number;
      issuesCount: number;
      breakdown: { assignee: number; priority: number; startDate: number; dueDate: number; estimate: number; description: number; };
    }>();

    data.forEach(group => {
      if (!memberStats.has(group.assignee)) {
        memberStats.set(group.assignee, {
          name: group.assignee,
          totalTasks: 0,
          penaltyPoints: 0,
          issuesCount: 0,
          breakdown: { assignee: 0, priority: 0, startDate: 0, dueDate: 0, estimate: 0, description: 0 }
        });
      }

      const mStat = memberStats.get(group.assignee)!;

      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          if (task.status?.toLowerCase().includes('conclu') || task.status === 'completed' || task.status === 'done') return;

          mStat.totalTasks++;
          let taskPenalty = 0;
          let hasIssue = false;

          if (!task.assignee || task.assignee === 'Sem responsável') { mStat.breakdown.assignee++; taskPenalty += weights.assignee; hasIssue = true; }
          if (!task.priority || task.priority === '4') { mStat.breakdown.priority++; taskPenalty += weights.priority; hasIssue = true; }
          if (!task.startDate) { mStat.breakdown.startDate++; taskPenalty += weights.startDate; hasIssue = true; }
          if (!task.dueDate) { mStat.breakdown.dueDate++; taskPenalty += weights.dueDate; hasIssue = true; }
          if (!task.timeEstimate) { mStat.breakdown.estimate++; taskPenalty += weights.estimate; hasIssue = true; }
          if (!task.description || task.description.length < 5) { mStat.breakdown.description++; taskPenalty += weights.description; hasIssue = true; }

          mStat.penaltyPoints += taskPenalty;
          if (hasIssue) mStat.issuesCount++;
        });
      });
    });

    return Array.from(memberStats.values()).map(m => {
      const penaltyPerTask = m.totalTasks > 0 ? m.penaltyPoints / m.totalTasks : 0;
      let memberScore = Math.max(0, Math.round(100 - (penaltyPerTask * 2.5)));
      let tier = 'Elite';
      if (memberScore < 60) tier = 'Crítico';
      else if (memberScore < 70) tier = 'Atenção';
      else if (memberScore < 90) tier = 'Profissional';
      return { ...m, score: memberScore, tier };
    }).sort((a, b) => b.score - a.score);
  }, [data, weights]);

  // --- ENGINE DE EXIBIÇÃO ---
  const displayStats = useMemo(() => {
    let totalTasks = 0;
    const issues = { assignee: [] as Task[], priority: [] as Task[], startDate: [] as Task[], dueDate: [] as Task[], estimate: [] as Task[], description: [] as Task[] };
    let totalPenalty = 0;

    const targetData = selectedMemberId ? data.filter(g => g.assignee === selectedMemberId) : data;

    targetData.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          if (task.status?.toLowerCase().includes('conclu') || task.status === 'completed' || task.status === 'done') return;
          totalTasks++;
          let taskPenalty = 0;
          if (!task.assignee || task.assignee === 'Sem responsável') { issues.assignee.push(task); taskPenalty += weights.assignee; }
          if (!task.priority || task.priority === '4') { issues.priority.push(task); taskPenalty += weights.priority; }
          if (!task.startDate) { issues.startDate.push(task); taskPenalty += weights.startDate; }
          if (!task.dueDate) { issues.dueDate.push(task); taskPenalty += weights.dueDate; }
          if (!task.timeEstimate) { issues.estimate.push(task); taskPenalty += weights.estimate; }
          if (!task.description || task.description.length < 5) { issues.description.push(task); taskPenalty += weights.description; }
          totalPenalty += taskPenalty;
        });
      });
    });

    const totalIssues = Object.values(issues).reduce((acc, curr) => acc + curr.length, 0);
    const avgPenaltyPerTask = totalTasks > 0 ? totalPenalty / totalTasks : 0;
    const score = selectedMemberId ? (rankings.find(m => m.name === selectedMemberId)?.score || 0) : Math.max(0, Math.round(100 - (avgPenaltyPerTask * 2)));

    return { totalTasks, issues, totalIssues, score };
  }, [data, selectedMemberId, rankings, weights]);

  const scoreColor = (s: number) => s < 60 ? '#ef4444' : s < 70 ? '#eab308' : '#10b981';
  const pieData = [{ name: 'Score', value: displayStats.score, fill: scoreColor(displayStats.score) }, { name: 'Gap', value: 100 - displayStats.score, fill: '#f1f5f9' }];

  const sections = [
    { id: 'assignee', label: 'Responsável', count: displayStats.issues.assignee.length, color: 'text-rose-600', icon: Users, weight: weights.assignee },
    { id: 'dueDate', label: 'Prazo', count: displayStats.issues.dueDate.length, color: 'text-orange-600', icon: Calendar, weight: weights.dueDate },
    { id: 'priority', label: 'Prioridade', count: displayStats.issues.priority.length, color: 'text-amber-600', icon: Flag, weight: weights.priority },
    { id: 'startDate', label: 'Início', count: displayStats.issues.startDate.length, color: 'text-indigo-600', icon: Play, weight: weights.startDate },
    { id: 'estimate', label: 'Estimativa', count: displayStats.issues.estimate.length, color: 'text-blue-600', icon: Clock, weight: weights.estimate },
    { id: 'description', label: 'Descrição', count: displayStats.issues.description.length, color: 'text-slate-600', icon: FileText, weight: weights.description },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-sans pb-12 relative bg-white min-h-full p-6">

      {/* MODAL DE CONFIGURAÇÃO DE PESOS */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn" onClick={() => setIsConfigOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            <div className="px-8 py-6 border-b border-slate-100 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl"><SlidersHorizontal size={20} /></div>
                <h3 className="font-black text-slate-800 text-lg">Pesos da Auditoria</h3>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
            </div>

            <div className="p-8 space-y-8">
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Defina o quanto cada campo incompleto penaliza o Score Final. Pesos maiores tornam a auditoria mais rigorosa.
              </p>

              <div className="space-y-6">
                {Object.entries(weights).map(([key, val]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-black text-slate-700 uppercase tracking-widest">
                        {key === 'assignee' ? 'Responsável' :
                          key === 'dueDate' ? 'Prazo' :
                            key === 'priority' ? 'Prioridade' :
                              key === 'startDate' ? 'Data Início' :
                                key === 'estimate' ? 'Estimativa' : 'Descrição'}
                      </label>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {val} pts
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="50" value={val}
                      onChange={(e) => setWeights({ ...weights, [key]: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                <button
                  onClick={() => setWeights(DEFAULT_WEIGHTS)}
                  className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw size={14} /> Restaurar Padrão
                </button>
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
                >
                  <Save size={16} /> Aplicar & Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL - REFINALIZADO */}
      <div className="space-y-6">
        <div className={`bg-white rounded-3xl p-6 border shadow-sm relative overflow-hidden transition-all duration-500 ${selectedMemberId ? 'border-indigo-200 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">

            {/* Esquerda: Toolbar e Título */}
            <div className="flex flex-col gap-6 w-full md:w-auto flex-1">
              <div className="flex items-center gap-2">
                <select
                  value={selectedMemberId || 'global'}
                  onChange={(e) => setSelectedMemberId(e.target.value === 'global' ? null : e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer hover:bg-white hover:border-indigo-300 min-w-[220px]"
                >
                  <option value="global">👥 Visão Global da Equipe</option>
                  {rankings.map((member) => (
                    <option key={member.name} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="p-2 text-slate-400 bg-white border border-slate-200 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
                  title="Configurar Pesos"
                >
                  <Settings size={18} />
                </button>

                {selectedMemberId && (
                  <button
                    onClick={() => setSelectedMemberId(null)}
                    className="p-2 text-slate-400 bg-white border border-slate-200 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 rounded-xl transition-all shadow-sm animate-fadeIn"
                    title="Limpar filtro"
                  >
                    <FilterX size={18} />
                  </button>
                )}
              </div>

              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
                  {selectedMemberId || 'Visão Global'}
                </h2>
                <p className="text-sm font-medium text-slate-400">
                  {selectedMemberId ? 'Performance individual detalhada' : 'Resumo de performance da equipe'}
                </p>
              </div>
            </div>

            {/* Direita: Métricas e Gráfico */}
            <div className="flex flex-col sm:flex-row items-center gap-6 self-stretch md:self-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100 w-full md:w-auto mt-4 md:mt-0">
              <div className="flex items-center justify-center gap-8 w-full sm:w-auto sm:pr-8 sm:border-r border-slate-200 border-b sm:border-b-0 pb-6 sm:pb-0">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tarefas</span>
                  <div className="flex items-center gap-3">
                    <Target size={24} className="text-slate-400" />
                    <span className="text-3xl font-black text-slate-700">{displayStats.totalTasks}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Erros</span>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={24} className="text-rose-500" />
                    <span className="text-3xl font-black text-rose-600">{displayStats.totalIssues}</span>
                  </div>
                </div>
              </div>

              <div className="relative w-24 h-24 flex-shrink-0" style={{ minWidth: '96px', minHeight: '96px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} cornerRadius={index === 0 ? 10 : 0} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black" style={{ color: scoreColor(displayStats.score) }}>{displayStats.score}%</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedCategory(selectedCategory === section.id ? null : section.id)}
              className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${selectedCategory === section.id ? 'bg-indigo-50 border-indigo-400 shadow-md transform scale-105' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
            >
              <div className="flex justify-between items-start mb-3">
                <section.icon size={20} className={`${section.color} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-slate-50 text-slate-400 border border-slate-100">P: {section.weight}</span>
              </div>
              <span className={`text-2xl font-black ${section.count > 0 ? 'text-slate-800' : 'text-slate-200'}`}>{section.count}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{section.label}</span>
              {section.count > 0 && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500"></div>}
            </button>
          ))}
        </div>

        {selectedCategory && (
          <div className="animate-slideInUp bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden ring-8 ring-slate-50">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">Lista de Correção: {selectedCategory}</h3>
              <button onClick={() => setSelectedCategory(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
              {(displayStats.issues as any)[selectedCategory].map((task: Task, index: number) => (
                <div key={`${task.id}-${index}`} className="p-5 hover:bg-slate-50 flex items-center justify-between group">
                  <div className="min-w-0 pr-4">
                    <p className="font-bold text-slate-800 text-sm mb-1 group-hover:text-indigo-700 transition-colors">{task.name}</p>
                    <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{task.projectName}</span>
                      <span>{task.assignee}</span>
                    </div>
                  </div>
                  <button className="flex-shrink-0 px-4 py-2 bg-[#0f172a] text-white text-[10px] font-black uppercase rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-black shadow-lg">Corrigir</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
