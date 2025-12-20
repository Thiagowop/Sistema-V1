import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { TeamMemberData } from '../types';

const formatHours = (value: number) => {
  const h = Math.floor(value);
  const m = Math.round((value - h) * 60);
  if (h === 0 && m === 0) return '0h';
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface CapacityChartProps {
  data: TeamMemberData[];
  onSelectMember: (name: string) => void;
  selectedMember: string | null;
}

export const CapacityChart: React.FC<CapacityChartProps> = ({ data, onSelectMember, selectedMember }) => {
  // Transform data to show "Weeks of Backlog"
  const chartData = data.map(d => ({
    name: d.name,
    backlogWeeks: d.totalHours / d.weeklyCapacity,
    totalHours: d.totalHours,
    capacity: d.weeklyCapacity
  })).sort((a, b) => b.backlogWeeks - a.backlogWeeks);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl ring-1 ring-black ring-opacity-5 z-50">
          <p className="font-bold text-slate-800 mb-1">{label}</p>
          <div className="space-y-1 text-xs">
            <p className="text-slate-500">Backlog Total: <span className="font-semibold text-slate-700">{formatHours(data.totalHours)}</span></p>
            <p className="text-slate-500">Capacidade Semanal: <span className="font-semibold text-slate-700">{formatHours(data.capacity)}</span></p>
            <div className="pt-1 border-t border-slate-100 mt-1">
              <p className="font-bold text-indigo-600">{data.backlogWeeks.toFixed(1)} semanas de trabalho</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          onClick={(data) => {
            if (data && data.activePayload) {
              onSelectMember(data.activePayload[0].payload.name);
            }
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#64748b" 
            fontSize={11} 
            fontWeight={500}
            tickLine={false} 
            axisLine={false} 
            width={80}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <ReferenceLine x={4} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Risco (4 sem)', position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }} />
          <Bar dataKey="backlogWeeks" radius={[0, 4, 4, 0]} barSize={20} cursor="pointer">
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.backlogWeeks > 4 ? '#ef4444' : entry.backlogWeeks > 2 ? '#f97316' : '#3b82f6'} 
                fillOpacity={selectedMember && selectedMember !== entry.name ? 0.3 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};