import { Route, Routes } from "react-router-dom";
import AppShell from "./components/ui/AppShell.jsx";
import CalendarScreen from "./screens/CalendarScreen.jsx";
import FinanceScreen from "./screens/FinanceScreen.jsx";
import HabitsScreen from "./screens/HabitsScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import JournalScreen from "./screens/JournalScreen.jsx";
import NutritionScreen from "./screens/NutritionScreen.jsx";
import SettingsScreen from "./screens/SettingsScreen.jsx";
import SignOutScreen from "./screens/SignOutScreen.jsx";
import TasksScreen from "./screens/TasksScreen.jsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/tasks" element={<TasksScreen />} />
        <Route path="/finance" element={<FinanceScreen />} />
        <Route path="/journal" element={<JournalScreen />} />
        <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/habits" element={<HabitsScreen />} />
        <Route path="/nutrition" element={<NutritionScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/sign-out" element={<SignOutScreen />} />
      </Routes>
    </AppShell>
  );
}
