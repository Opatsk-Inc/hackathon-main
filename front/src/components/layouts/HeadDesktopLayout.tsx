"use client";

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Upload,
  AlertTriangle,
  CheckSquare,
  Menu,
  X,
  Bell,
  User,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Огляд", href: "/head/dashboard", icon: LayoutDashboard },
  { label: "Імпорт даних", href: "/head/import", icon: Upload },
  { label: "Розбіжності", href: "/head/discrepancies", icon: AlertTriangle },
  { label: "Завдання", href: "/head/tasks", icon: CheckSquare },
];

interface HeadDesktopLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

export function HeadDesktopLayout({ children, currentPath }: HeadDesktopLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-white/60 bg-white/80 backdrop-blur-md transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-white/60 px-6">
            <h1 className="text-xl font-bold text-slate-800">Gromada-Audit</h1>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/60 p-4 space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Вийти
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Вийти з системи?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ви впевнені, що хочете вийти? Всі незбережені зміни буде втрачено.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Скасувати</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>
                    Вийти
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="text-xs text-slate-500 px-3">© 2026 Gromada-Audit</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/60 bg-white/40 backdrop-blur-md px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Панель керування</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-600">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-slate-600">
                <User className="h-5 w-5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Вийти" className="text-slate-600">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Вийти з системи?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Ви впевнені, що хочете вийти? Всі незбережені зміни буде втрачено.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Скасувати</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Вийти
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
