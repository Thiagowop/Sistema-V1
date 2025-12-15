export interface ClickUpRow {
  'Task Name': string;
  'Parent Name'?: string;
  'Status': string;
  'Assignee': string;
  'Start Date'?: string;
  'Due Date'?: string;
  'Time Estimate'?: string;
  'Time Logged'?: string;
  'List'?: string; // Project Name
  [key: string]: any;
}

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
  timeEstimate: number; // in hours
  timeLogged: number; // in hours
  remaining: number; // in hours
  additionalTime: number; // New: Logged - Estimate (if positive)
  remainingFormula: number; // New: Estimate - Logged (can be negative)
  projectName: string;
  orderIndex?: number;
  isSubtask: boolean;
  subtasks: Task[];
  isOverdue: boolean;
  hasNegativeBudget: boolean;
  description?: string;
  tags?: string[]; // Tags from ClickUp
  // Visual Distribution for the Week Grid
  weeklyDistribution: Record<string, string>; // date "DD/MM" -> formatted hours string
}

export interface GroupedData {
  assignee: string;
  projects: {
    name: string;
    tasks: Task[]; // Parent tasks (containing subtasks)
    stats: {
      planned: number;
      logged: number;
    }
  }[];
  weekDates: string[]; // List of "DD/MM" strings for the header
}

export interface AppConfig {
  teamMembers: string[];
  teamMemberOrder?: string[]; // Custom display order for team members
  nameMappings: Record<string, string>;
  holidays: string[]; // DD/MM format
  clickupApiToken?: string;
  clickupListIds?: string; // Comma separated IDs
  clickupTeamId?: string; // Team/Space ID for fetching all tasks
  apiTagFilters?: string[]; // Tags to filter at API level (e.g. ['projeto'])
  corsProxy?: string; // Proxy URL to bypass CORS in browser
  includeArchived?: boolean;
  priorityOrder?: string[]; // Highest to lowest, index defines numeric level
  clickupStandupViewId?: string; // View ID for daily standup summary
  taskGroups?: { name: string; tags: string[]; color?: string }[]; // Grupos de tarefas (ex: [{name: "Rotina", tags: ["rotina"], color: "amber"}])
  availableTags?: string[]; // Tags disponíveis do ClickUp (preenchido na sincronização)
  availableStatuses?: string[]; // Status disponíveis (preenchido na sincronização)
  availableAssignees?: string[]; // Responsáveis disponíveis (preenchido na sincronização)
}

export interface StandupSection {
  heading: string;
  items: string[];
}

export interface StandupEntry {
  id: string;
  dateIso: string; // ISO timestamp of the standup
  dateKey: string; // YYYY-MM-DD for quick filtering
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

export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  isError?: boolean;
}
