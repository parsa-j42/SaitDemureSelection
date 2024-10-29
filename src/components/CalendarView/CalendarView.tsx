import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Stack, Group, Button, Text, Alert, useMantineColorScheme } from '@mantine/core';
import {notifications} from '@mantine/notifications';
import { IconChevronLeft, IconChevronRight, IconCheck } from '@tabler/icons-react';
import { useSchedule } from '../../context/scheduleContext';
import type { CourseSection } from '../../utilities/csvParser';

// Configure moment to start weeks on Monday
moment.updateLocale('en-US', {
    week: {
        dow: 1,
        doy: 4
    }
});

const localizer = momentLocalizer(moment);

const NORD_COLORS = {
    purple: '#b48ead',
    green: '#a3be8c',
    red: '#bf616a',
    blue: '#88c0d0',
    yellow: '#ebcb8b',
    darkBg: '#2e3440',
    darkBg2: '#3b4252',
    lightBg: '#eceff4',
    lightBg2: '#e5e9f0',
    darkText: '#2e3440',
    lightText: '#eceff4',
};

interface CourseEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    courseSection: CourseSection;
    meetingType: 'Online' | 'In-person';
    courseIndex: number;
}

function CalendarView() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';

    const {
        currentCombination,
        currentCombinationIndex,
        totalCombinations,
        nextCombination,
        previousCombination
    } = useSchedule();

    const createDateForTime = (dayName: string, timeString: string): Date => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayIndex = days.indexOf(dayName);
        const date = moment().startOf('isoWeek');
        date.add(dayIndex, 'days');
        const [hours, minutes] = timeString.split(':').map(Number);
        date.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });
        return date.toDate();
    };

    const formatTimeRange = (startTime: string, endTime: string): string => {
        return `${moment(startTime, 'HH:mm').format('h:mm A')} - ${moment(endTime, 'HH:mm').format('h:mm A')}`;
    };

    const handleEventClick = (event: CourseEvent) => {
        const crn = event.courseSection.crn;
        navigator.clipboard.writeText(crn).then(() => {
            notifications.show({
                title: 'CRN Copied!',
                message: `CRN ${crn} has been copied to clipboard`,
                color: 'green',
                icon: <IconCheck size="1.1rem" />,
                withBorder: true,
                autoClose: 2000,
            });
        }).catch(() => {
            notifications.show({
                title: 'Failed to copy',
                message: 'Could not copy CRN to clipboard',
                color: 'red',
            });
        });
    };

    const events = useMemo(() => {
        if (!currentCombination) return [];
        const calendarEvents: CourseEvent[] = [];
        const coursesMap = new Map<string, number>();
        let colorIndex = 0;

        currentCombination.sections.forEach(section => {
            const courseKey = `${section.subject}${section.courseCode}`;
            if (!coursesMap.has(courseKey)) {
                coursesMap.set(courseKey, colorIndex++);
            }
            const courseColorIndex = coursesMap.get(courseKey)!;

            section.meetings.forEach((meeting, index) => {
                const start = createDateForTime(meeting.day, meeting.time.startTime);
                const end = createDateForTime(meeting.day, meeting.time.endTime);
                const timeRange = formatTimeRange(meeting.time.startTime, meeting.time.endTime);

                calendarEvents.push({
                    id: `${section.crn}-${index}`,
                    title: `${section.courseName}\n${section.subject} ${section.courseCode}\n${timeRange}\n${meeting.type} | CRN: ${section.crn}`,
                    start,
                    end,
                    courseSection: section,
                    meetingType: meeting.type,
                    courseIndex: courseColorIndex
                });
            });
        });

        return calendarEvents;
    }, [currentCombination]);

    const eventStyleGetter = (event: CourseEvent): { style: React.CSSProperties } => {
        const colors = [
            NORD_COLORS.purple,
            NORD_COLORS.green,
            NORD_COLORS.red,
            NORD_COLORS.blue,
            NORD_COLORS.yellow
        ];
        const backgroundColor = colors[event.courseIndex % colors.length];

        return {
            style: {
                backgroundColor,
                border: 'none',
                borderRadius: '4px',
                color: isDark ? NORD_COLORS.darkText : NORD_COLORS.darkText,
                fontSize: '0.875rem',
                opacity: event.meetingType === 'Online' ? 0.75 : 1,
                whiteSpace: 'pre-wrap',
                padding: '4px 8px',
                lineHeight: 1.4,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
            }
        };
    };

    if (!currentCombination) {
        return (
            <Alert color="blue" title="No Schedule Selected">
                Please go to the Config View tab, upload a course data file, and generate schedule combinations.
            </Alert>
        );
    }

    const wrapperStyle = {
        height: '700px',
    } as const;

    const calendarThemeStyle = `
        .rbc-toolbar {
            display: none;
        }
        .rbc-header {
            background-color: ${isDark ? NORD_COLORS.darkBg2 : NORD_COLORS.lightBg2};
            color: ${isDark ? NORD_COLORS.lightText : NORD_COLORS.darkText};
            padding: 8px;
            border: 0 !important;
        }
        .rbc-header + .rbc-header {
            border-left: 1px solid ${isDark ? '#4c566a' : '#d8dee9'} !important;
        }
        .rbc-time-header {
            background-color: ${isDark ? NORD_COLORS.darkBg2 : NORD_COLORS.lightBg2};
            border: 0 !important;
        }
        .rbc-time-header.rbc-overflowing {
            margin-right: 0;
        }
        .rbc-time-header-content {
            border: 0 !important;
            background-color: ${isDark ? NORD_COLORS.darkBg2 : NORD_COLORS.lightBg2} !important;
        }
        .rbc-off-range {
            display: none;
        }
        .rbc-time-content {
            background-color: ${isDark ? NORD_COLORS.darkBg : NORD_COLORS.lightBg};
            border: 0 !important;
        }
        .rbc-time-content > * + * > * {
            border-left: 1px solid ${isDark ? '#4c566a' : '#d8dee9'} !important;
        }
        .rbc-time-gutter {
            background-color: ${isDark ? NORD_COLORS.darkBg2 : NORD_COLORS.lightBg2};
            color: ${isDark ? NORD_COLORS.lightText : NORD_COLORS.darkText};
        }
        .rbc-current-time-indicator {
            display: none;
        }
        .rbc-time-slot {
            color: ${isDark ? NORD_COLORS.lightText : NORD_COLORS.darkText};
        }
        .rbc-label {
            color: ${isDark ? NORD_COLORS.lightText : NORD_COLORS.darkText};
        }
        .rbc-today {
            background-color: transparent !important;
        }
        .rbc-time-view {
            background-color: ${isDark ? NORD_COLORS.darkBg : NORD_COLORS.lightBg};
            border: 1px solid ${isDark ? '#4c566a' : '#d8dee9'} !important;
        }
        .rbc-day-slot .rbc-time-slot {
            background-color: ${isDark ? NORD_COLORS.darkBg : NORD_COLORS.lightBg};
        }
        .rbc-time-view .rbc-row {
            background-color: ${isDark ? NORD_COLORS.darkBg2 : NORD_COLORS.lightBg2};
        }
        .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid ${isDark ? '#4c566a' : '#d8dee9'};
        }
        .rbc-timeslot-group {
            border-bottom: 1px solid ${isDark ? '#4c566a' : '#d8dee9'};
        }
        .rbc-time-gutter .rbc-timeslot-group {
            border-bottom: 1px solid ${isDark ? '#4c566a' : '#d8dee9'};
        }
        .rbc-time-view .rbc-time-gutter {
            border-right: 1px solid ${isDark ? '#4c566a' : '#d8dee9'};
        }
        .rbc-time-header-gutter {
            border: 0 !important;
            background-color: ${isDark ? NORD_COLORS.darkBg2 : NORD_COLORS.lightBg2} !important;
        }
        .rbc-time-view {
            min-height: 0;
            border: 1px solid ${isDark ? '#4c566a' : '#d8dee9'};
        }
        .rbc-events-container {
            cursor: pointer;
        }
        .rbc-event {
            transition: filter 0.2s ease;
        }
        .rbc-event:hover {
            opacity: 0.9;
            transform: scale(1.01);
        }
    `;

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <Group>
                    <Button
                        leftSection={<IconChevronLeft size={14} />}
                        onClick={previousCombination}
                        disabled={currentCombinationIndex === 0}
                        variant="light"
                        color={isDark ? "#88c0d0" : "#5e81ac"}
                        w="7rem"
                    >
                        Previous
                    </Button>
                    <Button
                        rightSection={<IconChevronRight size={14}/>}
                        onClick={nextCombination}
                        disabled={currentCombinationIndex === totalCombinations - 1}
                        variant="light"
                        color={isDark ? "#88c0d0" : "#5e81ac"}
                        w="7rem"
                    >
                        Next
                    </Button>
                    <Text size="sm" c="dimmed">
                        Showing combination {currentCombinationIndex + 1} of {totalCombinations}
                    </Text>
                </Group>
                <Text size="sm" fw={500}>
                    {currentCombination.courseCount} courses selected
                </Text>
            </Group>

            <style>{calendarThemeStyle}</style>
            <div style={wrapperStyle}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    views={['week']}
                    defaultView="week"
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 21, 0, 0)}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleEventClick}
                    formats={{
                        eventTimeRangeFormat: () => '',
                        dayHeaderFormat: (date: Date) => moment(date).format('dddd')
                    }}
                    toolbar={false}
                />
            </div>
        </Stack>
    );
}

export default CalendarView;