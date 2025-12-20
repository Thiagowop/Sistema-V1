import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  count: number;
  hours: number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  textColor: string;
  isActive: boolean;
  onClick: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  count,
  hours,
  icon: Icon,
  color,
  bgColor,
  textColor,
  isActive,
  onClick
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200
        hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1
        ${isActive ? `ring-2 ring-offset-1 border-transparent shadow-md` : 'border-slate-200 bg-white hover:border-slate-300'}
      `}
      style={{
        boxShadow: isActive ? `0 0 0 2px ${color}` : undefined
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{count}</span>
            <span className="text-xs text-slate-400">tarefas</span>
          </div>
          <div className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${bgColor} ${textColor}`}>
            {hours.toFixed(1)}h estimadas
          </div>
        </div>
        <div className={`rounded-lg p-2 ${bgColor}`}>
          <Icon className={`h-5 w-5 ${textColor}`} />
        </div>
      </div>
      
      {/* Decorative bar at bottom */}
      <div 
        className="absolute bottom-0 left-0 h-1 w-full opacity-50" 
        style={{ backgroundColor: color }}
      />
    </button>
  );
};
