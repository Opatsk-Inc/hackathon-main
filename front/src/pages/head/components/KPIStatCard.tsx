import { motion, MotionValue } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPIStatCardProps {
  title: string
  value: string | number | MotionValue<string>
  delay?: number
  accent?: "amber" | "sky" | "emerald" | "rose"
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

const ACCENT_STYLES: Record<NonNullable<KPIStatCardProps["accent"]>, { bar: string; glow: string }> = {
  amber: {
    bar: "from-amber-400 via-amber-500 to-amber-600",
    glow: "bg-amber-400/15",
  },
  sky: {
    bar: "from-sky-400 via-sky-500 to-sky-600",
    glow: "bg-sky-400/15",
  },
  emerald: {
    bar: "from-emerald-400 via-emerald-500 to-emerald-600",
    glow: "bg-emerald-400/15",
  },
  rose: {
    bar: "from-rose-400 via-rose-500 to-rose-600",
    glow: "bg-rose-400/15",
  },
}

export function KPIStatCard({
  title,
  value,
  delay = 0,
  accent = "amber",
  trend,
}: KPIStatCardProps) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown
  const trendColor = trend?.direction === "up" ? "text-emerald-600" : "text-rose-600"
  const accentStyle = ACCENT_STYLES[accent]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group/kpi relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-6 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_18px_40px_rgba(11,28,54,0.08)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(11,28,54,0.06),0_24px_60px_rgba(11,28,54,0.12)]"
    >
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl ${accentStyle.glow}`}
      />
      <div className={`absolute inset-y-5 left-0 w-1 rounded-full bg-gradient-to-b ${accentStyle.bar}`} />
      <div className="relative flex flex-col gap-1.5 pl-3">
        <p className="font-heading text-[1.85rem] font-semibold leading-none tracking-[-0.03em] text-slate-900 sm:text-[2.25rem]">
          <motion.span>{value}</motion.span>
        </p>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {trend && (
          <div className="mt-2 flex items-center gap-1">
            <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
            <span className={`text-sm font-semibold ${trendColor}`}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-sm text-slate-400">vs минулий місяць</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
