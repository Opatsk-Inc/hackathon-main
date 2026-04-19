import { motion, MotionValue } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number | MotionValue<string>
  icon: LucideIcon
  delay: number
  colorScheme: "rose" | "amber" | "indigo" | "emerald"
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

const SCHEME_STYLES: Record<KPICardProps["colorScheme"], {
  iconBg: string
  iconColor: string
  accentBar: string
  glow: string
}> = {
  amber: {
    iconBg: "bg-amber-100/80 ring-1 ring-amber-200/70",
    iconColor: "text-amber-700",
    accentBar: "from-amber-400 via-amber-500 to-amber-600",
    glow: "bg-amber-400/15",
  },
  indigo: {
    iconBg: "bg-sky-100/80 ring-1 ring-sky-200/70",
    iconColor: "text-sky-700",
    accentBar: "from-sky-400 via-sky-500 to-sky-600",
    glow: "bg-sky-400/15",
  },
  emerald: {
    iconBg: "bg-emerald-100/80 ring-1 ring-emerald-200/70",
    iconColor: "text-emerald-700",
    accentBar: "from-emerald-400 via-emerald-500 to-emerald-600",
    glow: "bg-emerald-400/15",
  },
  rose: {
    iconBg: "bg-rose-100/80 ring-1 ring-rose-200/70",
    iconColor: "text-rose-700",
    accentBar: "from-rose-400 via-rose-500 to-rose-600",
    glow: "bg-rose-400/15",
  },
}

export function KPICard({
  title,
  value,
  icon: Icon,
  delay,
  colorScheme,
  trend,
}: KPICardProps) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown
  const trendColor = trend?.direction === "up" ? "text-emerald-600" : "text-rose-600"
  const scheme = SCHEME_STYLES[colorScheme]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group/kpi relative overflow-hidden rounded-2xl border border-white/70 bg-white/75 p-6 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_18px_40px_rgba(11,28,54,0.08)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(11,28,54,0.06),0_24px_60px_rgba(11,28,54,0.12)]"
    >
      <div
        className={`pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl ${scheme.glow}`}
      />
      <div className={`absolute inset-y-5 left-0 w-1 rounded-full bg-gradient-to-b ${scheme.accentBar}`} />
      <div className="relative flex items-start justify-between pl-3">
        <div className="flex flex-col gap-1.5">
          <p className="font-heading text-[2.25rem] font-semibold leading-none tracking-[-0.03em] text-slate-900">
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
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${scheme.iconBg}`}>
          <Icon className={`h-5 w-5 ${scheme.iconColor}`} />
        </div>
      </div>
    </motion.div>
  )
}
