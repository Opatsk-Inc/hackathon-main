import * as React from "react"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { PieChart, Pie, Label } from "recharts"

const violationData = [
  {
    name: "Комерція на житловій землі",
    value: 137,
    fill: "var(--color-commerce)",
  },
  { name: "Неоформлена земля", value: 120, fill: "var(--color-unregistered)" },
  { name: "Занижена площа", value: 85, fill: "var(--color-underreported)" },
]

const violationChartConfig = {
  value: {
    label: "Порушень",
  },
  commerce: {
    label: "Комерція на житловій землі",
    color: "hsl(var(--chart-1))",
  },
  unregistered: {
    label: "Неоформлена земля",
    color: "hsl(var(--chart-2))",
  },
  underreported: {
    label: "Занижена площа",
    color: "hsl(var(--chart-3))",
  },
}

export function ViolationsPieChart() {
  const [activeViolation, setActiveViolation] = React.useState(
    violationData[0].name
  )

  const activeIndex = React.useMemo(
    () => violationData.findIndex((item) => item.name === activeViolation),
    [activeViolation]
  )

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card">
      <div className="p-6 pb-4">
        <h3 className="text-lg font-semibold">Структура порушень</h3>
        <p className="text-sm text-muted-foreground">Січень - Квітень 2026</p>
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
          Зростання на 12.3% цього місяця
          <TrendingUp className="h-4 w-4 text-[#A27B5C]" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Показує загальну кількість порушень за останні 4 місяці
        </div>
      </div>
    </div>
  )
}
