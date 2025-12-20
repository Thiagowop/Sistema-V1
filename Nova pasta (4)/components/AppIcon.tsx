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
        relative overflow-hidden
        ${className}
      `}
    >
      <span className="relative z-10">M</span>
      {/* Miniatura do risco centralizado para manter a consistência com a tela de login */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[15%] bg-blue-800/80 mix-blend-multiply" />
    </div>
  );
};