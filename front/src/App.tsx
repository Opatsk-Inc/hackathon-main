import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  DashboardPage,
  ImportPage,
  DiscrepanciesPage,
  TasksKanbanPage,
} from "@/pages/head";
import { MobileTasksPage, TaskInspectionPage } from "@/pages/inspector";
import { HomePage } from "@/pages/HomePage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Homepage з автоматичним редіректом */}
        <Route path="/" element={<HomePage />} />

        {/* Head (Desktop) Routes */}
        <Route path="/head/dashboard" element={<DashboardPage />} />
        <Route path="/head/import" element={<ImportPage />} />
        <Route path="/head/discrepancies" element={<DiscrepanciesPage />} />
        <Route path="/head/tasks" element={<TasksKanbanPage />} />

        {/* Inspector (Mobile) Routes */}
        <Route path="/inspector/tasks" element={<MobileTasksPage />} />
        <Route
          path="/inspector/tasks/:taskId"
          element={<TaskInspectionPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
