import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ScheduleGeneratorResult, ScheduleCombination } from '../utilities/scheduleGenerator';

interface ScheduleContextType {
    scheduleResults: ScheduleGeneratorResult | null;
    setScheduleResults: (results: ScheduleGeneratorResult | null) => void;
    currentCombinationIndex: number;
    setCurrentCombinationIndex: (index: number) => void;
    currentCombination: ScheduleCombination | null;
    totalCombinations: number;
    nextCombination: () => void;
    previousCombination: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: React.ReactNode }) {
    const [scheduleResults, setScheduleResults] = useState<ScheduleGeneratorResult | null>(null);
    const [currentCombinationIndex, setCurrentCombinationIndex] = useState(0);

    const currentCombination = scheduleResults?.combinations[currentCombinationIndex] || null;
    const totalCombinations = scheduleResults?.combinations.length || 0;

    const nextCombination = useCallback(() => {
        if (scheduleResults && currentCombinationIndex < scheduleResults.combinations.length - 1) {
            setCurrentCombinationIndex(prev => prev + 1);
        }
    }, [scheduleResults, currentCombinationIndex]);

    const previousCombination = useCallback(() => {
        if (currentCombinationIndex > 0) {
            setCurrentCombinationIndex(prev => prev - 1);
        }
    }, [currentCombinationIndex]);

    const value = {
        scheduleResults,
        setScheduleResults,
        currentCombinationIndex,
        setCurrentCombinationIndex,
        currentCombination,
        totalCombinations,
        nextCombination,
        previousCombination,
    };

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
}

export function useSchedule() {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedule must be used within a ScheduleProvider');
    }
    return context;
}