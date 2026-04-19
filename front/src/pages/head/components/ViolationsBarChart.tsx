import * as React from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts"
import type { AnomalyTypeCount } from "@/lib/api/types"

const TYPE_LABELS: Record<string, string> = {
  MISSING_IN_REAL_ESTATE: "Немає нерухомості",
  MISSING_IN_LAND: "Немає земельної ділянки",
  NO_ACTIVE_REAL_RIGHTS: "Право власності закінчилось",
  AREA_MISMATCH: "Розбіжність площ",
};

const chartColors = [
  "#d97706", // amber-600 primary
  "#2563eb", // sky-600 secondary
  "#059669", // emerald-600
  "#7c3aed", // violet-600
  "#e11d48", // rose-600
]

interface ViolationsBarChartProps {
  data?: AnomalyTypeCount[]
  isLoading?: boolean
}

export function ViolationsBarChart({ data, isLoading }: ViolationsBarChartProps) {
  const chartData = React.useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map((item, index) => ({
      type: item.type,
      name: TYPE_LABELS[item.type] || item.type,
      value: item.count,
      fill: chartColors[index % chartColors.length],
    }))
  }, [data])

  if (isLoading || chartData.length === 0) {
    return (
      <div className="panel-glass flex flex-col rounded-2xl">
        <div className="p-6 pb-4 max-[600px]:p-4 max-[600px]:pb-3">
          <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
            Структура порушень
          </h3>
          <p className="text-sm text-slate-500">Завантаження...</p>
        </div>
        <div className="flex h-[320px] items-center justify-center max-[600px]:h-[230px] max-[480px]:h-[190px]">
          <div className="animate-pulse text-slate-400">Завантаження даних...</div>
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
      <div className="p-6 pb-4 max-[600px]:p-4 max-[600px]:pb-3">
        <h3 className="font-heading text-lg font-semibold tracking-[-0.02em] text-slate-900">
          Структура порушень
        </h3>
        <p className="text-sm text-slate-500">Розподіл за типами</p>
      </div>

      <div className="px-6 pb-6 max-[600px]:px-4 max-[600px]:pb-4">
        <ChartContainer config={chartConfig} className="h-[300px] w-full max-[600px]:h-[220px] max-[480px]:h-[185px]">
          <BarChart data={chartData} margin={{ left: 10, right: 10, top: 10 }}>
            <defs>
              {chartData.map((item, idx) => (
                <linearGradient
                  key={idx}
                  id={`bar-gradient-${idx}`}
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
            <XAxis dataKey="name" tick={false} axisLine={false} />
            <YAxis tick={false} axisLine={false} />
            <ChartTooltip cursor={{ fill: "rgba(217,119,6,0.08)" }} content={<ChartTooltipContent />} />
            <Bar
              dataKey="value"
              radius={[12, 12, 0, 0]}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={`url(#bar-gradient-${idx})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        <div className="mt-6 space-y-2 max-[600px]:mt-4">
          {chartData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 text-sm transition-colors hover:border-white/70 hover:bg-white/60"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.fill, boxShadow: `0 0 0 3px ${item.fill}1a` }}
                />
                <span className="font-medium text-slate-700 max-[600px]:text-xs">{item.name}</span>
              </div>
              <span className="font-mono font-semibold tabular-nums text-slate-900 max-[600px]:text-xs">
                {item.value.toLocaleString("uk-UA")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
