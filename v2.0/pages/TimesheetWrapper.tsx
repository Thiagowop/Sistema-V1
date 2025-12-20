/**
 * @id WRAP-TIMESHEET-001
 * @name TimesheetWrapper
 * @description Wrapper que integra TimesheetDashboard com dados reais do ClickUp
 * @dependencies DataContext, TimesheetDashboard
 * @status active
 * @version 1.0.0
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

    // Gerar meses disponíveis baseado nos dados
    const months = useMemo<MonthOption[]>(() => {
        const today = new Date();
        const result: MonthOption[] = [];

        // Últimos 3 meses + próx 3 meses = 7 meses
        for (let i = -3; i <= 3; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                .replace(/^\w/, c => c.toUpperCase());
            result.push({ value, label });
        }

        return result;
    }, []);

    // Transformar dados do ClickUp em formato do Timesheet
    const teamMembers = useMemo<Member[]>(() => {
        if (!groupedData || groupedData.length === 0) {
            return [];
        }

        return groupedData.map(group => {
            // Extrair iniciais do nome
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
                    // Gerar hours array (31 dias do mês atual)
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = today.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();

                    const hours: Hours[] = Array.from({ length: daysInMonth }, (_, dayIndex) => {
                        const day = dayIndex + 1;
                        const isWeekend = [0, 6].includes(new Date(year, month, day).getDay());

                        if (isWeekend) {
                            return { planned: 0, actual: 0 };
                        }

                        // Calcular horas baseado na task
                        // Se task tem time_estimate, usar isso
                        const estimateHours = task.timeEstimate
                            ? Math.round(task.timeEstimate / 3600000) // converter ms para horas
                            : 0;

                        // Se task tem timeLogged, usar
                        const actualHours = task.timeLogged
                            ? Math.round(task.timeLogged / 3600000)
                            : 0;

                        // Distribuir horas ao longo do mês (simplificado)
                        // TODO: usar datas reais das tasks quando disponível
                        const planned = estimateHours > 0 ? Math.min(8, estimateHours / 20) : 0;
                        const actual = actualHours > 0 ? Math.min(8, actualHours / 20) : 0;

                        return {
                            planned: Math.round(planned * 10) / 10,
                            actual: Math.round(actual * 10) / 10
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

            // Converter Map para array de Projects
            const projects: Project[] = Array.from(projectMap.entries()).map(([name, tasks]) => ({
                id: `${group.assignee}-${name}`,
                name,
                tasks
            }));

            return {
                id: group.assignee.toLowerCase().replace(/\s+/g, '-'),
                name: group.assignee,
                initials: initials.toUpperCase(),
                projects
            };
        });
    }, [groupedData]);

    // Props para o TimesheetDashboard
    const timesheetProps: TimesheetProps = {
        teamMembers,
        months
    };

    // Se não há dados sincronizados, mostrar mensagem
    if (syncState.status === 'idle' || teamMembers.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum dado disponível</h2>
                    <p className="text-gray-600 mb-4">
                        Sincronize os dados do ClickUp na aba "Sync" primeiro.
                    </p>
                    <p className="text-sm text-gray-500">
                        Status: {syncState.status === 'idle' ? 'Aguardando sincronização' : 'Carregando...'}
                    </p>
                </div>
            </div>
        );
    }

    return <TimesheetDashboard {...timesheetProps} />;
};

export default TimesheetWrapper;
