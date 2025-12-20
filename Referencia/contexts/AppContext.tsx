
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GlobalFilters {
  members: string[];
  projects: string[];
  tags: string[];
  dateRange: { start: string; end: string };
}

interface AppContextType {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  updateFilter: (key: keyof GlobalFilters, value: any) => void;
  clearFilters: () => void;
  isReadOnly: boolean;
  setReadOnly: (value: boolean) => void;
}

const defaultFilters: GlobalFilters = {
  members: [],
  projects: [],
  tags: [],
  dateRange: { start: '', end: '' }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFiltersState] = useState<GlobalFilters>(defaultFilters);
  const [isReadOnly, setIsReadOnlyState] = useState(false);

  // Load filters and settings from localStorage on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('mcsa_global_filters');
    if (savedFilters) {
      try {
        setFiltersState(JSON.parse(savedFilters));
      } catch (e) {
        console.error("Failed to parse filters", e);
      }
    }

    const savedReadOnly = localStorage.getItem('mcsa_read_only_mode');
    if (savedReadOnly) {
      setIsReadOnlyState(savedReadOnly === 'true');
    }
  }, []);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mcsa_global_filters', JSON.stringify(filters));
  }, [filters]);

  const setFilters = (newFilters: GlobalFilters) => {
    setFiltersState(newFilters);
  };

  const updateFilter = (key: keyof GlobalFilters, value: any) => {
    setFiltersState(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFiltersState(defaultFilters);
  };

  const setReadOnly = (value: boolean) => {
    setIsReadOnlyState(value);
    localStorage.setItem('mcsa_read_only_mode', String(value));
  };

  return (
    <AppContext.Provider value={{ filters, setFilters, updateFilter, clearFilters, isReadOnly, setReadOnly }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
