"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, MapPin } from "lucide-react";

interface InspectorMobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function InspectorMobileLayout({
  children,
  title = "Завдання",
  onBack,
  showBackButton = false,
}: InspectorMobileLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
        {showBackButton && onBack ? (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        )}

        <h1 className="flex-1 text-lg font-semibold">{title}</h1>

        <Button variant="ghost" size="icon">
          <MapPin className="h-5 w-5" />
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Bottom Navigation (optional) */}
      <nav className="sticky bottom-0 border-t bg-background">
        <div className="flex items-center justify-around p-2">
          <Button variant="ghost" size="sm" className="flex-1">
            Завдання
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            Карта
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            Профіль
          </Button>
        </div>
      </nav>
    </div>
  );
}
