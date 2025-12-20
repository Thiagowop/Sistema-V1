
import React from 'react';
import { TimesheetDashboard } from './TimesheetDashboard';

export const OperationalHub: React.FC = () => {
  return (
    <div className="animate-fadeIn h-[calc(100vh-180px)] min-h-[500px] w-full">
      <TimesheetDashboard />
    </div>
  );
};
