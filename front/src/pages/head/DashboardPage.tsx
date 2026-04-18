import { HeadDesktopLayout } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle, Building2, Wallet, TrendingUp } from "lucide-react"
import * as React from "react"
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber"
import { TopViolationsTable } from "@/features/discrepancies/components"
import {
  KPICard,
  ViolationsPieChart,
  InspectionAreaChart,
} from "./components"

export function DashboardPage() {
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
            <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              Огляд аудиту громади
            </h1>
            <p className="mt-1 text-muted-foreground">
              Аналітика податкових розбіжностей та фінансових втрат
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 shadow-lg transition-all hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Новий аудит
          </Button>
        </div>

        {/* KPI Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Орієнтовні втрати бюджету"
            value={budgetLoss}
            icon={Wallet}
            delay={0}
            colorScheme="rose"
          />
          <KPICard
            title="Виявлено розбіжностей"
            value={discrepancies}
            icon={AlertTriangle}
            delay={0.1}
            colorScheme="amber"
          />
          <KPICard
            title="Всього об'єктів"
            value={totalObjects}
            icon={Building2}
            delay={0.2}
            colorScheme="indigo"
          />
          <KPICard
            title="Повернуто до бюджету"
            value={recovered}
            icon={TrendingUp}
            delay={0.3}
            colorScheme="emerald"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ViolationsPieChart />
          <InspectionAreaChart />
        </div>

        {/* Top 5 Critical Violations Table */}
        <TopViolationsTable />
      </div>
    </HeadDesktopLayout>
  )
}
