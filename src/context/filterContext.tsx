import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScheduleFilters } from '../types/filters';
import { defaultFilters } from '../types/filters';

interface FilterContextType {
    filters: ScheduleFilters;
    setFilters: (filters: ScheduleFilters) => void;
    toggleFilters: (enabled: boolean) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
    const [filters, setFilters] = useState<ScheduleFilters>(defaultFilters);

    const toggleFilters = (enabled: boolean) => {
        setFilters(prev => ({ ...prev, isEnabled: enabled }));
    };

    return (
        <FilterContext.Provider value={{ filters, setFilters, toggleFilters }}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
}