import { Button } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useDiscrepancies } from "@/lib/hooks/useDiscrepancies";
import type { Anomaly } from "@/lib/api/types";
import { useMemo, useState } from "react";
import { X, Scale, ClipboardList, Coins } from "lucide-react";

function extractStreetAddress(fullAddress: string): string {
  if (!fullAddress) return "";
  const parts = fullAddress.split(',').map(p => p.trim());
  const streetKeywords = /вул\.|вулиця|пр\.|проспект|провулок|бульвар|площа|шосе/i;
  const streetPart = parts.find(p => streetKeywords.test(p));
  return streetPart || parts[parts.length - 1] || fullAddress;
}

const columnHelper = createColumnHelper<Anomaly>();

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

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Комерція на житловій землі",
  MISSING_IN_LAND: "Неоформлена земля",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Занижена площа",
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

function AnomalyModal({ a, onClose }: { a: Anomaly; onClose: () => void }) {
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

        <p className="border-t border-white/70 pt-3 text-xs leading-relaxed text-slate-600">
          {a.description}
        </p>
      </div>
    </div>
  );
}

export function TopViolationsTable() {
  const [selected, setSelected] = useState<Anomaly | null>(null);

  const { data: anomaliesData, isLoading } = useDiscrepancies();

  const topViolations = useMemo(() => {
    if (!anomaliesData?.items) return [];
    return [...anomaliesData.items]
      .filter((a) => a.potentialFine && a.potentialFine > 0)
      .sort((a, b) => (b.potentialFine || 0) - (a.potentialFine || 0))
      .slice(0, 5);
  }, [anomaliesData]);

  const columns = [
    columnHelper.accessor("address", {
      header: "Адреса",
      cell: (info) => (
        <span className="font-medium text-slate-800">
          {extractStreetAddress(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("type", {
      header: "Тип порушення",
      cell: (info) => (
        <span className="inline-flex items-center rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
          {TYPE_LABELS[info.getValue()] || info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("enrichment.riskLevel", {
      id: "risk",
      header: "Ризик",
      cell: (info) => <RiskBadge level={(info.getValue() as string) ?? "LOW"} />,
    }),
    columnHelper.accessor("potentialFine", {
      header: "Потенційний дохід",
      cell: (info) => (
        <span className="font-mono font-semibold tabular-nums text-amber-700">
          {info.getValue()?.toLocaleString("uk-UA") || "0"} ₴
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Дії",
      cell: (info) => (
        <Button variant="outline" size="sm" onClick={() => setSelected(info.row.original)}>
          Деталі
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: topViolations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/60 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_18px_40px_rgba(11,28,54,0.08)] backdrop-blur-2xl">
        <div className="border-b border-white/60 px-6 py-5">
          <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
            Топ-5 найкритичніших порушень
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Об'єкти з найбільшим потенційним доходом для бюджету
          </p>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-sm text-slate-500">Завантаження...</div>
        ) : topViolations.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Немає даних для відображення
          </div>
        ) : (
          <>
            <div className="space-y-3 p-4 md:hidden">
              {topViolations.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_10px_24px_rgba(11,28,54,0.06)]"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{extractStreetAddress(item.address)}</p>
                    <p className="text-xs text-slate-500">{item.suspectName}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100/80 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200/80">
                      {TYPE_LABELS[item.type] || item.type}
                    </span>
                    <RiskBadge level={item.enrichment?.riskLevel ?? "LOW"} />
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-sm font-semibold tabular-nums text-amber-700">
                      {item.potentialFine?.toLocaleString("uk-UA") || "0"} ₴
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setSelected(item)}>
                      Деталі
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-white/60 bg-white/40"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-white/60">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-amber-50/40">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm text-slate-700">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selected && <AnomalyModal a={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
