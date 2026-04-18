import { motion, MotionValue } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number | MotionValue<string>
  icon: LucideIcon
  delay: number
  colorScheme: "rose" | "amber" | "indigo" | "emerald"
}

const colorClasses = {
  rose: {
    border: "border-rose-200/50 dark:border-rose-900/50",
    gradient: "from-rose-50 to-white dark:from-rose-950/20 dark:to-card",
    overlay: "from-rose-500/5",
    textGradient:
      "from-rose-600 to-rose-500 dark:from-rose-400 dark:to-rose-300",
    iconBg: "bg-rose-100 dark:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  amber: {
    border: "border-amber-200/50 dark:border-amber-900/50",
    gradient: "from-amber-50 to-white dark:from-amber-950/20 dark:to-card",
    overlay: "from-amber-500/5",
    textGradient:
      "from-amber-600 to-amber-500 dark:from-amber-400 dark:to-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  indigo: {
    border: "border-indigo-200/50 dark:border-indigo-900/50",
    gradient: "from-indigo-50 to-white dark:from-indigo-950/20 dark:to-card",
    overlay: "from-indigo-500/5",
    textGradient:
      "from-indigo-600 to-indigo-500 dark:from-indigo-400 dark:to-indigo-300",
    iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  emerald: {
    border: "border-emerald-200/50 dark:border-emerald-900/50",
    gradient: "from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card",
    overlay: "from-emerald-500/5",
    textGradient:
      "from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
}

export function KPICard({
  title,
  value,
  icon: Icon,
  delay,
  colorScheme,
}: KPICardProps) {
  const colors = colorClasses[colorScheme]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative overflow-hidden rounded-xl border-2 ${colors.border} bg-gradient-to-br ${colors.gradient} p-6 shadow-lg`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.overlay} to-transparent`}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <p
            className={`bg-gradient-to-br ${colors.textGradient} bg-clip-text text-4xl font-bold text-transparent`}
          >
            <motion.span>{value}</motion.span> ₴
          </p>
        </div>
        <div className={`rounded-lg ${colors.iconBg} p-3`}>
          <Icon className={`h-6 w-6 ${colors.iconColor}`} />
        </div>
      </div>
    </motion.div>
  )
}
