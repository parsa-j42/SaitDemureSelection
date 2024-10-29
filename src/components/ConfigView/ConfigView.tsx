import { useState, useCallback, useMemo } from 'react';
import {
    FileInput,
    Text,
    Stack,
    Checkbox,
    Alert,
    Group,
    Box,
    Button,
    Accordion,
    Switch,
    useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconUpload, IconAlertCircle, IconCalendar, IconFilter, IconCheck, IconX } from '@tabler/icons-react';
import { parseCourseCsv, type CourseSection } from '../../utilities/csvParser';
import { generateNonConflictingSchedules } from '../../utilities/scheduleGenerator';
import { useSchedule } from '../../context/scheduleContext';
import { useFilters } from '../../context/filterContext';
import { ScheduleFilters } from '../Filters/ScheduleFilters';

function ConfigView() {
    const { colorScheme } = useMantineColorScheme();
    const isDark = colorScheme === 'dark';
    const { setScheduleResults } = useSchedule();
    const { filters, toggleFilters } = useFilters();

    const [file, setFile] = useState<File | null>(null);
    const [parsedCourses, setParsedCourses] = useState<CourseSection[] | null>(null);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [accordionValue, setAccordionValue] = useState<string | null>("filters");

    const handleFileChange = useCallback(async (file: File | null) => {
        if (!file) {
            setParsedCourses(null);
            setParseErrors([]);
            setFile(null);
            setSelectedCourses(new Set());
            setScheduleResults(null);
            return;
        }

        setFile(file);
        try {
            const content = await file.text();
            const result = parseCourseCsv(content);

            if (result.isValid && result.data) {
                setParsedCourses(result.data);
                setParseErrors([]);
                const uniqueCourseIds = new Set(
                    result.data.map(course => `${course.subject}${course.courseCode}`)
                );
                setSelectedCourses(uniqueCourseIds);
            } else {
                setParsedCourses(null);
                setParseErrors(result.errors);
                setSelectedCourses(new Set());
            }
            setScheduleResults(null);
        } catch (error) {
            setParsedCourses(null);
            setParseErrors(['Failed to read file content']);
            setSelectedCourses(new Set());
            setScheduleResults(null);
        }
    }, [setScheduleResults]);

    const toggleCourseSelection = useCallback((courseIdentifier: string) => {
        setSelectedCourses(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(courseIdentifier)) {
                newSelection.delete(courseIdentifier);
            } else {
                newSelection.add(courseIdentifier);
            }
            return newSelection;
        });
        setScheduleResults(null);
    }, [setScheduleResults]);

    const handleGenerateSchedules = useCallback(() => {
        if (!parsedCourses) return;

        setIsGenerating(true);
        try {
            const results = generateNonConflictingSchedules(
                parsedCourses,
                selectedCourses,
                filters
            );

            if (results.combinations.length > 0) {
                setScheduleResults(results);
                notifications.show({
                    title: 'Success!',
                    message: `Generated ${results.combinations.length} possible schedules`,
                    color: 'green',
                    icon: <IconCheck size="1.1rem" />,
                    withBorder: true,
                    autoClose: 2000,
                });
            } else {
                setParseErrors(['No valid schedule combinations found with the current filters']);
                setScheduleResults(null);
                notifications.show({
                    title: 'No Schedules Found',
                    message: 'Try adjusting your course selection or filters',
                    color: 'red',
                    icon: <IconX size="1.1rem" />,
                    withBorder: true,
                    autoClose: 2000,
                });
            }
        } catch (error) {
            console.error('Schedule generation error:', error);
            setParseErrors(['Failed to generate schedules']);
            setScheduleResults(null);
            notifications.show({
                title: 'Error',
                message: 'Failed to generate schedules',
                color: 'red',
                icon: <IconX size="1.1rem" />,
                withBorder: true,
                autoClose: 2000,
            });
        } finally {
            setIsGenerating(false);
        }
    }, [parsedCourses, selectedCourses, filters, setScheduleResults]);

    const ErrorDisplay = useMemo(() => {
        if (parseErrors.length === 0) return null;

        return (
            <Alert icon={<IconAlertCircle size={16} />} title="Validation Errors" color="red">
                <Stack gap="xs">
                    {parseErrors.map((error, index) => (
                        <Text key={index} size="sm">{error}</Text>
                    ))}
                </Stack>
            </Alert>
        );
    }, [parseErrors]);

    const CourseList = useMemo(() => {
        if (!parsedCourses || parsedCourses.length === 0) return null;

        const uniqueCoursesMap = new Map<string, { id: string; label: string }>();

        parsedCourses.forEach(course => {
            const courseId = `${course.subject}${course.courseCode}`;
            if (!uniqueCoursesMap.has(courseId)) {
                uniqueCoursesMap.set(courseId, {
                    id: courseId,
                    label: `${course.courseName} (${course.subject} ${course.courseCode})`
                });
            }
        });

        const uniqueCourses = Array.from(uniqueCoursesMap.values())
            .sort((a, b) => a.label.localeCompare(b.label));

        return (
            <Box>
                <Text size="lg" fw={500} mb="md">Available Courses:</Text>
                <Stack gap="xs">
                    {uniqueCourses.map(({ id, label }) => (
                        <Group key={id}>
                            <Checkbox
                                label={label}
                                checked={selectedCourses.has(id)}
                                onChange={() => toggleCourseSelection(id)}
                            />
                        </Group>
                    ))}
                </Stack>
            </Box>
        );
    }, [parsedCourses, selectedCourses, toggleCourseSelection]);

    return (
        <Stack gap="md">
            <FileInput
                placeholder="Upload course data CSV"
                label="Course Data File"
                accept=".csv"
                leftSection={<IconUpload size={14} />}
                value={file}
                onChange={handleFileChange}
                description="Upload a CSV file containing course information"
            />
            {ErrorDisplay}
            {CourseList}

            {parsedCourses && selectedCourses.size > 0 && (
                <>
                    <Accordion
                        value={accordionValue}
                        onChange={setAccordionValue}
                    >
                        <Accordion.Item value="filters">
                            <Accordion.Control icon={<IconFilter size={14} />}>
                                <Group justify="space-between">
                                    <Text>Schedule Preferences</Text>
                                    <Switch
                                        label="Enable Filters"
                                        checked={filters.isEnabled}
                                        onChange={(event) => toggleFilters(event.currentTarget.checked)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </Group>
                            </Accordion.Control>
                            <Accordion.Panel>
                                <ScheduleFilters />
                            </Accordion.Panel>
                        </Accordion.Item>
                    </Accordion>

                    <Button
                        leftSection={<IconCalendar size={14} />}
                        onClick={handleGenerateSchedules}
                        loading={isGenerating}
                        color={isDark ? "#4c566a" : "#d8dee9"}
                        c={isDark ? "#d8dee9" : "#4c566a"}
                        variant="filled"
                        radius="md"
                    >
                        Generate Possible Schedules
                    </Button>
                </>
            )}
        </Stack>
    );
}

export default ConfigView;