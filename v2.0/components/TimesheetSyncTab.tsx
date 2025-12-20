import React from 'react';

const TimesheetSyncTab: React.FC = () => {
  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">Sincronização de Dados</h2>
      <p className="text-gray-600 mb-6 max-w-xl text-center">
        Esta aba permite sincronizar manualmente os dados do ClickUp para garantir que o timesheet esteja sempre atualizado com as informações mais recentes da equipe e dos projetos.
      </p>
      <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all">
        Sincronizar Agora
      </button>
      <div className="mt-8 w-full max-w-2xl">
        <div className="bg-slate-100 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 font-mono">
          {/* Aqui podem ser exibidos logs ou status da última sincronização */}
          Última sincronização: <span className="font-bold text-emerald-600">Nunca</span>
        </div>
      </div>
    </div>
  );
};

export default TimesheetSyncTab;
