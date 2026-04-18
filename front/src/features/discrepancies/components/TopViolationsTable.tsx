import { Button } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { AdminService } from "@/lib/api/admin.service";
import type { Anomaly } from "@/lib/api/types";
import { useMemo, useState } from "react";

// Extract street address from full address
function extractStreetAddress(fullAddress: string): string {
  if (!fullAddress) return "";

  // Split by comma and find the part with street keywords
  const parts = fullAddress.split(',').map(p => p.trim());

  const streetKeywords = /вул\.|вулиця|пр\.|проспект|провулок|бульвар|площа|шосе/i;
  const streetPart = parts.find(p => streetKeywords.test(p));

  return streetPart || parts[parts.length - 1] || fullAddress;
}

const columnHelper = createColumnHelper<Anomaly>();

const RISK_COLORS = {
  CRITICAL: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/30",
  HIGH: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-800/30",
  MEDIUM: "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800/30",
  LOW: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800/30",
};

const RISK_CONFIG: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: "Критичний", cls: "bg-red-100 text-red-800 ring-1 ring-red-300 dark:bg-red-900/30 dark:text-red-300" },
  HIGH:     { label: "Високий",   cls: "bg-orange-100 text-orange-800 ring-1 ring-orange-300 dark:bg-orange-900/30 dark:text-orange-300" },
  MEDIUM:   { label: "Середній",  cls: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300" },
  LOW:      { label: "Низький",   cls: "bg-green-100 text-green-700 ring-1 ring-green-300 dark:bg-green-900/30 dark:text-green-300" },
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

export function TopViolationsTable() {
  const [selected, setSelected] = useState<Anomaly | null>(null);

  const { data: anomaliesData, isLoading } = useQuery({
    queryKey: ['discrepancies'],
    queryFn: () => AdminService.getDiscrepancies(),
  });

  const topViolations = useMemo(() => {
    if (!anomaliesData?.items) return [];

    // Sort by potentialFine descending and take top 5
    return [...anomaliesData.items]
      .filter(a => a.potentialFine && a.potentialFine > 0)
      .sort((a, b) => (b.potentialFine || 0) - (a.potentialFine || 0))
      .slice(0, 5);
  }, [anomaliesData]);

  const columns = [
    columnHelper.accessor("address", {
      header: "Адреса",
      cell: (info) => <span className="font-medium">{extractStreetAddress(info.getValue())}</span>,
    }),
    columnHelper.accessor("type", {
      header: "Тип порушення",
      cell: (info) => {
        const riskLevel = info.row.original.enrichment?.riskLevel || "LOW";
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
              RISK_COLORS[riskLevel as keyof typeof RISK_COLORS] || RISK_COLORS.LOW
            }`}
          >
            {TYPE_LABELS[info.getValue()] || info.getValue()}
          </span>
        );
      },
    }),
    columnHelper.accessor("potentialFine", {
      header: "Потенційний дохід",
      cell: (info) => (
        <span className="font-semibold text-[#A27B5C]">
          {info.getValue()?.toLocaleString("uk-UA") || "0"} ₴
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Дії",
      cell: (info) => (
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-[#A27B5C] hover:text-white hover:border-[#A27B5C] transition-colors"
          onClick={() => setSelected(info.row.original)}
        >
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
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b px-6 py-5">
          <h3 className="text-lg font-semibold">
            Топ-5 найкритичніших порушень
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Об'єкти з найбільшим потенційним доходом для бюджету
          </p>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Завантаження...</div>
        ) : topViolations.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Немає даних для відображення
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b bg-muted/30"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-border">
                {table.getRowModel().rows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`transition-colors hover:bg-muted/50 ${
                      idx % 2 === 0 ? "bg-card" : "bg-muted/20"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 text-sm">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <AnomalyModal a={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
