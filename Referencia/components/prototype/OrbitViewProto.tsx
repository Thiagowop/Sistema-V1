import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ArrowLeft, 
  Briefcase, 
  Activity, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Target,
  Layers,
  Zap
} from 'lucide-react';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../../constants';
import { GroupedData, TeamMemberData } from '../../types';

// --- HELPERS ---
const formatHours = (val: number) => `${Math.round(val)}h`;

// --- COMPONENTES VISUAIS ---

interface SatelliteCardProps {
  title: string;
  icon: any;
  children?: React.ReactNode;
  position: string;
  color: string;
}

// 1. Satellite Card (Os cards ao redor)
const SatelliteCard = ({ 
  title, 
  icon: Icon, 
  children, 
  position, 
  color 
}: SatelliteCardProps) => {
  // Posições CSS baseadas na prop 'position' (top-left, top-right, etc)
  const posClasses: Record<string, string> = {
    'top-left': 'top-4 left-4 md:top-10 md:left-10',
    'top-right': 'top-4 right-4 md:top-10 md:right-10',
    'bottom-left': 'bottom-4 left-4 md:bottom-10 md:left-10',
    'bottom-right': 'bottom-4 right-4 md:bottom-10 md:right-10',
  };

  const colorClasses: Record<string, string> = {
    indigo: 'border-indigo-200 bg-indigo-50/50 text-indigo-700',
    emerald: 'border-emerald-200 bg-emerald-50/50 text-emerald-700',
    rose: 'border-rose-200 bg-rose-50/50 text-rose-700',
    amber: 'border-amber-200 bg-amber-50/50 text-amber-700',
  };

  const iconColors: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <div className={`absolute ${posClasses[position]} w-[45%] md:w-[300px] z-20 transition-all duration-500 animate-scaleIn`}>
      <div className={`bg-white rounded-2xl border-2 shadow-lg backdrop-blur-sm overflow-hidden ${colorClasses[color]}`}>
        <div className="px-4 py-3 border-b border-inherit flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${iconColors[color]}`}>
            <Icon size={16} />
          </div>
          <span className="font-bold text-xs uppercase tracking-wider">{title}</span>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// 2. Connection Lines (SVG)
const ConnectionLines = () => (
  <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none opacity-20">
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
      </marker>
    </defs>
    {/* Center to Top Left */}
    <line x1="50%" y1="50%" x2="20%" y2="20%" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
    {/* Center to Top Right */}
    <line x1="50%" y1="50%" x2="80%" y2="20%" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
    {/* Center to Bottom Left */}
    <line x1="50%" y1="50%" x2="20%" y2="80%" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
    {/* Center to Bottom Right */}
    <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
  </svg>
);

// --- MAIN COMPONENT ---

export const OrbitViewProto: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Dados do membro selecionado
  const memberDetails = useMemo(() => {
    if (!selectedMember) return null;
    
    const teamData = MOCK_TEAM_DATA.find(m => m.name === selectedMember);
    const legacyData = MOCK_LEGACY_DATA.find(g => g.assignee === selectedMember);
    
    if (!teamData || !legacyData) return null;

    // Processar tarefas críticas
    const urgentTasks = [];
    let totalProjects = 0;
    
    legacyData.projects.forEach(p => {
        totalProjects++;
        p.tasks.forEach(t => {
            const isUrgent = (t.priority || '').includes('0') || (t.priority || '').includes('urgent');
            const isDone = t.status?.toLowerCase().includes('conclu');
            if (isUrgent && !isDone) urgentTasks.push(t);
        });
    });

    const utilization = (teamData.totalHours / teamData.weeklyCapacity) * 100;

    return {
        ...teamData,
        projectsCount: totalProjects,
        activeProjects: legacyData.projects.map(p => p.name).slice(0, 4),
        urgentTasksList: urgentTasks.slice(0, 3), // Top 3
        utilization
    };
  }, [selectedMember]);

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col font-sans overflow-hidden relative">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 p-6 z-30 flex justify-between items-start pointer-events-none">
        <div>
           <div className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold mb-2 pointer-events-auto">
             Protótipo Visual
           </div>
           <h1 className="text-2xl font-bold text-slate-800">Visão Orbital</h1>
           <p className="text-sm text-slate-500">Conexões dinâmicas centradas no colaborador</p>
        </div>
        {selectedMember && (
            <button 
              onClick={() => setSelectedMember(null)}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-xl text-sm font-bold text-slate-600 transition-all hover:text-indigo-600"
            >
                <ArrowLeft size={16} /> Voltar à Galáxia
            </button>
        )}
      </div>

      {/* --- CENA 1: SELEÇÃO (GALÁXIA) --- */}
      {!selectedMember && (
         <div className="flex-1 flex items-center justify-center p-8 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl">
               {MOCK_TEAM_DATA.map((member, idx) => (
                  <button
                    key={member.name}
                    onClick={() => setSelectedMember(member.name)}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white rounded-full aspect-square shadow-lg border-4 border-white hover:border-indigo-100 hover:scale-110 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20"
                  >
                     <div className="absolute inset-0 rounded-full border border-dashed border-slate-200 group-hover:border-indigo-300 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xl mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {member.name.substring(0, 2)}
                     </div>
                     <h3 className="font-bold text-slate-700 group-hover:text-indigo-700 text-lg">{member.name}</h3>
                     <span className="text-xs text-slate-400 font-medium">{member.weeklyCapacity}h cap.</span>
                  </button>
               ))}
            </div>
         </div>
      )}

      {/* --- CENA 2: FOCO (SISTEMA SOLAR) --- */}
      {selectedMember && memberDetails && (
         <div className="flex-1 relative flex items-center justify-center overflow-hidden animate-fadeIn">
            
            {/* SVG Lines Background */}
            <ConnectionLines />

            {/* SATELLITE 1 (Top Left): Projetos */}
            <SatelliteCard title="Projetos Ativos" icon={Briefcase} position="top-left" color="indigo">
               <div className="space-y-2">
                  {memberDetails.activeProjects.length > 0 ? (
                      memberDetails.activeProjects.map((proj, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600 bg-white/50 p-2 rounded border border-indigo-100">
                            <Layers size={14} className="text-indigo-400" />
                            <span className="truncate">{proj}</span>
                        </div>
                      ))
                  ) : (
                      <p className="text-sm text-slate-400 italic">Nenhum projeto ativo.</p>
                  )}
                  <div className="pt-2 text-right">
                      <span className="text-xs font-bold text-indigo-600">+ {memberDetails.projectsCount} Total</span>
                  </div>
               </div>
            </SatelliteCard>

            {/* SATELLITE 2 (Top Right): Capacidade & Saúde */}
            <SatelliteCard title="Saúde & Carga" icon={Activity} position="top-right" color="emerald">
               <div className="flex flex-col items-center py-2">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#ecfdf5" strokeWidth="8" fill="transparent" />
                          <circle 
                            cx="48" cy="48" r="40" 
                            stroke={memberDetails.utilization > 100 ? '#f43f5e' : '#10b981'} 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={251.2} 
                            strokeDashoffset={251.2 - (Math.min(memberDetails.utilization, 100) / 100 * 251.2)} 
                            strokeLinecap="round"
                          />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                          <span className={`text-xl font-bold ${memberDetails.utilization > 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {memberDetails.utilization.toFixed(0)}%
                          </span>
                          <span className="text-[9px] uppercase font-bold text-slate-400">Ocupado</span>
                      </div>
                  </div>
                  <div className="flex justify-between w-full mt-4 px-2 text-xs">
                      <div className="text-center">
                          <p className="font-bold text-slate-700">{formatHours(memberDetails.totalHours)}</p>
                          <p className="text-[9px] text-slate-400 uppercase">Alocado</p>
                      </div>
                      <div className="w-px h-8 bg-emerald-100"></div>
                      <div className="text-center">
                          <p className="font-bold text-slate-700">{memberDetails.weeklyCapacity}h</p>
                          <p className="text-[9px] text-slate-400 uppercase">Capacidade</p>
                      </div>
                  </div>
               </div>
            </SatelliteCard>

            {/* CENTER HUB (The Person) */}
            <div className="relative z-30 flex flex-col items-center justify-center">
               <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-white shadow-2xl border-8 border-slate-100 flex items-center justify-center relative group cursor-pointer transition-transform hover:scale-105">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-500 opacity-20 animate-ping"></div>
                  <div className="text-4xl md:text-6xl font-black text-slate-700 group-hover:text-indigo-600 transition-colors">
                      {memberDetails.name.substring(0, 2)}
                  </div>
                  <div className="absolute -bottom-4 bg-slate-800 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      {memberDetails.name}
                  </div>
               </div>
            </div>

            {/* SATELLITE 3 (Bottom Left): Alertas */}
            <SatelliteCard title="Pontos de Atenção" icon={AlertTriangle} position="bottom-left" color="rose">
               <div className="space-y-3">
                  {memberDetails.urgentTasksList.length > 0 ? (
                      memberDetails.urgentTasksList.map((task: any, i: number) => (
                          <div key={i} className="bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-start gap-2">
                              <Zap size={14} className="text-rose-500 mt-0.5 shrink-0" />
                              <div>
                                  <p className="text-xs font-bold text-rose-800 line-clamp-1">{task.name}</p>
                                  <p className="text-[10px] text-rose-600">{task.projectName}</p>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="flex flex-col items-center py-4 text-emerald-600">
                          <CheckCircle2 size={32} className="mb-2 opacity-50" />
                          <p className="text-sm font-bold">Sem Urgências</p>
                      </div>
                  )}
               </div>
            </SatelliteCard>

            {/* SATELLITE 4 (Bottom Right): Distribuição */}
            <SatelliteCard title="Foco de Trabalho" icon={Target} position="bottom-right" color="amber">
               <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Urgente (P0)</span>
                          <span>{formatHours(memberDetails.urgent)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-rose-500 h-2 rounded-full" style={{ width: `${(memberDetails.urgent / memberDetails.totalHours) * 100}%` }}></div>
                      </div>
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Alta (P1)</span>
                          <span>{formatHours(memberDetails.high)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(memberDetails.high / memberDetails.totalHours) * 100}%` }}></div>
                      </div>
                  </div>
                  <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Normal (P2)</span>
                          <span>{formatHours(memberDetails.normal)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(memberDetails.normal / memberDetails.totalHours) * 100}%` }}></div>
                      </div>
                  </div>
               </div>
            </SatelliteCard>

         </div>
      )}

    </div>
  );
};