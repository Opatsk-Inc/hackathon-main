import { useState, useEffect } from "react";
import { HeadDesktopLayout } from "@/components/layouts";
import { AdminService } from "@/lib/api/admin.service";
import type { Anomaly } from "@/lib/api/types";

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Немає нерухомості",
  MISSING_IN_LAND: "Немає земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const RISK_CONFIG: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: "Критичний", cls: "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-300" },
  HIGH:     { label: "Високий",   cls: "bg-orange-100 text-orange-800 ring-1 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-300" },
  MEDIUM:   { label: "Середній",  cls: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300" },
  LOW:      { label: "Низький",   cls: "bg-green-100 text-green-700 ring-1 ring-green-300 dark:bg-green-900/30 dark:text-green-300" },
};

function RiskBadge({ level }: { level: string }) {
  const cfg = RISK_CONFIG[level] ?? RISK_CONFIG.LOW;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function AnomalyModal({ a, onClose }: { a: Anomaly; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{a.suspectName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{a.address}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none shrink-0">&times;</button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <RiskBadge level={a.enrichment.riskLevel} />
          <span className="rounded-md bg-muted px-2 py-0.5 font-medium">{TYPE_LABELS[a.type] ?? a.type}</span>
          {a.taxId && <span className="rounded-md bg-muted px-2 py-0.5">ІПН: {a.taxId}</span>}
        </div>

        {/* Кримінальна відповідальність */}
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-3 space-y-1">
          <p className="text-xs font-bold text-red-700 dark:text-red-400">⚖ Кримінальна відповідальність</p>
          <p className="text-sm font-bold text-red-800 dark:text-red-300">{a.enrichment.criminalArticle}</p>
          <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">{a.enrichment.legalBasis}</p>
        </div>

        {/* Рекомендовані дії */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 space-y-2">
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400">📋 Рекомендовані дії інспектору</p>
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{a.enrichment.inspectorAction}</p>
          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {a.enrichment.shouldVisit ? (
              <span className="text-xs font-bold text-red-600">🔴 Потрібен виїзд на об'єкт</span>
            ) : (
              <span className="text-xs text-muted-foreground">⚪ Документальна перевірка</span>
            )}
            <span className="text-xs text-muted-foreground">Термін: {a.enrichment.urgencyDays} дн.</span>
          </div>
        </div>

        {/* Штраф */}
        {a.potentialFine ? (
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/20 p-3">
            <p className="text-xs text-muted-foreground">Потенційний штраф / недоотримані кошти</p>
            <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
              {a.potentialFine.toLocaleString("uk-UA")} ₴
            </p>
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-3">{a.description}</p>
      </div>
    </div>
  );
}

export function DiscrepanciesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    AdminService.getDiscrepancies()
      .then((d) => { setAnomalies(d.items); setTotal(d.total); })
      .catch(() => setError("Не вдалося завантажити дані"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL"
    ? anomalies
    : anomalies.filter((a) => a.enrichment?.riskLevel === filter);

  const countByRisk = (lvl: string) => anomalies.filter((a) => a.enrichment?.riskLevel === lvl).length;

  return (
    <HeadDesktopLayout currentPath="/head/discrepancies">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Розбіжності</h1>
            <p className="text-muted-foreground">Виявлені невідповідності між реєстрами ({total})</p>
          </div>
        </div>

        {/* Фільтри по ризику */}
        <div className="flex gap-2 flex-wrap">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilter(lvl)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                filter === lvl
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-muted"
              }`}
            >
              {lvl === "ALL" ? `Всі (${total})` : `${RISK_CONFIG[lvl]?.label} (${countByRisk(lvl)})`}
            </button>
          ))}
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Завантаження...</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Розбіжностей не знайдено. Завантажте дані для аналізу.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b bg-muted/30">
                  <tr>
                    {["Власник / ІПН", "Адреса", "Тип", "Ризик", "Штраф", "Дія"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => setSelected(a)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium leading-tight">{a.suspectName}</p>
                        {a.taxId && <p className="text-xs text-muted-foreground">{a.taxId}</p>}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">{a.address}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{TYPE_LABELS[a.type] ?? a.type}</td>
                      <td className="px-4 py-3">
                        <RiskBadge level={a.enrichment?.riskLevel ?? "LOW"} />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                        {a.potentialFine ? `${a.potentialFine.toLocaleString("uk-UA")} ₴` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {a.enrichment?.shouldVisit ? (
                          <span className="text-red-600 font-medium">Виїхати</span>
                        ) : (
                          <span className="text-muted-foreground">Документально</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && <AnomalyModal a={selected} onClose={() => setSelected(null)} />}
    </HeadDesktopLayout>
  );
}
