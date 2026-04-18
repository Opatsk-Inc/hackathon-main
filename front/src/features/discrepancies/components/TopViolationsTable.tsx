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
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            badge === "critical"
              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              : badge === "high"
                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
          }`}
        >
          {info.getValue()}
        </span>
      );
    },
  }),
  columnHelper.accessor("revenue", {
    header: "Потенційний дохід",
    cell: (info) => <span className="font-semibold">{info.getValue()} ₴</span>,
  }),
  columnHelper.display({
    id: "actions",
    header: "Дії",
    cell: () => (
      <Button variant="outline" size="sm">
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
    <div className="rounded-lg border bg-card shadow-sm">
      <div className="border-b p-6">
        <h3 className="text-lg font-semibold">
          Топ-5 найкритичніших порушень
        </h3>
        <p className="text-sm text-muted-foreground">
          Об'єкти з найбільшим потенційним доходом для бюджету
        </p>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b text-left text-sm font-medium text-muted-foreground"
                >
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="pb-3">
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
            <tbody className="text-sm">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-4">
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
    </div>
  );
}
