import { InspectorMobileLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, CheckCircle, XCircle } from "lucide-react";

export function TaskInspectionPage() {
  return (
    <InspectorMobileLayout
      title="Перевірка об'єкту"
      showBackButton
      onBack={() => window.history.back()}
    >
      <div className="space-y-4 p-4">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Деталі завдання</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Адреса:</span>
              <p className="font-medium">вул. Шевченка, 15</p>
            </div>
            <div>
              <span className="text-muted-foreground">Кадастровий номер:</span>
              <p className="font-medium">1234567890:12:345:6789</p>
            </div>
            <div>
              <span className="text-muted-foreground">Тип розбіжності:</span>
              <p className="font-medium">Відсутність у реєстрі нерухомості</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Карта</h3>
          <div className="flex h-48 items-center justify-center rounded-lg bg-muted">
            <MapPin className="h-12 w-12 text-muted-foreground" />
          </div>
          <Button variant="outline" className="mt-3 w-full">
            <MapPin className="mr-2 h-4 w-4" />
            Відкрити в навігації
          </Button>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <h3 className="mb-3 font-semibold">Фото</h3>
          <Button variant="outline" className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Зробити фото
          </Button>
        </div>

        <div className="space-y-2">
          <Button className="w-full" size="lg">
            <CheckCircle className="mr-2 h-5 w-5" />
            Підтвердити порушення
          </Button>
          <Button variant="outline" className="w-full" size="lg">
            <XCircle className="mr-2 h-5 w-5" />
            Відхилити
          </Button>
        </div>
      </div>
    </InspectorMobileLayout>
  );
}
