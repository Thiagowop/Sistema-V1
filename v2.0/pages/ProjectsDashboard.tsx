/**
 * @id PAGE-PROJ-001
 * @name ProjectsDashboard
 * @description Dashboard de projetos por membro (Em desenvolvimento)
 * @status placeholder
 * @version 2.0.0
 */

import React from 'react';
import { Construction, FolderKanban } from 'lucide-react';

export const ProjectsDashboard: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 to-slate-100 p-8">
            <div className="max-w-md text-center">
                <div className="p-6 bg-white rounded-3xl shadow-lg border border-slate-200 mb-6">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <div className="p-3 bg-indigo-50 rounded-xl">
                            <FolderKanban size={32} className="text-indigo-600" />
                        </div>
                        <div className="p-3 bg-amber-50 rounded-xl">
                            <Construction size={32} className="text-amber-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Projects Dashboard
                    </h2>
                    <p className="text-slate-500 text-sm leading-relaxed">
                        Esta funcionalidade está em desenvolvimento.
                        Em breve você poderá visualizar e gerenciar projetos
                        organizados por membro da equipe.
                    </p>
                </div>
                <span className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
                    <Construction size={14} />
                    Em Construção - v2.1
                </span>
            </div>
        </div>
    );
};

export default ProjectsDashboard;
