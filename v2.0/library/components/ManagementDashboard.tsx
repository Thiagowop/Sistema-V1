import React from 'react';
import { BarChart3, Construction } from 'lucide-react';

export const ManagementDashboard: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fadeIn font-sans">
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <BarChart3 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Gestão</h1>
            <p className="text-xs text-slate-500 font-medium">Painel Central de Controle</p>
          </div>
        </div>
      </div>

      {/* Content Area - Placeholder */}
      <div className="flex-1 p-8">
        <div className="h-full w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 gap-4">
           <div className="p-4 bg-white rounded-full shadow-sm">
             <Construction size={32} className="text-indigo-400" />
           </div>
           <div className="text-center">
             <h3 className="font-bold text-slate-600 mb-1">Área em Desenvolvimento</h3>
             <p className="text-sm">As funcionalidades serão migradas para cá gradualmente.</p>
           </div>
        </div>
      </div>

    </div>
  );
};
