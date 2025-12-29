/**
 * @id CONST-001
 * @name constants
 * @description Configuration constants for v2.0 (NO MOCK DATA!)
 */

import { PriorityType } from './types';
import { AlertTriangle, ArrowUpCircle, CheckCircle2, HelpCircle, AlertOctagon } from 'lucide-react';

// --- CONFIGURAÇÃO VISUAL DE PRIORIDADES ---
export const PRIORITY_CONFIG = {
    [PriorityType.URGENT]: {
        color: '#ef4444',
        label: '0 - Urgente',
        icon: AlertOctagon,
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        metricConfig: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', iconBg: 'bg-red-100', iconText: 'text-red-600' }
    },
    [PriorityType.HIGH]: {
        color: '#f97316',
        label: '1 - Alta',
        icon: AlertTriangle,
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        metricConfig: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', iconBg: 'bg-orange-100', iconText: 'text-orange-600' }
    },
    [PriorityType.NORMAL]: {
        color: '#3b82f6',
        label: '2 - Normal',
        icon: ArrowUpCircle,
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        metricConfig: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-600' }
    },
    [PriorityType.LOW]: {
        color: '#64748b',
        label: '3 - Baixa',
        icon: CheckCircle2,
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        metricConfig: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', iconBg: 'bg-slate-100', iconText: 'text-slate-500' }
    },
    [PriorityType.NONE]: {
        color: '#a1a1aa',
        label: '4 - S/ Prior.',
        icon: HelpCircle,
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        metricConfig: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', iconBg: 'bg-gray-100', iconText: 'text-gray-500' }
    },
};
