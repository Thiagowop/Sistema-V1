/**
 * @id COMP-TIMESHEET-EXCEL-001
 * @name TimesheetExcelView
 * @description Visão analítica estilo Excel do Timesheet
 * @status active
 * @version 2.0.0
 *
 * BASEADO NA REFERÊNCIA DO GESTOR:
 * - Colunas por dia com Planej. | Gastas | Desvio
 * - Linhas: Subtotal diário + Pessoas (expansíveis) + Projetos
 * - Cores indicando desvio (verde, amarelo, vermelho)
 * - Exportação para Excel
 */

import React, { useMemo, useState, useCallback } from 'react';
import { Download, ChevronDown, ChevronRight, FileSpreadsheet, User } from 'lucide-react';
import * as XLSX from 'xlsx';

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

interface HoursData {
  planned: number;
  actual: number;
  deviation: number;
  deviationPercent: number;
}

interface ProjectRow {
  id: string;
  name: string;
  hoursPerDay: HoursData[];
  totalPlanned: number;
  totalActual: number;
  totalDeviation: number;
}

// NEW: Person-level grouping
interface PersonRow {
  id: string;
  name: string;
  hoursPerDay: HoursData[];
  totalPlanned: number;
  totalActual: number;
  totalDeviation: number;
  projects: ProjectRow[];
}

interface TimesheetExcelViewProps {
  days: DayColumn[];
  projects: ProjectRow[];
  memberName: string;
  isDark?: boolean;
  onExport?: () => void;
  // NEW: Person-grouped data (when showing "all")
  persons?: PersonRow[];
  showAllMode?: boolean;
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
  onExport,
  persons,
  showAllMode = false
}) => {
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Filtrar apenas dias úteis
  const workDays = days.filter(d => !d.isWeekend);

  // Calcular subtotais por dia (baseado em persons ou projects)
  const dailySubtotals = useMemo(() => {
    if (showAllMode && persons) {
      return days.map((_, dayIdx) => {
        const planned = persons.reduce((sum, p) => sum + (p.hoursPerDay[dayIdx]?.planned || 0), 0);
        const actual = persons.reduce((sum, p) => sum + (p.hoursPerDay[dayIdx]?.actual || 0), 0);
        return {
          planned,
          actual,
          deviation: actual - planned,
          deviationPercent: planned > 0 ? ((actual - planned) / planned) * 100 : 0
        };
      });
    }
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
  }, [days, projects, persons, showAllMode]);

  // Calcular totais gerais
  const grandTotals = useMemo(() => {
    if (showAllMode && persons) {
      const planned = persons.reduce((sum, p) => sum + p.totalPlanned, 0);
      const actual = persons.reduce((sum, p) => sum + p.totalActual, 0);
      return { planned, actual, deviation: actual - planned };
    }
    const planned = projects.reduce((sum, p) => sum + p.totalPlanned, 0);
    const actual = projects.reduce((sum, p) => sum + p.totalActual, 0);
    return { planned, actual, deviation: actual - planned };
  }, [projects, persons, showAllMode]);

  const togglePerson = (personId: string) => {
    setExpandedPersons(prev => {
      const next = new Set(prev);
      if (next.has(personId)) {
        next.delete(personId);
      } else {
        next.add(personId);
      }
      return next;
    });
  };

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

  // Helper para formatar horas para Excel (número decimal)
  const formatTimeForExcel = (hours: number): number => {
    return Math.round(hours * 100) / 100;
  };

  // Função de exportação para Excel
  const handleExport = useCallback(() => {
    // Criar array de dados para a planilha
    const data: (string | number)[][] = [];

    // Linha 1: Cabeçalho com datas
    const headerRow1: (string | number)[] = [''];
    workDays.forEach(day => {
      headerRow1.push(`${day.day} de ${day.monthName}`, '', '');
    });
    headerRow1.push('TOTAL', '', '');
    data.push(headerRow1);

    // Linha 2: Sub-cabeçalho Planej./Gastas/Desvio
    const headerRow2: (string | number)[] = [showAllMode ? 'Equipe / Projetos' : "Job's / Projetos"];
    workDays.forEach(() => {
      headerRow2.push('Planej.', 'Gastas', 'Desvio');
    });
    headerRow2.push('Planej.', 'Gastas', 'Desvio');
    data.push(headerRow2);

    // Linha 3: Subtotal de horas diárias
    const subtotalRow: (string | number)[] = ['Subtotal de horas diárias'];
    workDays.forEach(day => {
      const subtotal = dailySubtotals[days.indexOf(day)];
      subtotalRow.push(
        formatTimeForExcel(subtotal?.planned || 0),
        formatTimeForExcel(subtotal?.actual || 0),
        formatTimeForExcel(subtotal?.deviation || 0)
      );
    });
    subtotalRow.push(
      formatTimeForExcel(grandTotals.planned),
      formatTimeForExcel(grandTotals.actual),
      formatTimeForExcel(grandTotals.deviation)
    );
    data.push(subtotalRow);

    // Linhas de dados: Persons com seus projetos OU apenas projetos
    if (showAllMode && persons) {
      persons.forEach(person => {
        // Linha da pessoa
        const personRow: (string | number)[] = [person.name];
        workDays.forEach(day => {
          const dayData = person.hoursPerDay[days.indexOf(day)];
          personRow.push(
            formatTimeForExcel(dayData?.planned || 0),
            formatTimeForExcel(dayData?.actual || 0),
            formatTimeForExcel(dayData?.deviation || 0)
          );
        });
        personRow.push(
          formatTimeForExcel(person.totalPlanned),
          formatTimeForExcel(person.totalActual),
          formatTimeForExcel(person.totalDeviation)
        );
        data.push(personRow);

        // Projetos da pessoa (indentados)
        person.projects.forEach(project => {
          const projectRow: (string | number)[] = [`  → ${project.name}`];
          workDays.forEach(day => {
            const dayData = project.hoursPerDay[days.indexOf(day)];
            projectRow.push(
              formatTimeForExcel(dayData?.planned || 0),
              formatTimeForExcel(dayData?.actual || 0),
              formatTimeForExcel(dayData?.deviation || 0)
            );
          });
          projectRow.push(
            formatTimeForExcel(project.totalPlanned),
            formatTimeForExcel(project.totalActual),
            formatTimeForExcel(project.totalDeviation)
          );
          data.push(projectRow);
        });
      });
    } else {
      // Modo de membro único - apenas projetos
      projects.forEach(project => {
        const projectRow: (string | number)[] = [project.name];
        workDays.forEach(day => {
          const dayData = project.hoursPerDay[days.indexOf(day)];
          projectRow.push(
            formatTimeForExcel(dayData?.planned || 0),
            formatTimeForExcel(dayData?.actual || 0),
            formatTimeForExcel(dayData?.deviation || 0)
          );
        });
        projectRow.push(
          formatTimeForExcel(project.totalPlanned),
          formatTimeForExcel(project.totalActual),
          formatTimeForExcel(project.totalDeviation)
        );
        data.push(projectRow);
      });
    }

    // Criar workbook e worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Ajustar largura das colunas
    const colWidths = [{ wch: 30 }]; // Primeira coluna mais larga
    for (let i = 0; i < workDays.length * 3 + 3; i++) {
      colWidths.push({ wch: 10 });
    }
    ws['!cols'] = colWidths;

    // Mesclar células do cabeçalho de datas
    const merges: XLSX.Range[] = [];
    for (let i = 0; i < workDays.length; i++) {
      merges.push({
        s: { r: 0, c: 1 + i * 3 },
        e: { r: 0, c: 3 + i * 3 }
      });
    }
    // Mesclar TOTAL
    merges.push({
      s: { r: 0, c: 1 + workDays.length * 3 },
      e: { r: 0, c: 3 + workDays.length * 3 }
    });
    ws['!merges'] = merges;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timesheet');

    // Gerar nome do arquivo com data
    const today = new Date();
    const fileName = `Timesheet_${memberName.replace(/\s+/g, '_')}_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.xlsx`;

    // Download do arquivo
    XLSX.writeFile(wb, fileName);
  }, [workDays, days, dailySubtotals, grandTotals, persons, projects, showAllMode, memberName]);

  // Render hours cells for a row
  const renderHoursCells = (hoursPerDay: HoursData[], totals: { planned: number; actual: number; deviation: number }, isHighlight = false) => (
    <>
      {workDays.map((day, dayIdx) => {
        const dayData = hoursPerDay[days.indexOf(day)];
        const deviationColor = getDeviationColor(dayData?.deviation || 0, dayData?.planned || 0);
        const deviationBg = isHighlight ? '' : getDeviationBg(dayData?.deviation || 0, dayData?.planned || 0);
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
      {/* Totals */}
      <td className={`px-2 py-3 text-center text-xs font-medium border-l ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
        {formatTime(totals.planned)}
      </td>
      <td className={`px-2 py-3 text-center text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        {formatTime(totals.actual)}
      </td>
      <td className={`px-2 py-3 text-center text-xs font-bold ${getDeviationColor(totals.deviation, totals.planned)}`}>
        {formatTime(totals.deviation)}
      </td>
    </>
  );

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
        <button
          onClick={handleExport}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
        >
          <Download className="w-4 h-4" />
          Exportar Excel
        </button>
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
                {showAllMode ? 'Equipe / Projetos' : "Job's / Projetos"}
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

            {/* Person Rows (when showing all) */}
            {showAllMode && persons ? (
              persons.map((person) => {
                const isExpanded = expandedPersons.has(person.id);
                return (
                  <React.Fragment key={person.id}>
                    {/* Person Row */}
                    <tr
                      className={`${isDark ? 'bg-slate-800/50 hover:bg-slate-700' : 'bg-indigo-50 hover:bg-indigo-100'} cursor-pointer transition-colors border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
                      onClick={() => togglePerson(person.id)}
                    >
                      <td className={`sticky left-0 z-10 px-4 py-3 text-sm font-semibold ${isDark ? 'text-white bg-slate-800/50' : 'text-slate-800 bg-indigo-50'}`}>
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-indigo-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-indigo-500" />
                          )}
                          <User className="w-4 h-4 text-indigo-500" />
                          <span>{person.name}</span>
                        </div>
                      </td>
                      {renderHoursCells(person.hoursPerDay, { planned: person.totalPlanned, actual: person.totalActual, deviation: person.totalDeviation }, true)}
                    </tr>

                    {/* Person's Projects (when expanded) */}
                    {isExpanded && person.projects.map((project) => (
                      <tr
                        key={`${person.id}-${project.id}`}
                        className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} transition-colors border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}
                      >
                        <td className={`sticky left-0 z-10 px-4 py-2 text-xs ${isDark ? 'text-slate-300 bg-gray-800' : 'text-slate-600 bg-white'}`}>
                          <div className="flex items-center gap-2 pl-8">
                            <span className="truncate max-w-[130px]" title={project.name}>
                              {project.name}
                            </span>
                          </div>
                        </td>
                        {renderHoursCells(project.hoursPerDay, { planned: project.totalPlanned, actual: project.totalActual, deviation: project.totalDeviation })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            ) : (
              /* Project Rows (single person mode) */
              projects.map((project) => {
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
                      {renderHoursCells(project.hoursPerDay, { planned: project.totalPlanned, actual: project.totalActual, deviation: project.totalDeviation })}
                    </tr>
                  </React.Fragment>
                );
              })
            )}
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
