import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  colorClass?: string;
  bgClass?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  colorClass = 'bg-indigo-500', 
  bgClass = 'bg-slate-100',
  showLabel = false, 
  size = 'md' 
}) => {
  const percentage = Math.min(Math.round((value / max) * 100), 100);
  const sizeClasses = { sm: 'h-1.5', md: 'h-2', lg: 'h-3' };

  return (
    <div className="flex items-center gap-2 w-full">
      <div className={`flex-1 ${bgClass} rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-semibold text-slate-600 min-w-[3rem] text-right">{percentage}%</span>}
    </div>
  );
};
