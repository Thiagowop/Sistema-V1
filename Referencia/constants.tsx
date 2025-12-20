
import { TeamMemberData, PriorityType, GroupedData, Task } from './types';
import { AlertTriangle, ArrowUpCircle, CheckCircle2, HelpCircle, AlertOctagon } from 'lucide-react';

// --- CONFIGURAÇÃO VISUAL DE PRIORIDADES ---
export const PRIORITY_CONFIG = {
  [PriorityType.URGENT]: { 
    color: '#ef4444', 
    label: '0 - Urgente', 
    icon: AlertOctagon, 
    bg: 'bg-red-50', 
    text: 'text-red-700', 
    border: 'border-red-200',
    metricConfig: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', iconBg: 'bg-red-100', iconText: 'text-red-600' }
  }, 
  [PriorityType.HIGH]: { 
    color: '#f97316', 
    label: '1 - Alta', 
    icon: AlertTriangle, 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    border: 'border-orange-200',
    metricConfig: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', iconBg: 'bg-orange-100', iconText: 'text-orange-600' }
  },
  [PriorityType.NORMAL]: { 
    color: '#3b82f6', 
    label: '2 - Normal', 
    icon: ArrowUpCircle, 
    bg: 'bg-blue-50', 
    text: 'text-blue-700', 
    border: 'border-blue-200',
    metricConfig: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', iconBg: 'bg-blue-100', iconText: 'text-blue-600' }
  },
  [PriorityType.LOW]: { 
    color: '#64748b', 
    label: '3 - Baixa', 
    icon: CheckCircle2, 
    bg: 'bg-slate-50', 
    text: 'text-slate-700', 
    border: 'border-slate-200',
    metricConfig: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', iconBg: 'bg-slate-100', iconText: 'text-slate-500' }
  },
  [PriorityType.NONE]: { 
    color: '#a1a1aa', 
    label: '4 - S/ Prior.', 
    icon: HelpCircle, 
    bg: 'bg-gray-50', 
    text: 'text-gray-600', 
    border: 'border-gray-200',
    metricConfig: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', iconBg: 'bg-gray-100', iconText: 'text-gray-500' }
  },
};

// --- GERADOR DE DADOS INTELIGENTE (SCENARIO ENGINE 4.0) ---

const generateSmartData = () => {
  const today = new Date();
  const date = (diffDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + diffDays);
    return d.toISOString();
  };

  const rawTasksData = [
    // BROZINGA: Gargalo Técnico (Projetos de 5 meses, muitos atrasos e estouros)
    {
      assignee: 'Brozinga',
      project: 'Core Architecture 2025',
      tasks: [
        { name: 'Migration Tier 1 (Legacy)', status: 'EM ANDAMENTO', priority: '0', est: 80, log: 120, start: -120, end: -30, desc: 'Migração crítica do sistema antigo.', tags: ['Core', 'Risco'] },
        { name: 'Security Audit & Fixes', status: 'EM ANDAMENTO', priority: '0', est: 20, log: 35, start: -15, end: -2, desc: '', tags: ['Security'] },
        { name: 'Code Review: Squad Alpha', status: 'PENDENTE', priority: '1', est: 15, log: 0, start: -5, end: 10, desc: '', tags: [] }
      ]
    },
    // THIAGO: Fragmentação (Muitos projetos pequenos, falha de preenchimento)
    {
      assignee: 'Thiago',
      project: 'Automations Hub',
      tasks: [
        { name: 'Zapier Integration', status: 'CONCLUÍDO', priority: '2', est: 10, log: 8, start: -40, end: -35, desc: 'Integração inicial.', tags: [] },
        { name: 'Webhook Handler', status: 'EM ANDAMENTO', priority: '4', est: 0, log: 12, start: -5, end: null, desc: '', tags: [] },
        { name: 'Slack Bot Refactor', status: 'PENDENTE', priority: '4', est: 0, log: 0, start: null, end: null, desc: '', tags: [] }
      ]
    },
    // SOARES: Estagiário Sobrecarregado (Carga de 30h, mas com 50h de backlog)
    {
      assignee: 'Soares',
      project: 'Documentation & Support',
      tasks: [
        { name: 'API Docs Revision', status: 'EM ANDAMENTO', priority: '2', est: 25, log: 40, start: -30, end: 5, desc: 'Revisando Swagger.', tags: ['Docs'] },
        { name: 'Bug Hunting: Mobile', status: 'EM ANDAMENTO', priority: '3', est: 15, log: 10, start: -2, end: 15, desc: '', tags: [] },
        { name: 'Legacy Cleanup', status: 'PENDENTE', priority: '3', est: 10, log: 0, start: 10, end: 40, desc: '', tags: [] }
      ]
    },
    // ALVARO: Desvio de Função (Suporte fazendo Dev)
    {
      assignee: 'Alvaro',
      project: 'Hotfixes',
      tasks: [
        { name: 'Fix #908: Login Error', status: 'EM ANDAMENTO', priority: '0', est: 4, log: 15, start: -5, end: -1, desc: 'Erro intermitente.', tags: ['Dev'] },
        { name: 'New Dashboard Feature', status: 'EM ANDAMENTO', priority: '2', est: 40, log: 5, start: -10, end: 60, desc: 'Desenvolvimento de BI.', tags: ['Dev'] }
      ]
    },
    // PEDRO & RAFAEL: Falta de Higiene de Dados
    {
      assignee: 'Pedro',
      project: 'Frontend UI',
      tasks: [
        { name: 'Component Library', status: 'EM ANDAMENTO', priority: '4', est: 0, log: 20, start: -20, end: null, desc: '', tags: [] }
      ]
    },
    {
      assignee: 'Rafael',
      project: 'Backend API',
      tasks: [
        { name: 'Database Optimization', status: 'PENDENTE', priority: '4', est: 0, log: 0, start: null, end: null, desc: '', tags: [] }
      ]
    }
  ];

  const memberMap = new Map<string, TeamMemberData>();
  const groupedData: GroupedData[] = [];

  rawTasksData.forEach(block => {
    let group = groupedData.find(g => g.assignee === block.assignee);
    if (!group) {
      group = { assignee: block.assignee, projects: [] };
      groupedData.push(group);
    }

    let project = group.projects.find(p => p.name === block.project);
    if (!project) {
      project = { name: block.project, tasks: [] };
      group.projects.push(project);
    }

    block.tasks.forEach((rawTask, idx) => {
      const task: Task = {
        id: `${block.assignee}-${block.project}-${idx}`,
        name: rawTask.name,
        status: rawTask.status, 
        priority: rawTask.priority,
        assignee: block.assignee,
        dueDate: rawTask.end !== null ? date(rawTask.end as number) : null,
        startDate: rawTask.start !== null ? date(rawTask.start as number) : null,
        timeEstimate: rawTask.est,
        timeLogged: rawTask.log,
        projectName: block.project,
        description: rawTask.desc,
        tags: rawTask.tags, 
        isOverdue: rawTask.end !== null && rawTask.end < 0 && !rawTask.status.includes('CONCLU'),
        hasNegativeBudget: (rawTask.log > rawTask.est) && rawTask.est > 0,
        subtasks: [] 
      };
      
      project!.tasks.push(task);

      if (!memberMap.has(block.assignee)) {
        memberMap.set(block.assignee, {
          name: block.assignee,
          weeklyCapacity: block.assignee === 'Soares' ? 30 : 40,
          urgent: 0, urgentTasks: 0, urgentLogged: 0,
          high: 0, highTasks: 0, highLogged: 0,
          normal: 0, normalTasks: 0, normalLogged: 0,
          low: 0, lowTasks: 0, lowLogged: 0,
          none: 0, noneTasks: 0, noneLogged: 0,
          totalHours: 0
        });
      }

      const stats = memberMap.get(block.assignee)!;
      const hours = task.timeEstimate || 0;
      const logged = task.timeLogged || 0;
      
      if (!task.status.includes('CONCLU')) {
        stats.totalHours += hours;
      }

      const p = (task.priority || '').toLowerCase();
      if (p === '0' || p.includes('urgent')) { stats.urgent += hours; stats.urgentTasks++; stats.urgentLogged += logged; }
      else if (p === '1' || p.includes('high')) { stats.high += hours; stats.highTasks++; stats.highLogged += logged; }
      else if (p === '2' || p.includes('normal')) { stats.normal += hours; stats.normalTasks++; stats.normalLogged += logged; }
      else if (p === '3' || p.includes('low')) { stats.low += hours; stats.lowTasks++; stats.lowLogged += logged; }
      else { stats.none += hours; stats.noneTasks++; stats.noneLogged += logged; }
    });
  });

  return {
    grouped: groupedData,
    members: Array.from(memberMap.values())
  };
};

const smartData = generateSmartData();
export const MOCK_LEGACY_DATA: GroupedData[] = smartData.grouped;
export const MOCK_TEAM_DATA: TeamMemberData[] = smartData.members;
