import * as React from "react"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Label, Sector } from "recharts"
import type { PieSectorDataItem } from "recharts/types/polar/Pie"
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

  const [activeViolation, setActiveViolation] = React.useState(
    violationData[0]?.name || ""
  )

  const activeIndex = React.useMemo(
    () => violationData.findIndex((item) => item.name === activeViolation),
    [activeViolation]
  )

  const renderActiveShape = (props: PieSectorDataItem) => {
    const outerRadius = (props as unknown as { outerRadius: number })
      .outerRadius
    return (
      <g>
        <Sector {...props} outerRadius={outerRadius + 10} />
        <Sector
          {...props}
          outerRadius={outerRadius + 25}
          innerRadius={outerRadius + 12}
        />
      </g>
    )
  }

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
        <p className="text-sm text-muted-foreground">Поточні дані</p>
      </div>
      <div className="px-6 pb-0">
        <ChartContainer
          config={violationChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={violationData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={2}
              activeShape={renderActiveShape}
              onMouseEnter={(_, index) => {
                setActiveViolation(violationData[index].name)
              }}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <motion.tspan
                          key={activeIndex}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {violationData[activeIndex].value.toLocaleString()}
                        </motion.tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground text-sm"
                        >
                          Порушень
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="flex-1 p-6 pt-4">
        <div className="space-y-3">
          {violationData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                index === activeIndex ? "bg-muted" : "hover:bg-muted/50"
              }`}
              onClick={() => setActiveViolation(item.name)}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{
                    scale: index === activeIndex ? 1.3 : 1,
                  }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-foreground">{item.name}</span>
              </div>
              <motion.span
                animate={{
                  scale: index === activeIndex ? 1.1 : 1,
                }}
                className="text-sm font-semibold"
              >
                {item.value}
              </motion.span>
            </motion.div>
          ))}
        </div>
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
