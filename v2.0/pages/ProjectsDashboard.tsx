import React from 'react';
import { FolderOpen } from 'lucide-react';

export const ProjectsDashboard: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
                <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Projetos</h2>
                <p className="text-gray-500">Dashboard de projetos em desenvolvimento</p>
            </div>
        </div>
    );
};

export default ProjectsDashboard;
