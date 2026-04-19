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

const PAGE_TITLES: Record<string, string> = {
  "/head/dashboard": "Огляд громади",
  "/head/import": "Імпорт даних",
  "/head/discrepancies": "Розбіжності",
  "/head/tasks": "Завдання та ревізії",
};

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

  const pageTitle = (currentPath && PAGE_TITLES[currentPath]) ?? "Панель керування";

  return (
    <div className="relative flex min-h-screen">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/60 bg-white/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(11,28,54,0.08)] transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-white/60 px-6">
            <img src="/name.svg" alt="Gromada-Audit" className="h-10" />
            <Button
              variant="ghost"
              size="icon-sm"
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
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group/nav relative flex items-center gap-3 overflow-hidden rounded-xl px-3.5 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all duration-200",
                    isActive
                      ? "bg-gradient-to-r from-amber-50/90 via-white/80 to-sky-50/80 text-amber-800 shadow-[0_8px_20px_rgba(217,119,6,0.14)] ring-1 ring-amber-200/60"
                      : "text-slate-600 hover:bg-white/75 hover:text-slate-900"
                  )}
                >
                  {isActive ? (
                    <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-gradient-to-b from-amber-500 to-amber-600" />
                  ) : null}
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-amber-600" : "text-slate-400 group-hover/nav:text-slate-600"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-white/60 p-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-slate-600 hover:bg-red-50 hover:text-red-600"
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
                  <AlertDialogAction onClick={handleLogout}>Вийти</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="px-3 text-xs text-slate-400">© 2026 Gromada-Audit</div>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b border-white/50 bg-white/55 px-6 backdrop-blur-2xl">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex flex-1 items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Gromada-Audit
              </span>
              <h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-slate-900">
                {pageTitle}
              </h2>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon-sm" className="relative text-slate-500 hover:text-slate-900">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_0_3px_rgba(255,255,255,0.9)]" />
              </Button>
              <Button variant="ghost" size="icon-sm" className="text-slate-500 hover:text-slate-900">
                <User className="h-5 w-5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    title="Вийти"
                    className="text-slate-500 hover:text-red-600"
                  >
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
                    <AlertDialogAction onClick={handleLogout}>Вийти</AlertDialogAction>
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
