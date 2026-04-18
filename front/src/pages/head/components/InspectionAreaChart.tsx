import { TrendingUp } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { AreaChart, Area, XAxis, CartesianGrid } from "recharts"

const inspectionData = [
  { month: "Лис", created: 45, inspected: 38 },
  { month: "Гру", created: 52, inspected: 45 },
  { month: "Січ", created: 48, inspected: 42 },
  { month: "Лют", created: 61, inspected: 55 },
  { month: "Бер", created: 58, inspected: 51 },
  { month: "Кві", created: 78, inspected: 61 },
]

export function InspectionAreaChart() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="p-6">
        <h3 className="mb-1 text-lg font-semibold">Динаміка інспекцій</h3>
        <p className="text-sm text-muted-foreground">
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
                  stopColor="var(--color-created)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-created)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="fillInspected" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-inspected)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-inspected)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="inspected"
              type="monotone"
              fill="url(#fillInspected)"
              fillOpacity={1}
              stroke="var(--color-inspected)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="created"
              type="monotone"
              fill="url(#fillCreated)"
              fillOpacity={1}
              stroke="var(--color-created)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </div>
      <div className="border-t px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          Зростання на 5.2% цього місяця
          <TrendingUp className="h-4 w-4 text-[#A27B5C]" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Порівняно з попереднім періодом
        </div>
      </div>
    </div>
  )
}
