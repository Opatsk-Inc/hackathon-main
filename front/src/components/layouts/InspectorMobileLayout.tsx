"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface InspectorMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function InspectorMobileLayout({
  children,
  title = "Завдання",
  subtitle,
  onBack,
  showBackButton = false,
}: InspectorMobileLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/60 bg-white/60 px-4 backdrop-blur-2xl shadow-[0_8px_24px_rgba(11,28,54,0.06)]">
        {showBackButton && onBack ? (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onBack}
            className="border-white/70 bg-white/75 text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}

        <div className="min-w-0 flex-1">
          {subtitle ? (
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-600">
              {subtitle}
            </div>
          ) : null}
          <h1 className="truncate font-heading text-base font-semibold tracking-[-0.01em] text-slate-900">
            {title}
          </h1>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-600"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
