/**
 * @id LIB-REG-001
 * @name LibraryRegistry
 * @description Dynamic registry of all library components
 */

import React from 'react';
import {
    BarChart2, Users, Calendar, Target, Shield, Layers,
    Settings as SettingsIcon, Clock, Layout, PieChart,
    FileText, AlertTriangle, Database, Activity, Briefcase,
    Grid, List, Filter, Upload, Download, GitBranch
} from 'lucide-react';

export type ComponentStatus = 'ready' | 'pending' | 'error' | 'deprecated';
export type ComponentCategory = 'Dashboard' | 'Utility' | 'Timesheet' | 'Admin' | 'Prototype' | 'Other';

export interface LibraryComponent {
    id: string;
    name: string;
    fileName: string;
    category: ComponentCategory;
    status: ComponentStatus;
    description: string;
    icon: React.ElementType;
    needsData: boolean;  // true = needs DataContext
    size: string;        // file size
}

// Registry of all library components
export const LIBRARY_REGISTRY: LibraryComponent[] = [
    // === DASHBOARDS ===
    {
        id: 'LIB-001',
        name: 'AllocationDashboard',
        fileName: 'AllocationDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Matriz de alocação por membro da equipe',
        icon: Target,
        needsData: true,
        size: '20KB'
    },
    {
        id: 'LIB-002',
        name: 'AttendanceDashboard',
        fileName: 'AttendanceDashboard',
        category: 'Dashboard',
        status: 'pending',
        description: 'Controle de presença e frequência',
        icon: Calendar,
        needsData: true,
        size: '35KB'
    },
    {
        id: 'LIB-003',
        name: 'GeneralTeamDashboard',
        fileName: 'GeneralTeamDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Visão global consolidada da equipe',
        icon: Layout,
        needsData: true,
        size: '36KB'
    },
    {
        id: 'LIB-004',
        name: 'GovernanceDashboard',
        fileName: 'GovernanceDashboard',
        category: 'Dashboard',
        status: 'pending',
        description: 'Governança e compliance',
        icon: Shield,
        needsData: true,
        size: '13KB'
    },
    {
        id: 'LIB-005',
        name: 'LegacyDashboard',
        fileName: 'LegacyDashboard',
        category: 'Dashboard',
        status: 'pending',
        description: 'Dashboard legado (grande)',
        icon: Database,
        needsData: true,
        size: '72KB'
    },
    {
        id: 'LIB-006',
        name: 'PriorityDashboard',
        fileName: 'PriorityDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Análise de distribuição por prioridade',
        icon: AlertTriangle,
        needsData: true,
        size: '25KB'
    },
    {
        id: 'LIB-007',
        name: 'QualityDashboard',
        fileName: 'QualityDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Auditoria de qualidade dos dados',
        icon: Shield,
        needsData: true,
        size: '20KB'
    },
    {
        id: 'LIB-008',
        name: 'TeamWorkloadDashboard',
        fileName: 'TeamWorkloadDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Carga de trabalho da equipe',
        icon: BarChart2,
        needsData: true,
        size: '21KB'
    },
    {
        id: 'LIB-009',
        name: 'DailyAlignmentDashboard',
        fileName: 'DailyAlignmentDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Alinhamento diário por membro',
        icon: Users,
        needsData: true,
        size: '24KB'
    },
    {
        id: 'LIB-010',
        name: 'AdminDashboard',
        fileName: 'AdminDashboard',
        category: 'Admin',
        status: 'pending',
        description: 'Painel administrativo',
        icon: SettingsIcon,
        needsData: false,
        size: '18KB'
    },
    // === TIMESHEETS ===
    {
        id: 'LIB-011',
        name: 'TimesheetDashboard',
        fileName: 'TimesheetDashboard',
        category: 'Timesheet',
        status: 'pending',
        description: 'Dashboard de timesheet',
        icon: Clock,
        needsData: true,
        size: '17KB'
    },
    {
        id: 'LIB-012',
        name: 'UnifiedTimesheet',
        fileName: 'UnifiedTimesheet',
        category: 'Timesheet',
        status: 'pending',
        description: 'Timesheet unificado completo',
        icon: Calendar,
        needsData: true,
        size: '31KB'
    },
    {
        id: 'LIB-013',
        name: 'WeeklyTimesheet',
        fileName: 'WeeklyTimesheet',
        category: 'Timesheet',
        status: 'pending',
        description: 'Timesheet semanal',
        icon: Calendar,
        needsData: true,
        size: '17KB'
    },
    // === UTILITY ===
    {
        id: 'LIB-014',
        name: 'KPICard',
        fileName: 'KPICard',
        category: 'Utility',
        status: 'ready',
        description: 'Card de métrica KPI',
        icon: Activity,
        needsData: false,
        size: '2KB'
    },
    {
        id: 'LIB-015',
        name: 'MetricCard',
        fileName: 'MetricCard',
        category: 'Utility',
        status: 'ready',
        description: 'Card de métrica genérico',
        icon: PieChart,
        needsData: false,
        size: '3KB'
    },
    {
        id: 'LIB-016',
        name: 'CapacityChart',
        fileName: 'CapacityChart',
        category: 'Utility',
        status: 'ready',
        description: 'Gráfico de capacidade',
        icon: BarChart2,
        needsData: true,
        size: '4KB'
    },
    {
        id: 'LIB-017',
        name: 'ProgressBar',
        fileName: 'ProgressBar',
        category: 'Utility',
        status: 'ready',
        description: 'Barra de progresso',
        icon: Activity,
        needsData: false,
        size: '1KB'
    },
    {
        id: 'LIB-018',
        name: 'TeamTable',
        fileName: 'TeamTable',
        category: 'Utility',
        status: 'pending',
        description: 'Tabela de equipe',
        icon: List,
        needsData: true,
        size: '10KB'
    },
    {
        id: 'LIB-019',
        name: 'WorkloadCharts',
        fileName: 'WorkloadCharts',
        category: 'Utility',
        status: 'pending',
        description: 'Gráficos de carga',
        icon: BarChart2,
        needsData: true,
        size: '8KB'
    },
    // === OTHER ===
    {
        id: 'LIB-020',
        name: 'ProjectsDashboard',
        fileName: 'ProjectsDashboard',
        category: 'Dashboard',
        status: 'ready',
        description: 'Boxes de projetos por pessoa',
        icon: Briefcase,
        needsData: true,
        size: '19KB'
    },
    {
        id: 'LIB-021',
        name: 'FilterDashboard',
        fileName: 'FilterDashboard',
        category: 'Utility',
        status: 'pending',
        description: 'Dashboard de filtros',
        icon: Filter,
        needsData: false,
        size: '11KB'
    },
    {
        id: 'LIB-022',
        name: 'DailySpace',
        fileName: 'DailySpace',
        category: 'Dashboard',
        status: 'pending',
        description: 'Espaço diário',
        icon: Layout,
        needsData: true,
        size: '22KB'
    },
    {
        id: 'LIB-023',
        name: 'ImportSyncView',
        fileName: 'ImportSyncView',
        category: 'Admin',
        status: 'pending',
        description: 'View de importação/sync',
        icon: Download,
        needsData: false,
        size: '13KB'
    },
    {
        id: 'LIB-024',
        name: 'SuggestionsDashboard',
        fileName: 'SuggestionsDashboard',
        category: 'Dashboard',
        status: 'pending',
        description: 'Dashboard de sugestões',
        icon: FileText,
        needsData: true,
        size: '12KB'
    },
    {
        id: 'LIB-025',
        name: 'ProjectTechnicalView',
        fileName: 'ProjectTechnicalView',
        category: 'Dashboard',
        status: 'pending',
        description: 'Visão técnica de projeto',
        icon: GitBranch,
        needsData: true,
        size: '9KB'
    },
    {
        id: 'LIB-026',
        name: 'PrototypeDashboard',
        fileName: 'PrototypeDashboard',
        category: 'Prototype',
        status: 'pending',
        description: 'Dashboard de protótipos',
        icon: Layers,
        needsData: false,
        size: '10KB'
    },
    {
        id: 'LIB-027',
        name: 'BackupVersions',
        fileName: 'BackupVersions',
        category: 'Admin',
        status: 'pending',
        description: 'Versões de backup',
        icon: Database,
        needsData: false,
        size: '13KB'
    },
    {
        id: 'LIB-028',
        name: 'LoginScreen',
        fileName: 'LoginScreen',
        category: 'Other',
        status: 'pending',
        description: 'Tela de login',
        icon: Users,
        needsData: false,
        size: '7KB'
    },
    {
        id: 'LIB-029',
        name: 'ManagementDashboard',
        fileName: 'ManagementDashboard',
        category: 'Dashboard',
        status: 'pending',
        description: 'Dashboard de gestão',
        icon: Briefcase,
        needsData: true,
        size: '1KB'
    },
    {
        id: 'LIB-030',
        name: 'SettingsDashboard',
        fileName: 'SettingsDashboard',
        category: 'Admin',
        status: 'pending',
        description: 'Dashboard de configurações',
        icon: SettingsIcon,
        needsData: false,
        size: '15KB'
    },
    {
        id: 'LIB-031',
        name: 'OperationalHub',
        fileName: 'OperationalHub',
        category: 'Dashboard',
        status: 'pending',
        description: 'Hub operacional',
        icon: Grid,
        needsData: true,
        size: '1KB'
    },
    {
        id: 'LIB-032',
        name: 'Management2Dashboard',
        fileName: 'Management2Dashboard',
        category: 'Dashboard',
        status: 'pending',
        description: 'Dashboard de gestão v2',
        icon: Briefcase,
        needsData: true,
        size: '1KB'
    },
];

// Helper functions
export const getComponentsByCategory = (category: ComponentCategory) =>
    LIBRARY_REGISTRY.filter(c => c.category === category);

export const getComponentsByStatus = (status: ComponentStatus) =>
    LIBRARY_REGISTRY.filter(c => c.status === status);

export const getComponentById = (id: string) =>
    LIBRARY_REGISTRY.find(c => c.id === id);

export const getComponentByName = (name: string) =>
    LIBRARY_REGISTRY.find(c => c.name === name);

export const CATEGORIES: ComponentCategory[] = ['Dashboard', 'Utility', 'Timesheet', 'Admin', 'Prototype', 'Other'];
