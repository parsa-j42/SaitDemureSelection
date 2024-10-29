import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import AppArea from "./components/AppArea/AppArea.tsx";
import {Notifications} from "@mantine/notifications";
import '@mantine/notifications/styles.css';

export default function App() {
  return <MantineProvider theme={theme} defaultColorScheme="auto">
    <Notifications position="top-right" zIndex={1000}/>
    <AppArea />
  </MantineProvider>;
}
