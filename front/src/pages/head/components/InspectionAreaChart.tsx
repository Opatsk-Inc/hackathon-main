import { useMemo } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { AreaChart, Area, XAxis, CartesianGrid } from "recharts"
import { AdminService } from "@/lib/api/admin.service"
import { useQuery } from "@tanstack/react-query"

const MONTH_NAMES = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];

export function InspectionAreaChart() {
  const { data: anomaliesData } = useQuery({
    queryKey: ['discrepancies'],
    queryFn: () => AdminService.getDiscrepancies(),
  });

  const inspectionData = useMemo(() => {
    if (!anomaliesData?.items) return [];

    const now = new Date();
    const monthsCount = 6;

    const monthsMap = new Map<string, { created: number; inspected: number }>();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, { created: 0, inspected: 0 });
    }

    for (const anomaly of anomaliesData.items) {
      const createdDate = new Date(anomaly.createdAt);
      const createdKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthsMap.has(createdKey)) {
        monthsMap.get(createdKey)!.created++;
      }

      if (anomaly.status === 'RESOLVED') {
        const resolvedKey = createdKey;
        if (monthsMap.has(resolvedKey)) {
          monthsMap.get(resolvedKey)!.inspected++;
        }
      }
    }

    return Array.from(monthsMap.entries()).map(([key, data]) => {
      const [, month] = key.split('-');
      const monthIndex = parseInt(month) - 1;
      return {
        month: MONTH_NAMES[monthIndex],
        created: data.created,
        inspected: data.inspected,
      };
    });
  }, [anomaliesData]);

  const growthRate = useMemo(() => {
    if (inspectionData.length < 2) return 0;
    const current = inspectionData[inspectionData.length - 1]?.inspected || 0;
    const previous = inspectionData[inspectionData.length - 2]?.inspected || 0;
    if (previous === 0) return 0;
    return Number(((current - previous) / previous * 100).toFixed(1));
  }, [inspectionData]);

  const positive = growthRate >= 0;

  return (
    <div className="panel-glass rounded-2xl">
      <div className="p-6 max-[600px]:p-4">
        <h3 className="mb-1 font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
          Динаміка інспекцій
        </h3>
        <p className="text-sm text-slate-500 max-[600px]:text-xs">
          Тренд створених та перевірених завдань за останні 6 місяців
        </p>
      </div>
      <div className="px-6 pb-6 max-[600px]:px-4 max-[600px]:pb-4">
        <ChartContainer
          config={{
            created: {
              label: "Виявлено розбіжностей",
              color: "#d97706",
            },
            inspected: {
              label: "Опрацьовано інспекторами",
              color: "#2563eb",
            },
          }}
          className="h-[300px] w-full max-[600px]:h-[220px] max-[480px]:h-[185px]"
        >
          <AreaChart
            data={inspectionData}
            margin={{ left: 12, right: 12, top: 10 }}
            accessibilityLayer
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 6"
              stroke="rgba(11,28,54,0.08)"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{ stroke: "rgba(217,119,6,0.35)", strokeWidth: 1, strokeDasharray: "4 4" }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <defs>
              <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d97706" stopOpacity={0.42} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillInspected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.36} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              dataKey="inspected"
              type="monotone"
              fill="url(#fillInspected)"
              fillOpacity={1}
              stroke="#2563eb"
              strokeWidth={2.5}
              stackId="a"
              animationDuration={900}
              animationEasing="ease-out"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff", fill: "#2563eb" }}
            />
            <Area
              dataKey="created"
              type="monotone"
              fill="url(#fillCreated)"
              fillOpacity={1}
              stroke="#d97706"
              strokeWidth={2.5}
              stackId="a"
              animationDuration={900}
              animationEasing="ease-out"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#ffffff", fill: "#d97706" }}
            />
          </AreaChart>
        </ChartContainer>

        <div className="mt-6 space-y-2 max-[600px]:mt-4">
          <div className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-colors hover:border-white/70 hover:bg-white/60">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#d97706]" style={{ boxShadow: '0 0 0 3px #d977061a' }} />
              <span className="font-medium text-slate-700 max-[600px]:text-xs">Виявлено розбіжностей</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-colors hover:border-white/70 hover:bg-white/60">
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" style={{ boxShadow: '0 0 0 3px #2563eb1a' }} />
              <span className="font-medium text-slate-700 max-[600px]:text-xs">Опрацьовано інспекторами</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/55 px-6 py-4 max-[600px]:px-4 max-[600px]:py-3">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800 max-[600px]:text-xs">
          {positive ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
              Зростання ефективності на {Math.abs(Number(growthRate))}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-rose-600">
              <TrendingDown className="h-4 w-4" />
              Зменшення темпів на {Math.abs(Number(growthRate))}%
            </span>
          )}
          <span className="text-slate-400 font-normal">|</span>
          <span className="font-normal text-slate-500">Порівняно з минулим місяцем</span>
        </div>
      </div>
    </div>
  )
}
