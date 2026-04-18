import { useState, useEffect, useCallback } from "react";
import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { AdminService } from "@/lib/api/admin.service";
import type { Anomaly, Inspector } from "@/lib/api/types";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, UserCheck, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 10;

type SortField = 'potentialFine' | 'riskLevel' | null;
type SortDirection = 'asc' | 'desc';

const RISK_ORDER = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

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

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  NEW:         { label: "Новий",       cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  IN_PROGRESS: { label: "В роботі",   cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  RESOLVED:    { label: "Вирішено",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
};

function RiskBadge({ level }: { level: string }) {
  const cfg = RISK_CONFIG[level] ?? RISK_CONFIG.LOW;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NEW;
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ── Assign Panel (inside modal) ───────────────────────────────────────────────

function AssignPanel({
  anomalyId,
  onAssigned,
}: {
  anomalyId: string;
  onAssigned: (inspectorId: string, inspectorName: string) => void;
}) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    AdminService.getInspectors()
      .then(setInspectors)
      .finally(() => setLoadingList(false));
  }, []);

  const handleAssign = async () => {
    if (!selectedId) return;
    setAssigning(true);
    try {
      const result = await AdminService.assignTask([anomalyId], selectedId);
      if (result?.assigned === 0) {
        console.warn("assignTask returned 0 updated rows — possible hromadaId mismatch");
      }
      setDone(true);
      const inspector = inspectors.find((i) => i.id === selectedId);
      onAssigned(selectedId, inspector?.name ?? selectedId);
    } catch (e) {
      console.error("Failed to assign inspector:", e);
    } finally {
      setAssigning(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2">
        <UserCheck className="h-4 w-4 text-green-600" />
        <p className="text-xs font-semibold text-green-700 dark:text-green-400">
          Інспектора призначено. Завдання відправлено.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
      <p className="text-xs font-semibold text-foreground">Призначити польового інспектора</p>
      {loadingList ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Завантаження списку...
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">— Оберіть інспектора —</option>
            {inspectors.map((ins) => (
              <option key={ins.id} value={ins.id}>
                {ins.name} ({ins.phone})
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={!selectedId || assigning}
            onClick={handleAssign}
            className="shrink-0 text-xs"
          >
            {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : "Викликати"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Anomaly Modal ─────────────────────────────────────────────────────────────

function AnomalyModal({
  a,
  onClose,
  onAssigned,
}: {
  a: Anomaly;
  onClose: () => void;
  onAssigned: (anomalyId: string, inspectorId: string, inspectorName: string) => void;
}) {
  const [showAssign, setShowAssign] = useState(false);
  const [assignedName, setAssignedName] = useState<string | null>(null);
  const currentStatus = assignedName ? "IN_PROGRESS" : a.status;

  const handleAssigned = (inspectorId: string, name: string) => {
    setAssignedName(name);
    onAssigned(a.id, inspectorId, name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border bg-card shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{a.suspectName}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{a.address}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-2xl leading-none shrink-0">&times;</button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <RiskBadge level={a.enrichment.riskLevel} />
          <StatusBadge status={currentStatus} />
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

        {/* Опис + кнопка Викликати інспектора */}
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{a.description}</p>

          {currentStatus === "NEW" && !showAssign && (
            <Button
              className="w-full gap-2"
              onClick={() => setShowAssign(true)}
            >
              <UserCheck className="h-4 w-4" />
              Викликати інспектора
            </Button>
          )}

          {currentStatus === "IN_PROGRESS" && !assignedName && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 px-3 py-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Інспектора вже призначено. Завдання в роботі.</p>
            </div>
          )}

          {showAssign && (
            <AssignPanel anomalyId={a.id} onAssigned={handleAssigned} />
          )}

          {assignedName && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <p className="text-xs font-semibold text-green-700 dark:text-green-400">
                Призначено: {assignedName}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DiscrepanciesPage() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Anomaly | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadAnomalies = useCallback(() => {
    AdminService.getDiscrepancies()
      .then((d) => { setAnomalies(d.items); setTotal(d.total); })
      .catch(() => setError("Не вдалося завантажити дані"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadAnomalies(); }, [loadAnomalies]);

  // Sync status in local state when inspector is assigned
  const handleAssigned = useCallback((anomalyId: string, inspectorId: string) => {
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === anomalyId
          ? { ...a, status: "IN_PROGRESS", inspectorId }
          : a
      )
    );
    // Also update selected modal if it's the same anomaly
    setSelected((prev) =>
      prev?.id === anomalyId ? { ...prev, status: "IN_PROGRESS", inspectorId } : prev
    );
  }, []);

  const filtered = filter === "ALL"
    ? anomalies
    : anomalies.filter((a) => a.enrichment?.riskLevel === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    if (sortField === 'potentialFine') {
      const aVal = a.potentialFine ?? 0;
      const bVal = b.potentialFine ?? 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    if (sortField === 'riskLevel') {
      const aVal = RISK_ORDER[a.enrichment?.riskLevel as keyof typeof RISK_ORDER] ?? 0;
      const bVal = RISK_ORDER[b.enrichment?.riskLevel as keyof typeof RISK_ORDER] ?? 0;
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const countByRisk = (lvl: string) => anomalies.filter((a) => a.enrichment?.riskLevel === lvl).length;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />;
  };

  useEffect(() => { setCurrentPage(1); }, [filter]);

  return (
    <HeadDesktopLayout currentPath="/head/discrepancies">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Розбіжності</h1>
            <p className="text-muted-foreground">Виявлені невідповідності між реєстрами ({total})</p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnomalies}>
            Оновити
          </Button>
        </div>

        {/* Фільтри */}
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

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b px-6 py-5">
            <h3 className="text-lg font-semibold">Виявлені розбіжності</h3>
            <p className="text-sm text-muted-foreground mt-1">{filtered.length} з {total} записів</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Завантаження...</div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-red-500">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Розбіжностей не знайдено. Завантажте дані для аналізу.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      {["Власник / ІПН", "Адреса", "Тип порушення"].map((h) => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
                      ))}
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSort('riskLevel')}
                      >
                        <div className="flex items-center">Ризик<SortIcon field="riskLevel" /></div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Статус</th>
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground select-none"
                        onClick={() => handleSort('potentialFine')}
                      >
                        <div className="flex items-center">Потенційний дохід<SortIcon field="potentialFine" /></div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedData.map((a, idx) => (
                      <tr
                        key={a.id}
                        className={`transition-colors hover:bg-muted/50 ${idx % 2 === 0 ? "bg-card" : "bg-muted/20"}`}
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium leading-tight">{a.suspectName}</p>
                          {a.taxId && <p className="text-xs text-muted-foreground mt-0.5">{a.taxId}</p>}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-[200px] truncate">{a.address}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${RISK_CONFIG[a.enrichment?.riskLevel]?.cls || RISK_CONFIG.LOW.cls}`}>
                            {TYPE_LABELS[a.type] ?? a.type}
                          </span>
                        </td>
                        <td className="px-6 py-4"><RiskBadge level={a.enrichment?.riskLevel ?? "LOW"} /></td>
                        <td className="px-6 py-4"><StatusBadge status={a.status} /></td>
                        <td className="px-6 py-4 text-sm font-semibold text-[#A27B5C]">
                          {a.potentialFine ? `${a.potentialFine.toLocaleString("uk-UA")} ₴` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-[#A27B5C] hover:text-white hover:border-[#A27B5C] transition-colors"
                            onClick={() => setSelected(a)}
                          >
                            Деталі
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="border-t px-6 py-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Сторінка {currentPage} з {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft className="h-4 w-4" />Назад
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                      Вперед<ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selected && (
        <AnomalyModal
          a={selected}
          onClose={() => setSelected(null)}
          onAssigned={(anomalyId, inspectorId, inspectorName) => {
            handleAssigned(anomalyId, inspectorId);
            void inspectorName;
          }}
        />
      )}
    </HeadDesktopLayout>
  );
}
