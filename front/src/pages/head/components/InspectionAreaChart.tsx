import { useMemo } from "react"
import { TrendingUp } from "lucide-react"
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

    // Initialize months
    const monthsMap = new Map<string, { created: number; inspected: number }>();
    for (let i = monthsCount - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(key, { created: 0, inspected: 0 });
    }

    // Count anomalies
    for (const anomaly of anomaliesData.items) {
      const createdDate = new Date(anomaly.createdAt);
      const createdKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;

      if (monthsMap.has(createdKey)) {
        monthsMap.get(createdKey)!.created++;
      }

      if (anomaly.status === 'RESOLVED') {
        // Use createdAt as fallback since we don't have updatedAt
        const resolvedKey = createdKey;
        if (monthsMap.has(resolvedKey)) {
          monthsMap.get(resolvedKey)!.inspected++;
        }
      }
    }

    // Convert to array
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
  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-md shadow-sm">
      <div className="p-6">
        <h3 className="mb-1 text-lg font-semibold text-slate-800">Динаміка інспекцій</h3>
        <p className="text-sm text-slate-500">
          Показує тренд створених та перевірених завдань за останні 6 місяців
        </p>
      </div>
      <div className="px-6 pb-6">
        <ChartContainer
          config={{
            created: {
              label: "Створено завдань",
              color: "hsl(var(--chart-1))",
            },
            inspected: {
              label: "Перевірено інспектором",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[300px] w-full"
        >
          <AreaChart
            data={inspectionData}
            margin={{
              left: 12,
              right: 12,
            }}
            accessibilityLayer
          >
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              opacity={0.3}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <defs>
              <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#f97316"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#f97316"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillInspected" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="#0d9488"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="#0d9488"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="inspected"
              type="monotone"
              fill="url(#fillInspected)"
              fillOpacity={1}
              stroke="#0d9488"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="created"
              type="monotone"
              fill="url(#fillCreated)"
              fillOpacity={1}
              stroke="#f97316"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="border-t border-white/60 px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {growthRate > 0 ? 'Зростання' : 'Зменшення'} на {Math.abs(Number(growthRate))}% цього місяця
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Порівняно з попереднім періодом
        </div>
      </div>
    </div>
  )
}
