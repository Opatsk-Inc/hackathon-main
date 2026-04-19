import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InspectorMobileLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { MapPin, Camera, CheckCircle, XCircle, Scale, AlertTriangle } from "lucide-react";
import { ApiClient } from "@/lib/api/client";
import type { Anomaly } from "@/lib/api/types";
import { AiRecommendation } from "@/components/AiRecommendation";

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Відсутність нерухомості",
  MISSING_IN_LAND: "Відсутність земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const RISK_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
  HIGH: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-300",
  LOW: "bg-green-100 text-green-700 border-green-300",
};

const RISK_LABELS: Record<string, string> = {
  CRITICAL: "Критичний",
  HIGH: "Високий",
  MEDIUM: "Середній",
  LOW: "Низький",
};

export function TaskInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    ApiClient.get<Anomaly[]>("/api/mobile/tasks")
      .then((tasks) => setTask(tasks.find((t) => t.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const resolve = async (confirmed: boolean) => {
    if (!task) return;
    setSubmitting(true);
    await ApiClient.patch(`/api/mobile/tasks/${task.id}/resolve`, {
      status: confirmed ? "RESOLVED" : "CANCELLED",
      comment: "",
    }).catch(() => null);
    setSubmitting(false);
    window.history.back();
  };

  if (loading) {
    return (
      <InspectorMobileLayout title="Перевірка" showBackButton onBack={() => window.history.back()}>
        <div className="p-8 text-center text-sm text-muted-foreground">Завантаження...</div>
      </InspectorMobileLayout>
    );
  }

  if (!task) {
    return (
      <InspectorMobileLayout title="Перевірка" showBackButton onBack={() => window.history.back()}>
        <div className="p-8 text-center text-sm text-red-500">Завдання не знайдено</div>
      </InspectorMobileLayout>
    );
  }

  const riskColor = RISK_COLORS[task.enrichment?.riskLevel] ?? RISK_COLORS.LOW;

  return (
    <InspectorMobileLayout
      title="Перевірка об'єкту"
      showBackButton
      onBack={() => window.history.back()}
    >
      <div className="space-y-4 p-4">

        {/* Заголовок */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${riskColor}`}>
              {RISK_LABELS[task.enrichment?.riskLevel] ?? task.enrichment?.riskLevel}
            </span>
            <span className="text-xs text-muted-foreground">
              Термін: {task.enrichment?.urgencyDays ?? "—"} дн.
            </span>
          </div>
          <h2 className="font-bold text-base leading-tight">{task.suspectName}</h2>
          <p className="text-sm text-muted-foreground">{task.address}</p>
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            <span className="rounded-md bg-muted px-2 py-0.5">{TYPE_LABELS[task.type] ?? task.type}</span>
            {task.taxId && <span className="rounded-md bg-muted px-2 py-0.5">ІПН: {task.taxId}</span>}
          </div>
        </div>

        {/* Кримінальна відповідальність */}
        {task.enrichment && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <p className="text-xs font-bold text-red-700 dark:text-red-400">Кримінальна відповідальність</p>
            </div>
            <p className="text-sm font-bold text-red-800 dark:text-red-300">{task.enrichment.criminalArticle}</p>
            <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{task.enrichment.legalBasis}</p>
          </div>
        )}

        {/* Рекомендовані дії */}
        {task.enrichment && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Рекомендовані дії</p>
            </div>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{task.enrichment.inspectorAction}</p>
            <div className={`mt-2 rounded-lg p-2 text-center text-xs font-bold ${
              task.enrichment.shouldVisit
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            }`}>
              {task.enrichment.shouldVisit ? "ПОТРІБЕН ВИЇЗД НА ОБ'ЄКТ" : "ДОКУМЕНТАЛЬНА ПЕРЕВІРКА"}
            </div>
          </div>
        )}

        {/* AI Рекомендації */}
        <AiRecommendation anomalyId={task.id} />

        {/* Карта */}
        {task.lat && task.lng ? (
          <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
            <h3 className="font-semibold text-sm">Карта</h3>
            <div className="flex h-40 items-center justify-center rounded-lg bg-muted">
              <MapPin className="h-10 w-10 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => window.open(`https://maps.google.com/?q=${task.lat},${task.lng}`, "_blank")}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Відкрити в навігації
            </Button>
          </div>
        ) : null}

        {/* Штраф */}
        {task.potentialFine ? (
          <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 p-4">
            <p className="text-xs text-muted-foreground">Потенційний штраф</p>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
              {task.potentialFine.toLocaleString("uk-UA")} ₴
            </p>
          </div>
        ) : null}

        {/* Фото */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3">Фото</h3>
          <Button variant="outline" className="w-full">
            <Camera className="mr-2 h-4 w-4" />
            Зробити фото
          </Button>
        </div>

        {/* Кнопки */}
        <div className="space-y-2 pb-4">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
            disabled={submitting}
            onClick={() => resolve(true)}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Підтвердити порушення
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            disabled={submitting}
            onClick={() => resolve(false)}
          >
            <XCircle className="mr-2 h-5 w-5" />
            Відхилити
          </Button>
        </div>
      </div>
    </InspectorMobileLayout>
  );
}
