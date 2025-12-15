import { AppConfig } from './types';
import { FilterConfig } from './types/FilterConfig';

export const DEFAULT_CONFIG: AppConfig = {
  teamMembers: [
    'Rodrigo Brozinga',
    'Lucas Soares',
    'Lucas Paresqui',
    'Thiago Vitorio',
    'Alvaro',
    'Rafael Viegas',
    'Pedro'
  ],
  nameMappings: {
    'Rodrigo Brozinga': 'Brozinga',
    'Lucas Soares': 'Soares',
    'Lucas Paresqui': 'Paresqui',
    'Thiago Vitorio': 'Thiago',
    'Alvaro Nunes': 'Alvaro',
    'Rafael Viegas': 'Rafael',
    'Viegas': 'Rafael',
    'Pedro Calais': 'Pedro'
  },
  teamMemberOrder: [
    'Brozinga',
    'Soares',
    'Paresqui',
    'Thiago',
    'Alvaro',
    'Rafael',
    'Pedro'
  ],
  holidays: [],
  corsProxy: '',
  clickupApiToken: import.meta.env.VITE_CLICKUP_API_TOKEN || '',
  clickupListIds: import.meta.env.VITE_CLICKUP_LIST_IDS || '',
  clickupTeamId: import.meta.env.VITE_CLICKUP_TEAM_ID || '',
  clickupStandupViewId: import.meta.env.VITE_CLICKUP_STANDUP_VIEW_ID || '',
  apiTagFilters: [], // Fetch ALL tasks (no API filtering) - filter on client side instead
  includeArchived: false,
  priorityOrder: ['URGENTE', 'ALTA', 'NORMAL', 'BAIXA'],
  customGroups: [
    {
      id: 'projetos',
      title: 'Projetos',
      tags: [], // Empty = catch all tasks without other group tags
      icon: '🎯',
      color: 'blue',
      order: 999, // Show last (default fallback)
      enabled: true
    }
  ]
};

export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  requiredTags: [],  // Changed: Show ALL tasks by default (no tag filter)
  excludedTags: [],
  includedStatuses: [],
  excludeClosed: false,
  includedPriorities: [],
  dateRange: null,
  includedAssignees: [],
  includeUnassigned: true,
  showParentTasks: true,
  showSubtasks: true,
  showArchivedTasks: false,
  includedProjects: []
};

export const formatHours = (hours: number): string => {
  if (hours === 0) return '-';

  const isNegative = hours < 0;
  const absHours = Math.abs(hours);

  const h = Math.floor(absHours);
  const m = Math.round((absHours - h) * 60);

  let result = '';
  if (h > 0 && m > 0) result = `${h}h ${m}m`;
  else if (h > 0) result = `${h}h`;
  else if (m > 0) result = `${m}m`;
  else result = '0';

  return isNegative ? `-${result}` : result;
};
