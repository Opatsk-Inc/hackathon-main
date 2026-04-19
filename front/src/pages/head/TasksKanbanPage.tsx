import { useState, useEffect, useCallback, useRef } from "react";
import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { useDiscrepancies } from "@/lib/hooks/useDiscrepancies";
import type { Anomaly } from "@/lib/api/types";
import {
  MapPin,
  Clock,
  AlertTriangle,
  RefreshCw,
  Hourglass,
  Loader2,
  CheckCircle2,
} from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Немає нерухомості",
  MISSING_IN_LAND: "Немає земельної ділянки",
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

const COLUMN_CONFIG: Record<string, {
  title: string;
  headerBg: string;
  titleColor: string;
  icon: typeof Hourglass;
  iconBg: string;
  accent: string;
}> = {
  NEW: {
    title: "Очікують",
    headerBg: "bg-gradient-to-r from-slate-50/80 to-white/40",
    titleColor: "text-slate-700",
    icon: Hourglass,
    iconBg: "bg-slate-100/80 text-slate-600 ring-1 ring-slate-200/70",
    accent: "from-slate-300 to-slate-400",
  },
  IN_PROGRESS: {
    title: "В роботі",
    headerBg: "bg-gradient-to-r from-sky-50/80 to-sky-50/30",
    titleColor: "text-sky-700",
    icon: Loader2,
    iconBg: "bg-sky-100/80 text-sky-700 ring-1 ring-sky-200/70",
    accent: "from-sky-400 to-sky-600",
  },
  RESOLVED: {
    title: "Завершено",
    headerBg: "bg-gradient-to-r from-emerald-50/80 to-emerald-50/30",
    titleColor: "text-emerald-700",
    icon: CheckCircle2,
    iconBg: "bg-emerald-100/80 text-emerald-700 ring-1 ring-emerald-200/70",
    accent: "from-emerald-400 to-emerald-600",
  },
};

function TaskCard({ anomaly, status }: { anomaly: Anomaly; status: string }) {
  const risk = RISK_CONFIG[anomaly.enrichment?.riskLevel] ?? RISK_CONFIG.LOW;
  const daysLeft = anomaly.enrichment?.urgencyDays ?? 30;

  return (
    <div className="group/task space-y-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_10px_24px_rgba(11,28,54,0.05)] backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(11,28,54,0.06),0_18px_38px_rgba(11,28,54,0.10)]">
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${risk.cls}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
          {risk.label}
        </span>
        <span className="whitespace-nowrap text-xs text-slate-400 tabular-nums">
          {new Date(anomaly.createdAt).toLocaleDateString("uk-UA")}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold leading-tight text-slate-900">
          {anomaly.suspectName}
        </p>
        {anomaly.taxId && (
          <p className="mt-0.5 font-mono text-xs text-slate-500">ІПН: {anomaly.taxId}</p>
        )}
      </div>

      <div className="flex items-start gap-1.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <p className="line-clamp-2 text-xs leading-tight text-slate-500">{anomaly.address}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200/70">
          {TYPE_LABELS[anomaly.type] ?? anomaly.type}
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-500 tabular-nums">
          <Clock className="h-3 w-3" />
          <span>{daysLeft} дн.</span>
        </div>
      </div>

      {anomaly.potentialFine ? (
        <div className="flex items-center justify-between border-t border-white/60 pt-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Штраф
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-amber-700">
            {anomaly.potentialFine.toLocaleString("uk-UA")} ₴
          </span>
        </div>
      ) : null}

      {anomaly.enrichment?.shouldVisit && status !== "RESOLVED" && (
        <div
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 ring-1 ${
            status === "IN_PROGRESS"
              ? "bg-sky-50/80 text-sky-700 ring-sky-200/70"
              : "bg-rose-50/80 text-rose-700 ring-rose-200/70"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <p className="text-xs font-semibold">
            {status === "IN_PROGRESS" ? "Виїзд призначено" : "Потрібен виїзд"}
          </p>
        </div>
      )}
    </div>
  );
}

function Column({
  status,
  items,
  enableInfiniteScroll = false,
}: {
  status: string;
  items: Anomaly[];
  enableInfiniteScroll?: boolean;
}) {
  const [displayCount, setDisplayCount] = useState(10);
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = COLUMN_CONFIG[status];
  const Icon = config.icon;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!enableInfiniteScroll) return;

      const target = e.currentTarget;
      const { scrollTop, scrollHeight, clientHeight } = target;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setDisplayCount((prev) => Math.min(prev + 10, items.length));
      }
    },
    [enableInfiniteScroll, items.length]
  );

  useEffect(() => {
    setDisplayCount(10);
  }, [items.length]);

  const displayedItems = enableInfiniteScroll ? items.slice(0, displayCount) : items;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/40 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_14px_36px_rgba(11,28,54,0.06)] backdrop-blur-2xl">
      <div className={`relative overflow-hidden border-b border-white/60 px-5 py-4 ${config.headerBg}`}>
        <span
          className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${config.accent}`}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${config.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className={`font-heading font-semibold tracking-[-0.01em] ${config.titleColor}`}>
              {config.title}
            </h3>
          </div>
          <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-bold tabular-nums text-slate-800 ring-1 ring-white/60">
            {items.length}
          </span>
        </div>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="custom-scrollbar space-y-3 overflow-y-auto p-4"
        style={{ height: "600px", maxHeight: "calc(100vh - 300px)" }}
      >
        {displayedItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Немає завдань з цим статусом
          </p>
        ) : (
          displayedItems.map((a) => <TaskCard key={a.id} anomaly={a} status={status} />)
        )}
      </div>
    </div>
  );
}

export function TasksKanbanPage() {
  const { data, isLoading, isFetching, refetch } = useDiscrepancies();
  const anomalies = data?.items ?? [];

  const load = useCallback(() => {
    refetch();
  }, [refetch]);

  const refreshing = isFetching && !isLoading;

  const effectiveStatus = (a: Anomaly) =>
    a.inspectorId && a.status === "NEW" ? "IN_PROGRESS" : a.status;

  const pending = anomalies.filter((a) => effectiveStatus(a) === "NEW");
  const inProgress = anomalies.filter((a) => effectiveStatus(a) === "IN_PROGRESS");
  const resolved = anomalies.filter((a) => effectiveStatus(a) === "RESOLVED");

  return (
    <HeadDesktopLayout currentPath="/head/tasks">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-slate-900">
              Завдання
            </h1>
            <p className="text-sm text-slate-500">Керування завданнями для інспекторів</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load()}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Оновити
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Завантаження...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Column status="NEW" items={pending} enableInfiniteScroll />
            <Column status="IN_PROGRESS" items={inProgress} />
            <Column status="RESOLVED" items={resolved} />
          </div>
        )}
      </div>
    </HeadDesktopLayout>
  );
}
