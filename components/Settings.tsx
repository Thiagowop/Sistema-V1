import React, { useState } from 'react';
import { AppConfig } from '../types';
import {
  Save,
  Download,
  FileText,
  Globe,
  RotateCcw,
  Key,
  Check,
  Loader2,
  Bug,
  Copy,
  Settings as SettingsIcon,
  Shield,
  ChevronDown,
  Upload,
  Layers,
  X,
  Database,
  Filter,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { DEFAULT_CONFIG, formatHours } from '../constants';
import { fetchRawClickUpData } from '../services/clickup';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
  data?: any[] | null;
  variant?: 'user' | 'admin';
  onFileUpload?: (file: File) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, onSave, data, variant = 'user', onFileUpload }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugData, setDebugData] = useState('');
  const [csvUploading, setCsvUploading] = useState(false);
  const [openTagSelector, setOpenTagSelector] = useState<number | null>(null);

  const isAdminView = variant === 'admin';

  // Get all available tags from config
  const availableTags = React.useMemo(() => {
    return localConfig.availableTags?.sort((a, b) => a.localeCompare(b)) || [];
  }, [localConfig.availableTags]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onFileUpload) return;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setCsvUploading(true);
        try {
          await onFileUpload(file);
          alert('✅ CSV importado com sucesso!');
        } catch (err) {
          alert('❌ Erro ao processar CSV: ' + (err as Error).message);
        } finally {
          setCsvUploading(false);
        }
      } else {
        alert('Por favor, envie um arquivo CSV válido.');
      }
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      onSave(localConfig);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Resetar para configuração padrão?')) {
      setLocalConfig(DEFAULT_CONFIG);
      setSaveStatus('idle');
    }
  };

  const handleMappingChange = (original: string, short: string) => {
    setLocalConfig(prev => ({
      ...prev,
      nameMappings: { ...prev.nameMappings, [original]: short }
    }));
  };

  const handleFetchDebugData = async () => {
    setDebugLoading(true);
    try {
      const raw = await fetchRawClickUpData(localConfig);
      setDebugData(JSON.stringify(raw, null, 2));
    } catch (e: any) {
      setDebugData(`Error: ${e.message}`);
    } finally {
      setDebugLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!debugData) return;
    navigator.clipboard.writeText(debugData);
    alert('JSON copiado!');
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 pb-12 ${isAdminView ? '' : 'lg:max-w-3xl'}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl text-white shadow-lg ${isAdminView ? 'bg-gradient-to-br from-emerald-500 to-sky-600' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
            {isAdminView ? <Shield className="w-5 h-5" /> : <SettingsIcon className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{isAdminView ? 'Administração' : 'Configurações'}</h2>
            <p className="text-sm text-slate-500">
              {isAdminView
                ? 'Gerencie integrações, mapeamentos e ferramentas avançadas'
                : 'Preferências e ferramentas para uso diário'}
            </p>
          </div>
        </div>
        {isAdminView && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Resetar
            </button>
            <button
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              className={`
                px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all duration-300 min-w-[140px] justify-center text-sm font-medium
                ${saveStatus === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25'}
              `}
            >
              {saveStatus === 'idle' && (<><Save size={16} />Salvar</>)}
              {saveStatus === 'saving' && (<><Loader2 size={16} className="animate-spin" />Salvando...</>)}
              {saveStatus === 'success' && (<><Check size={16} />Salvo!</>)}
            </button>
          </div>
        )}
      </div>

      {isAdminView && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white">
              <Key size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Integração ClickUp API</h3>
              <p className="text-xs text-slate-500">Configure suas credenciais de acesso</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Token de Acesso</label>
              <input
                type="password"
                placeholder="pk_12345_..."
                value={localConfig.clickupApiToken || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, clickupApiToken: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Encontrado em ClickUp Settings &gt; Apps</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">List IDs</label>
              <input
                type="text"
                placeholder="123456, 789012"
                value={localConfig.clickupListIds || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, clickupListIds: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Separe múltiplos IDs com vírgulas</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                Team/Space ID <span className="text-emerald-500">(Recomendado)</span>
              </label>
              <input
                type="text"
                placeholder="9013032717"
                value={localConfig.clickupTeamId || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, clickupTeamId: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Busca todas as tarefas do Space</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Standup View ID</label>
              <input
                type="text"
                placeholder="301234567890"
                value={localConfig.clickupStandupViewId || ''}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, clickupStandupViewId: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Utilize o ID da view de comentários diários no ClickUp</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                Filtro de Tags (API) <span className="text-amber-500">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Deixe vazio para buscar todas as tags"
                value={(localConfig.apiTagFilters || []).join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  setLocalConfig(prev => ({ ...prev, apiTagFilters: tags }));
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">
                ⚠️ Deixe vazio para baixar TODAS as tags. Use apenas se precisar restringir na API.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-2">
              <Globe size={14} className="text-slate-400" />
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">CORS Proxy</label>
            </div>
            <input
              type="text"
              placeholder="https://corsproxy.io/?"
              value={localConfig.corsProxy || ''}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, corsProxy: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none font-mono text-sm"
            />
            <p className="text-xs text-amber-500 mt-1">Fallback automático se o proxy principal falhar</p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-amber-400" />
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Grupos de Tarefas</label>
              </div>
              <button
                onClick={() => {
                  const newGroup = { name: 'Novo Grupo', tags: [], color: 'amber' };
                  setLocalConfig(prev => ({
                    ...prev,
                    taskGroups: [...(prev.taskGroups || []), newGroup]
                  }));
                }}
                className="px-2 py-1 text-xs font-medium bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
              >
                + Adicionar Grupo
              </button>
            </div>
            
            {(!localConfig.taskGroups || localConfig.taskGroups.length === 0) ? (
              <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Nenhum grupo configurado</p>
                <p className="text-xs mt-1">Tarefas aparecem apenas nos projetos (padrão)</p>
              </div>
            ) : (
              <div className="space-y-2">
                {localConfig.taskGroups.map((group, idx) => {
                  const colorOptions = [
                    { value: 'amber', label: 'Âmbar', class: 'bg-amber-500' },
                    { value: 'emerald', label: 'Esmeralda', class: 'bg-emerald-500' },
                    { value: 'violet', label: 'Violeta', class: 'bg-violet-500' },
                    { value: 'blue', label: 'Azul', class: 'bg-blue-500' },
                    { value: 'rose', label: 'Rosa', class: 'bg-rose-500' },
                    { value: 'slate', label: 'Cinza', class: 'bg-slate-500' },
                    { value: 'sky', label: 'Céu', class: 'bg-sky-500' },
                    { value: 'pink', label: 'Pink', class: 'bg-pink-500' },
                    { value: 'indigo', label: 'Índigo', class: 'bg-indigo-500' },
                    { value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
                  ];
                  const selectedColor = colorOptions.find(c => c.value === (group.color || 'amber'));
                  
                  return (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={group.name}
                        onChange={(e) => {
                          const updated = [...(localConfig.taskGroups || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setLocalConfig(prev => ({ ...prev, taskGroups: updated }));
                        }}
                        placeholder="Nome do grupo"
                        className="flex-1 px-3 py-1.5 text-sm font-medium bg-white border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                      />
                      
                      {/* Color picker */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenTagSelector(openTagSelector === -idx - 1 ? null : -idx - 1)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                          title="Escolher cor"
                        >
                          <div className={`w-4 h-4 rounded-full ${selectedColor?.class}`}></div>
                        </button>
                        
                        {openTagSelector === -idx - 1 && (
                          <div className="absolute right-0 z-50 mt-1 bg-white border border-slate-300 rounded-lg shadow-lg p-2 w-48">
                            <div className="grid grid-cols-5 gap-1">
                              {colorOptions.map(color => (
                                <button
                                  key={color.value}
                                  onClick={() => {
                                    const updated = [...(localConfig.taskGroups || [])];
                                    updated[idx] = { ...updated[idx], color: color.value };
                                    setLocalConfig(prev => ({ ...prev, taskGroups: updated }));
                                    setOpenTagSelector(null);
                                  }}
                                  className={`w-8 h-8 rounded-full ${color.class} hover:ring-2 ring-slate-400 transition-all ${group.color === color.value ? 'ring-2 ring-slate-600' : ''}`}
                                  title={color.label}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => {
                          const updated = (localConfig.taskGroups || []).filter((_, i) => i !== idx);
                          setLocalConfig(prev => ({ ...prev, taskGroups: updated }));
                        }}
                        className="px-2 py-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={() => setOpenTagSelector(openTagSelector === idx ? null : idx)}
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none text-left flex items-center justify-between"
                      >
                        <span className="flex-1 font-mono text-xs">
                          {group.tags.length === 0 
                            ? <span className="text-slate-400">Selecione as tags...</span>
                            : group.tags.join(', ')
                          }
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openTagSelector === idx ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {openTagSelector === idx && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {availableTags.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center">
                              Nenhuma tag disponível. Sincronize com ClickUp primeiro.
                            </div>
                          ) : (
                            <div className="p-2">
                              {availableTags.map(tag => {
                                const isSelected = group.tags.includes(tag);
                                return (
                                  <label
                                    key={tag}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        const updated = [...(localConfig.taskGroups || [])];
                                        if (e.target.checked) {
                                          updated[idx] = { ...updated[idx], tags: [...group.tags, tag] };
                                        } else {
                                          updated[idx] = { ...updated[idx], tags: group.tags.filter(t => t !== tag) };
                                        }
                                        setLocalConfig(prev => ({ ...prev, taskGroups: updated }));
                                      }}
                                      className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-2 focus:ring-amber-500"
                                    />
                                    <span className="text-xs font-mono flex-1">{tag}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {group.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {group.tags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-mono"
                          >
                            {tag}
                            <button
                              onClick={() => {
                                const updated = [...(localConfig.taskGroups || [])];
                                updated[idx] = { ...updated[idx], tags: group.tags.filter(t => t !== tag) };
                                setLocalConfig(prev => ({ ...prev, taskGroups: updated }));
                              }}
                              className="hover:text-amber-900"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
            
            <p className="text-xs text-slate-400 mt-2">
              💡 Grupos aparecem <strong>embaixo dos projetos</strong> e começam colapsados. Clique para expandir. Tarefas com múltiplas tags aparecem no grupo se tiver <strong>pelo menos uma</strong> tag correspondente.
            </p>
          </div>
        </div>
      )}

      {isAdminView && onFileUpload && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Importar CSV do ClickUp</h3>
              <p className="text-xs text-slate-500">Faça upload de um arquivo de exportação CSV</p>
            </div>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={csvUploading}
              className="hidden"
              id="csv-upload-admin"
            />
            <label
              htmlFor="csv-upload-admin"
              className={`
                flex items-center justify-center gap-3 w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${csvUploading 
                  ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' 
                  : 'bg-emerald-50 border-emerald-300 hover:border-emerald-400 hover:bg-emerald-100'
                }
              `}
            >
              {csvUploading ? (
                <>
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  <span className="font-medium text-emerald-700">Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <span className="font-medium text-emerald-700">Clique para selecionar arquivo CSV</span>
                </>
              )}
            </label>
          </div>
          <p className="text-xs text-slate-400 mt-3">💡 Os dados importados substituirão a visualização atual</p>
        </div>
      )}

      {isAdminView && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
              <SettingsIcon size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Manutenção Rápida</h3>
              <p className="text-xs text-slate-500">Ferramentas de solução de problemas</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Database className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 text-sm mb-1">Limpar Cache</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Se os dados não estiverem atualizando ou houver comportamento estranho, limpe o cache e faça um novo sync.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('⚠️ Isso irá limpar todo o cache. Deseja continuar?')) {
                        localStorage.removeItem('dailyflow_advanced_cache_metadata');
                        localStorage.removeItem('dailyflow_advanced_cache_processed');
                        // Clear IndexedDB
                        if (window.indexedDB) {
                          const request = window.indexedDB.deleteDatabase('dailyflow-cache');
                          request.onsuccess = () => console.log('Cache limpo com sucesso');
                        }
                        alert('✅ Cache limpo! Faça um novo sync na aba "Importar / Sync".');
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Limpar Cache
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <Filter className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 text-sm mb-1">Resetar Filtros</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Se os filtros estiverem com configurações antigas ou causando problemas, resete para o padrão.
                  </p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('dailyflow_filters');
                      alert('✅ Filtros resetados! Recarregue a página.');
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Resetar Filtros
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 text-sm mb-1">Reset Completo</h4>
                  <p className="text-xs text-slate-500 mb-2">
                    Em caso de problemas graves, limpe TODAS as configurações e dados. Isso requer reconfiguração completa.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('⚠️⚠️⚠️ ATENÇÃO! Isso vai apagar TODAS as configurações, cache e dados. Você precisará reconfigurar tudo. Continuar?')) {
                        // Clear all localStorage keys related to the app
                        const keysToRemove = [];
                        for (let i = 0; i < localStorage.length; i++) {
                          const key = localStorage.key(i);
                          if (key && (key.includes('dailyflow') || key.includes('dailyPresenter'))) {
                            keysToRemove.push(key);
                          }
                        }
                        keysToRemove.forEach(key => localStorage.removeItem(key));
                        
                        // Clear IndexedDB
                        if (window.indexedDB) {
                          window.indexedDB.deleteDatabase('dailyflow-cache');
                        }
                        
                        alert('🔄 Reset completo realizado! A página será recarregada.');
                        window.location.reload();
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    ⚠️ Reset Completo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white">
            <Download size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Exportar Visualização</h3>
            <p className="text-xs text-slate-500">Gere um HTML interativo para compartilhar</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (!data || data.length === 0) {
              alert('Nenhum dado encontrado. Faça um Sync primeiro!');
              return;
            }

            try {
              const html = generateExportHTML(data);
              const blob = new Blob([html], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `dashboard-${new Date().toISOString().split('T')[0]}.html`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              alert('✅ Arquivo HTML gerado com sucesso!');
            } catch (e: any) {
              alert('❌ Erro ao gerar HTML: ' + e.message);
            }
          }}
          className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-medium transition-all shadow-lg shadow-emerald-500/25"
        >
          <FileText size={18} />
          Exportar HTML
        </button>
        <p className="text-xs text-slate-400 mt-3">Arquivo 100% offline para compartilhar</p>
      </div>

      {isAdminView && (
        <>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <button
              onClick={() => {
                const section = document.getElementById('team-order-content');
                const icon = document.getElementById('team-order-icon');
                if (section && icon) {
                  section.classList.toggle('hidden');
                  icon.classList.toggle('rotate-180');
                }
              }}
              className="w-full flex items-center justify-between hover:bg-slate-50 rounded-lg p-2 -m-2 transition-colors"
            >
              <div>
                <h3 className="font-semibold text-slate-800 text-left">Ordem da Equipe</h3>
                <p className="text-xs text-slate-500 text-left">Arraste os cards para reorganizar a ordem de exibição</p>
              </div>
              <ChevronDown id="team-order-icon" className="w-5 h-5 text-slate-400 transition-transform" />
            </button>

            <div id="team-order-content" className="hidden mt-4 space-y-2">
              {(localConfig.teamMemberOrder || localConfig.teamMembers).map((member, index) => (
                <div
                  key={member}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', index.toString());
                    e.currentTarget.classList.add('opacity-50');
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove('opacity-50');
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                    const toIndex = index;
                    
                    if (fromIndex === toIndex) return;
                    
                    const currentOrder = localConfig.teamMemberOrder || localConfig.teamMembers;
                    const newOrder = [...currentOrder];
                    const [movedItem] = newOrder.splice(fromIndex, 1);
                    newOrder.splice(toIndex, 0, movedItem);
                    
                    setLocalConfig(prev => ({ ...prev, teamMemberOrder: newOrder }));
                  }}
                  className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-50 to-white border-2 border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all cursor-move group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white font-bold text-sm shadow-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-slate-800">{member}</span>
                  </div>
                  <div className="text-slate-400 group-hover:text-sky-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-3">💡 Esta ordem será usada no Dashboard e no Standup Summary</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-2">Mapeamento de Nomes</h3>
            <p className="text-xs text-slate-500 mb-4">Abrevie nomes longos do ClickUp para exibição</p>

            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {Object.keys(localConfig.nameMappings).map(original => (
                <div key={original} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl">
                  <span className="flex-1 text-sm text-slate-600 truncate" title={original}>{original}</span>
                  <input
                    type="text"
                    value={localConfig.nameMappings[original]}
                    onChange={(e) => handleMappingChange(original, e.target.value)}
                    className="w-32 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-slate-300 p-6 rounded-2xl border border-slate-700 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Bug size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Ferramentas de Debug</h3>
                <p className="text-xs text-slate-400">Visualize os dados brutos do ClickUp</p>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleFetchDebugData}
                disabled={debugLoading}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {debugLoading ? <Loader2 className="animate-spin" size={16} /> : <Globe size={16} />}
                Gerar JSON
              </button>

              <button
                onClick={() => {
                  // Use loadMockData from the parent component
                  if (window.confirm('Carregar dados de teste? Isso substituirá os dados atuais.')) {
                    window.location.href = '/';
                    setTimeout(() => {
                      const mockButton = document.querySelector('[data-mock-load]') as HTMLButtonElement;
                      mockButton?.click();
                    }, 100);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <FileText size={16} />
                Dados de Teste
              </button>

              {debugData && (
                <button
                  onClick={copyToClipboard}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors"
                >
                  <Copy size={16} />
                  Copiar
                </button>
              )}
            </div>

            {debugData && (
              <textarea
                readOnly
                value={debugData}
                className="w-full h-48 bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-slate-700 outline-none resize-none"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Function to generate standalone HTML export
function generateExportHTML(groupedData: any[]): string {
  const timestamp = new Date().toLocaleString('pt-BR');

  const statusStyles: Record<string, { bg: string; text: string }> = {
    'EM ANDAMENTO': { bg: '#fef3c7', text: '#92400e' },
    'EM PROGRESSO': { bg: '#fef3c7', text: '#92400e' },
    'CONCLUÍDO': { bg: '#dcfce7', text: '#166534' },
    'CONCLUIDO': { bg: '#dcfce7', text: '#166534' },
    'COMPLETE': { bg: '#dcfce7', text: '#166534' },
    'COMPLETED': { bg: '#dcfce7', text: '#166534' },
    'FINALIZADO': { bg: '#dcfce7', text: '#166534' },
    'DONE': { bg: '#dcfce7', text: '#166534' },
    'PENDENTE': { bg: '#fee2e2', text: '#b91c1c' },
    'BLOQUEADO': { bg: '#fee2e2', text: '#b91c1c' },
    'REVISÃO': { bg: '#e2e8f0', text: '#1f2937' },
    'REVISAO': { bg: '#e2e8f0', text: '#1f2937' },
    'EM PAUSA': { bg: '#ede9fe', text: '#5b21b6' },
    'PAUSA': { bg: '#ede9fe', text: '#5b21b6' },
    'NOVO': { bg: '#f8fafc', text: '#0f172a' },
    'A FAZER': { bg: '#f8fafc', text: '#0f172a' },
    'TO DO': { bg: '#f8fafc', text: '#0f172a' },
    'BACKLOG': { bg: '#e2e8f0', text: '#1f2937' }
  };

  const escapeHtml = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const sanitizeId = (value: string): string => {
    const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, '');
    return sanitized || 'row-' + Math.random().toString(36).slice(2, 8);
  };

  const parseNumeric = (value: any): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number.parseFloat(trimmed);
      if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
  };

  const compareTasks = (a: any, b: any): number => {
    const orderA = parseNumeric(a?.orderIndex ?? a?.orderindex ?? a?.order_index ?? a?.position) ?? Number.MAX_SAFE_INTEGER;
    const orderB = parseNumeric(b?.orderIndex ?? b?.orderindex ?? b?.order_index ?? b?.position) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;

    const dueA = a?.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const dueB = b?.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (dueA !== dueB) return dueA - dueB;

    return String(a?.name || '').localeCompare(String(b?.name || ''));
  };

  const formatDateValue = (value: any): string => {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const createHoursMetric = (value: number | null | undefined, variant: 'default' | 'negative' | 'warning' | 'positive' = 'default'): string => {
    if (value === null || value === undefined) return '<span class="metric metric-muted">-</span>';
    if (Math.abs(value) < 1e-6) return '<span class="metric metric-muted">-</span>';

    let cls = 'metric';
    if (variant === 'negative' || value < 0) cls += ' metric-negative';
    else if (variant === 'warning') cls += ' metric-warning';
    else if (variant === 'positive') cls += ' metric-positive';

    const absText = escapeHtml(formatHours(Math.abs(value)));
    const display = value < 0 ? '-' + absText : absText;
    return `<span class="${cls}">${display}</span>`;
  };

  const getStatusBadge = (status: string | undefined): string => {
    const key = status ? status.toUpperCase().trim() : 'BACKLOG';
    const style = statusStyles[key] || statusStyles['BACKLOG'];
    return `<span class="status-badge" style="background:${style.bg};color:${style.text}">${escapeHtml(status || 'Sem status')}</span>`;
  };

  const getPriorityVariant = (priority: string | undefined): string => {
    if (!priority) return 'neutral';
    const val = priority.toLowerCase();
    if (val.includes('urgent') || val.includes('urgente')) return 'urgent';
    if (val.includes('high') || val.includes('alta')) return 'high';
    if (val.includes('normal')) return 'normal';
    if (val.includes('low') || val.includes('baixa')) return 'low';
    return 'neutral';
  };

  const getPriorityBadge = (priority?: string, level?: number): string => {
    if (!priority && (level === undefined || level === -1)) {
      return '<span class="priority-chip priority-neutral">-</span>';
    }
    const variant = getPriorityVariant(priority);
    const levelText = level !== undefined && level !== null && !Number.isNaN(level) && level !== -1
      ? `<span class="priority-level">${escapeHtml(String(level))}</span>`
      : '';
    return `<span class="priority-chip priority-${variant}">${levelText}<span class="priority-label">${escapeHtml(priority || 'Normal')}</span></span>`;
  };

  const renderTaskRow = (task: any, taskIndex: number, projectKey: string, isSubtask = false): string => {
    const rowId = sanitizeId(`${projectKey}-task-${taskIndex}`);
    const hasSubtasks = !isSubtask && Array.isArray(task?.subtasks) && task.subtasks.length > 0;
    const estimate = typeof task?.timeEstimate === 'number' ? task.timeEstimate : Number(task?.timeEstimate) || 0;
    const logged = typeof task?.timeLogged === 'number' ? task.timeLogged : Number(task?.timeLogged) || 0;
    const remaining = typeof task?.remaining === 'number' ? task.remaining : estimate - logged;
    const additional = typeof task?.additionalTime === 'number' ? task.additionalTime : 0;
    const trackedExtra = Math.max(0, logged - estimate);
    const remainingFormula = typeof task?.remainingFormula === 'number' ? task.remainingFormula : remaining;
    const priorityLevel = parseNumeric(task?.priorityLevel);
    const assigneeDisplay = isSubtask ? task?.assignee || task?.rawAssignee || '-' : task?.assignee || '-';

    const subtasksHtml = hasSubtasks
      ? [...task.subtasks].sort(compareTasks).map((sub: any, subIdx: number) => renderTaskRow(sub, subIdx, rowId, true)).join('')
      : '';

    const startDate = formatDateValue(task?.startDate);
    const dueDate = formatDateValue(task?.dueDate);
    const additionalRestShouldShow = (additional > 0) || (logged > estimate);

    return `
      <tr class="${isSubtask ? 'subtask-row is-hidden' : 'task-row'}" ${isSubtask ? `data-parent="${projectKey}"` : `data-row-id="${rowId}"`}>
        <td>
          <div class="task-cell ${isSubtask ? 'task-cell-sub' : ''}">
            ${hasSubtasks ? `<button class="expand-btn" type="button" data-target="${rowId}" aria-expanded="false"><span>+</span></button>` : '<span class="expand-placeholder"></span>'}
            ${isSubtask ? '<span class="subtask-bullet"></span>' : ''}
            <div class="task-info">
              <span class="task-title">${escapeHtml(task?.name || 'Sem título')}</span>
              ${task?.isOverdue ? `<span class="task-pill pill-overdue">Atrasada</span>` : ''}
              ${task?.hasNegativeBudget ? `<span class="task-pill pill-budget">Orçamento estourado</span>` : ''}
            </div>
          </div>
        </td>
        <td><span class="assignee-chip">${escapeHtml(assigneeDisplay)}</span></td>
        <td>${escapeHtml(startDate)}</td>
        <td>${escapeHtml(dueDate)}</td>
        <td>${createHoursMetric(estimate, 'positive')}</td>
        <td>${createHoursMetric(logged, 'positive')}</td>
        <td>${createHoursMetric(remaining, remaining < 0 ? 'negative' : 'default')}</td>
        <td>${createHoursMetric(additional, additional > 0 ? 'warning' : 'default')}</td>
        <td>${createHoursMetric(trackedExtra, trackedExtra > 0 ? 'negative' : 'default')}</td>
        <td>${additionalRestShouldShow ? createHoursMetric(remainingFormula, remainingFormula < 0 ? 'negative' : 'warning') : '<span class="metric metric-muted">-</span>'}</td>
        <td>${getStatusBadge(task?.status)}</td>
        <td>${getPriorityBadge(task?.priority, priorityLevel)}</td>
      </tr>
      ${subtasksHtml}
    `;
  };

  const projectNames = new Set<string>();
  let totalTasks = 0;
  let overdueTasks = 0;

  groupedData.forEach(group => {
    (group?.projects || []).forEach((project: any) => {
      if (project?.name) projectNames.add(project.name);
      (project?.tasks || []).forEach((task: any) => {
        totalTasks += 1;
        if (task?.isOverdue) overdueTasks += 1;
        (task?.subtasks || []).forEach((sub: any) => {
          totalTasks += 1;
          if (sub?.isOverdue) overdueTasks += 1;
        });
      });
    });
  });

  const metricsHtml = `
    <section class="metrics-grid">
      <div class="metric-card">
        <span class="metric-card-label">Profissionais</span>
        <span class="metric-card-value">${groupedData.length}</span>
        <span class="metric-card-sub">Com tarefas distribuídas</span>
      </div>
      <div class="metric-card">
        <span class="metric-card-label">Projetos</span>
        <span class="metric-card-value">${projectNames.size}</span>
        <span class="metric-card-sub">Com atividades em curso</span>
      </div>
      <div class="metric-card">
        <span class="metric-card-label">Tarefas</span>
        <span class="metric-card-value">${totalTasks}</span>
        <span class="metric-card-sub">Incluindo subtarefas visíveis</span>
      </div>
      <div class="metric-card">
        <span class="metric-card-label">Atrasos</span>
        <span class="metric-card-value ${overdueTasks > 0 ? 'text-alert' : ''}">${overdueTasks}</span>
        <span class="metric-card-sub">Itens com prazo vencido</span>
      </div>
    </section>
  `;

  const membersHtml = groupedData.map((group: any, groupIndex: number) => {
    const projects = (group?.projects || [])
      .filter((project: any) => Array.isArray(project?.tasks) && project.tasks.length > 0)
      .map((project: any, projectIndex: number) => {
        const projectKey = `${groupIndex}-${projectIndex}`;
        const tasksHtml = [...project.tasks]
          .sort(compareTasks)
          .map((task: any, taskIndex: number) => renderTaskRow(task, taskIndex, sanitizeId(projectKey)))
          .join('');

        if (!tasksHtml) return '';

        return `
          <article class="project-card">
            <header class="project-header">
              <div class="project-title">
                <span>${escapeHtml(project?.name || 'Projeto sem nome')}</span>
                <span class="project-pill">${project?.tasks?.length || 0} tarefas</span>
              </div>
            </header>
            <div class="table-wrapper">
              <table class="task-table">
                <thead>
                  <tr>
                    <th>Tarefa</th>
                    <th>Responsável</th>
                    <th>Início</th>
                    <th>Prazo</th>
                    <th>Planejado</th>
                    <th>Registrado</th>
                    <th>Restante</th>
                    <th>Adic. Est.</th>
                    <th>Adic. Rast.</th>
                    <th>Adic. Rest.</th>
                    <th>Status</th>
                    <th>Prioridade</th>
                  </tr>
                </thead>
                <tbody>
                  ${tasksHtml}
                </tbody>
              </table>
            </div>
          </article>
        `;
      })
      .filter(Boolean)
      .join('');

    return `
      <section class="member-section">
        <div class="member-header">
          <div class="member-avatar">${escapeHtml((group?.assignee || '?').charAt(0).toUpperCase())}</div>
          <div>
            <h2>${escapeHtml(group?.assignee || 'Sem responsável')}</h2>
            <p>${escapeHtml((group?.projects || []).length.toString())} projetos vinculados</p>
          </div>
        </div>
        ${projects || '<div class="empty-projects">Nenhuma tarefa ativa para este responsável.</div>'}
      </section>
    `;
  }).join('');

  const emptyState = groupedData.length === 0 ? '<div class="empty-global">Nenhum dado disponível. Gere um novo snapshot a partir do app DailyFlow.</div>' : '';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DailyFlow Snapshot - ${timestamp}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #f1f5f9; font-family: 'Inter', 'Segoe UI', Roboto, sans-serif; color: #0f172a; line-height: 1.6; padding: 32px; }
    .container { max-width: 1400px; margin: 0 auto; }
    .export-header { background: linear-gradient(135deg, #0f172a, #1e3a8a); border-radius: 24px; padding: 32px; color: #ffffff; box-shadow: 0 20px 40px rgba(15, 23, 42, 0.45); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
    .export-header h1 { font-size: 28px; margin: 0; letter-spacing: -0.02em; }
    .export-header p { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
    .header-meta { display: flex; gap: 12px; align-items: center; }
    .header-meta span { background: rgba(255, 255, 255, 0.12); padding: 10px 18px; border-radius: 999px; font-size: 13px; font-weight: 600; }
    .metrics-grid { margin-top: 32px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
    .metric-card { background: #ffffff; border-radius: 20px; padding: 20px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1); border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 4px; }
    .metric-card-label { font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.08em; }
    .metric-card-value { font-size: 28px; font-weight: 700; color: #0f172a; }
    .metric-card-sub { font-size: 12px; color: #94a3b8; }
    .metric-card-value.text-alert { color: #b91c1c; }
    .member-section { margin-top: 48px; }
    .member-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .member-avatar { width: 60px; height: 60px; border-radius: 18px; background: linear-gradient(135deg, #38bdf8, #2563eb); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 700; box-shadow: 0 15px 30px rgba(37, 99, 235, 0.25); }
    .member-header h2 { margin: 0; font-size: 22px; color: #0f172a; }
    .member-header p { margin: 2px 0 0; font-size: 13px; color: #64748b; }
    .project-card { margin-top: 18px; background: #ffffff; border-radius: 22px; border: 1px solid #e2e8f0; box-shadow: 0 18px 35px rgba(15, 23, 42, 0.08); overflow: hidden; }
    .project-header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 20px 24px; color: #ffffff; }
    .project-title { display: flex; justify-content: space-between; align-items: center; gap: 12px; font-weight: 600; letter-spacing: 0.01em; }
    .project-pill { background: rgba(255, 255, 255, 0.18); padding: 6px 14px; border-radius: 999px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
    .table-wrapper { overflow-x: auto; }
    .task-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 900px; }
    thead th { background: #0f172a; color: #ffffff; padding: 14px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; text-align: center; border-bottom: 1px solid rgba(148, 163, 184, 0.35); }
    thead th:first-child { text-align: left; padding-left: 18px; border-top-left-radius: 18px; }
    thead th:last-child { border-top-right-radius: 18px; }
    tbody tr td { background: #ffffff; padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; text-align: center; }
    tbody tr:last-child td:first-child { border-bottom-left-radius: 18px; }
    tbody tr:last-child td:last-child { border-bottom-right-radius: 18px; }
    tr.task-row:hover td { background: #f8fafc; }
    tr.subtask-row td { background: #f1f5f9; }
    tr.subtask-row.is-hidden { display: none; }
    td:first-child { text-align: left; }
    .task-cell { display: flex; align-items: center; gap: 12px; }
    .task-cell-sub { padding-left: 12px; }
    .task-info { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .task-title { font-weight: 600; color: #1f2937; }
    .task-pill { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; border-radius: 999px; padding: 4px 8px; }
    .pill-overdue { background: rgba(248, 113, 113, 0.16); color: #b91c1c; }
    .pill-budget { background: rgba(251, 191, 36, 0.18); color: #b45309; }
    .expand-btn { width: 28px; height: 28px; border-radius: 10px; border: 1px solid #cbd5f5; background: #ffffff; color: #1d4ed8; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s ease; }
    .expand-btn:hover { background: #eff6ff; }
    .expand-placeholder { width: 28px; height: 28px; display: inline-block; }
    .subtask-bullet { width: 10px; height: 10px; border-radius: 999px; background: #cbd5f5; }
    .assignee-chip { display: inline-flex; alignments: center; justify-content: center; padding: 6px 10px; border-radius: 999px; background: #e2e8f0; color: #1f2937; font-size: 12px; font-weight: 600; min-width: 60px; }
    .metric { display: inline-flex; align-items: center; justify-content: center; min-width: 72px; padding: 6px 12px; border-radius: 999px; background: #eff3f8; font-weight: 600; color: #1f2937; font-size: 12px; }
    .metric-positive { background: rgba(34, 197, 94, 0.14); color: #166534; }
    .metric-warning { background: rgba(251, 191, 36, 0.18); color: #b45309; }
    .metric-negative { background: rgba(248, 113, 113, 0.2); color: #b91c1c; }
    .metric-muted { background: transparent; color: #94a3b8; font-weight: 500; }
    .status-badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .priority-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; background: #e2e8f0; color: #1f2937; }
    .priority-chip .priority-level { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 999px; background: rgba(15, 23, 42, 0.12); color: inherit; font-size: 11px; font-weight: 700; }
    .priority-chip.priority-urgent { background: rgba(248, 113, 113, 0.2); color: #b91c1c; }
    .priority-chip.priority-high { background: rgba(251, 191, 36, 0.2); color: #b45309; }
    .priority-chip.priority-normal { background: rgba(59, 130, 246, 0.16); color: #1d4ed8; }
    .priority-chip.priority-low { background: rgba(148, 163, 184, 0.25); color: #475569; }
    .priority-chip.priority-neutral { background: rgba(226, 232, 240, 0.7); color: #475569; }
    .priority-label { font-size: 11px; }
    .empty-projects, .empty-global { margin-top: 16px; padding: 24px; border-radius: 16px; background: #f8fafc; border: 1px dashed #cbd5e1; color: #475569; text-align: center; font-size: 14px; }
    .empty-global { margin-top: 40px; font-size: 15px; }
    .export-footer { margin-top: 64px; text-align: center; color: #94a3b8; font-size: 13px; letter-spacing: 0.06em; text-transform: uppercase; }
    @media (max-width: 768px) {
      body { padding: 20px; }
      .export-header { padding: 24px; }
      .task-table { min-width: 760px; }
      .member-header { flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="export-header">
      <div>
        <h1>DailyFlow Snapshot</h1>
        <p>Gerado em ${escapeHtml(timestamp)}</p>
      </div>
      <div class="header-meta">
        <span>${escapeHtml(groupedData.length.toString())} profissionais</span>
        <span>${escapeHtml(projectNames.size.toString())} projetos</span>
      </div>
    </header>
    ${groupedData.length > 0 ? metricsHtml : ''}
    ${membersHtml}
    ${emptyState}
    <footer class="export-footer">Exportado automaticamente pelo DailyFlow • Abrir offline em qualquer navegador</footer>
  </div>

  <script>
    document.addEventListener('click', function(event) {
      var target = event.target;
      while (target && (!target.classList || !target.classList.contains('expand-btn'))) {
        target = target.parentElement;
      }
      if (!target || !target.classList) return;
      var taskId = target.getAttribute('data-target');
      if (!taskId) return;
      var currentlyExpanded = target.getAttribute('aria-expanded') === 'true';
      var newState = currentlyExpanded ? 'false' : 'true';
      target.setAttribute('aria-expanded', newState);
      var icon = target.querySelector('span');
      if (icon) icon.textContent = newState === 'true' ? '−' : '+';
      var rows = document.querySelectorAll('[data-parent="' + taskId + '"]');
      var toggleRow = function(row) {
        if (!row.classList) return;
        if (newState === 'true') row.classList.remove('is-hidden');
        else row.classList.add('is-hidden');
      };
      if (typeof rows.forEach === 'function') {
        rows.forEach(toggleRow);
      } else {
        Array.prototype.forEach.call(rows, toggleRow);
      }
    });
  </script>
</body>
</html>`;
}

export default Settings;
