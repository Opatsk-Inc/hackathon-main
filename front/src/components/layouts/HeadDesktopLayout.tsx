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
    <div className="atmo-shell relative flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0f1f38]/55 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/40 bg-white/70 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-white/45 px-6">
            <img src="/name.svg" alt="Gromada-Audit" className="h-10" />
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
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-[#2f6fe8]/15 to-[#f38c3d]/12 text-[#1f55b5] shadow-sm"
                      : "text-[#334b6d] hover:bg-white/70 hover:text-[#0f2951]"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/45 p-4 space-y-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-[#334b6d] hover:text-red-600 hover:bg-red-50"
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

            <div className="text-xs text-[#5d728f] px-3">© 2026 Gromada-Audit</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/35 bg-white/35 backdrop-blur-xl px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center justify-between">
            <h2 className="text-xl font-bold text-[#10213f]">Панель керування</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-[#334b6d] hover:bg-white/70">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-[#334b6d] hover:bg-white/70">
                <User className="h-5 w-5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Вийти" className="text-[#334b6d] hover:bg-white/70">
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
