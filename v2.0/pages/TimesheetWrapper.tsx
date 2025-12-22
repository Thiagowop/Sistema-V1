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

    // Estado para mês selecionado
    const [selectedMonth, setSelectedMonth] = React.useState(() => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    });

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

                projectGroup.tasks.forEach(task => {
                    // Pegar datas da task
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

                    // Se task termina antes do mês ou começa depois, skip
                    if (effectiveEnd < monthStart || effectiveStart > monthEnd) {
                        return;
                    }

                    // Calcular dias em que a task está ativa no mês
                    const taskStartInMonth = Math.max(1, effectiveStart.getDate());
                    const taskEndInMonth = Math.min(daysInMonth, effectiveEnd.getDate());

                    // Só considerar se as datas estão no mesmo mês/ano
                    const startInThisMonth = effectiveStart.getFullYear() === filterYear &&
                        effectiveStart.getMonth() + 1 === filterMonth;
                    const endInThisMonth = effectiveEnd.getFullYear() === filterYear &&
                        effectiveEnd.getMonth() + 1 === filterMonth;

                    // Se nenhuma data está no mês, verificar se período atravessa o mês
                    if (!startInThisMonth && !endInThisMonth) {
                        // Task atravessa o mês inteiro?
                        if (effectiveStart < monthStart && effectiveEnd > monthEnd) {
                            // Task cobre o mês todo - distribuir horas em todos dias úteis
                        } else {
                            return; // Não está neste mês
                        }
                    }

                    // Calcular horas totais da task
                    const totalEstimateMs = task.timeEstimate || 0;
                    const totalLoggedMs = task.timeLogged || 0;
                    const totalEstimateHours = totalEstimateMs / 3600000;
                    const totalLoggedHours = totalLoggedMs / 3600000;

                    // Determinar início e fim efetivo no mês
                    const startDay = startInThisMonth ? effectiveStart.getDate() : 1;
                    const endDay = endInThisMonth ? effectiveEnd.getDate() : daysInMonth;

                    // Contar dias úteis da task no mês
                    let workingDays = 0;
                    for (let d = startDay; d <= endDay; d++) {
                        const dayOfWeek = new Date(filterYear, filterMonth - 1, d).getDay();
                        if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++;
                    }

                    // Horas por dia
                    const hoursPerDay = workingDays > 0 ? totalEstimateHours / workingDays : 0;
                    const loggedPerDay = workingDays > 0 ? totalLoggedHours / workingDays : 0;

                    console.log(`[TIMESHEET] Task "${task.name}": dias ${startDay}-${endDay}, ${workingDays} úteis, ${totalEstimateHours.toFixed(1)}h estimadas`);

                    // Gerar array de horas para cada dia do mês
                    const hours: Hours[] = Array.from({ length: daysInMonth }, (_, dayIndex) => {
                        const day = dayIndex + 1;
                        const dayOfWeek = new Date(filterYear, filterMonth - 1, day).getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                        // Se é fim de semana OU dia está fora do período da task
                        if (isWeekend || day < startDay || day > endDay) {
                            return { planned: 0, actual: 0 };
                        }

                        // Dia útil dentro do período da task
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
    }, [groupedData, selectedMonth]);

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

    return (
        <div>
            {/* Filtro de mês */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Mês:</label>
                <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    {months.map(month => (
                        <option key={month.value} value={month.value}>
                            {month.label}
                        </option>
                    ))}
                </select>
                <span className="text-xs text-gray-500">
                    Exibindo {teamMembers.length} pessoas com projetos em {months.find(m => m.value === selectedMonth)?.label}
                </span>
            </div>
            <TimesheetDashboard {...timesheetProps} />
        </div>
    );
};

export default TimesheetWrapper;
