
import React, { useState } from 'react';
import { TeamMemberData, PriorityType } from '../types';
import { ArrowUpDown, Users, Clock, Hash } from 'lucide-react';

const formatHours = (value: number) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '-';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface TeamTableProps {
  data: TeamMemberData[];
  filterPriority: PriorityType | null;
  selectedMember: string | null;
  onSelectMember: (name: string | null) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({ 
  data, 
  filterPriority,
  selectedMember,
  onSelectMember
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'totalHours', direction: 'desc' });

  // Sorting Logic
  const sortedData = [...data].sort((a, b) => {
    let valA: any = a[sortConfig.key as keyof TeamMemberData];
    let valB: any = b[sortConfig.key as keyof TeamMemberData];

    // Handle priority specific sorting if needed
    if (filterPriority) {
        // Logic handled by caller usually, but we can refine internal sort here if we want columns to be sortable
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleHeaderClick = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const RenderCell = ({ hours, tasks, colorClass, barColor }: { hours: number, tasks: number, colorClass: string, barColor: string }) => (
    <div className="flex flex-col justify-center h-full w-full relative group/cell">
       <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-bold ${hours > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
            {formatHours(hours)}
          </span>
          {hours > 0 && (
            <span className="text-[10px] text-slate-400 font-medium">
              ({tasks} un)
            </span>
          )}
       </div>
       {/* Micro Progress Bar */}
       {hours > 0 && (
         <div className="h-1 w-full bg-slate-100 rounded-full mt-1.5 overflow-hidden">
            <div className={`h-full ${barColor} opacity-80`} style={{ width: '100%' }}></div>
         </div>
       )}
    </div>
  );

  return (
    <div className="overflow-hidden bg-white">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/80">
              <th 
                onClick={() => handleHeaderClick('name')}
                className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  Colaborador
                  <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                </div>
              </th>
              
              {(!filterPriority || filterPriority === PriorityType.URGENT) && (
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-rose-600 border-l border-slate-100">
                  Urgente
                </th>
              )}
              {(!filterPriority || filterPriority === PriorityType.HIGH) && (
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-orange-600 border-l border-slate-100">
                  Alta
                </th>
              )}
              {(!filterPriority || filterPriority === PriorityType.NORMAL) && (
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-blue-600 border-l border-slate-100">
                  Normal
                </th>
              )}
              {(!filterPriority || filterPriority === PriorityType.LOW) && (
                 <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-600 border-l border-slate-100">
                   Baixa
                 </th>
              )}
               {(!filterPriority || filterPriority === PriorityType.NONE) && (
                 <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400 border-l border-slate-100">
                   Sem Prior.
                 </th>
              )}
              
              <th 
                onClick={() => handleHeaderClick('totalHours')}
                className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-700 transition-colors group border-l border-slate-100"
              >
                <div className="flex items-center justify-end gap-2">
                  <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                  Backlog Total
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {sortedData.map((row) => {
              const isSelected = selectedMember === row.name;
              const isDimmed = selectedMember && !isSelected;

              return (
                <tr 
                  key={row.name} 
                  onClick={() => onSelectMember(isSelected ? null : row.name)}
                  className={`
                    transition-all duration-300 cursor-pointer group border-l-4
                    ${isSelected 
                      ? 'bg-indigo-50/60 border-indigo-500 shadow-inner' 
                      : 'border-transparent hover:bg-slate-50 hover:border-slate-300'
                    }
                    ${isDimmed ? 'opacity-40 grayscale-[0.8]' : 'opacity-100'}
                  `}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className={`
                        h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm transition-transform duration-300
                        ${isSelected ? 'bg-indigo-600 scale-110 ring-4 ring-indigo-100' : 'bg-slate-400 group-hover:bg-slate-500'}
                      `}>
                        {row.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className={`text-sm font-bold transition-colors ${isSelected ? 'text-indigo-800' : 'text-slate-700'}`}>
                          {row.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                           <Clock size={10} /> {row.weeklyCapacity}h semanais
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {(!filterPriority || filterPriority === PriorityType.URGENT) && (
                    <td className="px-6 py-4 border-l border-slate-50 bg-rose-50/10 group-hover:bg-rose-50/30 transition-colors">
                      <RenderCell hours={row.urgent} tasks={row.urgentTasks} colorClass="text-rose-700" barColor="bg-rose-500" />
                    </td>
                  )}
                  
                  {(!filterPriority || filterPriority === PriorityType.HIGH) && (
                    <td className="px-6 py-4 border-l border-slate-50 bg-orange-50/10 group-hover:bg-orange-50/30 transition-colors">
                      <RenderCell hours={row.high} tasks={row.highTasks} colorClass="text-orange-700" barColor="bg-orange-500" />
                    </td>
                  )}

                  {(!filterPriority || filterPriority === PriorityType.NORMAL) && (
                    <td className="px-6 py-4 border-l border-slate-50 bg-blue-50/10 group-hover:bg-blue-50/30 transition-colors">
                      <RenderCell hours={row.normal} tasks={row.normalTasks} colorClass="text-blue-700" barColor="bg-blue-500" />
                    </td>
                  )}

                  {(!filterPriority || filterPriority === PriorityType.LOW) && (
                    <td className="px-6 py-4 border-l border-slate-50">
                      <RenderCell hours={row.low} tasks={row.lowTasks} colorClass="text-slate-700" barColor="bg-slate-500" />
                    </td>
                  )}

                  {(!filterPriority || filterPriority === PriorityType.NONE) && (
                    <td className="px-6 py-4 border-l border-slate-50 bg-gray-50/30">
                       <RenderCell hours={row.none} tasks={row.noneTasks} colorClass="text-slate-500" barColor="bg-slate-300" />
                    </td>
                  )}

                  <td className="whitespace-nowrap px-6 py-4 text-right border-l border-slate-50 bg-slate-50/30">
                     <div className="flex flex-col items-end justify-center h-full gap-1">
                        <span className={`
                          inline-flex items-center justify-center px-3 py-1 text-sm font-bold rounded-lg transition-all
                          ${isSelected 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'bg-white text-slate-700 border border-slate-200'
                          }
                        `}>
                          {formatHours(row.totalHours)}
                        </span>
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
