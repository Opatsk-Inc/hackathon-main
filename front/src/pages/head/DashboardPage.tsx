import { HeadDesktopLayout } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Plus,
  TrendingUp,
  AlertTriangle,
  Building2,
  Wallet,
} from "lucide-react"
import * as React from "react"
import { motion } from "framer-motion"
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber"
import { TopViolationsTable } from "@/features/discrepancies/components"
import {
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Label,
} from "recharts"

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

const inspectionData = [
  { month: "Лис", created: 45, inspected: 38 },
  { month: "Гру", created: 52, inspected: 45 },
  { month: "Січ", created: 48, inspected: 42 },
  { month: "Лют", created: 61, inspected: 55 },
  { month: "Бер", created: 58, inspected: 51 },
  { month: "Кві", created: 78, inspected: 61 },
]

export function DashboardPage() {
  const totalViolations = React.useMemo(() => {
    return violationData.reduce((acc, curr) => acc + curr.value, 0)
  }, [])

  const budgetLoss = useAnimatedNumber(1250000, 2, 0)
  const discrepancies = useAnimatedNumber(342, 2, 0.2)
  const totalObjects = useAnimatedNumber(12450, 2, 0.4)
  const recovered = useAnimatedNumber(150000, 2, 0.6)

  return (
    <HeadDesktopLayout currentPath="/head/dashboard">
      <div className="mx-auto w-full space-y-6 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Огляд аудиту громади
            </h1>
            <p className="text-muted-foreground">
              Аналітика податкових розбіжностей та фінансових втрат
            </p>
          </div>
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Новий аудит
          </Button>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Budget Losses - Primary Value Prop */}
          <div className="relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Wallet className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Орієнтовні втрати бюджету
                </p>
                <p className="text-3xl font-bold text-rose-600 dark:text-rose-400">
                  <motion.span>{budgetLoss}</motion.span> ₴
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Discrepancies Found */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Виявлено розбіжностей
                </p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  <motion.span>{discrepancies}</motion.span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Total Objects */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Всього об'єктів
                </p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  <motion.span>{totalObjects}</motion.span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Recovered to Budget */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Повернуто до бюджету
                </p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  <motion.span>{recovered}</motion.span> ₴
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart: Violation Structure */}
          <div className="flex flex-col rounded-lg border bg-card shadow-sm">
            <div className="p-6 pb-4">
              <h3 className="text-lg font-semibold">Структура порушень</h3>
              <p className="text-sm text-muted-foreground">
                Січень - Квітень 2026
              </p>
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
                    strokeWidth={5}
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
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {totalViolations.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
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
              <div className="space-y-2">
                {violationData.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto border-t px-6 py-4">
              <div className="flex items-center gap-2 text-sm leading-none font-medium">
                Зростання на 12.3% цього місяця{" "}
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="mt-1 text-xs leading-none text-muted-foreground">
                Показує загальну кількість порушень за останні 4 місяці
              </div>
            </div>
          </div>

          {/* Area Chart: Inspection Dynamics */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6">
              <h3 className="mb-1 text-lg font-semibold">Динаміка інспекцій</h3>
              <p className="text-sm text-muted-foreground">
                Показує тренд створених та перевірених завдань за останні 6
                місяців
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
                  <CartesianGrid vertical={false} />
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
                    <linearGradient
                      id="fillCreated"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-created)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-created)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="fillInspected"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--color-inspected)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-inspected)"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    dataKey="inspected"
                    type="natural"
                    fill="url(#fillInspected)"
                    fillOpacity={0.4}
                    stroke="var(--color-inspected)"
                    stackId="a"
                  />
                  <Area
                    dataKey="created"
                    type="natural"
                    fill="url(#fillCreated)"
                    fillOpacity={0.4}
                    stroke="var(--color-created)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
            <div className="border-t px-6 py-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1 leading-none font-medium">
                  Зростання на 5.2% цього місяця
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Порівняно з попереднім періодом
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Critical Violations Table */}
        <TopViolationsTable />
      </div>
    </HeadDesktopLayout>
  )
}
