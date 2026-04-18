import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  DashboardPage,
  ImportPage,
  DiscrepanciesPage,
  TasksKanbanPage,
} from "@/pages/head";
import { MobileTasksPage, TaskInspectionPage } from "@/pages/inspector";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Redirect root to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Protected Head (Desktop) Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/head/dashboard" element={<DashboardPage />} />
          <Route path="/head/import" element={<ImportPage />} />
          <Route path="/head/discrepancies" element={<DiscrepanciesPage />} />
          <Route path="/head/tasks" element={<TasksKanbanPage />} />
        </Route>

        {/* Protected Inspector (Mobile) Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/inspector/tasks" element={<MobileTasksPage />} />
          <Route
            path="/inspector/tasks/:taskId"
            element={<TaskInspectionPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
