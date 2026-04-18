import { Navigate, Outlet } from "react-router-dom"
import { useInspectorStore } from "@/features/auth/store/inspector.store"

export function InspectorRoute() {
  const isAuthenticated = useInspectorStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}
