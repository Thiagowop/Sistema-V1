import React, { useState } from 'react';
import { Task } from '../types';
import { STATUS_COLORS } from '../services/processor';
import { formatHours } from '../constants';
import { ChevronRight, ChevronDown, AlertCircle, Flag } from 'lucide-react';
import clsx from 'clsx';import Tooltip from './Tooltip';

// Helper to safely format dates
const formatDate = (date: Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '-';
    return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '-';
  }
};

interface TaskTableProps {
  tasks: Task[];
  weekDates?: string[];
  holidays?: string[];
  showDailyGrid?: boolean;
  variant?: 'default' | 'week-summary';
  showCompleted?: boolean;
  showSubtasks?: boolean;
  hideAdditionalColumns?: boolean;
}

interface TaskRowProps {
  task: Task;
  depth?: number;
  weekDates: string[];
  holidays: string[];
  showDailyGrid: boolean;
  showCompleted?: boolean;
  showSubtasks?: boolean;
  hideAdditionalColumns?: boolean;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const key = status.toUpperCase().trim();
  const matchedKey = Object.keys(STATUS_COLORS).find(k => k === key) || 'BACKLOG';
  const style = STATUS_COLORS[matchedKey] || STATUS_COLORS['BACKLOG'];

  return (
    <span
      className="inline-flex items-center justify-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide rounded-full min-w-[110px]"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {status}
    </span>
  );
};

const PriorityBadge: React.FC<{ priority?: string; level?: number }> = ({ priority, level }) => {
  if (!priority) return <span className="text-slate-300">-</span>;

  const getPriorityColor = (p: string) => {
    const lower = p.toLowerCase();
    if (lower.includes('urgent') || lower.includes('urgente')) return 'text-rose-500 bg-rose-50';
    if (lower.includes('high') || lower.includes('alta')) return 'text-amber-500 bg-amber-50';
    if (lower.includes('normal')) return 'text-sky-500 bg-sky-50';
    if (lower.includes('low') || lower.includes('baixa')) return 'text-slate-400 bg-slate-50';
    return 'text-slate-500 bg-slate-50';
  };

  let displayLevel = level;
  if (displayLevel === undefined || displayLevel === -1) {
    const lower = priority.toLowerCase();
    if (lower.includes('urgent') || lower.includes('urgente')) displayLevel = 0;
    else if (lower.includes('high') || lower.includes('alta')) displayLevel = 1;
    else if (lower.includes('normal')) displayLevel = 2;
    else if (lower.includes('low') || lower.includes('baixa')) displayLevel = 3;
    else displayLevel = 4;
  }

  return (
    <div className={clsx("flex items-center justify-center gap-1 px-2 py-1 rounded-full", getPriorityColor(priority))} title={priority}>
      <Flag className="w-3 h-3 fill-current" />
      <span className="text-[10px] font-bold">{displayLevel}</span>
    </div>
  );
};

const TaskRow: React.FC<TaskRowProps> = ({
  task,
  depth = 0,
  weekDates = [],
  holidays = [],
  showDailyGrid = false,
  showCompleted = true,
  showSubtasks = true,
  hideAdditionalColumns = false
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isNegative = task.remaining < 0;

  return (
    <>
      <tr className={clsx(
        "group transition-colors",
        depth === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/50 hover:bg-slate-100/50"
      )}>
        <td className="px-4 py-3 text-sm relative">
          <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
            {depth > 0 && <span className="text-slate-300 mr-2 text-xs">└</span>}
            {hasSubtasks ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mr-2 p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-5 mr-2" />
            )}
            <div className="flex items-center gap-2">
              <span 
                className={clsx("truncate max-w-[500px]", depth === 0 ? "font-medium text-slate-800" : "text-slate-600")}
                title={task.name}
              >
                {task.name}
              </span>
              <Tooltip content={task.description} />
            </div>
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-center text-slate-600">
          <span className="inline-flex items-center px-2 py-1 bg-slate-100 rounded-full">{task.assignee}</span>
        </td>
        <td className="px-3 py-3 text-xs text-center text-slate-600 font-medium">
          {formatDate(task.startDate)}
        </td>
        <td className="px-3 py-3 text-xs text-center">
          {task.dueDate ? (
            <span className={clsx("inline-flex items-center gap-1 font-medium", task.isOverdue ? "text-rose-600" : "text-slate-600")}>
              {formatDate(task.dueDate)}
              {task.isOverdue && <AlertCircle size={12} className="text-rose-500" />}
            </span>
          ) : '-'}
        </td>
        <td className="px-3 py-3 text-xs text-center font-semibold text-slate-700">{formatHours(task.timeEstimate)}</td>
        <td className="px-3 py-3 text-xs text-center font-semibold text-slate-700">{formatHours(task.timeLogged)}</td>
        <td className={clsx("px-3 py-3 text-xs text-center font-semibold", isNegative ? "text-rose-600 bg-rose-50" : "text-slate-700")}>
          {isNegative ? '-' : ''}{formatHours(Math.abs(task.remaining))}
        </td>
        {!hideAdditionalColumns && (
          <>
            <td className="px-3 py-3 text-xs text-center text-slate-500">
              {task.additionalTime > 0 ? formatHours(task.additionalTime) : '-'}
            </td>
            <td className="px-3 py-3 text-xs text-center text-slate-500">
              {Math.max(0, task.timeLogged - task.timeEstimate) > 0 ? formatHours(Math.max(0, task.timeLogged - task.timeEstimate)) : '-'}
            </td>
            <td className={clsx("px-3 py-3 text-xs text-center", task.remainingFormula < 0 ? "text-rose-600 font-semibold" : "text-slate-500")}>
              {(task.additionalTime > 0 || task.timeLogged > task.timeEstimate) ? formatHours(task.remainingFormula) : '-'}
            </td>
          </>
        )}
        <td className="px-3 py-3 text-center"><StatusBadge status={task.status} /></td>
        <td className="px-3 py-3 text-center"><PriorityBadge priority={task.priority} level={task.priorityLevel} /></td>
        {showDailyGrid && weekDates.map((dateStr, i) => {
          const isHoliday = holidays.includes(dateStr);
          if (isHoliday) return <td key={i} className="px-2 py-3 text-center text-[10px] text-slate-400 bg-blue-50 font-medium">Feriado</td>;
          const val = task.weeklyDistribution[dateStr];
          return <td key={i} className="px-2 py-3 text-center text-xs font-medium text-slate-600 min-w-[50px]">{val || ''}</td>;
        })}
      </tr>
      {hasSubtasks && expanded && task.subtasks
        .filter(sub => {
          if (!showSubtasks) return false;
          const statusLower = sub.status.toLowerCase();
          const isCompleted = statusLower.includes('conclu') || statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('finalizado');
          if (isCompleted && !showCompleted) return false;
          return true;
        })
        .map((sub) => (
          <TaskRow key={sub.id} task={sub} depth={depth + 1} weekDates={weekDates} holidays={holidays} showDailyGrid={showDailyGrid} showCompleted={showCompleted} showSubtasks={showSubtasks} hideAdditionalColumns={hideAdditionalColumns} />
        ))}
    </>
  );
};

const TaskTable: React.FC<TaskTableProps> = ({ tasks, weekDates = [], holidays = [], showDailyGrid = true, variant = 'default', showCompleted = true, showSubtasks = true, hideAdditionalColumns = false }) => {
  const displayDates = weekDates.length > 0 ? weekDates : [];

  if (tasks.length === 0) {
    return <div className="p-8 text-center text-slate-400"><p className="text-sm">Nenhuma tarefa encontrada</p></div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-800 text-white">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider min-w-[300px]">Tarefa</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[100px]">Responsável</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[80px]">Início</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[80px]">Prazo</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[90px]">Planejado</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[90px]">Registrado</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[90px]">Restante</th>
            {!hideAdditionalColumns && (
              <>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[90px]">Adic. Est.</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[90px]">Adic. Rast.</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[90px]">Adic. Rest.</th>
              </>
            )}
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[100px]">Status</th>
            <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[80px]">Prioridade</th>
            {showDailyGrid && displayDates.map((dateStr, i) => (
              <th key={i} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider min-w-[50px]">{dateStr}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} depth={0} weekDates={displayDates} holidays={holidays} showDailyGrid={showDailyGrid} showCompleted={showCompleted} showSubtasks={showSubtasks} hideAdditionalColumns={hideAdditionalColumns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
