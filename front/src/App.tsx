import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import {
  DashboardPage,
  ImportPage,
  DiscrepanciesPage,
  TasksKanbanPage,
} from "@/pages/head";
import { MobileTasksPage, TaskInspectionPage } from "@/pages/inspector";
import { InspectorAuthPage } from "@/pages/inspector/InspectorAuthPage";
import { DirectTaskPage } from "@/pages/inspector/DirectTaskPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { InspectorRoute } from "@/components/InspectorRoute";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Routes location={location} key={location.pathname}>
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

      {/* Public inspector magic link */}
      <Route path="/inspector/auth" element={<InspectorAuthPage />} />
      <Route path="/inspector/task/:id" element={<DirectTaskPage />} />

      {/* Protected Inspector (Mobile) Routes */}
      <Route element={<InspectorRoute />}>
        <Route path="/inspector/tasks" element={<MobileTasksPage />} />
        <Route
          path="/inspector/tasks/:taskId"
          element={<TaskInspectionPage />}
        />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;
