/**
 * @id HOOK-TASK-001
 * @name useTasks
 * @description Hook para acesso e manipulação de tasks
 * @dependencies contexts/DataContext
 * @status active
 * @version 2.0.0
 */

import { useMemo, useCallback } from 'react';
import { useData } from '../contexts/DataContext';
import { Task, GroupedData } from '../types';

export interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
  totalHours: number;
  loggedHours: number;
  remainingHours: number;
}

export interface UseTasksReturn {
  // Data
  groupedData: GroupedData[];
  allTasks: Task[];
  
  // Getters
  getTaskById: (id: string) => Task | null;
  getTasksByAssignee: (assignee: string) => Task[];
  getTasksByProject: (project: string) => Task[];
  getTasksByStatus: (status: string) => Task[];
  getTasksByTag: (tag: string) => Task[];
  getOverdueTasks: () => Task[];
  getTasksInDateRange: (start: Date, end: Date) => Task[];
  
  // Stats
  stats: TaskStats;
  getStatsForAssignee: (assignee: string) => TaskStats;
  getStatsForProject: (project: string) => TaskStats;
  
  // Lists
  assignees: string[];
  projects: string[];
  statuses: string[];
  tags: string[];
}

const isCompleted = (status: string): boolean => {
  const s = status.toUpperCase();
  return s.includes('CONCLU') || s.includes('COMPLETE') || s.includes('DONE') || s.includes('FECHADO');
};

const isInProgress = (status: string): boolean => {
  const s = status.toUpperCase();
  return s.includes('PROGRESS') || s.includes('ANDAMENTO') || s.includes('DOING');
};

export const useTasks = (): UseTasksReturn => {
  const { groupedData, getTaskById, getTasksByAssignee, getTasksByProject, metadata } = useData();

  // Flatten all tasks
  const allTasks = useMemo((): Task[] => {
    const tasks: Task[] = [];
    for (const group of groupedData) {
      for (const project of group.projects) {
        tasks.push(...project.tasks);
      }
    }
    return tasks;
  }, [groupedData]);

  // Unique lists
  const assignees = useMemo(() => 
    [...new Set(groupedData.map(g => g.assignee))].sort(), 
    [groupedData]
  );

  const projects = useMemo(() => {
    const set = new Set<string>();
    for (const group of groupedData) {
      for (const project of group.projects) {
        set.add(project.name);
      }
    }
    return [...set].sort();
  }, [groupedData]);

  const statuses = useMemo(() => 
    metadata?.statuses || [...new Set(allTasks.map(t => t.status))].sort(),
    [metadata, allTasks]
  );

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const task of allTasks) {
      task.tags?.forEach(tag => set.add(tag));
    }
    return [...set].sort();
  }, [allTasks]);

  // ============================================
  // GETTERS
  // ============================================

  const getTasksByStatus = useCallback((status: string): Task[] => {
    return allTasks.filter(t => t.status.toUpperCase() === status.toUpperCase());
  }, [allTasks]);

  const getTasksByTag = useCallback((tag: string): Task[] => {
    return allTasks.filter(t => t.tags?.includes(tag.toLowerCase()));
  }, [allTasks]);

  const getOverdueTasks = useCallback((): Task[] => {
    const now = new Date();
    return allTasks.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < now && !isCompleted(t.status);
    });
  }, [allTasks]);

  const getTasksInDateRange = useCallback((start: Date, end: Date): Task[] => {
    return allTasks.filter(t => {
      const date = t.dueDate ? new Date(t.dueDate) : t.startDate ? new Date(t.startDate) : null;
      if (!date) return false;
      return date >= start && date <= end;
    });
  }, [allTasks]);

  // ============================================
  // STATS
  // ============================================

  const calculateStats = useCallback((tasks: Task[]): TaskStats => {
    const now = new Date();
    
    return {
      total: tasks.length,
      completed: tasks.filter(t => isCompleted(t.status)).length,
      inProgress: tasks.filter(t => isInProgress(t.status)).length,
      overdue: tasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < now && !isCompleted(t.status);
      }).length,
      totalHours: tasks.reduce((sum, t) => sum + (t.timeEstimate || 0), 0),
      loggedHours: tasks.reduce((sum, t) => sum + (t.timeLogged || 0), 0),
      remainingHours: tasks.reduce((sum, t) => sum + Math.max(0, (t.remaining || 0)), 0)
    };
  }, []);

  const stats = useMemo(() => calculateStats(allTasks), [allTasks, calculateStats]);

  const getStatsForAssignee = useCallback((assignee: string): TaskStats => {
    const tasks = getTasksByAssignee(assignee);
    return calculateStats(tasks);
  }, [getTasksByAssignee, calculateStats]);

  const getStatsForProject = useCallback((project: string): TaskStats => {
    const tasks = getTasksByProject(project);
    return calculateStats(tasks);
  }, [getTasksByProject, calculateStats]);

  return {
    // Data
    groupedData,
    allTasks,
    
    // Getters
    getTaskById,
    getTasksByAssignee,
    getTasksByProject,
    getTasksByStatus,
    getTasksByTag,
    getOverdueTasks,
    getTasksInDateRange,
    
    // Stats
    stats,
    getStatsForAssignee,
    getStatsForProject,
    
    // Lists
    assignees,
    projects,
    statuses,
    tags
  };
};

export default useTasks;
