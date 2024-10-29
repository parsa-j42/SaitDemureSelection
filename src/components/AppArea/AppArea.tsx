import { useMantineColorScheme, Paper, Container, Tabs, ActionIcon } from "@mantine/core";
import { CSSProperties, useState } from "react";
import ConfigView from "../ConfigView/ConfigView";
import CalendarView from "../CalendarView/CalendarView";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { ScheduleProvider } from "../../context/scheduleContext";
import { FilterProvider } from "../../context/filterContext";
// import {Notifications} from "@mantine/notifications";

const containerStyle: CSSProperties = {
    display: "flex",
    minHeight: "100vh",
    alignItems: "center",
    justifyContent: "center"
};

const paperWrapperStyle: CSSProperties = {
    position: "relative"
};

const themeToggleStyle: CSSProperties = {
    position: "absolute",
    top: "1.2rem",
    right: "1.4rem",
    zIndex: 1
};

function AppArea() {
    const { colorScheme, toggleColorScheme } = useMantineColorScheme();
    const [activeTab, setActiveTab] = useState<string | null>('configView');

    return (
        <ScheduleProvider>
            <FilterProvider>
                <Container style={containerStyle} fluid bg={colorScheme === "light" ? "#d8dee9" : "#2e3440"}>
                    <></>
                    <div style={paperWrapperStyle}>
                        <Paper
                            shadow="xl"
                            p="xl"
                            w="110rem"
                            h="55rem"
                            radius="lg"
                            c={colorScheme === "dark" ? "#d8dee9" : "#4c566a"}
                            bg={colorScheme === "light" ? "#e5e9f0" : "#3b4252"}
                        >
                            <ActionIcon
                                onClick={() => toggleColorScheme()}
                                color={colorScheme === "light" ? "#5e81ac" : "#ebcb8b"}
                                variant="subtle"
                                radius="xl"
                                size={36}
                                style={themeToggleStyle}
                            >
                                {colorScheme === "light" ? <IconMoon size={24} /> : <IconSun size={24} />}
                            </ActionIcon>

                            <Tabs value={activeTab} onChange={setActiveTab} color="#81a1c1" variant="pills" radius="md">
                                <Tabs.List>
                                    <Tabs.Tab value="configView">Config View</Tabs.Tab>
                                    <Tabs.Tab value="calendarView">Calendar View</Tabs.Tab>
                                </Tabs.List>

                                <Tabs.Panel value="configView" my="lg" mx="xs">
                                    <ConfigView />
                                </Tabs.Panel>
                                <Tabs.Panel value="calendarView" my="lg" mx="xs">
                                    <CalendarView />
                                </Tabs.Panel>
                            </Tabs>
                        </Paper>
                    </div>
                </Container>
            </FilterProvider>
        </ScheduleProvider>
    );
}

export default AppArea;