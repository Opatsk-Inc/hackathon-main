import * as React from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import type { AnomalyTypeCount } from "@/lib/api/types"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Немає нерухомості",
  MISSING_IN_LAND: "Немає земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface ViolationsBarChartProps {
  data?: AnomalyTypeCount[]
  isLoading?: boolean
}

type SortDirection = 'asc' | 'desc' | null

export function ViolationsBarChart({ data, isLoading }: ViolationsBarChartProps) {
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    let items = data.map((item, index) => ({
      type: item.type,
      name: TYPE_LABELS[item.type] || item.type,
      value: item.count,
      fill: chartColors[index % chartColors.length],
    }))

    if (sortDirection === 'asc') {
      items = items.sort((a, b) => a.value - b.value)
    } else if (sortDirection === 'desc') {
      items = items.sort((a, b) => b.value - a.value)
    }

    return items
  }, [data, sortDirection])

  const handleSort = () => {
    if (sortDirection === null) {
      setSortDirection('desc')
    } else if (sortDirection === 'desc') {
      setSortDirection('asc')
    } else {
      setSortDirection(null)
    }
  }

  const SortIcon = () => {
    if (sortDirection === null) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 ml-1" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1" />
  }

  if (isLoading || chartData.length === 0) {
    return (
      <div className="flex flex-col rounded-2xl border border-border bg-card">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold">Структура порушень</h3>
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-muted-foreground">Завантаження даних...</div>
        </div>
      </div>
    )
  }

  const chartConfig = chartData.reduce((acc, item, index) => {
    acc[`type${index}`] = {
      label: item.name,
      color: chartColors[index % chartColors.length],
    }
    return acc
  }, {} as Record<string, { label: string; color: string }>)

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold">Структура порушень</h3>
        <p className="text-sm text-muted-foreground">Розподіл за типами</p>
      </div>

      <div className="px-6 pb-6">
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={chartData} margin={{ left: 50, right: 50 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs"
              tick={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {/* Компактний список під графіком */}
        <div className="mt-6 space-y-2">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <span className="font-semibold tabular-nums" style={{ color: item.fill }}>
                {item.value.toLocaleString("uk-UA")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
