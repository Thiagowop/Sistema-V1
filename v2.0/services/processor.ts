/**
 * @id SERV-PROC-001
 * @name ProcessorService
 * @description Processamento de tarefas, distribuição semanal e agrupamento
 * @dependencies types
 * @status active
 * @version 2.0.0
 */

import { Task } from '../types';

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
