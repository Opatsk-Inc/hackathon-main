import { useState, useEffect, useCallback } from "react";
import { HeadDesktopLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { AdminService } from "@/lib/api/admin.service";
import type { Anomaly, Inspector } from "@/lib/api/types";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  Loader2,
  Copy,
  Check,
  X,
  Scale,
  ClipboardList,
  Coins,
} from "lucide-react";

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

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  NEW: {
    label: "Новий",
    cls: "bg-slate-100/90 text-slate-700 ring-1 ring-slate-200/80",
  },
  IN_PROGRESS: {
    label: "В роботі",
    cls: "bg-sky-50/90 text-sky-700 ring-1 ring-sky-200/80",
  },
  RESOLVED: {
    label: "Вирішено",
    cls: "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200/80",
  },
};

function RiskBadge({ level }: { level: string }) {
  const cfg = RISK_CONFIG[level] ?? RISK_CONFIG.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NEW;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function AssignPanel({
  anomalyId,
  onAssigned,
}: {
  anomalyId: string;
  onAssigned: (inspectorId: string, inspectorName: string, magicLink: string) => void;
}) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [done, setDone] = useState(false);
  const [magicLink, setMagicLink] = useState("");
  const [copied, setCopied] = useState(false);

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

      const inspector = inspectors.find((i) => i.id === selectedId);
      const link = `${window.location.origin}/inspector/task/${anomalyId}?token=${inspector?.magicToken || ''}`;
      setMagicLink(link);
      setDone(true);
      onAssigned(selectedId, inspector?.name ?? selectedId, link);
    } catch (e) {
      console.error("Failed to assign inspector:", e);
    } finally {
      setAssigning(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (done) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2">
          <UserCheck className="h-4 w-4 text-emerald-600" />
          <p className="text-xs font-semibold text-emerald-700">
            Інспектора призначено. Завдання відправлено.
          </p>
        </div>
        <MagicLinkRow magicLink={magicLink} copied={copied} onCopy={copyToClipboard} />
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-white/70 bg-white/70 p-3 backdrop-blur-xl">
      <p className="text-xs font-semibold text-slate-700">Призначити польового інспектора</p>
      {loadingList ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Завантаження списку...
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-xl border border-white/70 bg-white/85 px-3 py-1.5 text-xs text-slate-800 backdrop-blur-xl focus:outline-none focus:ring-4 focus:ring-amber-500/20"
          >
            <option value="">— Оберіть інспектора —</option>
            {inspectors.map((ins) => (
              <option key={ins.id} value={ins.id}>
                {ins.name} ({ins.phone})
              </option>
            ))}
          </select>
          <Button size="sm" disabled={!selectedId || assigning} onClick={handleAssign} className="shrink-0">
            {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Викликати"}
          </Button>
        </div>
      )}
    </div>
  );
}

function MagicLinkRow({
  magicLink,
  copied,
  onCopy,
}: {
  magicLink: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/70 bg-white/70 p-3 backdrop-blur-xl">
      <p className="text-xs font-semibold text-slate-700">Magic Link для інспектора</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={magicLink}
          readOnly
          className="flex-1 select-all rounded-xl border border-white/70 bg-white/90 px-3 py-1.5 font-mono text-[11px] text-slate-800 backdrop-blur-xl"
          onClick={(e) => e.currentTarget.select()}
        />
        <Button size="sm" variant="outline" onClick={onCopy} className="shrink-0" title="Копіювати">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <p className="text-xs text-slate-500">Відправте це посилання інспектору через SMS або Telegram</p>
    </div>
  );
}

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
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const currentStatus = assignedName ? "IN_PROGRESS" : a.status;

  useEffect(() => {
    if (a.status === "IN_PROGRESS" && a.inspectorId && !magicLink) {
      AdminService.getInspectors()
        .then((list) => {
          const inspector = list.find((i) => i.id === a.inspectorId);
          if (inspector?.magicToken) {
            setMagicLink(`${window.location.origin}/inspector/task/${a.id}?token=${inspector.magicToken}`);
          }
        })
        .catch((err) => console.error("Failed to load inspectors:", err));
    }
  }, [a.status, a.inspectorId, a.id, magicLink]);

  const handleAssigned = (inspectorId: string, name: string, link: string) => {
    setAssignedName(name);
    setMagicLink(link);
    onAssigned(a.id, inspectorId, name);
  };

  const copyToClipboard = () => {
    if (!magicLink) return;
    navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_40px_100px_rgba(11,28,54,0.28)] backdrop-blur-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
              {a.suspectName}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">{a.address}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} className="shrink-0 text-slate-400 hover:text-slate-800">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <RiskBadge level={a.enrichment.riskLevel} />
          <StatusBadge status={currentStatus} />
          <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 font-medium text-slate-700 ring-1 ring-slate-200/80">
            {TYPE_LABELS[a.type] ?? a.type}
          </span>
          {a.taxId && (
            <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 font-mono text-slate-600 ring-1 ring-slate-200/80">
              ІПН: {a.taxId}
            </span>
          )}
        </div>

        <div className="space-y-1.5 rounded-2xl border border-rose-200/70 bg-rose-50/70 p-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-rose-700">
            <Scale className="h-3.5 w-3.5" />
            <p className="text-xs font-bold uppercase tracking-[0.08em]">Кримінальна відповідальність</p>
          </div>
          <p className="text-sm font-semibold text-rose-900">{a.enrichment.criminalArticle}</p>
          <p className="text-xs leading-relaxed text-rose-700">{a.enrichment.legalBasis}</p>
        </div>

        <div className="space-y-2 rounded-2xl border border-sky-200/70 bg-sky-50/70 p-3.5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sky-700">
            <ClipboardList className="h-3.5 w-3.5" />
            <p className="text-xs font-bold uppercase tracking-[0.08em]">Рекомендовані дії</p>
          </div>
          <p className="text-xs leading-relaxed text-sky-800">{a.enrichment.inspectorAction}</p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {a.enrichment.shouldVisit ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                Потрібен виїзд на об'єкт
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                Документальна перевірка
              </span>
            )}
            <span className="text-xs text-slate-600">Термін: {a.enrichment.urgencyDays} дн.</span>
          </div>
        </div>

        {a.potentialFine ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/70 bg-gradient-to-r from-amber-50/80 via-amber-50/60 to-white/50 p-3.5 backdrop-blur-xl">
            <div>
              <p className="text-xs text-slate-500">Потенційний штраф / недоотримані кошти</p>
              <p className="font-heading text-2xl font-semibold tracking-[-0.02em] text-amber-700">
                {a.potentialFine.toLocaleString("uk-UA")} ₴
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100/80 ring-1 ring-amber-200/70">
              <Coins className="h-5 w-5 text-amber-700" />
            </div>
          </div>
        ) : null}

        <div className="space-y-3 border-t border-white/70 pt-3">
          <p className="text-xs leading-relaxed text-slate-600">{a.description}</p>

          {currentStatus === "NEW" && !showAssign && (
            <Button className="w-full gap-2" onClick={() => setShowAssign(true)}>
              <UserCheck className="h-4 w-4" />
              Викликати інспектора
            </Button>
          )}

          {currentStatus === "IN_PROGRESS" && !assignedName && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-200/70 bg-sky-50/70 px-3 py-2">
              <UserCheck className="h-4 w-4 text-sky-600" />
              <p className="text-xs font-semibold text-sky-700">
                Інспектора вже призначено. Завдання в роботі.
              </p>
            </div>
          )}

          {showAssign && <AssignPanel anomalyId={a.id} onAssigned={handleAssigned} />}

          {assignedName && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-2">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-semibold text-emerald-700">Призначено: {assignedName}</p>
            </div>
          )}

          {currentStatus === "IN_PROGRESS" && magicLink && (
            <MagicLinkRow magicLink={magicLink} copied={copied} onCopy={copyToClipboard} />
          )}
        </div>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const loadAnomalies = useCallback(() => {
    AdminService.getDiscrepancies()
      .then((d) => {
        setAnomalies(d.items);
        setTotal(d.total);
      })
      .catch(() => setError("Не вдалося завантажити дані"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  const handleAssigned = useCallback((anomalyId: string, inspectorId: string) => {
    setAnomalies((prev) =>
      prev.map((a) =>
        a.id === anomalyId ? { ...a, status: "IN_PROGRESS", inspectorId } : a
      )
    );
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
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3.5 w-3.5 text-amber-600" />
      : <ArrowDown className="ml-1 h-3.5 w-3.5 text-amber-600" />;
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <HeadDesktopLayout currentPath="/head/discrepancies">
      <div className="mx-auto w-full space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.02em] text-slate-900">
              Розбіжності
            </h1>
            <p className="text-sm text-slate-500">
              Виявлені невідповідності між реєстрами ({total})
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadAnomalies}>
            Оновити
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((lvl) => {
            const active = filter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`group/chip inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-amber-400/70 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 shadow-[0_8px_22px_rgba(217,119,6,0.18)]"
                    : "border-white/70 bg-white/60 text-slate-600 backdrop-blur-xl hover:bg-white/85 hover:text-slate-900"
                }`}
              >
                {lvl !== "ALL" ? (
                  <span className={`h-1.5 w-1.5 rounded-full ${RISK_CONFIG[lvl]?.dot}`} />
                ) : null}
                {lvl === "ALL" ? `Всі (${total})` : `${RISK_CONFIG[lvl]?.label} (${countByRisk(lvl)})`}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_18px_40px_rgba(11,28,54,0.08)] backdrop-blur-2xl">
          <div className="flex items-end justify-between border-b border-white/60 px-6 py-5">
            <div>
              <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
                Виявлені розбіжності
              </h3>
              <p className="mt-0.5 text-sm text-slate-500">
                {filtered.length} з {total} записів
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">Завантаження...</div>
          ) : error ? (
            <div className="p-10 text-center text-sm text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Розбіжностей не знайдено. Завантажте дані для аналізу.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/60 bg-white/40">
                      {["Власник / ІПН", "Адреса", "Тип порушення"].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                        >
                          {h}
                        </th>
                      ))}
                      <th
                        className="cursor-pointer select-none px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 hover:text-slate-800"
                        onClick={() => handleSort('riskLevel')}
                      >
                        <div className="flex items-center">
                          Ризик
                          <SortIcon field="riskLevel" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Статус
                      </th>
                      <th
                        className="cursor-pointer select-none px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 hover:text-slate-800"
                        onClick={() => handleSort('potentialFine')}
                      >
                        <div className="flex items-center">
                          Потенційний дохід
                          <SortIcon field="potentialFine" />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                        Дії
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/60">
                    {paginatedData.map((a) => (
                      <tr
                        key={a.id}
                        className="transition-colors hover:bg-amber-50/40"
                      >
                        <td className="px-6 py-4">
                          <p className="text-sm font-semibold leading-tight text-slate-900">
                            {a.suspectName}
                          </p>
                          {a.taxId && (
                            <p className="mt-0.5 font-mono text-xs text-slate-500">{a.taxId}</p>
                          )}
                        </td>
                        <td className="max-w-[220px] truncate px-6 py-4 text-sm text-slate-600">
                          {a.address}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                            {TYPE_LABELS[a.type] ?? a.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <RiskBadge level={a.enrichment?.riskLevel ?? "LOW"} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={a.status} />
                        </td>
                        <td className="px-6 py-4 font-mono text-sm font-semibold tabular-nums text-amber-700">
                          {a.potentialFine ? `${a.potentialFine.toLocaleString("uk-UA")} ₴` : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="outline" size="sm" onClick={() => setSelected(a)}>
                            Деталі
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-white/60 px-6 py-4">
                  <p className="text-sm text-slate-500">
                    Сторінка {currentPage} з {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Назад
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Вперед
                      <ChevronRight className="h-4 w-4" />
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
