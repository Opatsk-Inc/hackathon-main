import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { InspectorMobileLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Scale,
  ClipboardList,
  Coins,
  Clock,
  Loader2,
} from "lucide-react";
import { ApiClient } from "@/lib/api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Anomaly } from "@/lib/api/types";
import { AiRecommendation } from "@/components/AiRecommendation";

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Відсутність нерухомості",
  MISSING_IN_LAND: "Відсутність земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const RISK_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  CRITICAL: {
    label: "Критичний",
    cls: "bg-rose-50/90 text-rose-700 ring-1 ring-rose-200/80",
    dot: "bg-rose-500",
  },
  HIGH: {
    label: "Високий",
    cls: "bg-amber-50/90 text-amber-800 ring-1 ring-amber-200/80",
    dot: "bg-amber-500",
  },
  MEDIUM: {
    label: "Середній",
    cls: "bg-yellow-50/90 text-yellow-800 ring-1 ring-yellow-200/80",
    dot: "bg-yellow-500",
  },
  LOW: {
    label: "Низький",
    cls: "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
};

export function TaskInspectionPage() {
  const { id } = useParams<{ id: string }>();
  const [task, setTask] = useState<Anomaly | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ApiClient.get<Anomaly[]>("/api/mobile/tasks")
      .then((tasks) => setTask(tasks.find((t) => t.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  const queryClient = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: async ({ confirmed, comment = "" }: { confirmed: boolean; comment?: string }) => {
      if (!task) return;
      return ApiClient.patch(`/api/mobile/tasks/${task.id}/resolve`, {
        status: confirmed ? "RESOLVED" : "CANCELLED",
        comment,
      });
    },
    onSuccess: () => {
      // Invalidate queries to reflect changes on dashboard and task lists
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancies'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      window.history.back();
    },
    onError: (e) => {
      console.error("Failed to resolve task:", e);
    }
  });

  const resolve = (confirmed: boolean) => {
    resolveMutation.mutate({ confirmed });
  };

  if (loading) {
    return (
      <InspectorMobileLayout title="Перевірка" showBackButton onBack={() => window.history.back()}>
        <div className="flex flex-col items-center justify-center gap-3 p-12 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
          <p className="text-sm">Завантаження...</p>
        </div>
      </InspectorMobileLayout>
    );
  }

  if (!task) {
    return (
      <InspectorMobileLayout title="Перевірка" showBackButton onBack={() => window.history.back()}>
        <div className="p-8 text-center text-sm text-rose-600">Завдання не знайдено</div>
      </InspectorMobileLayout>
    );
  }

  const risk = RISK_CONFIG[task.enrichment?.riskLevel] ?? RISK_CONFIG.LOW;

  return (
    <InspectorMobileLayout
      title="Перевірка об'єкту"
      subtitle="Деталі завдання"
      showBackButton
      onBack={() => window.history.back()}
    >
      <div className="space-y-4 p-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-5 shadow-[0_14px_36px_rgba(11,28,54,0.08)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl" />

          <div className="relative space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${risk.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                {risk.label}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 tabular-nums">
                <Clock className="h-3 w-3" />
                {task.enrichment?.urgencyDays ?? "—"} дн.
              </span>
            </div>

            <div>
              <h2 className="font-heading text-lg font-semibold leading-tight tracking-[-0.01em] text-slate-900">
                {task.suspectName}
              </h2>
              <p className="mt-1 text-sm text-slate-600">{task.address}</p>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200/70">
                {TYPE_LABELS[task.type] ?? task.type}
              </span>
              {task.taxId && (
                <span className="inline-flex items-center rounded-full bg-slate-100/80 px-2.5 py-0.5 font-mono text-xs text-slate-700 ring-1 ring-slate-200/70">
                  ІПН: {task.taxId}
                </span>
              )}
            </div>
          </div>
        </div>

        {task.enrichment && (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 shrink-0 text-rose-600" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-rose-700">
                Кримінальна відповідальність
              </p>
            </div>
            <p className="mt-2 text-sm font-semibold text-rose-800">
              {task.enrichment.criminalArticle}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-rose-700/90">
              {task.enrichment.legalBasis}
            </p>
          </div>
        )}

        {task.enrichment && (
          <div className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 shrink-0 text-sky-600" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sky-700">
                Рекомендовані дії
              </p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-sky-900">
              {task.enrichment.inspectorAction}
            </p>
            <div
              className={`mt-3 rounded-xl px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.08em] ${
                task.enrichment.shouldVisit
                  ? "bg-rose-100/80 text-rose-700 ring-1 ring-rose-200/70"
                  : "bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/70"
              }`}
            >
              {task.enrichment.shouldVisit ? "Потрібен виїзд на об'єкт" : "Документальна перевірка"}
            </div>
          </div>
        )}

        <AiRecommendation anomalyId={task.id} />

        {task.lat && task.lng ? (
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_14px_36px_rgba(11,28,54,0.06)] backdrop-blur-2xl">
            <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-slate-900">
              Карта
            </p>
            <div className="mt-3 flex h-40 items-center justify-center rounded-xl border border-white/60 bg-slate-100/60 backdrop-blur-xl">
              <MapPin className="h-10 w-10 text-slate-400" />
            </div>
            <Button
              variant="outline"
              className="mt-3 w-full gap-2"
              onClick={() => window.open(`https://maps.google.com/?q=${task.lat},${task.lng}`, "_blank")}
            >
              <MapPin className="h-4 w-4" />
              Відкрити в навігації
            </Button>
          </div>
        ) : null}

        {task.potentialFine ? (
          <div className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/90 ring-1 ring-amber-200/70">
                <Coins className="h-4 w-4 text-amber-700" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                Потенційний штраф
              </p>
            </div>
            <p className="font-heading text-xl font-semibold tracking-[-0.02em] tabular-nums text-amber-800">
              {task.potentialFine.toLocaleString("uk-UA")} ₴
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_14px_36px_rgba(11,28,54,0.06)] backdrop-blur-2xl">
          <p className="font-heading text-sm font-semibold tracking-[-0.01em] text-slate-900">
            Фото
          </p>
          <Button variant="outline" className="mt-3 w-full gap-2">
            <Camera className="h-4 w-4" />
            Зробити фото
          </Button>
        </div>

        <div className="space-y-2.5 pb-4 pt-1">
          <Button
            className="w-full gap-2 bg-emerald-600 text-white shadow-[0_12px_30px_rgba(5,150,105,0.28)] hover:bg-emerald-500 hover:shadow-[0_16px_38px_rgba(5,150,105,0.34)]"
            size="lg"
            disabled={resolveMutation.isPending}
            onClick={() => resolve(true)}
          >
            <CheckCircle className="h-5 w-5" />
            Підтвердити порушення
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2 border-rose-200/80 bg-white/80 text-rose-700 hover:bg-rose-50/80 hover:text-rose-800"
            size="lg"
            disabled={resolveMutation.isPending}
            onClick={() => resolve(false)}
          >
            <XCircle className="h-5 w-5" />
            Відхилити
          </Button>
        </div>
      </div>
    </InspectorMobileLayout>
  );
}
