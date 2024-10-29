import { Stack, SegmentedControl, Title } from '@mantine/core';
import { useFilters } from '../../context/filterContext';
import type { ScheduleFilters as ScheduleFiltersType } from '../../types/filters';

export function ScheduleFilters() {
    const { filters, setFilters } = useFilters();

    const updateFilter = <K extends keyof ScheduleFiltersType>(
        key: K,
        value: ScheduleFiltersType[K]
    ) => {
        setFilters({ ...filters, [key]: value });
    };

    if (!filters.isEnabled) return null;

    return (
        <Stack gap="md">
            <Title order={6}>Customize your schedule preferences:</Title>

            <Stack gap="xs">
                <SegmentedControl
                    fullWidth
                    data={[
                        { label: 'Any Mode', value: 'any' },
                        { label: 'Online', value: 'online' },
                        { label: 'In-Person', value: 'inPerson' },
                        { label: 'Hybrid', value: 'hybrid' }
                    ]}
                    value={filters.deliveryMode}
                    onChange={(value) => updateFilter('deliveryMode', value as ScheduleFiltersType['deliveryMode'])}
                />

                <SegmentedControl
                    fullWidth
                    data={[
                        { label: 'Any Time', value: 'any' },
                        { label: 'Morning', value: 'morning' },
                        { label: 'Afternoon', value: 'afternoon' },
                        { label: 'Evening', value: 'evening' }
                    ]}
                    value={filters.timeOfDay}
                    onChange={(value) => updateFilter('timeOfDay', value as ScheduleFiltersType['timeOfDay'])}
                />

                <SegmentedControl
                    fullWidth
                    data={[
                        { label: 'Any Spacing', value: 'any' },
                        { label: 'Compact', value: 'compact' },
                        { label: 'Spread Out', value: 'spread' }
                    ]}
                    value={filters.scheduleCompactness}
                    onChange={(value) => updateFilter('scheduleCompactness', value as ScheduleFiltersType['scheduleCompactness'])}
                />

                <SegmentedControl
                    fullWidth
                    data={[
                        { label: 'Any Days', value: 'any' },
                        { label: '1 Day Off', value: 'oneDay' },
                        { label: '2 Days Off', value: 'twoDays' }
                    ]}
                    value={filters.daysOff}
                    onChange={(value) => updateFilter('daysOff', value as ScheduleFiltersType['daysOff'])}
                />
            </Stack>
        </Stack>
    );
}