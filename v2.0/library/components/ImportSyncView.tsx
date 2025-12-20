
import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  ToggleRight,
  ToggleLeft,
  Clock,
  DownloadCloud,
  HardDrive,
  Activity,
  Loader2,
  FileCheck,
  Layers,
  Users,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { fetchClickUpData, getClickUpConfig } from '../services/clickup';

export const ImportSyncView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [autoSync, setAutoSync] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Terminal Logs State
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `> ${message}`]);
  };

  const handleSync = async () => {
    setIsLoading(true);
    setSyncStatus('syncing');
    setLogs([]);
    setErrorMessage('');

    try {
      addLog("Iniciando varredura de dados...");
      const config = getClickUpConfig();

      if (!config.clickupApiToken) {
        throw new Error("Token de acesso não encontrado. Configure no painel Admin.");
      }
      
      const { grouped, members } = await fetchClickUpData(config, (msg) => addLog(msg));

      addLog(`Dados processados para ${members.length} colaboradores.`);
      addLog(`Estrutura consolidada em ${grouped.length} frentes de trabalho.`);
      
      addLog("Painel de dados atualizado com sucesso.");
      setSyncStatus('success');
    } catch (e: any) {
      console.error(e);
      addLog(`FALHA NO PROCESSAMENTO: ${e.message}`);
      setErrorMessage(e.message);
      setSyncStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSyncStatus('idle');
    setLogs([]);
    setErrorMessage('');
  };

  // --- SUB-COMPONENTS ---

  const MetricItem = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
    <div className="flex flex-col items-center p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm flex-1 transition-all hover:bg-slate-800/80 group">
      <div className={`p-2 rounded-lg bg-opacity-20 mb-2 transition-transform group-hover:scale-110 duration-300 ${color.replace('text-', 'bg-')}`}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xl font-bold text-white">{value}</span>
      </div>
      <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1 opacity-70">{label}</span>
    </div>
  );

  return (
    <div className="flex-1 h-full overflow-hidden bg-slate-50 flex items-center justify-center p-6 animate-fadeIn">
      
      <div className="w-full max-w-2xl relative group">
          
          {/* Background Glow */}
          <div className={`absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 rounded-[2rem] opacity-20 blur-2xl transition duration-1000 ${isLoading ? 'opacity-50 animate-pulse' : ''}`}></div>
          
          <div className="relative bg-[#0f172a] rounded-3xl shadow-2xl flex flex-col border border-slate-800 overflow-hidden">
            
            {/* Decorative Background Icon */}
            <div className="absolute -top-10 -right-10 p-12 opacity-[0.03] pointer-events-none">
              <Database size={300} className="text-white transform rotate-12" />
            </div>

            {/* Card Body */}
            <div className="p-8 pb-6">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${isLoading ? 'bg-indigo-500/20' : 'bg-indigo-600 shadow-indigo-900/50'}`}>
                    <RefreshCw size={32} className={`text-white ${isLoading ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <h3 className="text-2xl font-bold text-white tracking-tight">Atualizar Dados</h3>
                       <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">Modo Diretor</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : syncStatus === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                      <span className={`text-xs font-bold uppercase tracking-wide ${isLoading ? 'text-amber-400' : syncStatus === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {isLoading ? 'Lendo base remota...' : syncStatus === 'error' ? 'Erro de Conexão' : 'Pronto para Atualizar'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                   <button 
                    onClick={() => !isLoading && setAutoSync(!autoSync)}
                    className={`group/toggle cursor-pointer ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="Alternar Atualização Automática"
                  >
                    <div className={`transition-colors duration-300 ${autoSync ? 'text-indigo-400' : 'text-slate-600'}`}>
                      {autoSync ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                    </div>
                  </button>
                  <span className="text-[10px] font-bold text-slate-500 uppercase mt-1 mr-1">Auto-Sync</span>
                </div>
              </div>

              {/* CONSOLE / TERMINAL VIEW */}
              {syncStatus !== 'idle' ? (
                <div className={`rounded-xl border p-5 font-mono text-xs mb-8 overflow-y-auto custom-scrollbar h-[200px] shadow-inner relative flex flex-col ${syncStatus === 'error' ? 'bg-rose-950/20 border-rose-900/50 text-rose-200' : 'bg-black/40 border-slate-700/50 text-slate-300'}`}>
                    <div className="flex items-center justify-between mb-2 border-b border-white/10 pb-2">
                       <span className="font-bold uppercase text-[10px] opacity-70">Logs do Sistema</span>
                       <div className="flex gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-white/20"></div>
                          <div className="w-2 h-2 rounded-full bg-white/20"></div>
                       </div>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {logs.map((log, i) => (
                        <div key={i} className="animate-fadeIn break-all">{log}</div>
                      ))}
                      {isLoading && (
                        <div className="animate-pulse text-indigo-400">_</div>
                      )}
                      <div ref={logsEndRef} />
                    </div>
                </div>
              ) : (
                /* Metrics Grid (Idle State) */
                <div className="grid grid-cols-3 gap-4 mb-8 relative z-10 mt-auto h-[200px] items-center">
                    <MetricItem icon={FileCheck} label="Tarefas" value="--" color="text-blue-400" />
                    <MetricItem icon={Layers} label="Projetos" value="--" color="text-violet-400" />
                    <MetricItem icon={Users} label="Equipe" value="--" color="text-emerald-400" />
                </div>
              )}

              {/* Action Button Area */}
              <div className="relative z-10">
                {syncStatus === 'success' ? (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="text-emerald-400" size={24} />
                          <div>
                             <p className="text-sm font-bold text-white">Dados Atualizados!</p>
                             <p className="text-xs text-emerald-400/80 mt-0.5">O painel já reflete as informações mais recentes.</p>
                          </div>
                        </div>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="w-full py-3 text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <ArrowRight size={14} /> Voltar ao Painel
                    </button>
                  </div>
                ) : syncStatus === 'error' ? (
                   <div className="space-y-3 animate-fadeIn">
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3">
                       <AlertTriangle className="text-rose-400" size={24} />
                       <div>
                          <p className="text-sm font-bold text-white">Erro na Atualização</p>
                          <p className="text-xs text-rose-400/80 mt-0.5">{errorMessage}</p>
                       </div>
                    </div>
                    <button 
                      onClick={handleReset}
                      className="w-full py-3 text-slate-400 hover:text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      Tentar Novamente
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleSync}
                    disabled={isLoading}
                    className={`
                      w-full group/btn relative flex items-center justify-center gap-3 font-bold py-4 px-6 rounded-xl transition-all transform
                      ${isLoading 
                        ? 'bg-slate-800 text-slate-500 cursor-wait border border-slate-700' 
                        : 'bg-white hover:bg-indigo-50 text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:-translate-y-1 active:scale-[0.98]'
                      }
                    `}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin text-indigo-500" /> Sincronizando dados...
                      </>
                    ) : (
                      <>
                        <DownloadCloud size={20} className="text-indigo-600" /> 
                        Atualizar Dados Agora
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Footer Information / Status Bar */}
            <div className="bg-slate-900/50 border-t border-slate-800 p-4 grid grid-cols-2 gap-4 backdrop-blur-sm">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400 border border-slate-700">
                     <HardDrive size={14} />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Conexão Ativa</span>
                     <span className="text-xs font-mono text-slate-300 font-medium">ClickUp Cloud</span>
                  </div>
               </div>
               <div className="flex items-center gap-3 justify-end text-right">
                  <div className="flex flex-col">
                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Última Leitura</span>
                     <span className="text-xs font-mono text-emerald-400 font-bold">
                        {syncStatus === 'success' ? 'Agora mesmo' : 'Pendente'}
                     </span>
                  </div>
                  <div className="p-2 bg-slate-800 rounded-lg text-emerald-500 border border-slate-700">
                     <Activity size={14} />
                  </div>
               </div>
            </div>

          </div>
      </div>
    </div>
  );
};
