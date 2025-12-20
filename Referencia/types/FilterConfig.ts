// Filter Configuration Types for ClickUp Integration
// @id TYPE-FILT-001
// @name FilterConfig
// @description Tipos de configuração de filtros para integração com ClickUp
// @status active
// @version 2.0.0

export interface FilterConfig {
  // Tags filtering
  requiredTags: string[];        // Tasks must have AT LEAST ONE of these tags (OR logic)
  excludedTags: string[];        // Tasks must NOT have these tags
  
  // Status filtering
  includedStatuses: string[];    // Empty = all statuses
  excludeClosed: boolean;        // Exclude completed tasks
  
  // Priority filtering
  includedPriorities: string[];  // Empty = all priorities
  
  // Date filtering
  dateRange: {
    start: Date | null;
    end: Date | null;
  } | null;
  
  // Assignee filtering  
  includedAssignees: string[];  // Empty = all assignees
  includeUnassigned: boolean;
  
  // Task type filtering
  showParentTasks: boolean;
  showSubtasks: boolean;
  showArchivedTasks: boolean;
  
  // Project filtering
  includedProjects: string[];   // List names, empty = all projects
}

export interface FilterGroup {
  id: string;
  name: string;
  description?: string;
  filters: FilterConfig;
  createdAt: string;  // ISO string for JSON serialization
  lastUsed: string;   // ISO string for JSON serialization
}

export interface FilterState {
  currentFilters: FilterConfig;
  savedGroups: FilterGroup[];
  activeGroupId: string | null;
}

// Metadata extracted from raw data for populating filter dropdowns
export interface FilterMetadata {
  tags: string[];
  statuses: string[];
  projects: string[];
  assignees: string[];
  priorities: string[];
}
