import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<number | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  if (!content || content.trim() === '') {
    return null;
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Calcula posição do tooltip baseado no botão
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
      const padding = 12;

      // Posiciona à direita do ícone por padrão
      let left = rect.right + 8;
      let top = rect.top - 10;

      // Se não cabe à direita, posiciona à esquerda
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = rect.left - tooltipWidth - 8;
      }

      // Se ainda não cabe (muito à esquerda), posiciona abaixo centralizado
      if (left < padding) {
        left = Math.max(padding, rect.left + rect.width / 2 - tooltipWidth / 2);
        top = rect.bottom + 8;
      }

      // Garante que não ultrapasse a direita
      if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - tooltipWidth - padding;
      }

      setPosition({ top, left });
    }

    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };

  return (
    <span className="inline-flex items-center ml-1">
      <button
        ref={buttonRef}
        type="button"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isVisible && createPortal(
        <div
          className="fixed z-[99999] bg-slate-800 text-white rounded-lg shadow-2xl p-3 w-72 animate-fadeIn"
          style={{ top: position.top, left: position.left }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="text-[10px] font-semibold tracking-wider text-sky-300 uppercase mb-1.5">
            Descrição
          </div>
          <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
};

export default Tooltip;
