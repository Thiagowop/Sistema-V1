import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutGrid,
  Mountain,
  Map,
  Hammer,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { QualityDashboard } from './QualityDashboard';
import { MOCK_LEGACY_DATA } from '../../constants';

// --- SUB-COMPONENTS ---

const InfoCard = ({ title, description, icon: Icon, colorClass }: { title: string, description: string, icon: any, colorClass: string }) => (
  <div className={`rounded-xl p-4 border ${colorClass} bg-opacity-10 flex items-start gap-3 mb-6`}>
    <div className={`p-2 rounded-lg bg-white bg-opacity-60`}>
      <Icon size={20} className={colorClass.replace('border-', 'text-').replace('bg-', 'text-')} />
    </div>
    <div>
      <h4 className={`font-bold text-sm ${colorClass.replace('border-', 'text-').replace('bg-', 'text-')}`}>{title}</h4>
      <p className="text-xs text-slate-600 mt-1">{description}</p>
    </div>
  </div>
);

// 2. NÍVEL TÁTICO (GERÊNCIA & PROCESSO)
export const TacticalView = () => {
  // Calcular métricas reais com base no MOCK_LEGACY_DATA
  const metrics = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    
    MOCK_LEGACY_DATA.forEach(group => {
      group.projects.forEach(project => {
        project.tasks.forEach(task => {
          totalTasks++;
          if (task.status === 'completed' || task.status === 'concluído' || task.status === 'done') {
            completedTasks++;
          }
        });
      });
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    return { totalTasks, completedTasks, completionRate };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        
        {/* CARD MOVIDO DA VISÃO GERAL: Eficiência de Entrega */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden xl:col-span-2 flex flex-col justify-center">
            <div className="absolute right-0 top-0 p-4 opacity-[0.03]">
              <CheckCircle2 size={100} />
            </div>
            <div className="flex items-center gap-2 mb-2">
               <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={18} />
               </div>
               <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Eficiência de Entrega</span>
            </div>
            
            <div className="flex items-end gap-3 mt-2">
              <span className="text-4xl font-bold text-slate-800">{metrics.completedTasks}</span>
              <span className="text-sm font-bold text-slate-400 mb-1">/ {metrics.totalTasks} tarefas</span>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 mt-4 overflow-hidden">
               <div 
                 className={`h-full rounded-full ${metrics.completionRate > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                 style={{ width: `${metrics.completionRate}%` }}
               ></div>
            </div>
            
            <div className="flex justify-between mt-2 text-xs">
               <span className="font-bold text-slate-500">{metrics.completionRate.toFixed(0)}% Concluído</span>
               <span className="text-indigo-600 font-bold hover:underline cursor-pointer">Ver Pendências</span>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Saúde do Sprint</p>
          <div className="flex items-center gap-2">
             <h3 className="text-3xl font-bold text-slate-800">92%</h3>
             <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full mt-2 inline-block w-fit">Estável</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Membros em Risco</p>
          <div className="flex items-center gap-2">
             <h3 className="text-3xl font-bold text-slate-800">2</h3>
             <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-full mt-2 inline-block w-fit">Sobrecarga > 100%</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center">
          <p className="text-slate-500 text-xs font-bold uppercase mb-2">Gargalo (Code Review)</p>
          <div className="flex items-center gap-2">
             <h3 className="text-3xl font-bold text-slate-800">4.5h</h3>
             <Clock size={20} className="text-slate-400" />
          </div>
          <span className="text-xs text-slate-400 font-medium mt-2 inline-block">Tempo médio espera</span>
        </div>

      </div>
    </div>
  );
};

// 3. NÍVEL ESTRATÉGICO (DIRETORIA)
export const StrategicView = () => (
  <div className="space-y-6 animate-fadeIn">
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold">Objetivos do Trimestre (OKRs)</h2>
          <p className="text-slate-400">Progresso macro em direção à visão da empresa</p>
        </div>
        <div className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold border border-white/20">
          Q3 2024
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex justify-between mb-2 items-end">
             <span className="font-bold text-lg">Lançamento Módulo IA</span>
             <span className="text-emerald-400 font-mono text-xl">75%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-emerald-500 w-3/4 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          </div>
          <p className="text-xs text-slate-400">Previsão: 15 Out • Risco: Baixo</p>
        </div>
        <div>
          <div className="flex justify-between mb-2 items-end">
             <span className="font-bold text-lg">Redução Bugs Críticos</span>
             <span className="text-amber-400 font-mono text-xl">40%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-amber-500 w-2/5"></div>
          </div>
          <p className="text-xs text-slate-400">Meta: -80% • Risco: Médio</p>
        </div>
        <div>
          <div className="flex justify-between mb-2 items-end">
             <span className="font-bold text-lg">Refatoração Legacy</span>
             <span className="text-blue-400 font-mono text-xl">20%</span>
          </div>
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-blue-500 w-1/5"></div>
          </div>
          <p className="text-xs text-slate-400">Foco técnico secundário</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
         <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Confiabilidade de Entrega</p>
         <div className="text-4xl font-bold text-indigo-600 mb-1">87%</div>
         <p className="text-xs text-slate-400">Sprints entregues no prazo (YTD)</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
         <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">Satisfação do Time (eNPS)</p>
         <div className="text-4xl font-bold text-emerald-600 mb-1">+42</div>
         <p className="text-xs text-slate-400">Zona de Qualidade</p>
      </div>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
         <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-2">ROI de Engenharia</p>
         <div className="text-4xl font-bold text-slate-700 mb-1">R$ 1.2M</div>
         <p className="text-xs text-slate-400">Valor gerado em features (Est.)</p>
      </div>
    </div>
  </div>
);

// --- MAIN LAYOUT COMPONENT ---

interface GovernanceDashboardProps {
  initialView?: 'strategic' | 'tactical' | 'operational';
  hideNavigation?: boolean;
}

const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({ 
  initialView = 'tactical',
  hideNavigation = false 
}) => {
  const [activeView, setActiveView] = useState<'strategic' | 'tactical' | 'operational'>(initialView);

  // Effect to sync prop changes if they happen
  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

  return (
    <div className="space-y-6">
      
      {/* Header com Navegação Hierárquica (Opcional) */}
      {!hideNavigation && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="text-indigo-600" />
              Governança 4.0
            </h2>
            <p className="text-slate-500 text-sm">Visão multinível para tomada de decisão</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-1.5 inline-flex shadow-sm">
            <button
              onClick={() => setActiveView('strategic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'strategic' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Mountain size={16} /> Estratégico
            </button>
            <button
              onClick={() => setActiveView('tactical')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'tactical' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Map size={16} /> Tático
            </button>
            <button
              onClick={() => setActiveView('operational')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'operational' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Hammer size={16} /> Operacional
            </button>
          </div>
        </div>
      )}

      {/* View Content */}
      <div className={hideNavigation ? "" : "min-h-[500px] mt-4"}>
        {activeView === 'strategic' && (
          <div className="space-y-6">
            {!hideNavigation && <InfoCard 
              title="Nível Estratégico (Diretoria e Stakeholders)" 
              description="Foco em resultados de negócio, cumprimento de prazos macro e grandes objetivos (OKRs)."
              icon={Mountain}
              colorClass="bg-violet-50 border-violet-200"
            />}
            <StrategicView />
          </div>
        )}
        {activeView === 'tactical' && (
          <div className="space-y-6">
            {!hideNavigation && <InfoCard 
              title="Nível Tático (Gerência e Coordenação)" 
              description="Foco em alocação de recursos, gargalos e saúde do processo."
              icon={Map}
              colorClass="bg-blue-50 border-blue-200"
            />}
            <TacticalView />
          </div>
        )}
        {activeView === 'operational' && (
           <div className="space-y-6">
             {!hideNavigation && <InfoCard 
              title="Nível Operacional (O Chão de Fábrica)" 
              description="Foco na higiene dos dados e execução diária."
              icon={Hammer}
              colorClass="bg-emerald-50 border-emerald-200"
            />}
             {/* Using the isolated component now */}
             <QualityDashboard data={MOCK_LEGACY_DATA} />
           </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceDashboard;
