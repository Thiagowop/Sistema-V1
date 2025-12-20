
import React, { useMemo, useState } from 'react';
import { MOCK_LEGACY_DATA, MOCK_TEAM_DATA } from '../constants';
import { 
  Bell, 
  CheckSquare, 
  MessageSquare, 
  Calendar, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Coffee,
  LayoutDashboard,
  Ban,
  Hourglass,
  AlertOctagon,
  Timer
} from 'lucide-react';

type TabKey = 'dashboard' | 'alerts' | 'tasks' | 'messages';

// Helper para calcular dias entre datas
const getDaysDiff = (date1: Date, date2: Date) => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

export const DailySpace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  
  // --- Lógica para buscar dados reais do sistema ---
  
  // 1. Processamento para o Dashboard Específico
  const dashboardMetrics = useMemo(() => {
    const validationItems: any[] = [];
    const blockedItems: any[] = [];
    const overdueItems: any[] = [];
    const today = new Date();

    MOCK_LEGACY_DATA.forEach(group => {
      group.projects.forEach(proj => {
        proj.tasks.forEach(task => {
          const statusLower = task.status?.toLowerCase() || '';
          const isCompleted = statusLower.includes('conclu') || task.status === 'completed';
          
          if (isCompleted) return;

          const dueDate = task.dueDate ? new Date(task.dueDate) : null;
          // Simulando data de início do status (como não temos histórico no mock, usamos startDate ou uma data aleatória recente)
          const statusDate = task.startDate ? new Date(task.startDate) : new Date(today.getTime() - (Math.random() * 10 * 24 * 60 * 60 * 1000));

          // 1. Validação
          if (statusLower.includes('valid') || statusLower.includes('review') || statusLower.includes('homolog')) {
             const daysInValidation = getDaysDiff(today, statusDate);
             // Regra de negócio fictícia: Prazo de validação é o DueDate ou 3 dias após entrada
             const validationDeadline = dueDate || new Date(statusDate.getTime() + (3 * 24 * 60 * 60 * 1000)); 
             const isStalled = today > validationDeadline;

             validationItems.push({
               ...task,
               assignee: group.assignee,
               projectName: proj.name,
               daysInStatus: daysInValidation,
               deadline: validationDeadline,
               isStalled
             });
          }

          // 2. Bloqueados
          else if (statusLower.includes('bloq') || statusLower.includes('block') || statusLower.includes('wait') || statusLower.includes('impedido')) {
             const daysBlocked = getDaysDiff(today, statusDate);
             blockedItems.push({
               ...task,
               assignee: group.assignee,
               projectName: proj.name,
               daysBlocked
             });
          }

          // 3. Atrasados (Geral)
          else if (dueDate && dueDate < today) {
             const daysLate = getDaysDiff(today, dueDate);
             overdueItems.push({
               ...task,
               assignee: group.assignee,
               projectName: proj.name,
               daysLate
             });
          }
        });
      });
    });

    // Ordenar por gravidade
    validationItems.sort((a, b) => (b.isStalled ? 1 : 0) - (a.isStalled ? 1 : 0));
    overdueItems.sort((a, b) => b.daysLate - a.daysLate);
    blockedItems.sort((a, b) => b.daysBlocked - a.daysBlocked);

    return { validationItems, blockedItems, overdueItems };
  }, []);

  const alertsData = useMemo(() => {
    // Exemplo: Filtrar todas as tarefas atrasadas ou críticas do sistema
    const alerts: any[] = [];
    MOCK_LEGACY_DATA.forEach(group => {
      group.projects.forEach(proj => {
        proj.tasks.forEach(task => {
          // Lógica de alerta: Atrasado ou Prioridade Urgente não concluída
          const isUrgent = (task.priority || '').includes('0') || (task.priority || '').includes('urgent');
          const isDone = task.status?.toLowerCase().includes('conclu') || task.status === 'completed';
          
          if (!isDone && isUrgent) {
            alerts.push({ ...task, source: group.assignee });
          }
        });
      });
    });
    return alerts;
  }, []);

  const myTasksData = useMemo(() => {
    // Simulando tarefas atribuídas ao usuário logado (ex: Thiago)
    const myName = "Thiago"; 
    const tasks: any[] = [];
    MOCK_LEGACY_DATA.forEach(group => {
        if (group.assignee === myName) {
            group.projects.forEach(proj => {
                proj.tasks.forEach(t => {
                    if (!t.status?.toLowerCase().includes('conclu')) {
                        tasks.push({ ...t, project: proj.name });
                    }
                });
            });
        }
    });
    return tasks;
  }, []);

  // Mock de Mensagens
  const messages = [
    { id: 1, from: 'Brozinga', text: 'Precisamos revisar a API de pagamentos hoje.', time: '10:30', unread: true },
    { id: 2, from: 'Sistema', text: 'Sincronização do ClickUp concluída com sucesso.', time: '09:00', unread: true },
    { id: 3, from: 'Soares', text: 'Terminei a documentação do módulo 3.', time: 'Ontem', unread: false },
  ];
  const unreadMessages = messages.filter(m => m.unread).length;

  // --- Renderização de Conteúdo Baseado na Aba ---
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn">
             
             {/* 1. Em Validação */}
             <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-indigo-50 bg-indigo-50/50 flex justify-between items-center">
                   <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                     <CheckCircle2 className="text-indigo-600" size={20} />
                     Em Validação / Homologação
                   </h3>
                   <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">{dashboardMetrics.validationItems.length} itens</span>
                </div>
                <div className="divide-y divide-indigo-50/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                   {dashboardMetrics.validationItems.length === 0 ? (
                     <div className="p-6 text-center text-slate-400 text-sm">Nenhum projeto em validação no momento.</div>
                   ) : (
                     dashboardMetrics.validationItems.map((item, idx) => (
                       <div key={idx} className="p-4 hover:bg-indigo-50/30 transition-colors flex items-center justify-between group">
                          <div>
                             <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-700 text-sm">{item.name}</span>
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.projectName}</span>
                             </div>
                             <div className="flex items-center gap-4 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><Clock size={12} /> Em validação há <strong>{item.daysInStatus} dias</strong></span>
                                <span className="flex items-center gap-1">Prazo: {item.deadline.toLocaleDateString('pt-BR')}</span>
                             </div>
                          </div>
                          
                          <div className="text-right">
                             {item.isStalled ? (
                               <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">
                                  <AlertOctagon size={14} />
                                  <span className="text-xs font-bold">Estourado</span>
                               </div>
                             ) : (
                               <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                                  <Timer size={14} />
                                  <span className="text-xs font-bold">No Prazo</span>
                               </div>
                             )}
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 2. Bloqueados */}
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
                   <div className="px-6 py-4 border-b border-rose-50 bg-rose-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-rose-900 flex items-center gap-2">
                        <Ban className="text-rose-600" size={20} />
                        Bloqueados / Impedidos
                      </h3>
                      <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">{dashboardMetrics.blockedItems.length}</span>
                   </div>
                   <div className="divide-y divide-rose-50/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {dashboardMetrics.blockedItems.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">Nenhum bloqueio registrado.</div>
                      ) : (
                        dashboardMetrics.blockedItems.map((item, idx) => (
                          <div key={idx} className="p-4 hover:bg-rose-50/30 transition-colors">
                             <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-700 text-sm line-clamp-1">{item.name}</span>
                                <span className="text-xs font-bold text-rose-600 whitespace-nowrap">Há {item.daysBlocked} dias</span>
                             </div>
                             <p className="text-xs text-slate-500 mb-2">{item.projectName} • {item.assignee}</p>
                             <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded w-fit">
                                <Hourglass size={10} /> Parado
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>

                {/* 3. Atrasados */}
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                   <div className="px-6 py-4 border-b border-amber-50 bg-amber-50/50 flex justify-between items-center">
                      <h3 className="font-bold text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="text-amber-600" size={20} />
                        Projetos Atrasados
                      </h3>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">{dashboardMetrics.overdueItems.length}</span>
                   </div>
                   <div className="divide-y divide-amber-50/50 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {dashboardMetrics.overdueItems.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">Tudo em dia!</div>
                      ) : (
                        dashboardMetrics.overdueItems.map((item, idx) => (
                          <div key={idx} className="p-4 hover:bg-amber-50/30 transition-colors">
                             <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-700 text-sm line-clamp-1">{item.name}</span>
                                <span className="text-xs font-bold text-amber-600 whitespace-nowrap">+{item.daysLate} dias</span>
                             </div>
                             <p className="text-xs text-slate-500 mb-2">{item.projectName} • {item.assignee}</p>
                             <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar size={12} />
                                Era para: {new Date(item.dueDate).toLocaleDateString('pt-BR')}
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>

          </div>
        );

      case 'alerts':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <AlertTriangle className="text-rose-500" />
                 Atenção Necessária
               </h2>
               <span className="text-xs text-slate-500">Itens urgentes de toda a equipe</span>
            </div>
            
            <div className="grid gap-3">
              {alertsData.length === 0 ? (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
                      <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-200" />
                      Tudo tranquilo por aqui. Sem alertas críticos.
                  </div>
              ) : (
                  alertsData.map((alert, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-rose-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer group">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
                          <AlertTriangle size={20} />
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-start">
                              <h4 className="font-bold text-slate-800 text-sm">{alert.name}</h4>
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">P0 - Urgente</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">Responsável: <strong className="text-slate-700">{alert.source}</strong></p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                              {alert.dueDate && <span className="flex items-center gap-1 text-rose-600 font-medium"><Calendar size={12} /> {new Date(alert.dueDate).toLocaleDateString('pt-BR')}</span>}
                              {alert.timeEstimate && <span className="flex items-center gap-1"><Clock size={12} /> {alert.timeEstimate}h est.</span>}
                          </div>
                      </div>
                      <button className="text-slate-300 hover:text-indigo-600 transition-colors self-center">
                          <ArrowRight size={18} />
                      </button>
                  </div>
                  ))
              )}
            </div>
          </div>
        );

      case 'tasks':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <CheckSquare className="text-indigo-500" />
                 Meu Backlog
               </h2>
               <span className="text-xs text-slate-500">Tarefas atribuídas a você</span>
            </div>

            <div className="grid gap-3">
               {myTasksData.length === 0 ? (
                  <div className="p-10 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 flex flex-col items-center">
                      <Coffee size={40} className="mb-3 text-slate-300" />
                      <p>Você não tem tarefas pendentes.</p>
                      <p className="text-xs mt-1">Aproveite o café!</p>
                  </div>
               ) : (
                  myTasksData.map((task, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 transition-all cursor-pointer">
                          <div className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-500 cursor-pointer transition-colors"></div>
                          <div className="flex-1">
                              <h4 className="font-bold text-slate-700 text-sm line-through-hover">{task.name}</h4>
                              <p className="text-xs text-slate-500">{task.project}</p>
                          </div>
                          <div className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                              {task.status}
                          </div>
                      </div>
                  ))
               )}
            </div>
          </div>
        );

      case 'messages':
        return (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <MessageSquare className="text-sky-500" />
                 Comunicações
               </h2>
               <span className="text-xs text-slate-500">Atualizações recentes</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
               {messages.map((msg) => (
                   <div key={msg.id} className={`p-4 flex gap-4 hover:bg-slate-50 transition-colors ${msg.unread ? 'bg-sky-50/30' : ''}`}>
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 uppercase">
                          {msg.from.substring(0,2)}
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between">
                              <span className={`text-sm font-bold ${msg.unread ? 'text-slate-900' : 'text-slate-600'}`}>{msg.from}</span>
                              <span className="text-[10px] text-slate-400">{msg.time}</span>
                          </div>
                          <p className={`text-xs mt-1 ${msg.unread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                              {msg.text}
                          </p>
                      </div>
                      {msg.unread && <div className="w-2 h-2 rounded-full bg-sky-500 self-center"></div>}
                   </div>
               ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const TabButton = ({ id, label, badge, icon: Icon }: { id: TabKey, label: string, badge?: number, icon: any }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`
          relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
          ${isActive
            ? "bg-white text-slate-800 shadow-sm ring-1 ring-black/5"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }
        `}
      >
        <Icon size={16} className={isActive ? 'text-indigo-600' : ''} />
        <span>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span
            className={`
              flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full leading-none transition-colors
              ${isActive
                ? "bg-rose-500 text-white"
                : "bg-slate-200 text-slate-600"
              }
            `}
          >
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </button>
    );
  };

  // --- Renderização da Página ---
  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] animate-fadeIn font-sans p-6 md:p-8">
        
        {/* Header Personalizado */}
        <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Bom dia, Gestor.</h1>
            <p className="text-slate-500 text-sm">Aqui está o resumo do que requer sua atenção hoje.</p>
        </div>

        <div className="max-w-4xl">
            {/* Navegação de Abas (Nativa) */}
            <div className="flex flex-wrap gap-2 mb-6 p-1 bg-slate-100/80 rounded-2xl w-fit">
               <TabButton id="dashboard" label="Dashboard" icon={LayoutDashboard} />
               <TabButton id="alerts" label="Alertas & Riscos" badge={alertsData.length} icon={Bell} />
               <TabButton id="tasks" label="Minhas Tarefas" badge={myTasksData.length} icon={CheckSquare} />
               <TabButton id="messages" label="Mensagens" badge={unreadMessages} icon={MessageSquare} />
            </div>

            {/* Conteúdo da Aba */}
            <div>
               {renderContent()}
            </div>
        </div>

    </div>
  );
};
