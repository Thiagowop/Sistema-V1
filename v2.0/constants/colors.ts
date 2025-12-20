/**
 * @id CONST-COLORS-001
 * @name StatusColors
 * @description Constantes de cores para status e prioridades
 * Migrado de Referencia/services/processor.ts
 */

// Status colors from ClickUp matching
export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    'EM ANDAMENTO': { bg: '#FFC23D', text: '#000000' },
    'EM PROGRESSO': { bg: '#FFC23D', text: '#000000' },
    'CONCLUÍDO': { bg: '#2DA56A', text: '#FFFFFF' },
    'CONCLUIDO': { bg: '#2DA56A', text: '#FFFFFF' },
    'COMPLETE': { bg: '#2DA56A', text: '#FFFFFF' },
    'COMPLETED': { bg: '#2DA56A', text: '#FFFFFF' },
    'FINALIZADO': { bg: '#2DA56A', text: '#FFFFFF' },
    'DONE': { bg: '#2DA56A', text: '#FFFFFF' },
    'PENDENTE': { bg: '#C93A34', text: '#FFFFFF' },
    'BLOQUEADO': { bg: '#C93A34', text: '#FFFFFF' },
    'REVISÃO': { bg: '#D9D9D9', text: '#000000' },
    'REVISAO': { bg: '#D9D9D9', text: '#000000' },
    'EM PAUSA': { bg: '#7030A0', text: '#FFFFFF' },
    'PAUSA': { bg: '#7030A0', text: '#FFFFFF' },
    'NOVO': { bg: '#F8F8F8', text: '#000000' },
    'A FAZER': { bg: '#F8F8F8', text: '#000000' },
    'TO DO': { bg: '#F8F8F8', text: '#000000' },
    'BACKLOG': { bg: '#333333', text: '#FFFFFF' },
    'VALIDAÇÃO': { bg: '#4A9EFF', text: '#FFFFFF' },
    'VALIDACAO': { bg: '#4A9EFF', text: '#FFFFFF' },
};

// Helper to get status color with inline styles
export const getStatusStyle = (status: string): React.CSSProperties => {
    const upperStatus = status?.toUpperCase().trim() || 'NOVO';
    const colors = STATUS_COLORS[upperStatus] || { bg: '#F8F8F8', text: '#000000' };
    return {
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.text === '#FFFFFF' ? colors.bg : '#E2E8F0'}`
    };
};

// Helper for Tailwind classes (for use when known status)
export const getStatusColorClass = (status: string): string => {
    const s = status?.toLowerCase() || '';

    if (s.includes('conclu') || s.includes('done') || s.includes('complete') || s.includes('finaliz')) {
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
    if (s.includes('andamento') || s.includes('progress') || s.includes('doing')) {
        return 'bg-amber-100 text-amber-700 border-amber-300';
    }
    if (s.includes('bloqueado') || s.includes('blocked') || s.includes('impedido')) {
        return 'bg-rose-100 text-rose-700 border-rose-200';
    }
    if (s.includes('valid') || s.includes('homolog') || s.includes('review') || s.includes('revis')) {
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    if (s.includes('pausa') || s.includes('hold')) {
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
    if (s.includes('backlog')) {
        return 'bg-slate-600 text-white border-slate-700';
    }
    // Default: NOVO, A FAZER, TO DO
    return 'bg-slate-100 text-slate-600 border-slate-200';
};

// Priority colors using Tailwind classes
export const getPriorityColorClass = (priority: string | null | undefined): string => {
    const p = priority?.toLowerCase() || '';

    if (p.includes('urgent') || p.includes('0') || p.includes('crítico') || p.includes('critico')) {
        return 'text-rose-600';
    }
    if (p.includes('alta') || p.includes('high') || p.includes('1')) {
        return 'text-orange-500';
    }
    if (p.includes('normal') || p.includes('2') || p.includes('média') || p.includes('media')) {
        return 'text-amber-500';
    }
    if (p.includes('baixa') || p.includes('low') || p.includes('3')) {
        return 'text-blue-400';
    }
    return 'text-slate-300';
};

// Priority badge with background
export const getPriorityBadgeClass = (priority: string | null | undefined): string => {
    const p = priority?.toLowerCase() || '';

    if (p.includes('urgent') || p.includes('0') || p.includes('crítico')) {
        return 'bg-rose-100 text-rose-700 border-rose-200';
    }
    if (p.includes('alta') || p.includes('high') || p.includes('1')) {
        return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (p.includes('normal') || p.includes('2') || p.includes('média')) {
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    if (p.includes('baixa') || p.includes('low') || p.includes('3')) {
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-500 border-slate-200';
};

// Helper to check if status is completed
export const isCompleted = (status: string): boolean => {
    const s = status?.toUpperCase().trim() || '';
    return ['COMPLETE', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(s);
};
