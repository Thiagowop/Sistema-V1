
import React from 'react';
import { ManagementDashboard } from './gestao/ManagementDashboard';

export const Management2Dashboard: React.FC = () => {
  return (
    <div className="h-full w-full bg-slate-50 animate-fadeIn">
      {/* 
        Renderiza o painel completo de gestão (Visão Geral, Saúde, Operacional, IA) 
        que estava localizado anteriormente apenas no protótipo.
      */}
      <ManagementDashboard />
    </div>
  );
};
