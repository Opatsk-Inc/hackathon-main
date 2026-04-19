import * as React from "react"
import { TrendingUp } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import type { AnomalyTypeCount } from "@/lib/api/types"

const chartColors = [
  "#d97706",
  "#2563eb",
  "#059669",
  "#7c3aed",
  "#e11d48",
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
      <div className="panel-glass flex flex-col rounded-2xl">
        <div className="p-6 pb-4">
          <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
            Структура порушень
          </h3>
          <p className="text-sm text-slate-500">Завантаження...</p>
        </div>
        <div className="flex h-[400px] items-center justify-center">
          <div className="animate-pulse text-slate-400">Завантаження даних...</div>
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
    <div className="panel-glass flex flex-col rounded-2xl">
      <div className="p-6 pb-4">
        <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
          Структура порушень
        </h3>
        <p className="text-sm text-slate-500">Розподіл за типами</p>
      </div>
      <div className="px-6 pb-6">
        <ChartContainer config={violationChartConfig} className="h-[300px] w-full">
          <BarChart data={violationData} margin={{ left: 10, right: 10, top: 10 }}>
            <defs>
              {violationData.map((item, idx) => (
                <linearGradient
                  key={idx}
                  id={`pie-gradient-${idx}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={item.fill} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={item.fill} stopOpacity={0.55} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="4 6"
              stroke="rgba(11,28,54,0.08)"
            />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <ChartTooltip cursor={{ fill: "rgba(37,99,235,0.08)" }} content={<ChartTooltipContent />} />
            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {violationData.map((_, idx) => (
                <Cell key={idx} fill={`url(#pie-gradient-${idx})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <div className="mt-auto border-t border-white/55 px-6 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          Всього типів порушень: {violationData.length}
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </div>
        <div className="mt-1 text-xs text-slate-500">Розподіл за типами аномалій</div>
      </div>
    </div>
  )
}
