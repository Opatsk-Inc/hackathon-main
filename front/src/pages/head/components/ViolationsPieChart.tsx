import * as React from "react"
import { TrendingUp } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import type { AnomalyTypeCount } from "@/lib/api/types"

const chartColors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
]

interface ViolationsPieChartProps {
  data?: AnomalyTypeCount[]
  isLoading?: boolean
}

export function ViolationsPieChart({ data, isLoading }: ViolationsPieChartProps) {
  const violationData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((item, index) => ({
      name: item.type,
      value: item.count,
      fill: chartColors[index % chartColors.length],
    }))
  }, [data])

  if (isLoading || violationData.length === 0) {
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

  const violationChartConfig = violationData.reduce((acc, item, index) => {
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
        <ChartContainer config={violationChartConfig} className="h-[300px] w-full">
          <BarChart data={violationData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="mt-auto border-t px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          Всього типів порушень: {violationData.length}
          <TrendingUp className="h-4 w-4 text-[#A27B5C]" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Розподіл за типами аномалій
        </div>
      </div>
    </div>
  )
}
