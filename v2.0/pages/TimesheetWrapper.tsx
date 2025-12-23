/**
 * @id WRAP-TIMESHEET-001
 * @name TimesheetWrapper
 * @description Wrapper que integra TimesheetDashboard com dados reais do ClickUp
 * @dependencies DataContext, TimesheetDashboard
 * @status active
 * @version 2.0.0 - Corrigido para mostrar horas nos dias corretos
 */

import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import TimesheetDashboard from './TimesheetDashboard';

// Tipos do TimesheetDashboard
interface Hours {
    planned: number;
    actual: number;
}

interface Task {
    id: string;
    name: string;
    hours: Hours[];
}

interface Project {
    id: string;
    name: string;
    tasks: Task[];
}

interface Member {
    id: string;
    name: string;
    initials: string;
    projects: Project[];
}

interface MonthOption {
    value: string;
    label: string;
}

interface TimesheetProps {
    teamMembers: Member[];
    months: MonthOption[];
}

export const TimesheetWrapper: React.FC = () => {
    const { groupedData, syncState } = useData();

    // Debug: Log dados recebidos
    console.log('[TIMESHEET] groupedData:', groupedData?.length || 0, 'membros');
    console.log('[TIMESHEET] syncState:', syncState.status);

    // Gerar meses disponíveis (últimos 12 meses + próximos 3 meses)
    const months = useMemo<MonthOption[]>(() => {
        const today = new Date();
        const result: MonthOption[] = [];

        for (let i = -12; i <= 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                .replace(/^\w/, c => c.toUpperCase());
            result.push({ value, label });
        }

        return result;
    }, []);

    // Estado para mês selecionado e filtro de concluídas
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });
    const [showCompleted, setShowCompleted] = React.useState(false);

    // Transformar dados do ClickUp em formato do Timesheet
    const teamMembers = useMemo<Member[]>(() => {
        if (!groupedData || groupedData.length === 0) {
            console.log('[TIMESHEET] No grouped data');
            return [];
        }

        console.log('[TIMESHEET] Processing', groupedData.length, 'members');

        // Extrair ano e mês do filtro
        const [filterYear, filterMonth] = selectedMonth.split('-').map(Number);
        const daysInMonth = new Date(filterYear, filterMonth, 0).getDate();

        const transformedMembers = groupedData.map(group => {
            // Extrair iniciais
            const nameParts = group.assignee.split(' ');
            const initials = nameParts.length >= 2
                ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
                : group.assignee.substring(0, 2);

            // Agrupar tasks por projeto
            const projectMap = new Map<string, Task[]>();

            group.projects.forEach(projectGroup => {
                const projectName = projectGroup.name;
                const tasks: Task[] = [];

                projectGroup.tasks.forEach(parentTask => {
                    // FILTRO: Se showCompleted é false, pular tarefas PAI concluídas
                    if (!showCompleted && parentTask.status && parentTask.status.toLowerCase().includes('complete')) {
                        return;
                    }
                    if (!showCompleted && parentTask.dateClosed) {
                        return;
                    }

                    // Processar SUBTAREFAS individualmente (se existirem)
                    const subtasksToProcess = parentTask.subtasks && parentTask.subtasks.length > 0
                        ? parentTask.subtasks
                        : [parentTask]; // Se não tem subtarefas, processar a própria tarefa

                    subtasksToProcess.forEach(task => {
                        // FILTRO: pular SUBTAREFAS concluídas
                        if (!showCompleted && task.status && task.status.toLowerCase().includes('complete')) {
                            return;
                        }
                        if (!showCompleted && task.dateClosed) {
                            return;
                        }

                        // Usar as PRÓPRIAS horas da subtarefa (não agregadas)
                        const taskEstimate = task.timeEstimate || 0;
                        const taskLogged = task.timeLogged || 0;

                        // Pegar datas da subtarefa
                        const taskStart = task.startDate ? new Date(task.startDate) : null;
                        const taskEnd = task.dueDate ? new Date(task.dueDate) : null;

                        // Se não tem datas, skip
                        if (!taskStart && !taskEnd) return;

                        // Determinar período da task no mês selecionado
                        const monthStart = new Date(filterYear, filterMonth - 1, 1);
                        const monthEnd = new Date(filterYear, filterMonth, 0);

                        // Verificar se task tem interseção com o mês
                        const effectiveStart = taskStart || taskEnd!;
                        const effectiveEnd = taskEnd || taskStart!;

                        // DEBUG: Log das datas
                        console.log(`[TIMESHEET DEBUG] Task "${task.name}": start=${effectiveStart.toISOString().split('T')[0]}, end=${effectiveEnd.toISOString().split('T')[0]}, monthStart=${monthStart.toISOString().split('T')[0]}, monthEnd=${monthEnd.toISOString().split('T')[0]}`);

                        // Se task termina antes do mês ou começa depois, skip
                        if (effectiveEnd < monthStart || effectiveStart > monthEnd) {
                            console.log(`[TIMESHEET DEBUG] SKIPPING "${task.name}" - outside month range`);
                            return;
                        }

                        // Só considerar se as datas estão no mesmo mês/ano
                        const startInThisMonth = effectiveStart.getFullYear() === filterYear &&
                            effectiveStart.getMonth() + 1 === filterMonth;
                        const endInThisMonth = effectiveEnd.getFullYear() === filterYear &&
                            effectiveEnd.getMonth() + 1 === filterMonth;

                        // Se nenhuma data está no mês, verificar se período atravessa o mês
                        if (!startInThisMonth && !endInThisMonth) {
                            if (effectiveStart < monthStart && effectiveEnd > monthEnd) {
                                // OK - atravessa o mês
                            } else {
                                return;
                            }
                        }

                        // Determinar início e fim efetivo no mês
                        const startDay = startInThisMonth ? effectiveStart.getDate() : 1;
                        const endDay = endInThisMonth ? effectiveEnd.getDate() : daysInMonth;

                        // Verificar se é tarefa de mesmo dia
                        const isSameDay = startDay === endDay;

                        // Contar dias úteis
                        let workingDays = 0;
                        for (let d = startDay; d <= endDay; d++) {
                            const dayOfWeek = new Date(filterYear, filterMonth - 1, d).getDay();
                            if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
                        }

                        // MESMO DIA: todas horas naquele dia
                        // MULTI-DIA: dividir proporcionalmente (pois não sabemos a distribuição exata)
                        const hoursPerDay = isSameDay
                            ? taskEstimate
                            : (workingDays > 0 ? taskEstimate / workingDays : 0);

                        const loggedPerDay = isSameDay
                            ? taskLogged
                            : (workingDays > 0 ? taskLogged / workingDays : 0);

                        console.log(`[TIMESHEET] "${task.name}": ${isSameDay ? `DIA ${startDay}` : `dias ${startDay}-${endDay}`}, ${taskEstimate.toFixed(1)}h est, ${taskLogged.toFixed(1)}h log`);

                        // Gerar array de horas
                        const hours: Hours[] = Array.from({ length: daysInMonth }, (_, dayIndex) => {
                            const day = dayIndex + 1;
                            const dayOfWeek = new Date(filterYear, filterMonth - 1, day).getDay();
                            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                            if (isWeekend || day < startDay || day > endDay) {
                                return { planned: 0, actual: 0 };
                            }

                            // Para mesmo dia, só no dia específico
                            if (isSameDay && day !== startDay) {
                                return { planned: 0, actual: 0 };
                            }

                            return {
                                planned: Math.round(hoursPerDay * 100) / 100,
                                actual: Math.round(loggedPerDay * 100) / 100
                            };
                        });

                        tasks.push({
                            id: task.id,
                            name: task.name,
                            hours
                        });
                    });
                });

                if (tasks.length > 0) {
                    if (!projectMap.has(projectName)) {
                        projectMap.set(projectName, []);
                    }
                    projectMap.get(projectName)!.push(...tasks);
                }
            });

            // Converter para array de Projects (filtrar vazios)
            const projects: Project[] = Array.from(projectMap.entries())
                .map(([name, tasks]) => ({
                    id: `${group.assignee}-${name}`,
                    name,
                    tasks
                }))
                .filter(p => p.tasks.length > 0);

            return {
                id: group.assignee.toLowerCase().replace(/\s+/g, '-'),
                name: group.assignee,
                initials: initials.toUpperCase(),
                projects
            };
        })
            .filter(member => member.projects.length > 0); // Filtrar membros sem projetos

        console.log('[TIMESHEET] Transformed', transformedMembers.length, 'members with data');
        return transformedMembers;
    }, [groupedData, selectedMonth, showCompleted]);

    // Props para o TimesheetDashboard
    const timesheetProps: TimesheetProps = {
        teamMembers,
        months
    };

    // Se não há dados
    if (syncState.status === 'idle' || teamMembers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum dado disponível</h2>
                    <p className="text-gray-600 mb-4">
                        {groupedData?.length === 0
                            ? 'Sincronize os dados do ClickUp na aba "Atualizar Dados" primeiro.'
                            : `Nenhum projeto encontrado para ${months.find(m => m.value === selectedMonth)?.label || selectedMonth}.`
                        }
                    </p>
                    <p className="text-sm text-gray-500">
                        groupedData: {groupedData?.length || 0} membros, filtrados: {teamMembers.length}
                    </p>
                </div>
            </div>
        );
    }

    return <TimesheetDashboard {...timesheetProps} />;
};

export default TimesheetWrapper;
