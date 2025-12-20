
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Key, 
  Plus, 
  Trash2, 
  Upload, 
  HardDrive,
  Eye,
  EyeOff,
  Check,
  Shield,
  AlertTriangle,
  Users,
  Globe,
  BookOpen,
  Lock,
  Unlock,
  ToggleRight,
  ToggleLeft
} from 'lucide-react';
import { DailySpace } from './DailySpace'; 
import { useApp } from '../contexts/AppContext';

// --- CONSTANTS ---
const INVALID_KEYS = ["pk_62269365_IH2045K95689038590", "INSERT_YOUR_KEY_HERE"];

const DEV_DEFAULTS = {
  apiKey: "", 
  teamId: "9015049902", 
  viewId: "", 
  listIds: "",
  proxy: "https://corsproxy.io/?" 
};

// Dados limpos conforme solicitado
const INITIAL_MAPPINGS: { original: string; display: string; role: string }[] = [];

type AdminTab = 'api' | 'security' | 'team' | 'data' | 'diario'; 

export const AdminDashboard: React.FC = () => {
  const { isReadOnly, setReadOnly } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('api');
  
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('clickup_api_key') || DEV_DEFAULTS.apiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [listIds, setListIds] = useState(() => localStorage.getItem('clickup_list_ids') || DEV_DEFAULTS.listIds);
  const [teamId, setTeamId] = useState(() => localStorage.getItem('clickup_team_id') || DEV_DEFAULTS.teamId);
  const [viewId, setViewId] = useState(() => localStorage.getItem('clickup_view_id') || DEV_DEFAULTS.viewId);
  const [corsProxy, setCorsProxy] = useState(() => localStorage.getItem('clickup_cors_proxy') || DEV_DEFAULTS.proxy);
  
  const [mappings, setMappings] = useState(INITIAL_MAPPINGS);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    const currentKey = localStorage.getItem('clickup_api_key');
    if (currentKey && INVALID_KEYS.includes(currentKey)) {
      localStorage.removeItem('clickup_api_key');
      setApiKey("");
    }
    
    if (!localStorage.getItem('clickup_team_id')) {
       localStorage.setItem('clickup_team_id', DEV_DEFAULTS.teamId);
       setTeamId(DEV_DEFAULTS.teamId);
    }

    if (!localStorage.getItem('clickup_cors_proxy') && DEV_DEFAULTS.proxy) {
      localStorage.setItem('clickup_cors_proxy', DEV_DEFAULTS.proxy);
      setCorsProxy(DEV_DEFAULTS.proxy);
    }
  }, []);

  const handleSave = () => {
    if (isReadOnly) return;
    if (apiKey) localStorage.setItem('clickup_api_key', apiKey);
    if (teamId) localStorage.setItem('clickup_team_id', teamId);
    if (listIds) localStorage.setItem('clickup_list_ids', listIds);
    if (viewId) localStorage.setItem('clickup_view_id', viewId);
    if (corsProxy) localStorage.setItem('clickup_cors_proxy', corsProxy);

    setIsSaved(true);
    setTimeout(() => alert('Configurações salvas com sucesso!'), 100);
  };

  const markUnsaved = () => setIsSaved(false);

  const updateMapping = (index: number, field: string, value: string) => {
    if (isReadOnly) return;
    const newMappings = [...mappings];
    (newMappings[index] as any)[field] = value;
    setMappings(newMappings);
    markUnsaved();
  };

  const addMapping = () => {
    if (isReadOnly) return;
    setMappings([...mappings, { original: '', display: '', role: '' }]);
    markUnsaved();
  };

  const removeMapping = (index: number) => {
    if (isReadOnly) return;
    const newMappings = [...mappings];
    newMappings.splice(index, 1);
    setMappings(newMappings);
    markUnsaved();
  };

  const TabButton = ({ id, label, icon: Icon }: { id: AdminTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap
        w-auto md:w-full
        ${activeTab === id 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
          : 'text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm'
        }
      `}
    >
      <Icon size={18} className={activeTab === id ? 'text-indigo-600' : 'text-slate-400'} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-slate-50/50 overflow-hidden">
      
      <aside className="w-full md:w-64 flex-shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
        <div className="p-4 pb-2 md:pb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Shield size={20} className="text-indigo-600" />
            Administração
          </h2>
          <p className="text-xs text-slate-500 mt-1 hidden md:block">Configurações globais</p>
        </div>
        
        <div className="flex-1 overflow-x-auto md:overflow-y-auto px-4 pb-4 md:pb-0 custom-scrollbar">
          <div className="flex flex-row md:flex-col gap-1 md:space-y-1">
            <TabButton id="api" label="Conexão & API" icon={Key} />
            <TabButton id="security" label="Segurança" icon={Shield} />
            <TabButton id="team" label="Equipe & Mapeamento" icon={Users} />
            <TabButton id="data" label="Dados & Manutenção" icon={HardDrive} />
            
            <div className="hidden md:block pt-4 mt-4 border-t border-slate-200">
               <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Conteúdo</p>
            </div>
            <div className="w-px h-6 bg-slate-200 mx-2 md:hidden"></div>
            <TabButton id="diario" label="Meu Diário" icon={BookOpen} />
          </div>
        </div>

        <div className="hidden md:block mt-auto p-4 border-t border-slate-200 bg-white">
           {isReadOnly && (
             <div className="mb-3 flex items-center justify-center">
               <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full"><Lock size={12}/> Somente Leitura</span>
             </div>
           )}
           <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2 h-2 rounded-full ${isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
              <span className="text-xs font-bold text-slate-600">{isSaved ? 'Sincronizado' : 'Pendências'}</span>
           </div>
           <button 
             onClick={handleSave}
             disabled={isSaved || isReadOnly}
             className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 
               ${isSaved || isReadOnly
                 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                 : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/30 transform hover:-translate-y-0.5'
               }`}
           >
             <Save size={14} /> Salvar Tudo
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        
        {activeTab === 'diario' && <div className="h-full w-full animate-fadeIn"><DailySpace /></div>}

        {activeTab === 'security' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Segurança & Permissões</h3>
              <p className="text-sm text-slate-500">Controle de acesso e restrições globais.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-700 text-sm">
                 Privilégios do Sistema
              </div>
              
              <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                 <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${isReadOnly ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                       {isReadOnly ? <Lock size={24} /> : <Unlock size={24} />}
                    </div>
                    <div>
                       <p className="text-base font-bold text-slate-800">Modo Somente Leitura (Global)</p>
                       <p className="text-sm text-slate-500 max-w-md">Bloqueia edições, renomeações e configurações em todos os módulos para evitar alterações acidentais.</p>
                    </div>
                 </div>
                 <button onClick={() => setReadOnly(!isReadOnly)} className={isReadOnly ? 'text-amber-600' : 'text-slate-300'}>
                    {isReadOnly ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                 </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Conexão ClickUp API</h3>
                <p className="text-sm text-slate-500">Gerencie as chaves de acesso.</p>
              </div>
              <div className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1 ${apiKey && apiKey.length > 20 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                <Check size={12} /> {apiKey && apiKey.length > 20 ? 'Online' : 'Offline'}
              </div>
            </div>

            <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">API Token</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key size={16} className="text-slate-400" />
                  </div>
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); markUnsaved(); }}
                    placeholder="pk_..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 pointer-events-auto"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Team ID</label>
                  <input 
                    type="text" 
                    value={teamId}
                    onChange={(e) => { setTeamId(e.target.value); markUnsaved(); }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: 9015..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">View ID</label>
                  <input 
                    type="text" 
                    value={viewId}
                    onChange={(e) => { setViewId(e.target.value); markUnsaved(); }}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: 8c9k-..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                  CORS Proxy URL <Globe size={12} />
                </label>
                <input 
                  type="text" 
                  value={corsProxy}
                  onChange={(e) => { setCorsProxy(e.target.value); markUnsaved(); }}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://corsproxy.io/?"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Mapeamento de Equipe</h3>
              <p className="text-sm text-slate-500">Padronize nomes e funções.</p>
            </div>

            <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Original (ClickUp)</th>
                      <th className="px-6 py-3">Exibição</th>
                      <th className="px-6 py-3">Função</th>
                      <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mappings.length === 0 && (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Nenhum mapeamento.</td></tr>
                    )}
                    {mappings.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-mono text-slate-600">
                          <input type="text" value={item.original} onChange={(e) => updateMapping(idx, 'original', e.target.value)} className="w-full bg-transparent outline-none" />
                        </td>
                        <td className="px-6 py-3">
                          <input type="text" value={item.display} onChange={(e) => updateMapping(idx, 'display', e.target.value)} className="w-full bg-transparent outline-none font-bold" />
                        </td>
                        <td className="px-6 py-3">
                          <input type="text" value={item.role || ''} onChange={(e) => updateMapping(idx, 'role', e.target.value)} className="w-full bg-transparent outline-none" />
                        </td>
                        <td className="px-6 py-3 text-right">
                          <button onClick={() => removeMapping(idx)} className="text-slate-300 hover:text-rose-500 p-2"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <button onClick={addMapping} className="flex items-center gap-2 text-sm font-bold text-indigo-600"><Plus size={16} /> Adicionar</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
            <h3 className="text-xl font-bold text-slate-800">Manutenção de Dados</h3>
            <div className={`bg-white rounded-2xl border border-slate-200 p-8 text-center border-dashed ${isReadOnly ? 'opacity-70 pointer-events-none' : ''}`}>
               <Upload size={32} className="text-slate-300 mx-auto mb-4" />
               <h4 className="font-bold text-slate-700">Importar Snapshot CSV</h4>
               <p className="text-xs text-slate-400 mt-1 mb-6">Use para carga offline de indicadores</p>
               <button className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50">Selecionar</button>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xl font-bold text-rose-600 flex items-center gap-2"><AlertTriangle size={20} /> Perigo</h3>
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
                 <div>
                   <h4 className="font-bold text-rose-800 text-sm">Resetar Sistema</h4>
                   <p className="text-xs text-rose-600 mt-1">Limpa cache e chaves API locais.</p>
                 </div>
                 <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg text-sm hover:bg-rose-600 hover:text-white transition-colors">Resetar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
