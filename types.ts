/**
 * @id TYPE-CORE-001
 * @name CoreTypes
 * @description Tipos principais do Daily Flow v2.0
 * @status active
 * @version 2.0.0
 */

import React from 'react';

// ============================================
// ENUMS
// ============================================

export enum PriorityType {
  URGENT = '0',
  HIGH = '1',
  NORMAL = '2',
  LOW = '3',
  NONE = '4',
}

// ============================================
// TAB TYPES
// ============================================

export type TabKey = 
  | 'overview' 
  | 'team' 
  | 'ai_analysis' 
  | 'legacy' 
  | 'governance' 
  | 'timesheet' 
  | 'attendance' 
  | 'visual_management' 
  | 'general' 
  | 'strategic' 
  | 'tactical' 
  | 'operational' 
  | 'allocation' 
  | 'priorities' 
  | 'team_health';

// ============================================
// CORE TASK TYPES (Compatible with v1.0)
// ============================================

export interface Task {
  id: string;
  name: string;
  status: string;
  assignee: string;
  rawAssignee: string;
  startDate: Date | null;
  dueDate: Date | null;
  dateClosed: Date | null;
  priority?: string;
  priorityLevel?: number;
  timeEstimate: number;
  timeLogged: number;
  remaining: number;
  additionalTime: number;
  remainingFormula: number;
  projectName: string;
  orderIndex?: number;
  isSubtask: boolean;
  subtasks: Task[];
  isOverdue: boolean;
  hasNegativeBudget: boolean;
  description?: string;
  tags?: string[];
  weeklyDistribution: Record<string, string>;
}

export interface Project {
  name: string;
  tasks: Task[];
  stats?: {
    planned: number;
    logged: number;
  };
}

export interface GroupedData {
  assignee: string;
  projects: {
    name: string;
    tasks: Task[];
    stats: {
      planned: number;
      logged: number;
    }
  }[];
  weekDates: string[];
}

// ============================================
// APP CONFIGURATION (Compatible with v1.0)
// ============================================

export interface AppConfig {
  teamMembers: string[];
  teamMemberOrder?: string[];
  nameMappings: Record<string, string>;
  holidays: string[];
  clickupApiToken?: string;
  clickupListIds?: string;
  clickupTeamId?: string;
  clickupStandupViewId?: string;
  clickupViewId?: string;
  apiTagFilters?: string[];
  corsProxy?: string;
  includeArchived?: boolean;
  priorityOrder?: string[];
  taskGroups?: { name: string; tags: string[]; color?: string }[];
  availableTags?: string[];
  availableStatuses?: string[];
  availableAssignees?: string[];
}

// ============================================
// STANDUP TYPES
// ============================================

export interface StandupSection {
  heading: string;
  items: string[];
}

export interface StandupEntry {
  id: string;
  dateIso: string;
  dateKey: string;
  title: string;
  content: string;
  author?: string;
  taskMentions: {
    taskId: string;
    slug: string;
    label: string;
    url: string;
  }[];
  sections: StandupSection[];
}

// ============================================
// TEAM & DASHBOARD TYPES
// ============================================

export interface TeamMemberData {
  name: string;
  weeklyCapacity: number;
  
  // Estimates (Planejado)
  urgent: number;
  urgentTasks: number;
  high: number;
  highTasks: number;
  normal: number;
  normalTasks: number;
  low: number;
  lowTasks: number;
  none: number;
  noneTasks: number;

  // Logged (Realizado)
  urgentLogged: number;
  highLogged: number;
  normalLogged: number;
  lowLogged: number;
  noneLogged: number;

  totalHours: number;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  hours: number;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}

// ============================================
// SYNC STATUS TYPES
// ============================================

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncResult {
  success: boolean;
  taskCount: number;
  newTasks: number;
  updatedTasks: number;
  timestamp: string;
  error?: string;
}

// ============================================
// RE-EXPORT FILTER TYPES
// ============================================

export type { 
  FilterConfig, 
  FilterGroup, 
  FilterState, 
  FilterMetadata 
} from './types/FilterConfig';
