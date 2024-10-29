export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';
export type DeliveryMode = 'online' | 'inPerson' | 'hybrid' | 'any';
export type ScheduleCompactness = 'compact' | 'spread' | 'any';
export type DaysOff = 'any' | 'oneDay' | 'twoDays';

export interface ScheduleFilters {
    isEnabled: boolean;
    deliveryMode: DeliveryMode;
    timeOfDay: TimeOfDay;
    scheduleCompactness: ScheduleCompactness;
    daysOff: DaysOff;
}

export const timeRanges = {
    morning: { start: 8, end: 12 },
    afternoon: { start: 12, end: 17 },
    evening: { start: 17, end: 21 }
} as const;

export const defaultFilters: ScheduleFilters = {
    isEnabled: false,
    deliveryMode: 'any',
    timeOfDay: 'any',
    scheduleCompactness: 'any',
    daysOff: 'any'
};