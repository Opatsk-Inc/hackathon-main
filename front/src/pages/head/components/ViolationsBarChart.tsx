import * as React from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import type { AnomalyTypeCount } from "@/lib/api/types"

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Немає нерухомості",
  MISSING_IN_LAND: "Немає земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const chartColors = [
  "#3b82f6",  // Синій
  "#0d9488",  // Бірюзовий
  "#f97316",  // Помаранчевий
  "#16a34a",  // Зелений
  "#8b5cf6",  // Фіолетовий
]

interface ViolationsBarChartProps {
  data?: AnomalyTypeCount[]
  isLoading?: boolean
}

export function ViolationsBarChart({ data, isLoading }: ViolationsBarChartProps) {
  const sortDirection = null

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
  }, [data])

  if (isLoading || chartData.length === 0) {
    return (
      <div className="panel-glass flex flex-col rounded-2xl">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-[#10213f]">Структура порушень</h3>
          <p className="text-sm text-[#5d728f]">Завантаження...</p>
        </div>
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-pulse text-[#5d728f]">Завантаження даних...</div>
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
    <div className="panel-glass flex flex-col rounded-2xl">
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold text-[#10213f]">Структура порушень</h3>
        <p className="text-sm text-[#5d728f]">Розподіл за типами</p>
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
              <span className="font-medium text-[#2d4467]">{item.name}</span>
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
