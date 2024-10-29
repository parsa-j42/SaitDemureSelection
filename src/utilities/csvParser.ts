// Types for the course data structure
export interface CourseTime {
    startTime: string;
    endTime: string;
}

export interface CourseMeeting {
    day: string;
    time: CourseTime;
    type: 'Online' | 'In-person';
}

export interface CourseSection {
    courseName: string;
    subject: string;
    courseCode: string;
    crn: string;
    meetings: [CourseMeeting, CourseMeeting]; // Exactly two meetings
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    data: CourseSection[] | null;
}

// Validation helper functions
const isValidTimeFormat = (time: string): boolean => {
    const timePattern = /^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/;
    if (!timePattern.test(time)) return false;

    const [start, end] = time.split('-');
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    // Convert to minutes for comparison
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return endMinutes > startMinutes;
};

const isValidDay = (day: string): boolean => {
    const validDays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ];
    return validDays.includes(day);
};

const isValidMeetingType = (type: string): type is 'Online' | 'In-person' => {
    return type === 'Online' || type === 'In-person';
};

const parseTimeString = (timeString: string): CourseTime => {
    const [start, end] = timeString.split('-');
    return {
        startTime: start,
        endTime: end
    };
};

/**
 * Parses and validates a CSV string containing course information.
 * @param csvContent - The CSV content as a string
 * @returns ValidationResult containing parsing results and any validation errors
 */
export const parseCourseCsv = (csvContent: string): ValidationResult => {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        data: null
    };

    try {
        // Split into lines and remove empty lines
        const lines = csvContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Validate header
        const expectedHeader = 'CourseName,Subject,CourseCode,FirstMeetingDay,FirstMeetingTime,FirstMeetingType,SecondMeetingDay,SecondMeetingTime,SecondMeetingType,CRN';
        const header = lines[0];

        if (header !== expectedHeader) {
            result.errors.push('Invalid CSV header format');
            result.isValid = false;
            return result;
        }

        // Parse and validate each line
        const parsedCourses: CourseSection[] = [];
        const crnSet = new Set<string>(); // For detecting duplicate CRNs

        for (let i = 1; i < lines.length; i++) {
            const lineNumber = i + 1;
            const line = lines[i];
            const fields = line.split(',');

            // Validate field count
            if (fields.length !== 10) {
                result.errors.push(`Line ${lineNumber}: Invalid number of fields`);
                continue;
            }

            const [
                courseName,
                subject,
                courseCode,
                firstDay,
                firstTime,
                firstType,
                secondDay,
                secondTime,
                secondType,
                crn
            ] = fields;

            // Validate required fields
            if (!courseName || !subject || !courseCode || !crn) {
                result.errors.push(`Line ${lineNumber}: Missing required fields`);
                continue;
            }

            // Validate CRN uniqueness and format
            if (crnSet.has(crn)) {
                result.errors.push(`Line ${lineNumber}: Duplicate CRN ${crn}`);
                continue;
            }
            if (!/^\d{5}$/.test(crn)) {
                result.errors.push(`Line ${lineNumber}: Invalid CRN format ${crn}`);
                continue;
            }
            crnSet.add(crn);

            // Validate course code format
            if (!/^\d{3}$/.test(courseCode)) {
                result.errors.push(`Line ${lineNumber}: Invalid course code format ${courseCode}`);
                continue;
            }

            // Validate days
            if (!isValidDay(firstDay)) {
                result.errors.push(`Line ${lineNumber}: Invalid first meeting day ${firstDay}`);
                continue;
            }
            if (!isValidDay(secondDay)) {
                result.errors.push(`Line ${lineNumber}: Invalid second meeting day ${secondDay}`);
                continue;
            }

            // Validate time formats
            if (!isValidTimeFormat(firstTime)) {
                result.errors.push(`Line ${lineNumber}: Invalid first meeting time format ${firstTime}`);
                continue;
            }
            if (!isValidTimeFormat(secondTime)) {
                result.errors.push(`Line ${lineNumber}: Invalid second meeting time format ${secondTime}`);
                continue;
            }

            // Validate meeting types
            if (!isValidMeetingType(firstType)) {
                result.errors.push(`Line ${lineNumber}: Invalid first meeting type ${firstType}`);
                continue;
            }
            if (!isValidMeetingType(secondType)) {
                result.errors.push(`Line ${lineNumber}: Invalid second meeting type ${secondType}`);
                continue;
            }

            // Create course section object
            const courseSection: CourseSection = {
                courseName,
                subject,
                courseCode,
                crn,
                meetings: [
                    {
                        day: firstDay,
                        time: parseTimeString(firstTime),
                        type: firstType as 'Online' | 'In-person'
                    },
                    {
                        day: secondDay,
                        time: parseTimeString(secondTime),
                        type: secondType as 'Online' | 'In-person'
                    }
                ]
            };

            parsedCourses.push(courseSection);
        }

        // Set final results
        result.isValid = result.errors.length === 0;
        result.data = result.isValid ? parsedCourses : null;

    } catch (error) {
        result.isValid = false;
        result.errors.push(`Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.data = null;
    }

    return result;
};

/**
 * Helper function to extract unique course identifiers
 * @param courses - Array of parsed course sections
 * @returns Object containing unique subjects and course codes
 */
export const extractUniqueCourses = (courses: CourseSection[]) => {
    const uniqueSubjects = new Set<string>();
    const uniqueCourses = new Map<string, Set<string>>();

    courses.forEach(course => {
        uniqueSubjects.add(course.subject);

        if (!uniqueCourses.has(course.subject)) {
            uniqueCourses.set(course.subject, new Set<string>());
        }
        uniqueCourses.get(course.subject)?.add(course.courseCode);
    });

    return {
        subjects: Array.from(uniqueSubjects).sort(),
        coursesBySubject: Object.fromEntries(
            Array.from(uniqueCourses.entries()).map(([subject, codes]) => [
                subject,
                Array.from(codes).sort()
            ])
        )
    };
};

/**
 * Helper function to get all sections for a specific course
 * @param courses - Array of parsed course sections
 * @param subject - Course subject code
 * @param courseCode - Course number
 * @returns Array of matching course sections
 */
export const getCourseSections = (
    courses: CourseSection[],
    subject: string,
    courseCode: string
): CourseSection[] => {
    return courses.filter(
        course => course.subject === subject && course.courseCode === courseCode
    );
};

/**
 * Helper function to check for time conflicts between course sections
 * @param section1 - First course section
 * @param section2 - Second course section
 * @returns boolean indicating if there is a time conflict
 */
export const hasTimeConflict = (
    section1: CourseSection,
    section2: CourseSection
): boolean => {
    for (const meeting1 of section1.meetings) {
        for (const meeting2 of section2.meetings) {
            if (meeting1.day !== meeting2.day) continue;

            // Parse start times
            const [start1Hour, start1Min] = meeting1.time.startTime.split(':').map(Number);
            const startTime1 = start1Hour * 60 + start1Min;

            // Parse end times correctly
            const [end1Hour, end1Min] = meeting1.time.endTime.split(':').map(Number);
            const endTime1 = end1Hour * 60 + end1Min;

            // Parse second meeting times
            const [start2Hour, start2Min] = meeting2.time.startTime.split(':').map(Number);
            const startTime2 = start2Hour * 60 + start2Min;

            const [end2Hour, end2Min] = meeting2.time.endTime.split(':').map(Number);
            const endTime2 = end2Hour * 60 + end2Min;

            // Check for overlap
            // Two time ranges overlap if one starts before the other ends
            if (Math.max(startTime1, startTime2) < Math.min(endTime1, endTime2)) {
                return true;
            }
        }
    }
    return false;
};

// Example usage:
/*
const csvContent = `CourseName,Subject,CourseCode,FirstMeetingDay,FirstMeetingTime,FirstMeetingType,SecondMeetingDay,SecondMeetingTime,SecondMeetingType,CRN
Software Testing and Deployment,CPRG,305,Monday,13:00-14:50,Online,Thursday,13:00-14:50,In-person,30922`;

const result = parseCourseCsv(csvContent);
if (result.isValid && result.data) {
  const courses = result.data;
  const uniqueCourses = extractUniqueCourses(courses);
  const sections = getCourseSections(courses, 'CPRG', '305');
  // Use the parsed data...
} else {
  console.error('Validation errors:', result.errors);
}
*/