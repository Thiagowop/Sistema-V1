/**
 * @id COMP-TIMESHEET-EXCEL-001
 * @name TimesheetExcelView
 * @description Visão analítica estilo Excel do Timesheet
 * @status active
 * @version 1.0.0
 *
 * BASEADO NA REFERÊNCIA DO GESTOR:
 * - Colunas por dia com Planej. | Gastas | Desvio
 * - Linhas: Subtotal diário + Projetos
 * - Cores indicando desvio (verde, amarelo, vermelho)
 * - Exportação para Excel
 */

import React, { useMemo, useState } from 'react';
import { Download, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus, FileSpreadsheet } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface DayColumn {
  date: Date;
  day: number;
  weekday: string;
  monthName: string;
  isWeekend: boolean;
  isToday: boolean;
}

interface ProjectRow {
  id: string;
  name: string;
  hoursPerDay: {
    planned: number;
    actual: number;
    deviation: number; // actual - planned
    deviationPercent: number;
  }[];
  totalPlanned: number;
  totalActual: number;
  totalDeviation: number;
}

interface TimesheetExcelViewProps {
  days: DayColumn[];
  projects: ProjectRow[];
  memberName: string;
  isDark?: boolean;
  onExport?: () => void;
}

// ============================================
// HELPERS
// ============================================

const formatTime = (hours: number): string => {
  if (!hours || hours === 0) return '';
  const h = Math.floor(Math.abs(hours));
  const m = Math.round((Math.abs(hours) - h) * 60);
  const sign = hours < 0 ? '-' : '';
  if (m === 0) return `${sign}${h}:00`;
  return `${sign}${h}:${m.toString().padStart(2, '0')}`;
};

const getDeviationColor = (deviation: number, planned: number): string => {
  if (!planned || planned === 0) return 'text-slate-400';
  const percent = Math.abs(deviation / planned) * 100;
  if (deviation === 0) return 'text-emerald-600';
  if (percent <= 10) return 'text-emerald-600';
  if (percent <= 20) return 'text-amber-600';
  return 'text-rose-600';
};

const getDeviationBg = (deviation: number, planned: number): string => {
  if (!planned || planned === 0) return '';
  const percent = Math.abs(deviation / planned) * 100;
  if (deviation === 0) return 'bg-emerald-50';
  if (percent <= 10) return 'bg-emerald-50';
  if (percent <= 20) return 'bg-amber-50';
  return 'bg-rose-50';
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const TimesheetExcelView: React.FC<TimesheetExcelViewProps> = ({
  days,
  projects,
  memberName,
  isDark = false,
  onExport
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Calcular subtotais por dia
  const dailySubtotals = useMemo(() => {
    return days.map((_, dayIdx) => {
      const planned = projects.reduce((sum, p) => sum + (p.hoursPerDay[dayIdx]?.planned || 0), 0);
      const actual = projects.reduce((sum, p) => sum + (p.hoursPerDay[dayIdx]?.actual || 0), 0);
      return {
        planned,
        actual,
        deviation: actual - planned,
        deviationPercent: planned > 0 ? ((actual - planned) / planned) * 100 : 0
      };
    });
  }, [days, projects]);

  // Calcular totais gerais
  const grandTotals = useMemo(() => {
    const planned = projects.reduce((sum, p) => sum + p.totalPlanned, 0);
    const actual = projects.reduce((sum, p) => sum + p.totalActual, 0);
    return {
      planned,
      actual,
      deviation: actual - planned
    };
  }, [projects]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Filtrar apenas dias úteis
  const workDays = days.filter(d => !d.isWeekend);

  return (
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDark ? 'border-gray-700' : 'border-slate-200'} overflow-hidden shadow-sm`}>
      {/* Header */}
      <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-100 bg-slate-50'} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
            <FileSpreadsheet className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Performance Analítica</h3>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Visão detalhada de desvio (Excel Mode)</p>
          </div>
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        )}
      </div>

      {/* Table - with both horizontal and vertical scroll */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-280px)]">
        <table className="w-full border-collapse min-w-max">
          {/* Header Row - Datas */}
          <thead>
            <tr className={isDark ? 'bg-slate-800' : 'bg-slate-700'}>
              <th className={`sticky left-0 z-10 px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider min-w-[200px] ${isDark ? 'bg-slate-800' : 'bg-slate-700'}`}>
                Datas
              </th>
              {workDays.map((day, idx) => (
                <th
                  key={idx}
                  colSpan={3}
                  className={`px-2 py-3 text-center text-xs font-bold text-white border-l ${isDark ? 'border-slate-600' : 'border-slate-600'} ${day.isToday ? 'bg-blue-600' : ''}`}
                >
                  <div>{day.day} de {day.monthName}</div>
                </th>
              ))}
              <th colSpan={3} className={`px-2 py-3 text-center text-xs font-bold text-white border-l ${isDark ? 'border-slate-600' : 'border-slate-600'}`}>
                TOTAL
              </th>
            </tr>

            {/* Sub-header Row - Planej/Gastas/Desvio */}
            <tr className={isDark ? 'bg-slate-700' : 'bg-slate-600'}>
              <th className={`sticky left-0 z-10 px-4 py-2 text-left text-[10px] font-bold text-slate-300 uppercase tracking-wider ${isDark ? 'bg-slate-700' : 'bg-slate-600'}`}>
                Job's / Projetos
              </th>
              {workDays.map((day, idx) => (
                <React.Fragment key={idx}>
                  <th className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-300 border-l ${isDark ? 'border-slate-600' : 'border-slate-500'} w-16 ${day.isToday ? 'bg-blue-700' : ''}`}>
                    Planej.
                  </th>
                  <th className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-300 w-16 ${day.isToday ? 'bg-blue-700' : ''}`}>
                    Gastas
                  </th>
                  <th className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-300 w-16 ${day.isToday ? 'bg-blue-700' : ''}`}>
                    Desvio
                  </th>
                </React.Fragment>
              ))}
              <th className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-300 border-l ${isDark ? 'border-slate-600' : 'border-slate-500'} w-16`}>
                Planej.
              </th>
              <th className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-300 w-16`}>
                Gastas
              </th>
              <th className={`px-2 py-2 text-center text-[10px] font-semibold text-slate-300 w-16`}>
                Desvio
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Subtotal Row */}
            <tr className={`${isDark ? 'bg-slate-900' : 'bg-slate-100'} font-bold`}>
              <td className={`sticky left-0 z-10 px-4 py-3 text-sm ${isDark ? 'text-white bg-slate-900' : 'text-slate-800 bg-slate-100'}`}>
                Subtotal de horas diárias
              </td>
              {workDays.map((day, idx) => {
                const subtotal = dailySubtotals[days.indexOf(day)];
                const deviationColor = getDeviationColor(subtotal?.deviation || 0, subtotal?.planned || 0);
                return (
                  <React.Fragment key={idx}>
                    <td className={`px-2 py-3 text-center text-sm border-l ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'} ${day.isToday ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}>
                      {formatTime(subtotal?.planned || 0)}
                    </td>
                    <td className={`px-2 py-3 text-center text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'} ${day.isToday ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}>
                      {formatTime(subtotal?.actual || 0)}
                    </td>
                    <td className={`px-2 py-3 text-center text-sm font-bold ${deviationColor} ${day.isToday ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}>
                      {subtotal?.deviation !== 0 ? formatTime(subtotal?.deviation || 0) : '0:00'}
                    </td>
                  </React.Fragment>
                );
              })}
              {/* Totais gerais */}
              <td className={`px-2 py-3 text-center text-sm font-bold border-l ${isDark ? 'border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`}>
                {formatTime(grandTotals.planned)}
              </td>
              <td className={`px-2 py-3 text-center text-sm font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {formatTime(grandTotals.actual)}
              </td>
              <td className={`px-2 py-3 text-center text-sm font-bold ${getDeviationColor(grandTotals.deviation, grandTotals.planned)}`}>
                {formatTime(grandTotals.deviation)}
              </td>
            </tr>

            {/* Project Rows */}
            {projects.map((project, pIdx) => {
              const isExpanded = expandedProjects.has(project.id);
              return (
                <React.Fragment key={project.id}>
                  <tr
                    className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} cursor-pointer transition-colors border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}`}
                    onClick={() => toggleProject(project.id)}
                  >
                    <td className={`sticky left-0 z-10 px-4 py-3 text-sm ${isDark ? 'text-slate-200 bg-gray-800 hover:bg-slate-800' : 'text-slate-700 bg-white hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-medium truncate max-w-[150px]" title={project.name}>
                          {project.name}
                        </span>
                      </div>
                    </td>
                    {workDays.map((day, dayIdx) => {
                      const dayData = project.hoursPerDay[days.indexOf(day)];
                      const deviationColor = getDeviationColor(dayData?.deviation || 0, dayData?.planned || 0);
                      const deviationBg = getDeviationBg(dayData?.deviation || 0, dayData?.planned || 0);
                      return (
                        <React.Fragment key={dayIdx}>
                          <td className={`px-2 py-3 text-center text-xs border-l ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-100 text-slate-500'} ${day.isToday ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50/50') : ''}`}>
                            {formatTime(dayData?.planned || 0)}
                          </td>
                          <td className={`px-2 py-3 text-center text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'} ${day.isToday ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50/50') : ''}`}>
                            {formatTime(dayData?.actual || 0)}
                          </td>
                          <td className={`px-2 py-3 text-center text-xs font-semibold ${deviationColor} ${day.isToday ? (isDark ? 'bg-blue-900/20' : 'bg-blue-50/50') : deviationBg}`}>
                            {dayData?.deviation ? formatTime(dayData.deviation) : ''}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {/* Project totals */}
                    <td className={`px-2 py-3 text-center text-xs font-medium border-l ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                      {formatTime(project.totalPlanned)}
                    </td>
                    <td className={`px-2 py-3 text-center text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {formatTime(project.totalActual)}
                    </td>
                    <td className={`px-2 py-3 text-center text-xs font-bold ${getDeviationColor(project.totalDeviation, project.totalPlanned)}`}>
                      {formatTime(project.totalDeviation)}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Legend */}
      <div className={`px-5 py-3 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-100 bg-slate-50'} flex items-center gap-6 text-xs`}>
        <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Legenda:</span>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Dentro da meta (±10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Atenção (±20%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span className={isDark ? 'text-gray-300' : 'text-slate-600'}>Crítico (&gt;20%)</span>
        </div>
      </div>
    </div>
  );
};

export default TimesheetExcelView;
