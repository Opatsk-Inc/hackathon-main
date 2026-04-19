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
        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/55 p-6 md:p-8 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_24px_60px_rgba(11,28,54,0.10)] backdrop-blur-2xl">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-700 backdrop-blur-xl">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Панель керівника
              </span>
              <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-slate-900 md:text-5xl">
                Огляд аудиту {user?.name ? `громади ${user.name}` : "громади"}
              </h1>
              <p className="max-w-xl text-sm text-slate-500 md:text-base">
                Аналітика податкових розбіжностей, фінансових втрат та призначених інспекцій
              </p>
            </div>
            <Button size="lg" className="gap-2" onClick={() => navigate("/head/import")}>
              <Plus className="h-5 w-5" />
              Новий аудит
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <KPIStatCard
            title="Орієнтовні втрати бюджету"
            value={budgetLoss}
            delay={0}
            accent="amber"
            trend={metrics?.budgetLossTrend}
          />
          <KPIStatCard
            title="Виявлено розбіжностей"
            value={discrepancies}
            delay={0.1}
            accent="sky"
            trend={metrics?.anomaliesTrend}
          />
          <KPIStatCard
            title="В роботі"
            value={inProgress}
            delay={0.2}
            accent="sky"
            trend={metrics?.inProgressTrend}
          />
          <KPIStatCard
            title="Вирішено"
            value={resolved}
            delay={0.3}
            accent="emerald"
            trend={metrics?.resolvedTrend}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <ViolationsBarChart data={metrics?.byType} isLoading={isLoading} />
          <InspectionAreaChart />
        </div>

        <TopViolationsTable />
      </div>
    </HeadDesktopLayout>
  )
}
