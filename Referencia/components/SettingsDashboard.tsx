
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Download, 
  Filter,
  Sliders,
  CalendarClock,
  Check,
  X,
  Mail,
  Sun,
  Moon,
  Monitor,
  ToggleRight,
  ToggleLeft
} from 'lucide-react';
import { FilterDashboard } from './FilterDashboard';
import { useApp } from '../contexts/AppContext';

type SettingsTab = 'general' | 'filters';
type ReportFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

interface WeeklyReportConfig {
  enabled: boolean;
  frequency: ReportFrequency;
  weekday?: string; 
  monthDay?: number;
  time: string;
  email: string;
}

const WeeklyReportModal = ({ 
  isOpen, 
  onClose, 
  config, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  config: WeeklyReportConfig; 
  onSave: (newConfig: WeeklyReportConfig) => void;
}) => {
  const [localConfig, setLocalConfig] = useState(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-indigo-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
               <CalendarClock size={18} />
             </div>
             <h3 className="font-bold text-slate-800">Configurar Relatório</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Frequência de Envio</label>
            <div className="grid grid-cols-2 gap-2">
               {(['daily', 'weekly', 'biweekly', 'monthly'] as ReportFrequency[]).map(freq => (
                 <button
                   key={freq}
                   onClick={() => setLocalConfig({...localConfig, frequency: freq})}
                   className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                     localConfig.frequency === freq
                       ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                       : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                   }`}
                 >
                   {freq === 'daily' && 'Diário'}
                   {freq === 'weekly' && 'Semanal'}
                   {freq === 'biweekly' && 'Quinzenal'}
                   {freq === 'monthly' && 'Mensal'}
                 </button>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Horário</label>
              <input 
                type="time" 
                value={localConfig.time}
                onChange={(e) => setLocalConfig({...localConfig, time: e.target.value})}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Próximo Envio</label>
              <div className="w-full p-2.5 bg-slate-100 border border-transparent rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2 cursor-not-allowed">
                 <CalendarClock size={14} />
                 <span>Automático</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">E-mail de Destino</label>
            <div className="relative">
               <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
               <input 
                type="email" 
                value={localConfig.email}
                onChange={(e) => setLocalConfig({...localConfig, email: e.target.value})}
                placeholder="seu@email.com"
                className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
           <button 
             onClick={() => onSave(localConfig)}
             className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
           >
             <Check size={16} /> Salvar Configuração
           </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isExporting, setIsExporting] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'auto'>('light');
  
  const [reportConfig, setReportConfig] = useState<WeeklyReportConfig>({
    enabled: false,
    frequency: 'weekly',
    weekday: 'Sexta-feira',
    monthDay: 1,
    time: '17:00',
    email: 'gestor@mcsa.com.br'
  });

  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const savedReport = localStorage.getItem('mcsa_weekly_report');
    if (savedReport) {
      try {
        setReportConfig(JSON.parse(savedReport));
      } catch (e) { console.error("Error loading report config", e); }
    }
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const element = document.createElement("a");
      const file = new Blob(["<html><body><h1>Relatório Exportado</h1></body></html>"], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      element.download = "relatorio_mcsa.html";
      document.body.appendChild(element);
      element.click();
      setIsExporting(false);
    }, 1500);
  };

  const handleSaveReport = (newConfig: WeeklyReportConfig) => {
    const updated = { ...newConfig, enabled: true };
    setReportConfig(updated);
    localStorage.setItem('mcsa_weekly_report', JSON.stringify(updated));
    setShowReportModal(false);
  };

  const toggleReport = () => {
    if (!reportConfig.enabled) {
      setShowReportModal(true);
    } else {
      const updated = { ...reportConfig, enabled: false };
      setReportConfig(updated);
      localStorage.setItem('mcsa_weekly_report', JSON.stringify(updated));
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: SettingsTab, label: string, icon: any }) => (
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
    <div className="flex flex-col md:flex-row h-full bg-slate-50/50 overflow-hidden font-sans">
      
      <WeeklyReportModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)}
        config={reportConfig}
        onSave={handleSaveReport}
      />

      <aside className="w-full md:w-64 flex-shrink-0 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 flex flex-col">
        <div className="p-4 pb-2 md:pb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Settings size={20} className="text-indigo-600" />
            Configurações
          </h2>
          <p className="text-xs text-slate-500 mt-1 hidden md:block">Preferências e parâmetros</p>
        </div>
        
        <div className="flex-1 overflow-x-auto md:overflow-y-auto px-4 pb-4 md:pb-0 custom-scrollbar">
          <div className="flex flex-row md:flex-col gap-1 md:space-y-1">
            <TabButton id="general" label="Geral" icon={Sliders} />
            <TabButton id="filters" label="Filtros Globais" icon={Filter} />
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
          
          {activeTab === 'filters' && <FilterDashboard />}

          {activeTab === 'general' && (
            <div className="space-y-8">
              <div className="mb-2">
                  <h3 className="text-xl font-bold text-slate-800">Configurações Gerais</h3>
                  <p className="text-sm text-slate-500">Personalize a aparência e comportamento do sistema.</p>
              </div>

              {/* 1. Aparência do Sistema */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-700 text-sm">
                   Aparência do Sistema
                </div>
                
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                   <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                         {activeTheme === 'light' ? <Sun size={24} /> : activeTheme === 'dark' ? <Moon size={24} /> : <Monitor size={24} />}
                      </div>
                      <div>
                         <p className="text-base font-bold text-slate-800">Tema</p>
                         <p className="text-sm text-slate-500">Alternar entre claro e escuro</p>
                      </div>
                   </div>
                   
                   <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200 shadow-inner">
                      <button 
                        onClick={() => setActiveTheme('light')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTheme === 'light' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                         <Sun size={16} /> Claro
                      </button>
                      <button 
                        onClick={() => setActiveTheme('dark')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTheme === 'dark' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                         <Moon size={16} /> Escuro
                      </button>
                      <button 
                        onClick={() => setActiveTheme('auto')}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTheme === 'auto' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                         <Monitor size={16} /> Auto
                      </button>
                   </div>
                </div>
              </div>

              {/* 2. Notificações */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 font-bold text-slate-700 text-sm">
                   Notificações & Relatórios
                </div>
                
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                  <div className="flex items-start gap-4">
                     <div className={`p-3 rounded-xl ${reportConfig.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <CalendarClock size={24} />
                     </div>
                     <div>
                        <p className="text-base font-bold text-slate-800">Relatório Automático</p>
                        <p className="text-sm text-slate-500">Receber resumo de performance por e-mail.</p>
                     </div>
                  </div>
                  <button onClick={toggleReport} className={reportConfig.enabled ? 'text-indigo-600' : 'text-slate-300'}>
                    {reportConfig.enabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                  </button>
                </div>
              </div>

              {/* 3. Exportação */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-6">
                 <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                    <Download size={24} />
                 </div>
                 <div className="flex-1 text-center md:text-left">
                    <h3 className="font-bold text-slate-800 text-lg">Exportar Visualização</h3>
                    <p className="text-sm text-slate-500">Gere um HTML interativo para compartilhar.</p>
                 </div>
                 <button 
                   onClick={handleExport}
                   disabled={isExporting}
                   className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                 >
                   {isExporting ? 'Processando...' : 'Exportar HTML'}
                 </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
