import { HeadDesktopLayout } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import {
  Plus,
} from "lucide-react"
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber"
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics"
import { TopViolationsTable } from "@/features/discrepancies/components"
import { KPIStatCard, ViolationsBarChart, InspectionAreaChart } from "./components"

export function DashboardPage() {
  const { data: metrics, isLoading } = useDashboardMetrics()

  const budgetLoss = useAnimatedNumber(metrics?.totalPotentialFine ?? 0, 2, 0)
  const discrepancies = useAnimatedNumber(metrics?.totalAnomalies ?? 0, 2, 0.2)
  const inProgress = useAnimatedNumber(metrics?.inProgressCount ?? 0, 2, 0.4)
  const resolved = useAnimatedNumber(metrics?.resolvedCount ?? 0, 2, 0.6)

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
          <KPIStatCard
            title="Орієнтовні втрати бюджету"
            value={budgetLoss}
            delay={0}
            trend={metrics?.budgetLossTrend}
          />
          <KPIStatCard
            title="Виявлено розбіжностей"
            value={discrepancies}
            delay={0.1}
            trend={metrics?.anomaliesTrend}
          />
          <KPIStatCard
            title="В роботі"
            value={inProgress}
            delay={0.2}
            trend={metrics?.inProgressTrend}
          />
          <KPIStatCard
            title="Вирішено"
            value={resolved}
            delay={0.3}
            trend={metrics?.resolvedTrend}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ViolationsBarChart data={metrics?.byType} isLoading={isLoading} />
          <InspectionAreaChart />
        </div>

        {/* Top 5 Critical Violations Table */}
        <TopViolationsTable />
      </div>
    </HeadDesktopLayout>
  )
}
