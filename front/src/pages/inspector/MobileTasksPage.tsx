import { InspectorMobileLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { MapPin, Clock } from "lucide-react";

export function MobileTasksPage() {
  return (
    <InspectorMobileLayout title="Мої завдання">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Всі
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Активні
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Завершені
          </Button>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Перевірка об'єкту #1234</h3>
                <p className="text-sm text-muted-foreground">
                  вул. Шевченка, 15
                </p>
              </div>
              <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                Очікує
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>2.3 км</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Сьогодні</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Немає активних завдань
            </p>
          </div>
        </div>
      </div>
    </InspectorMobileLayout>
  );
}
