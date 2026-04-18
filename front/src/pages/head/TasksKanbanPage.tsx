import { useState, useEffect, useCallback } from "react";
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

const RISK_CONFIG: Record<string, { label: string; dot: string }> = {
  CRITICAL: { label: "Критичний", dot: "bg-red-500" },
  HIGH:     { label: "Високий",   dot: "bg-orange-500" },
  MEDIUM:   { label: "Середній",  dot: "bg-yellow-500" },
  LOW:      { label: "Низький",   dot: "bg-green-500" },
};

function TaskCard({ anomaly }: { anomaly: Anomaly }) {
  const risk = RISK_CONFIG[anomaly.enrichment?.riskLevel] ?? RISK_CONFIG.LOW;
  const daysLeft = anomaly.enrichment?.urgencyDays ?? 30;

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full shrink-0 ${risk.dot}`} />
          <span className="text-xs font-semibold text-muted-foreground">{risk.label}</span>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(anomaly.createdAt).toLocaleDateString("uk-UA")}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold leading-tight">{anomaly.suspectName}</p>
        {anomaly.taxId && <p className="text-xs text-muted-foreground">ІПН: {anomaly.taxId}</p>}
      </div>

      <div className="flex items-start gap-1.5">
        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-tight line-clamp-2">{anomaly.address}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs">
          {TYPE_LABELS[anomaly.type] ?? anomaly.type}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{daysLeft} дн.</span>
        </div>
      </div>

      {anomaly.potentialFine ? (
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 border-t pt-2">
          {anomaly.potentialFine.toLocaleString("uk-UA")} ₴
        </p>
      ) : null}

      {anomaly.enrichment?.shouldVisit && (
        <div className="flex items-center gap-1.5 rounded-md bg-red-50 dark:bg-red-950/20 px-2 py-1">
          <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">Потрібен виїзд</p>
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
}: {
  title: string;
  status: string;
  items: Anomaly[];
  headerCls: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border bg-muted/20 overflow-hidden">
      <div className={`border-b px-5 py-4 ${headerCls}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="rounded-full bg-background/80 px-2.5 py-0.5 text-xs font-bold">
            {items.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">завдань</p>
      </div>
      <div className="flex-1 space-y-3 p-4 min-h-[200px]">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Немає завдань з цим статусом
          </p>
        ) : (
          items.map((a) => <TaskCard key={a.id} anomaly={a} />)
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
            <h1 className="text-3xl font-bold tracking-tight">Завдання</h1>
            <p className="text-muted-foreground">Керування завданнями для інспекторів</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => load(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Оновити
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Завантаження...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Column
              title="Очікують"
              status="NEW"
              items={pending}
              headerCls="bg-gray-50 dark:bg-gray-900/30"
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
