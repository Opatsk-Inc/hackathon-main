import { Button } from "@/components/ui/button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface TopViolation {
  address: string;
  type: string;
  revenue: string;
  badge: "critical" | "high" | "medium";
}

const topViolations: TopViolation[] = [
  {
    address: "вул. Шевченка, 15",
    type: "Комерція на житловій землі",
    revenue: "125,000",
    badge: "critical",
  },
  {
    address: "вул. Грушевського, 42",
    type: "Неоформлена земля",
    revenue: "98,500",
    badge: "high",
  },
  {
    address: "пр. Незалежності, 8",
    type: "Занижена площа",
    revenue: "87,200",
    badge: "high",
  },
  {
    address: "вул. Франка, 23",
    type: "Комерція на житловій землі",
    revenue: "76,300",
    badge: "critical",
  },
  {
    address: "вул. Лесі Українки, 11",
    type: "Неоформлена земля",
    revenue: "64,800",
    badge: "medium",
  },
];

const columnHelper = createColumnHelper<TopViolation>();

const columns = [
  columnHelper.accessor("address", {
    header: "Адреса",
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("type", {
    header: "Тип порушення",
    cell: (info) => {
      const badge = info.row.original.badge;
      return (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
            badge === "critical"
              ? "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800/30"
              : badge === "high"
                ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400 dark:ring-orange-800/30"
                : "bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800/30"
          }`}
        >
          {info.getValue()}
        </span>
      );
    },
  }),
  columnHelper.accessor("revenue", {
    header: "Потенційний дохід",
    cell: (info) => (
      <span className="font-semibold text-[#A27B5C]">
        {info.getValue()} ₴
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Дії",
    cell: () => (
      <Button
        variant="outline"
        size="sm"
        className="hover:bg-[#A27B5C] hover:text-white hover:border-[#A27B5C] transition-colors"
      >
        Деталі
      </Button>
    ),
  }),
];

export function TopViolationsTable() {
  const table = useReactTable({
    data: topViolations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="border-b px-6 py-5">
        <h3 className="text-lg font-semibold">
          Топ-5 найкритичніших порушень
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Об'єкти з найбільшим потенційним доходом для бюджету
        </p>
      </div>
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
    </div>
  );
}
