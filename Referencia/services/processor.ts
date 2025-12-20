/**
 * @id SERV-PROC-001
 * @name ProcessorService
 * @description Processamento de tarefas, distribuição semanal e agrupamento
 * @dependencies types, papaparse
 * @status active
 * @version 2.0.0
 */

import Papa from 'papaparse';
import { ClickUpRow, Task, GroupedData, AppConfig } from '../types';

// Utility function for formatting hours
export const formatHours = (h: number): string => {
  if (h <= 0) return '';
  if (h < 1) {
    const mins = Math.round(h * 60);
    return `${mins}m`;
  }
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

// Constants for Status Colors
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

// --- Helper Functions ---

const parseHours = (text: string | undefined): number => {
  if (!text || text === '0') return 0;
  const s = text.trim().toLowerCase();

  // Regex for "1h 30m"
  const m1 = s.match(/(\d+)h\s*(\d*)m?/);
  if (m1) {
    const h = parseInt(m1[1], 10);
    const mm = m1[2] ? parseInt(m1[2], 10) : 0;
    return h + (mm / 60);
  }

  // Regex for "90m"
  const m2 = s.match(/(\d+)m/);
  if (m2) return parseInt(m2[1], 10) / 60;

  // Regex for "2h"
  const m3 = s.match(/(\d+)h/);
  if (m3) return parseInt(m3[1], 10);

  return 0;
};

const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const s = dateStr.trim();

  // Handle timestamp (milliseconds)
  if (/^\d+$/.test(s)) {
    return new Date(parseInt(s, 10));
  }

  // Handle DD/MM or DD/MM/YYYY
  const parts = s.split('/');
  if (parts.length >= 2) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    let y = new Date().getFullYear();

    if (parts.length === 3) {
      const yearPart = parts[2];
      y = parseInt(yearPart, 10);
      if (yearPart.length === 2) y += 2000;
    }

    return new Date(y, m, d);
  }

  return null;
};

const normalizeName = (name: string, mappings: Record<string, string>): string => {
  if (!name) return "Não atribuído";
  let s = name.replace(/['"\[\]]/g, '').trim();
  if (!s) return "Não atribuído";

  // Apply mappings exact match
  if (mappings[s]) return mappings[s];

  // Map parts
  const parts = s.split(/,|;|\||\//).map(p => p.trim()).filter(Boolean);
  const mappedParts = parts.map(p => {
    for (const [full, short] of Object.entries(mappings)) {
      if (p.toLowerCase().includes(full.toLowerCase())) return short;
    }
    return p;
  });

  return Array.from(new Set(mappedParts)).join(' / ');
};

export const isCompleted = (status: string): boolean => {
  const s = status.toUpperCase().trim();
  return ['COMPLETE', 'COMPLETED', 'CONCLUÍDO', 'CONCLUIDO', 'FINALIZADO', 'DONE'].includes(s);
};

// --- Distribution Logic ---
export const calculateWeeklyDistribution = (
  task: Task,
  weekDates: Date[],
  holidays: string[] = []
): Record<string, string> => {
  const distribution: Record<string, string> = {};

  const hoursTotal = task.timeEstimate > 0 ? task.timeEstimate : task.timeLogged;
  if (hoursTotal <= 0) return distribution;

  if (!task.startDate && !task.dueDate) return distribution;

  const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
  const end = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate!);

  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  let workingDays = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    const dateStr = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const isHoliday = holidays.includes(dateStr);

    if (day !== 0 && day !== 6 && !isHoliday) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  if (workingDays === 0) workingDays = 1;

  const hoursPerDay = hoursTotal / workingDays;
  const hoursStr = formatHours(hoursPerDay);

  weekDates.forEach(date => {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);

    if (d >= start && d <= end) {
      const day = d.getDay();
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const isHoliday = holidays.includes(key);

      if (day !== 0 && day !== 6 && !isHoliday) {
        distribution[key] = hoursStr;
      }
    }
  });

  return distribution;
};

// --- Smart Week Detection ---
export const getDynamicWeekRange = (tasks: Task[]): Date[] => {
  // ALWAYS use current week (today) as the anchor
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 10 working days from today
  return getWeekFromDate(today);
};

const getWeekFromDate = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  let cursorDate = new Date(startDate);
  cursorDate.setHours(12, 0, 0, 0);

  let safetyLoop = 0;
  while (dates.length < 10 && safetyLoop < 30) {
    const day = cursorDate.getDay();

    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursorDate));
    }

    cursorDate.setDate(cursorDate.getDate() + 1);
    safetyLoop++;
  }

  return dates;
};

// --- Calculate Working Days Between Dates ---
export const calculateWorkingDays = (startDate: Date, endDate: Date, holidays: string[] = []): number => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(12, 0, 0, 0);
  
  const end = new Date(endDate);
  end.setHours(12, 0, 0, 0);

  while (current <= end) {
    const day = current.getDay();
    const dateStr = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const isHoliday = holidays.includes(dateStr);

    if (day !== 0 && day !== 6 && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

// --- CSV Processor ---
export const processCSV = async (file: File, config: AppConfig): Promise<GroupedData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as ClickUpRow[];
          const tasks: Task[] = [];
          const taskMap = new Map<string, Task>();
          const parentMap = new Map<string, Task[]>();

          rows.forEach((row, index) => {
            const taskName = row['Task Name']?.trim();
            if (!taskName) return;

            const timeEst = parseHours(row['Time Estimate']);
            const timeLog = parseHours(row['Time Logged']);
            const dueDate = parseDate(row['Due Date']);
            const startDate = parseDate(row['Start Date']);
            const dateClosed = parseDate(row['Date Closed'] || row['Closed Date']);

            const status = row['Status']?.trim() || 'NOVO';

            const remaining = timeEst - timeLog;
            const additionalTime = timeLog > timeEst ? timeLog - timeEst : 0;
            const remainingFormula = remaining;

            const hasNegativeBudget = remaining < 0 && !isCompleted(status);
            const isOverdue = dueDate ? (dueDate < new Date() && !isCompleted(status)) : false;

            const rawAssignee = row['Assignee'] || '';
            const normalizedAssignee = normalizeName(rawAssignee, config.nameMappings);

            const task: Task = {
              id: `${index}-${taskName}`,
              name: taskName,
              status: status,
              assignee: normalizedAssignee,
              rawAssignee: rawAssignee,
              startDate: startDate,
              dueDate: dueDate,
              dateClosed: dateClosed,
              description: (row as any)['Description'] || (row as any)['Descrição'] || undefined,
              timeEstimate: timeEst,
              timeLogged: timeLog,
              remaining: remaining,
              additionalTime: additionalTime,
              remainingFormula: remainingFormula,
              projectName: row['List'] || 'Unknown Project',
              isSubtask: false,
              subtasks: [],
              isOverdue,
              hasNegativeBudget,
              weeklyDistribution: {}
            };

            const parentName = row['Parent Name']?.trim();
            if (parentName && parentName !== 'nan') {
              task.isSubtask = true;
              if (!parentMap.has(parentName)) parentMap.set(parentName, []);
              parentMap.get(parentName)?.push(task);
            } else {
              taskMap.set(taskName, task);
              tasks.push(task);
            }
          });

          // Link Subtasks
          parentMap.forEach((subtasks, parentName) => {
            const parent = taskMap.get(parentName);
            if (parent) {
              parent.subtasks = subtasks;
              if (parent.subtasks.length > 0) {
                const subTotalEst = subtasks.reduce((acc, t) => acc + t.timeEstimate, 0);
                const subTotalLog = subtasks.reduce((acc, t) => acc + t.timeLogged, 0);

                if (parent.timeEstimate === 0) parent.timeEstimate = subTotalEst;
                parent.timeLogged = Math.max(parent.timeLogged, subTotalLog);

                parent.remaining = parent.timeEstimate - parent.timeLogged;
                parent.additionalTime = parent.timeLogged > parent.timeEstimate ? parent.timeLogged - parent.timeEstimate : 0;
                parent.remainingFormula = parent.remaining;

                parent.hasNegativeBudget = parent.remaining < 0 && !isCompleted(parent.status);
              }
            } else {
              subtasks.forEach(t => { t.isSubtask = false; tasks.push(t); });
            }
          });

          // Determine Week Range
          const weekRangeDates = getDynamicWeekRange(tasks);
          const weekStart = weekRangeDates[0];
          const weekEnd = weekRangeDates[weekRangeDates.length - 1];

          // Filter Active Tasks
          const activeTasks = tasks.filter(t => {
            const isActive = !isCompleted(t.status);
            const isRecentlyCompleted = t.dateClosed && t.dateClosed >= weekStart && t.dateClosed <= weekEnd;

            const hasRelevantSubtasks = t.subtasks.some(s => {
              const subActive = !isCompleted(s.status);
              const subRecent = s.dateClosed && s.dateClosed >= weekStart && s.dateClosed <= weekEnd;
              return subActive || subRecent;
            });

            return isActive || isRecentlyCompleted || hasRelevantSubtasks;
          });

          const weekDatesStr = weekRangeDates.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));

          // Apply Distribution
          activeTasks.forEach(t => {
            t.weeklyDistribution = calculateWeeklyDistribution(t, weekRangeDates, config.holidays);
            t.subtasks.forEach(s => {
              s.weeklyDistribution = calculateWeeklyDistribution(s, weekRangeDates, config.holidays);
            });
          });

          // Dynamic Grouping
          const groupedTasksMap = new Map<string, Task[]>();

          activeTasks.forEach(t => {
            const assignees = t.assignee.split(' / ');

            assignees.forEach(assigneeName => {
              if (!assigneeName) assigneeName = 'Não atribuído';
              if (!groupedTasksMap.has(assigneeName)) {
                groupedTasksMap.set(assigneeName, []);
              }
              groupedTasksMap.get(assigneeName)?.push(t);
            });
          });

          const groupedData: GroupedData[] = [];

          groupedTasksMap.forEach((memberTasks, memberName) => {
            const projectGroups: Record<string, Task[]> = {};
            memberTasks.forEach(t => {
              if (!projectGroups[t.projectName]) projectGroups[t.projectName] = [];
              projectGroups[t.projectName].push(t);
            });

            const projects = Object.keys(projectGroups).map(pName => {
              return {
                name: pName,
                tasks: projectGroups[pName],
                stats: { planned: 0, logged: 0 }
              };
            });

            groupedData.push({
              assignee: memberName,
              projects,
              weekDates: weekDatesStr
            });
          });

          // Sort groups
          groupedData.sort((a, b) => {
            if (a.assignee === 'Não atribuído') return -1;
            if (b.assignee === 'Não atribuído') return 1;
            return a.assignee.localeCompare(b.assignee);
          });

          resolve(groupedData);
        } catch (e) {
          reject(e);
        }
      },
      error: (err) => reject(err)
    });
  });
};
