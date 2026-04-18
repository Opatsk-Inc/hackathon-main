import { useState, useEffect, useCallback, useRef } from "react";
import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { AdminService } from "@/lib/api/admin.service";
import type { Anomaly } from "@/lib/api/types";
import { MapPin, Clock, AlertTriangle, RefreshCw } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Немає нерухомості",
  MISSING_IN_LAND: "Немає земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const RISK_CONFIG: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: "Критичний", cls: "bg-red-100 text-red-900 ring-1 ring-red-400" },
  HIGH:     { label: "Високий",   cls: "bg-orange-100 text-orange-900 ring-1 ring-orange-400" },
  MEDIUM:   { label: "Середній",  cls: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-400" },
  LOW:      { label: "Низький",   cls: "bg-green-100 text-green-900 ring-1 ring-green-400" },
};

function TaskCard({ anomaly, status }: { anomaly: Anomaly; status: string }) {
  const risk = RISK_CONFIG[anomaly.enrichment?.riskLevel] ?? RISK_CONFIG.LOW;
  const daysLeft = anomaly.enrichment?.urgencyDays ?? 30;

  return (
    <div className="rounded-xl border border-white/60 bg-white/50 backdrop-blur-md p-4 shadow-sm space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${risk.cls}`}>
          {risk.label}
        </span>
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {new Date(anomaly.createdAt).toLocaleDateString("uk-UA")}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold leading-tight text-slate-800">{anomaly.suspectName}</p>
        {anomaly.taxId && <p className="text-xs text-slate-500">ІПН: {anomaly.taxId}</p>}
      </div>

      <div className="flex items-start gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-tight line-clamp-2">{anomaly.address}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {TYPE_LABELS[anomaly.type] ?? anomaly.type}
        </span>
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>{daysLeft} дн.</span>
        </div>
      </div>

      {anomaly.potentialFine ? (
        <p className="text-xs font-bold text-orange-600 border-t border-white/60 pt-2">
          {anomaly.potentialFine.toLocaleString("uk-UA")} ₴
        </p>
      ) : null}

      {anomaly.enrichment?.shouldVisit && status !== "RESOLVED" && (
        <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 ${
          status === "IN_PROGRESS"
            ? "bg-blue-100 text-blue-900 ring-1 ring-blue-400"
            : "bg-red-100 text-red-900 ring-1 ring-red-400"
        }`}>
          <AlertTriangle className={`h-3.5 w-3.5 shrink-0 ${status === "IN_PROGRESS" ? "text-blue-900" : "text-red-900"}`} />
          <p className={`text-xs font-semibold ${status === "IN_PROGRESS" ? "text-blue-900" : "text-red-900"}`}>
            {status === "IN_PROGRESS" ? "Виїзд призначено" : "Потрібен виїзд"}
          </p>
        </div>
      )}
    </div>
  );
}

function Column({
  title,
  status,
  items,
  headerCls,
  enableInfiniteScroll = false,
}: {
  title: string;
  status: string;
  items: Anomaly[];
  headerCls: string;
  enableInfiniteScroll?: boolean;
}) {
  const [displayCount, setDisplayCount] = useState(10);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!enableInfiniteScroll) return;

    const target = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setDisplayCount(prev => Math.min(prev + 10, items.length));
    }
  }, [enableInfiniteScroll, items.length]);

  useEffect(() => {
    setDisplayCount(10);
  }, [items.length]);

  const displayedItems = enableInfiniteScroll ? items.slice(0, displayCount) : items;

  return (
    <div className="flex flex-col rounded-xl border border-white/60 bg-white/30 backdrop-blur-md overflow-hidden">
      <div className={`border-b border-white/60 px-5 py-4 ${headerCls}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-bold text-slate-800">
            {items.length}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-0.5">завдань</p>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-y-scroll space-y-3 p-4 custom-scrollbar"
        style={{ height: '600px', maxHeight: 'calc(100vh - 300px)' }}
      >
        {displayedItems.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
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
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const d = await AdminService.getDiscrepancies();
      setAnomalies(d.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending     = anomalies.filter((a) => a.status === "NEW");
  const inProgress  = anomalies.filter((a) => a.status === "IN_PROGRESS");
  const resolved    = anomalies.filter((a) => a.status === "RESOLVED");

  return (
    <HeadDesktopLayout currentPath="/head/tasks">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">Завдання</h1>
            <p className="text-slate-500">Керування завданнями для інспекторів</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
            className="gap-2 bg-white text-slate-800 border-slate-300 hover:bg-slate-100"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Оновити
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Завантаження...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Column
              title="Очікують"
              status="NEW"
              items={pending}
              headerCls="bg-gray-50 dark:bg-gray-900/30"
              enableInfiniteScroll={true}
            />
            <Column
              title="В роботі"
              status="IN_PROGRESS"
              items={inProgress}
              headerCls="bg-blue-50 dark:bg-blue-950/20"
            />
            <Column
              title="Завершено"
              status="RESOLVED"
              items={resolved}
              headerCls="bg-green-50 dark:bg-green-950/20"
            />
          </div>
        )}
      </div>
    </HeadDesktopLayout>
  );
}
