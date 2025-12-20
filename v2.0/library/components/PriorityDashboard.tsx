import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { 
  AlertTriangle, 
  ArrowUpCircle, 
  CheckCircle2, 
  Clock, 
  HelpCircle,
  Filter,
  ArrowDownUp,
  XCircle,
  BarChart3,
  Table as TableIcon
} from 'lucide-react';
import { MOCK_TEAM_DATA, PRIORITY_CONFIG } from '../../constants';
import { PriorityType } from '../../types';

const formatHours = (value: number) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// --- COMPONENTS ---

const InteractiveCard = ({ 
  type, 
  count, 
  hours, 
  totalHours, 
  isActive, 
  onClick 
}: { 
  type: PriorityType, 
  count: number, 
  hours: number, 
  totalHours: number, 
  isActive: boolean, 
  onClick: () => void 
}) => {
  const config = PRIORITY_CONFIG[type];
  const Icon = config.icon;
  const percentage = totalHours > 0 ? (hours / totalHours) * 100 : 0;

  return (
    <button 
      onClick={onClick}
      className={`
        relative text-left w-full p-4 rounded-xl border transition-all duration-200 group
        ${isActive 
          ? `bg-white ring-2 ring-indigo-500 shadow-md transform scale-[1.02] z-10 ${config.border}` 
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm'
        }
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100 text-indigo-700' : `${config.bg} ${config.text}`}`}>
           <Icon size={20} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bg} ${config.text}`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      <div>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
          {config.label}
        </p>
        <div className="flex items-baseline gap-1">
          <h3 className={`text-lg font-bold ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
            {formatHours(hours)}
          </h3>
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5">{count} tarefas</p>
      </div>

      {isActive && (
        <div className="absolute top-0 right-0 p-1.5">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </button>
  );
};

export const PriorityDashboard: React.FC = () => {
  const [activePriority, setActivePriority] = useState<PriorityType | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'totalHours', direction: 'desc' });

  // 1. Aggregates (KPIs)
  const aggregates = useMemo(() => {
    let totalH = 0;
    const counts = {
      [PriorityType.URGENT]: { hours: 0, count: 0 },
      [PriorityType.HIGH]: { hours: 0, count: 0 },
      [PriorityType.NORMAL]: { hours: 0, count: 0 },
      [PriorityType.LOW]: { hours: 0, count: 0 },
      [PriorityType.NONE]: { hours: 0, count: 0 },
    };

    MOCK_TEAM_DATA.forEach(m => {
      totalH += m.totalHours;
      counts[PriorityType.URGENT].hours += m.urgent;
      counts[PriorityType.URGENT].count += m.urgentTasks;
      counts[PriorityType.HIGH].hours += m.high;
      counts[PriorityType.HIGH].count += m.highTasks;
      counts[PriorityType.NORMAL].hours += m.normal;
      counts[PriorityType.NORMAL].count += m.normalTasks;
      counts[PriorityType.LOW].hours += m.low;
      counts[PriorityType.LOW].count += m.lowTasks;
      counts[PriorityType.NONE].hours += m.none;
      counts[PriorityType.NONE].count += m.noneTasks;
    });

    return { totalH, counts };
  }, []);

  // 2. Filter & Sort Data
  const processedData = useMemo(() => {
    let data = [...MOCK_TEAM_DATA];

    // Sorting Logic
    data.sort((a: any, b: any) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [sortConfig]);

  // Handle Header Click for Sorting
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const clearFilters = () => {
    setActivePriority(null);
    setSelectedMember(null);
  };

  // Helper for "Data Bars" inside table
  const renderDataBar = (value: number, max: number, color: string, isActiveColumn: boolean) => {
    const width = max > 0 ? (value / max) * 100 : 0;
    return (
      <div className="flex flex-col justify-center h-full w-full relative group">
        <span className={`relative z-10 text-xs font-bold ${isActiveColumn ? 'text-slate-800' : 'text-slate-600 group-hover:text-slate-800'}`}>
           {value > 0 ? formatHours(value) : '-'}
        </span>
        {value > 0 && (
          <div className="absolute left-0 top-1 bottom-1 bg-opacity-20 rounded-sm transition-all" style={{ width: `${width}%`, backgroundColor: color }}></div>
        )}
      </div>
    );
  };

  // Find max values for data bars scaling
  const maxValues = useMemo(() => {
    return {
      urgent: Math.max(...MOCK_TEAM_DATA.map(d => d.urgent)),
      high: Math.max(...MOCK_TEAM_DATA.map(d => d.high)),
      normal: Math.max(...MOCK_TEAM_DATA.map(d => d.normal)),
      low: Math.max(...MOCK_TEAM_DATA.map(d => d.low)),
      none: Math.max(...MOCK_TEAM_DATA.map(d => d.none)),
      total: Math.max(...MOCK_TEAM_DATA.map(d => d.totalHours)),
    };
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans text-slate-900">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-indigo-600" />
              Painel de Prioridades
            </h2>
            <p className="text-sm text-slate-500">
              Análise de distribuição de carga e riscos por prioridade.
            </p>
         </div>
         
         {(activePriority || selectedMember) && (
           <button 
             onClick={clearFilters}
             className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors animate-fadeIn"
           >
             <XCircle size={16} /> Limpar Filtros
           </button>
         )}
      </div>

      {/* 2. Interactive KPI Cards (Filters) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <InteractiveCard 
            type={PriorityType.URGENT} 
            isActive={activePriority === PriorityType.URGENT}
            onClick={() => setActivePriority(activePriority === PriorityType.URGENT ? null : PriorityType.URGENT)}
            count={aggregates.counts[PriorityType.URGENT].count} 
            hours={aggregates.counts[PriorityType.URGENT].hours} 
            totalHours={aggregates.totalH} 
          />
          <InteractiveCard 
            type={PriorityType.HIGH} 
            isActive={activePriority === PriorityType.HIGH}
            onClick={() => setActivePriority(activePriority === PriorityType.HIGH ? null : PriorityType.HIGH)}
            count={aggregates.counts[PriorityType.HIGH].count} 
            hours={aggregates.counts[PriorityType.HIGH].hours} 
            totalHours={aggregates.totalH} 
          />
          <InteractiveCard 
            type={PriorityType.NORMAL} 
            isActive={activePriority === PriorityType.NORMAL}
            onClick={() => setActivePriority(activePriority === PriorityType.NORMAL ? null : PriorityType.NORMAL)}
            count={aggregates.counts[PriorityType.NORMAL].count} 
            hours={aggregates.counts[PriorityType.NORMAL].hours} 
            totalHours={aggregates.totalH} 
          />
          <InteractiveCard 
            type={PriorityType.LOW} 
            isActive={activePriority === PriorityType.LOW}
            onClick={() => setActivePriority(activePriority === PriorityType.LOW ? null : PriorityType.LOW)}
            count={aggregates.counts[PriorityType.LOW].count} 
            hours={aggregates.counts[PriorityType.LOW].hours} 
            totalHours={aggregates.totalH} 
          />
          <InteractiveCard 
            type={PriorityType.NONE} 
            isActive={activePriority === PriorityType.NONE}
            onClick={() => setActivePriority(activePriority === PriorityType.NONE ? null : PriorityType.NONE)}
            count={aggregates.counts[PriorityType.NONE].count} 
            hours={aggregates.counts[PriorityType.NONE].hours} 
            totalHours={aggregates.totalH} 
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 3. Main Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Distribuição Visual</h3>
                <div className="flex gap-4 text-xs">
                   {/* Custom Legend */}
                   {Object.values(PriorityType).map(t => (
                     <div key={t} className={`flex items-center gap-1.5 ${activePriority && activePriority !== t ? 'opacity-30' : 'opacity-100'}`}>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_CONFIG[t].color }}></div>
                        <span className="text-slate-600 font-medium">{PRIORITY_CONFIG[t].label}</span>
                     </div>
                   ))}
                </div>
             </div>
             
             <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart
                      data={processedData}
                      margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      barSize={32}
                      onClick={(data) => {
                        if (data && data.activePayload) {
                          const name = data.activePayload[0].payload.name;
                          setSelectedMember(selectedMember === name ? null : name);
                        }
                      }}
                      cursor="pointer"
                   >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => formatHours(value)}
                      />
                      {/* Only render bars for active priority or all if none selected */}
                      {(!activePriority || activePriority === PriorityType.URGENT) && <Bar dataKey="urgent" stackId="a" fill={PRIORITY_CONFIG[PriorityType.URGENT].color} radius={[0,0,4,4]} animationDuration={540} />}
                      {(!activePriority || activePriority === PriorityType.HIGH) && <Bar dataKey="high" stackId="a" fill={PRIORITY_CONFIG[PriorityType.HIGH].color} animationDuration={540} />}
                      {(!activePriority || activePriority === PriorityType.NORMAL) && <Bar dataKey="normal" stackId="a" fill={PRIORITY_CONFIG[PriorityType.NORMAL].color} animationDuration={540} />}
                      {(!activePriority || activePriority === PriorityType.LOW) && <Bar dataKey="low" stackId="a" fill={PRIORITY_CONFIG[PriorityType.LOW].color} animationDuration={540} />}
                      {(!activePriority || activePriority === PriorityType.NONE) && <Bar dataKey="none" stackId="a" fill={PRIORITY_CONFIG[PriorityType.NONE].color} radius={[4,4,0,0]} animationDuration={540} />}
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-xs text-center text-slate-400 mt-4">Clique nas barras para filtrar a tabela abaixo</p>
          </div>

          {/* 4. Mini Insights / Legend */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
             <div className="text-center mb-6">
               <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-100 text-slate-400 mb-3">
                 <TableIcon size={24} />
               </div>
               <h3 className="text-lg font-bold text-slate-800">
                 {selectedMember ? `Focando em ${selectedMember}` : activePriority ? `Filtrando por ${PRIORITY_CONFIG[activePriority].label}` : 'Visão Geral'}
               </h3>
               <p className="text-sm text-slate-500">Use os filtros acima e o gráfico para explorar os dados.</p>
             </div>
             
             {/* Selected Member Detail (Mini) */}
             {selectedMember && (
               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 animate-fadeIn">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Total Horas</span>
                    <span className="text-lg font-bold text-indigo-600">
                      {formatHours(processedData.find(m => m.name === selectedMember)?.totalHours || 0)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 animate-pulse" style={{ width: '100%' }}></div>
                  </div>
               </div>
             )}

             {!selectedMember && (
               <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-red-50/50 border border-red-100">
                     <span className="text-xs font-bold text-red-600">Maior Carga Urgente</span>
                     <span className="text-xs font-bold text-slate-700">
                       {MOCK_TEAM_DATA.reduce((prev, current) => (prev.urgent > current.urgent) ? prev : current).name}
                     </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                     <span className="text-xs font-bold text-orange-600">Maior Carga Alta</span>
                     <span className="text-xs font-bold text-slate-700">
                       {MOCK_TEAM_DATA.reduce((prev, current) => (prev.high > current.high) ? prev : current).name}
                     </span>
                  </div>
               </div>
             )}
          </div>
      </div>

      {/* 5. The "Super Table" */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TableIcon size={18} className="text-slate-400" />
              Matriz Detalhada
            </h3>
            <span className="text-xs bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-500 font-medium">
               Clique nos cabeçalhos para ordenar
            </span>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                     <th 
                       onClick={() => requestSort('name')}
                       className="text-left px-6 py-4 font-bold text-slate-600 uppercase tracking-wider w-[220px] cursor-pointer hover:bg-slate-100 transition-colors"
                     >
                       <div className="flex items-center gap-1">Colaborador <ArrowDownUp size={12} className="opacity-30" /></div>
                     </th>
                     
                     <th 
                       onClick={() => requestSort('urgent')}
                       className={`text-left px-4 py-3 font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-l border-slate-100 w-[140px] ${activePriority === PriorityType.URGENT ? 'bg-red-50 text-red-700' : 'text-slate-500'}`}
                     >
                       Urgente
                     </th>
                     
                     <th 
                        onClick={() => requestSort('high')}
                        className={`text-left px-4 py-3 font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-l border-slate-100 w-[140px] ${activePriority === PriorityType.HIGH ? 'bg-orange-50 text-orange-700' : 'text-slate-500'}`}
                     >
                        Alta
                     </th>
                     
                     <th 
                        onClick={() => requestSort('normal')}
                        className={`text-left px-4 py-3 font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-l border-slate-100 w-[140px] ${activePriority === PriorityType.NORMAL ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}
                     >
                        Normal
                     </th>
                     
                     <th 
                        onClick={() => requestSort('low')}
                        className={`text-left px-4 py-3 font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-l border-slate-100 w-[140px] ${activePriority === PriorityType.LOW ? 'bg-slate-100 text-slate-700' : 'text-slate-500'}`}
                     >
                        Baixa
                     </th>
                     
                     <th 
                        onClick={() => requestSort('none')}
                        className={`text-left px-4 py-3 font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors border-l border-slate-100 w-[140px] ${activePriority === PriorityType.NONE ? 'bg-gray-100 text-gray-700' : 'text-slate-400'}`}
                     >
                        N/A
                     </th>
                     
                     <th 
                        onClick={() => requestSort('totalHours')}
                        className="text-right px-6 py-3 font-bold text-slate-700 uppercase tracking-wider border-l border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors w-[120px]"
                     >
                        Total (h)
                     </th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {processedData.map((member) => {
                     const isSelected = selectedMember === member.name;
                     const isDimmed = selectedMember && !isSelected;

                     return (
                       <tr 
                         key={member.name} 
                         onClick={() => setSelectedMember(isSelected ? null : member.name)}
                         className={`
                           transition-all duration-200 cursor-pointer
                           ${isSelected ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-500' : 'hover:bg-slate-50'}
                           ${isDimmed ? 'opacity-40' : 'opacity-100'}
                         `}
                       >
                          <td className="px-6 py-3 font-bold text-slate-700">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                   {member.name.substring(0,2)}
                                </div>
                                <div>
                                   <div className={isSelected ? 'text-indigo-900' : 'text-slate-800'}>{member.name}</div>
                                </div>
                             </div>
                          </td>

                          {/* Data Bars Cells */}
                          <td className={`px-4 py-2 border-l border-slate-100 ${activePriority === PriorityType.URGENT ? 'bg-red-50/30' : ''}`}>
                             {renderDataBar(member.urgent, maxValues.urgent, PRIORITY_CONFIG[PriorityType.URGENT].color, activePriority === PriorityType.URGENT)}
                          </td>
                          <td className={`px-4 py-2 border-l border-slate-100 ${activePriority === PriorityType.HIGH ? 'bg-orange-50/30' : ''}`}>
                             {renderDataBar(member.high, maxValues.high, PRIORITY_CONFIG[PriorityType.HIGH].color, activePriority === PriorityType.HIGH)}
                          </td>
                          <td className={`px-4 py-2 border-l border-slate-100 ${activePriority === PriorityType.NORMAL ? 'bg-blue-50/30' : ''}`}>
                             {renderDataBar(member.normal, maxValues.normal, PRIORITY_CONFIG[PriorityType.NORMAL].color, activePriority === PriorityType.NORMAL)}
                          </td>
                          <td className={`px-4 py-2 border-l border-slate-100 ${activePriority === PriorityType.LOW ? 'bg-slate-50/50' : ''}`}>
                             {renderDataBar(member.low, maxValues.low, PRIORITY_CONFIG[PriorityType.LOW].color, activePriority === PriorityType.LOW)}
                          </td>
                          <td className={`px-4 py-2 border-l border-slate-100 ${activePriority === PriorityType.NONE ? 'bg-gray-50/50' : ''}`}>
                             {renderDataBar(member.none, maxValues.none, PRIORITY_CONFIG[PriorityType.NONE].color, activePriority === PriorityType.NONE)}
                          </td>

                          <td className="px-6 py-3 text-right font-bold text-slate-800 border-l border-slate-100 bg-slate-50/20">
                             {formatHours(member.totalHours)}
                          </td>
                       </tr>
                     );
                  })}
               </tbody>
               
               {/* Summary Footer */}
               <tfoot className="bg-slate-50 font-bold text-slate-700 text-xs border-t border-slate-200">
                  <tr>
                     <td className="px-6 py-4 uppercase tracking-wider text-slate-500">Total Geral</td>
                     <td className="px-4 py-3 text-red-600">{formatHours(aggregates.counts[PriorityType.URGENT].hours)}</td>
                     <td className="px-4 py-3 text-orange-600">{formatHours(aggregates.counts[PriorityType.HIGH].hours)}</td>
                     <td className="px-4 py-3 text-blue-600">{formatHours(aggregates.counts[PriorityType.NORMAL].hours)}</td>
                     <td className="px-4 py-3 text-slate-600">{formatHours(aggregates.counts[PriorityType.LOW].hours)}</td>
                     <td className="px-4 py-3 text-gray-500">{formatHours(aggregates.counts[PriorityType.NONE].hours)}</td>
                     <td className="px-6 py-3 text-right text-slate-900">{formatHours(aggregates.totalH)}</td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
    </div>
  );
};
