import { HeadDesktopLayout } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import {
  Plus,
} from "lucide-react"
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics"
import { TopViolationsTable } from "@/features/discrepancies/components"
import { KPIStatCard, ViolationsBarChart, InspectionAreaChart } from "./components"
import { formatLargeNumber } from "@/lib/utils/formatNumber"
import { useEffect } from "react"
import { useMotionValue, useTransform, animate } from "framer-motion"
import { useAuthStore } from "@/features/auth/store/auth.store"
import { useNavigate } from "react-router-dom"


export function DashboardPage() {
  const { user } = useAuthStore()
  const { data: metrics, isLoading } = useDashboardMetrics()

  const navigate = useNavigate();

  // Animated motion values
  const budgetLossMotion = useMotionValue(0)
  const discrepanciesMotion = useMotionValue(0)
  const inProgressMotion = useMotionValue(0)
  const resolvedMotion = useMotionValue(0)

  // Transform to formatted strings
  const budgetLoss = useTransform(budgetLossMotion, (v) => `${formatLargeNumber(v)} ₴`)
  const discrepancies = useTransform(discrepanciesMotion, (v) => formatLargeNumber(v))
  const inProgress = useTransform(inProgressMotion, (v) => formatLargeNumber(v, 0))
  const resolved = useTransform(resolvedMotion, (v) => formatLargeNumber(v, 0))

  // Animate on data change
  useEffect(() => {
    if (!metrics) return
    animate(budgetLossMotion, metrics.totalPotentialFine, { duration: 2, delay: 0, ease: "easeOut" })
    animate(discrepanciesMotion, metrics.totalAnomalies, { duration: 2, delay: 0.2, ease: "easeOut" })
    animate(inProgressMotion, metrics.inProgressCount, { duration: 2, delay: 0.4, ease: "easeOut" })
    animate(resolvedMotion, metrics.resolvedCount, { duration: 2, delay: 0.6, ease: "easeOut" })
  }, [metrics, budgetLossMotion, discrepanciesMotion, inProgressMotion, resolvedMotion])

  return (
    <HeadDesktopLayout currentPath="/head/dashboard">
      <div className="mx-auto w-full space-y-6 p-6 md:p-8">
        {/* Page Header */}
        <div className="panel-glass rounded-3xl p-6 md:p-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#10213f] leading-[1.05]">
              Огляд аудиту {user?.name ? `громади ${user.name}` : "громади"}
            </h1>

            <p className="mt-2 text-[#5d728f]">
              Аналітика податкових розбіжностей та фінансових втрат
            </p>
          </div>
          <Button
            size="lg"
            className="gap-2 shadow-lg transition-all hover:shadow-xl bg-[#10213f] hover:bg-[#1c365f] text-[#f8fbff]"
            onClick={() => navigate("/head/import")}
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
