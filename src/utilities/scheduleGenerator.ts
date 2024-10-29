import { CourseSection, hasTimeConflict } from './csvParser';
import type { ScheduleFilters } from '../types/filters';
import { timeRanges } from '../types/filters';

export interface ScheduleCombination {
    sections: CourseSection[];
    courseCount: number;
}

export interface ScheduleGeneratorResult {
    combinations: ScheduleCombination[];
    stats: {
        totalCombinations: number;
        coursesIncluded: string[];
    };
}

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

// Helper function to check if a time falls within a range
const isInTimeRange = (time: string, range: { start: number; end: number }): boolean => {
    const minutes = timeToMinutes(time);
    return minutes >= range.start * 60 && minutes < range.end * 60;
};

// Calculate gap between meetings in hours
const getGapBetweenMeetings = (end: string, start: string): number => {
    return (timeToMinutes(start) - timeToMinutes(end)) / 60;
};

// Sort meetings chronologically within a day
const sortMeetings = (meetings: Array<{ start: string; end: string }>): Array<{ start: string; end: string }> => {
    return meetings.sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
};

// Helper function to get the number of days with classes in a combination
const getActiveDays = (combination: CourseSection[]): Set<string> => {
    const activeDays = new Set<string>();
    combination.forEach(section => {
        section.meetings.forEach(meeting => {
            activeDays.add(meeting.day);
        });
    });
    return activeDays;
};

const meetsFilterCriteria = (combination: CourseSection[], filters: ScheduleFilters): boolean => {
    // If filters are not enabled, accept all combinations
    if (!filters.isEnabled) return true;

    // Days Off Check
    if (filters.daysOff !== 'any') {
        const activeDays = getActiveDays(combination);
        const totalActiveDays = activeDays.size;
        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].length;
        const daysOff = weekdays - totalActiveDays;

        if (filters.daysOff === 'oneDay' && daysOff !== 1) return false;
        if (filters.daysOff === 'twoDays' && daysOff !== 2) return false;
    }

    // Delivery Mode Check
    if (filters.deliveryMode !== 'any') {
        const meetingTypes = combination.flatMap(section =>
            section.meetings.map(meeting => meeting.type)
        );

        const onlineMeetingsCount = meetingTypes.filter(type => type === 'Online').length;
        const inPersonMeetingsCount = meetingTypes.filter(type => type === 'In-person').length;
        const hasOnline = onlineMeetingsCount > 0;
        const hasInPerson = inPersonMeetingsCount > 0;

        switch (filters.deliveryMode) {
            case 'online':
                if (onlineMeetingsCount < meetingTypes.length / 2) return false;
                break;
            case 'inPerson':
                if (inPersonMeetingsCount < meetingTypes.length / 2) return false;
                break;
            case 'hybrid':
                if (!hasOnline || !hasInPerson) return false;
                break;
        }
    }

    // Time of Day Check
    if (filters.timeOfDay !== 'any') {
        const range = timeRanges[filters.timeOfDay];
        const meetingsInRange = combination.reduce((count, section) => {
            return count + section.meetings.filter(meeting =>
                isInTimeRange(meeting.time.startTime, range)
            ).length;
        }, 0);

        const totalMeetings = combination.reduce((count, section) =>
            count + section.meetings.length, 0
        );

        if (meetingsInRange < totalMeetings / 2) return false;
    }

    // Schedule Compactness Check
    if (filters.scheduleCompactness !== 'any') {
        const meetingsByDay = new Map<string, Array<{start: string; end: string}>>();

        combination.forEach(section => {
            section.meetings.forEach(meeting => {
                if (!meetingsByDay.has(meeting.day)) {
                    meetingsByDay.set(meeting.day, []);
                }
                meetingsByDay.get(meeting.day)?.push({
                    start: meeting.time.startTime,
                    end: meeting.time.endTime
                });
            });
        });

        let validDayCount = 0;
        let totalDaysWithMultipleMeetings = 0;

        for (const meetings of meetingsByDay.values()) {
            if (meetings.length < 2) continue;

            totalDaysWithMultipleMeetings++;
            const sortedMeetings = sortMeetings(meetings);

            let isValidDay = true;
            for (let i = 1; i < sortedMeetings.length; i++) {
                const gap = getGapBetweenMeetings(
                    sortedMeetings[i-1].end,
                    sortedMeetings[i].start
                );

                if (filters.scheduleCompactness === 'compact' && gap > 2) {
                    isValidDay = false;
                    break;
                }
                if (filters.scheduleCompactness === 'spread' && gap < 1) {
                    isValidDay = false;
                    break;
                }
            }
            if (isValidDay) validDayCount++;
        }

        if (totalDaysWithMultipleMeetings > 0 &&
            validDayCount < totalDaysWithMultipleMeetings / 2) {
            return false;
        }
    }

    return true;
};

const hasConflictWithCombination = (
    section: CourseSection,
    currentSections: CourseSection[]
): boolean => {
    return currentSections.some(existingSection => hasTimeConflict(section, existingSection));
};

const groupSectionsByCourse = (sections: CourseSection[]): Map<string, CourseSection[]> => {
    const grouped = new Map<string, CourseSection[]>();

    sections.forEach(section => {
        const courseId = `${section.subject}${section.courseCode}`;
        if (!grouped.has(courseId)) {
            grouped.set(courseId, []);
        }
        grouped.get(courseId)?.push(section);
    });

    return grouped;
};

export const generateNonConflictingSchedules = (
    allSections: CourseSection[],
    selectedCourseIds: Set<string>,
    filters: ScheduleFilters
): ScheduleGeneratorResult => {
    // Filter sections to only include selected courses
    const selectedSections = allSections.filter(section =>
        selectedCourseIds.has(`${section.subject}${section.courseCode}`)
    );

    // Group sections by course
    const sectionsByCourse = groupSectionsByCourse(selectedSections);
    const courseIds = Array.from(sectionsByCourse.keys());

    const combinations: ScheduleCombination[] = [];

    const buildCombinations = (
        currentCombination: CourseSection[],
        courseIndex: number
    ) => {
        // Base case: we've considered all courses
        if (courseIndex === courseIds.length) {
            if (meetsFilterCriteria(currentCombination, filters)) {
                combinations.push({
                    sections: [...currentCombination],
                    courseCount: currentCombination.length
                });
            }
            return;
        }

        const courseId = courseIds[courseIndex];
        const courseSections = sectionsByCourse.get(courseId) || [];

        // Try each section of the current course
        let addedSection = false;
        for (const section of courseSections) {
            if (!hasConflictWithCombination(section, currentCombination)) {
                currentCombination.push(section);
                buildCombinations(currentCombination, courseIndex + 1);
                currentCombination.pop();
                addedSection = true;
            }
        }

        // If we couldn't add any section for this course, try skipping it
        if (!addedSection) {
            buildCombinations(currentCombination, courseIndex + 1);
        }
    };

    // Start the recursive process
    buildCombinations([], 0);

    // Sort combinations
    combinations.sort((a, b) => {
        // First by number of courses (descending)
        if (b.courseCount !== a.courseCount) {
            return b.courseCount - a.courseCount;
        }
        // Then randomly for variety
        return Math.random() - 0.5;
    });

    // Ensure we return an empty array if no combinations are found
    return {
        combinations: combinations,
        stats: {
            totalCombinations: combinations.length,
            coursesIncluded: courseIds
        }
    };
};

export const formatScheduleCombination = (combination: ScheduleCombination): string => {
    return combination.sections
        .map(section =>
            `${section.subject} ${section.courseCode} (CRN: ${section.crn})`
        )
        .join('\n');
};