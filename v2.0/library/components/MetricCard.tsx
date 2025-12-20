
import React from 'react';
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorConfig: {
    bg: string;
    text: string;
    border: string;
    iconBg: string;
    iconText: string;
  };
  isActive?: boolean;
  onClick?: () => void;
  trend?: { value: number; positive: boolean };
  progress?: { value: number; total: number; label: string };
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  colorConfig,
  isActive = false, 
  onClick,
  trend,
  progress
}) => {
  const percentage = progress && progress.total > 0 ? Math.min((progress.value / progress.total) * 100, 100) : 0;
  const isOverBudget = progress && progress.value > progress.total && progress.total > 0;
  
  const barColorBase = isOverBudget ? 'bg-rose-600' : colorConfig.text.replace('text-', 'bg-');

  return (
    <button 
      onClick={onClick}
      className={`
        relative w-full text-left transition-all duration-200 group flex flex-col h-full
        bg-white rounded-2xl p-5 border shadow-sm
        ${isActive 
          ? `ring-2 ring-offset-2 ring-indigo-500 border-indigo-200 transform scale-[1.02]` 
          : `border-slate-100 hover:shadow-md hover:border-slate-200`
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl transition-colors ${isActive ? 'bg-indigo-100' : `${colorConfig.iconBg}`}`}>
          <Icon className={`w-6 h-6 ${isActive ? 'text-indigo-600' : `${colorConfig.iconText}`}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend.positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend.value}%
          </div>
        )}
      </div>
      
      <div className="flex-1">
        <p className={`text-2xl font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{value}</p>
        <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
        {subtitle && <p className={`text-xs mt-1 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>{subtitle}</p>}
      </div>
      
      {progress && (
        <div className="mt-4 pt-3 border-t border-slate-50">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
             <span>{progress.label}</span>
             <span className={isOverBudget ? 'text-rose-600' : ''}>
               {Math.round((progress.value / (progress.total || 1)) * 100)}%
             </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
             <div 
               className={`h-full rounded-full transition-all duration-1000 ease-out ${barColorBase}`} 
               style={{ width: `${percentage}%` }} 
             />
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="absolute bottom-0 left-6 right-6 h-1 bg-indigo-500 rounded-t-full" />
      )}
    </button>
  );
};
