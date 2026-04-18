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
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Огляд аудиту громади
            </h1>
            <p className="text-muted-foreground mt-1">
              Аналітика податкових розбіжностей та фінансових втрат
            </p>
          </div>
          <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
            <Plus className="h-5 w-5" />
            Новий аудит
          </Button>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Budget Losses - Primary Value Prop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0 }}
            className="group relative overflow-hidden rounded-xl border-2 border-rose-200/50 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-card p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-rose-300 dark:hover:border-rose-800"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-400 to-pink-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Орієнтовні втрати бюджету
                </p>
                <p className="text-4xl font-bold bg-gradient-to-br from-rose-600 to-rose-500 bg-clip-text text-transparent dark:from-rose-400 dark:to-rose-300">
                  <motion.span>{budgetLoss}</motion.span> ₴
                </p>
              </div>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-lg bg-rose-100 dark:bg-rose-900/30 p-3"
              >
                <Wallet className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Card 2: Discrepancies Found */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative overflow-hidden rounded-xl border-2 border-amber-200/50 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-amber-300 dark:hover:border-amber-800"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Виявлено розбіжностей
                </p>
                <p className="text-4xl font-bold bg-gradient-to-br from-amber-600 to-amber-500 bg-clip-text text-transparent dark:from-amber-400 dark:to-amber-300">
                  <motion.span>{discrepancies}</motion.span>
                </p>
              </div>
              <motion.div
                whileHover={{ rotate: -15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3"
              >
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Card 3: Total Objects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative overflow-hidden rounded-xl border-2 border-indigo-200/50 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-card p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-300 dark:hover:border-indigo-800"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Всього об'єктів
                </p>
                <p className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300">
                  <motion.span>{totalObjects}</motion.span>
                </p>
              </div>
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-lg bg-indigo-100 dark:bg-indigo-900/30 p-3"
              >
                <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </motion.div>
            </div>
          </motion.div>

          {/* Card 4: Recovered to Budget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative overflow-hidden rounded-xl border-2 border-emerald-200/50 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card p-6 shadow-lg transition-all hover:shadow-2xl hover:scale-[1.02] hover:border-emerald-300 dark:hover:border-emerald-800"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity" />
            <div className="relative flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Повернуто до бюджету
                </p>
                <p className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-300">
                  <motion.span>{recovered}</motion.span> ₴
                </p>
              </div>
              <motion.div
                whileHover={{ rotate: -15, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-3"
              >
                <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart: Violation Structure */}
          <div className="flex flex-col rounded-xl border bg-gradient-to-br from-card to-card/50 shadow-lg backdrop-blur-sm">
            <div className="p-6 pb-4">
              <h3 className="text-xl font-bold">Структура порушень</h3>
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
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full shadow-sm"
                        style={{ backgroundColor: item.fill }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-auto border-t bg-muted/30 px-6 py-4">
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
          <div className="rounded-xl border bg-gradient-to-br from-card to-card/50 shadow-lg backdrop-blur-sm">
            <div className="p-6">
              <h3 className="mb-1 text-xl font-bold">Динаміка інспекцій</h3>
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
            <div className="border-t bg-muted/30 px-6 py-4">
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
