import React from 'react';

interface AppIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ size = 'md', className = '' }) => {
  const sizeConfig = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-12 h-12 text-2xl'
  };

  return (
    <div 
      className={`
        ${sizeConfig[size]} 
        bg-blue-600 rounded flex items-center justify-center 
        text-white font-black shrink-0 
        shadow-lg shadow-blue-900/20 
        ${className}
      `}
    >
      M
    </div>
  );
};