"use client";

import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
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
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Огляд", href: "/head/dashboard", icon: LayoutDashboard },
  { label: "Імпорт даних", href: "/head/import", icon: Upload },
  { label: "Розбіжності", href: "/head/discrepancies", icon: AlertTriangle },
  { label: "Завдання", href: "/head/tasks", icon: CheckSquare },
];

// const PAGE_TITLES: Record<string, string> = {
//   "/head/dashboard": "Огляд громади",
//   "/head/import": "Імпорт даних",
//   "/head/discrepancies": "Розбіжності",
//   "/head/tasks": "Завдання та ревізії",
// };

interface HeadDesktopLayoutProps {
  children: React.ReactNode;
  currentPath?: string;
}

export function HeadDesktopLayout({ children, currentPath }: HeadDesktopLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const activeItem = NAV_ITEMS.find((item) => item.href === currentPath);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    navigate("/login");
  };

  return (
    <div className="relative flex min-h-screen overflow-x-clip">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-md lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-white/35 bg-gradient-to-r from-[#fff7ea]/78 via-white/66 to-[#eaf4ff]/78 px-4 backdrop-blur-xl lg:hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarOpen(true)}
          aria-label="Відкрити меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <p className="truncate px-2 text-sm font-semibold tracking-[-0.01em] text-slate-900">
          {activeItem?.label ?? "Панель керівника"}
        </p>
        <div className="h-9 w-9 shrink-0" aria-hidden="true" />
      </header>

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
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pt-16 lg:pt-0 lg:pl-72">
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
