
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TeamMemberData, PriorityType } from '../types';
import { PRIORITY_CONFIG } from '../constants';

const formatHours = (value: number) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface WorkloadChartsProps {
  data: TeamMemberData[];
  filterPriority: PriorityType | null;
  selectedMember: string | null;
  onSelectMember: (name: string | null) => void;
  onSelectPriority: (priority: PriorityType | null) => void;
}

export const WorkloadCharts: React.FC<WorkloadChartsProps> = ({ 
  data, 
  filterPriority, 
  selectedMember,
  onSelectMember,
  onSelectPriority
}) => {
  
  // Filter data if a person is selected (for Pie Chart only)
  // For Bar Chart we usually want to show everyone but highlight the selected
  const displayData = selectedMember 
    ? data.filter(d => d.name === selectedMember)
    : data;

  // Calculate totals for Pie Chart based on current view
  const pieData = Object.values(PriorityType).map(type => {
    const totalHours = displayData.reduce((acc, curr) => {
      if (type === PriorityType.URGENT) return acc + curr.urgent;
      if (type === PriorityType.HIGH) return acc + curr.high;
      if (type === PriorityType.NORMAL) return acc + curr.normal;
      if (type === PriorityType.LOW) return acc + curr.low;
      if (type === PriorityType.NONE) return acc + curr.none;
      return acc;
    }, 0);

    return {
      name: PRIORITY_CONFIG[type].label,
      value: totalHours,
      color: PRIORITY_CONFIG[type].color,
      type: type
    };
  }).filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main Bar Chart - Stacked */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between mb-2">
           <div>
             <h3 className="text-lg font-bold text-slate-800">Distribuição de Carga</h3>
             <p className="text-xs text-slate-500">Horas alocadas por pessoa e prioridade (Clique na barra para filtrar)</p>
           </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data} // Always show full team in bar chart context
              layout="vertical"
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              barSize={20}
              onClick={(data) => {
                if (data && data.activePayload) {
                  const clickedName = data.activePayload[0].payload.name;
                  onSelectMember(clickedName === selectedMember ? null : clickedName);
                }
              }}
              cursor="pointer"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => Math.round(val).toString()} />
              <YAxis 
                dataKey="name" 
                type="category" 
                stroke="#64748b" 
                fontSize={11} 
                fontWeight={selectedMember ? 700 : 500}
                tickFormatter={(value) => selectedMember && value !== selectedMember ? '' : value}
                tickLine={false} 
                axisLine={false} 
                width={80}
              />
              <Tooltip 
                cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number) => formatHours(value)}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
                iconSize={8}
                onClick={(e) => {
                  // Find priority type from label
                  const type = Object.values(PriorityType).find(t => PRIORITY_CONFIG[t].label === e.value);
                  if (type) onSelectPriority(type === filterPriority ? null : type);
                }}
              />
              <Bar name="Urgente" dataKey="urgent" stackId="a" fill={PRIORITY_CONFIG[PriorityType.URGENT].color} fillOpacity={filterPriority && filterPriority !== PriorityType.URGENT ? 0.1 : 1} radius={[0, 0, 0, 0]} animationDuration={540} />
              <Bar name="Alta" dataKey="high" stackId="a" fill={PRIORITY_CONFIG[PriorityType.HIGH].color} fillOpacity={filterPriority && filterPriority !== PriorityType.HIGH ? 0.1 : 1} radius={[0, 0, 0, 0]} animationDuration={540} />
              <Bar name="Normal" dataKey="normal" stackId="a" fill={PRIORITY_CONFIG[PriorityType.NORMAL].color} fillOpacity={filterPriority && filterPriority !== PriorityType.NORMAL ? 0.1 : 1} radius={[0, 0, 0, 0]} animationDuration={540} />
              <Bar name="Baixa" dataKey="low" stackId="a" fill={PRIORITY_CONFIG[PriorityType.LOW].color} fillOpacity={filterPriority && filterPriority !== PriorityType.LOW ? 0.1 : 1} radius={[0, 0, 0, 0]} animationDuration={540} />
              <Bar name="Sem Prior." dataKey="none" stackId="a" fill={PRIORITY_CONFIG[PriorityType.NONE].color} fillOpacity={filterPriority && filterPriority !== PriorityType.NONE ? 0.1 : 1} radius={[0, 4, 4, 0]} animationDuration={540} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Donut Chart */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative">
        <h3 className="mb-1 text-lg font-bold text-slate-800">Composição {selectedMember ? `(${selectedMember})` : 'Total'}</h3>
        <p className="mb-4 text-xs text-slate-500">Volume de horas por prioridade</p>
        
        <div className="flex-1 min-h-[220px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                cx="50%"
                cy="50%"
                onClick={(data) => {
                  onSelectPriority(data.type === filterPriority ? null : data.type);
                }}
                cursor="pointer"
                animationDuration={540}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    fillOpacity={filterPriority && filterPriority !== entry.type ? 0.2 : 1}
                    stroke={filterPriority === entry.type ? entry.color : 'none'}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatHours(value)} />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Total - Aligned with the pie chart center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ height: 'calc(100% - 30px)' }}>
            <div className="text-center">
              <span className="block text-xl font-black text-slate-800 leading-tight">
                {formatHours(pieData.reduce((acc, curr) => acc + curr.value, 0))}
              </span>
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">TOTAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
