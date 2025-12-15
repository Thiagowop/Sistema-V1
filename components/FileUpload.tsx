import React from 'react';
import { Loader2 } from 'lucide-react';

interface FileUploadProps {
  onApiSync: () => void;
  loading: boolean;
  hasApiConfig: boolean;
  lastSyncTime?: Date | null;
  cachedTaskCount?: number;
  onClearCache?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onApiSync, loading, hasApiConfig, lastSyncTime, cachedTaskCount, onClearCache }) => {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center px-4">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center justify-center px-4 py-2 bg-sky-50 text-sky-700 rounded-full text-sm font-medium mb-6">
          Sincronização com ClickUp
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight">
          MCSA Tecnologia
        </h2>
        <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
          Transforme seus dados do ClickUp em um painel de Daily Stand-up profissional e interativo.
        </p>
      </div>

      {/* Single Centered API Sync Card */}
      <div className="w-full max-w-md">
        <div className={`
          relative rounded-3xl p-8 text-center transition-all duration-300 ease-in-out flex flex-col items-center justify-center min-h-[320px]
          ${loading 
            ? 'bg-slate-50 border-2 border-slate-200 opacity-50' 
            : 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-xl'
          }
        `}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-sky-500/25">
            {loading ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <span className="text-white text-lg font-semibold tracking-wide">API</span>}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">Sincronizar via API</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Busque tarefas diretamente das suas Listas do ClickUp usando seu Token de API.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={onApiSync}
              disabled={loading || !hasApiConfig}
              className={`
                relative z-20 px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${!hasApiConfig 
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-600 hover:to-blue-700 shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30'
                }
              `}
            >
              {loading ? 'Sincronizando...' : (lastSyncTime ? 'Atualizar Dados' : 'Sincronizar Agora')}
            </button>
            
            {lastSyncTime && (
              <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-3 text-center">
                <div className="text-xs text-slate-400 mb-1">Última sincronização</div>
                <div className="text-sm font-semibold text-slate-300">
                  {lastSyncTime.toLocaleDateString('pt-BR')} às {lastSyncTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {cachedTaskCount && cachedTaskCount > 0 && (
                  <div className="text-xs text-emerald-400 mt-1">
                    💾 {cachedTaskCount} tarefas em cache
                  </div>
                )}
                <div className="text-[10px] text-slate-500 mt-2">
                  🔄 Próxima sincronização será incremental (mais rápida)
                </div>
                {onClearCache && (
                  <button
                    onClick={onClearCache}
                    className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700/40 transition-colors"
                  >
                    Limpar cache
                  </button>
                )}
              </div>
            )}
          </div>
          
          {!hasApiConfig && (
            <p className="text-xs text-amber-400 mt-4 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Configure o Token e List IDs nas Configurações
            </p>
          )}
        </div>

        {/* Info box for CSV import */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <p className="text-sm text-slate-600">
            Precisa importar um arquivo CSV? 
            <br />
            <span className="font-semibold text-slate-800">Acesse a aba Admin</span> para fazer upload.
          </p>
        </div>
      </div>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-sky-500/25">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xl font-semibold text-slate-800">Processando dados...</p>
          <p className="text-sm text-slate-500 mt-2">Isso pode levar alguns segundos</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;