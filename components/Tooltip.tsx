import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  if (!content || content.trim() === '') {
    return null;
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const fallbackWidth = 320; // matches w-80 default width
      let left = rect.left + rect.width / 2 - fallbackWidth / 2;
      const viewportWidth = window.innerWidth;
      left = Math.min(Math.max(12, left), viewportWidth - fallbackWidth - 12);
      const top = rect.bottom + 8;
      setPosition({ top, left });
    }
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    // Small delay before hiding to allow mouse to move to tooltip
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const updatePosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    const tooltipEl = tooltipRef.current;
    if (!triggerEl || !tooltipEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const width = tooltipEl.offsetWidth;
    const height = tooltipEl.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.min(Math.max(12, left), viewportWidth - width - 12);

    let top = rect.bottom + 8;
    if (top + height + 12 > viewportHeight) {
      top = Math.max(12, rect.top - height - 8);
    }

    setPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    updatePosition();

    const handleScroll = () => updatePosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, updatePosition]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-colors"
        ref={triggerRef}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isVisible && position && (
        <div 
          className="fixed inset-0 z-[9999] pointer-events-none"
        >
          <div
            ref={tooltipRef}
            className="absolute bg-slate-800 text-white rounded-lg shadow-2xl p-4 pointer-events-auto max-w-md w-80"
            style={{ top: position.top, left: position.left }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="text-[10px] font-semibold tracking-wider text-sky-300 uppercase mb-2">
              Descrição
            </div>
            <div className="max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
