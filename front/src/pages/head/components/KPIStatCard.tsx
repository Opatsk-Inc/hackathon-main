import { motion, MotionValue } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KPIStatCardProps {
  title: string
  value: string | number | MotionValue<string>
  delay?: number
  trend?: {
    value: number
    direction: "up" | "down"
  }
}

export function KPIStatCard({
  title,
  value,
  delay = 0,
  trend,
}: KPIStatCardProps) {
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown
  const trendColor = trend?.direction === "up" ? "text-emerald-600" : "text-red-600"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white/50 backdrop-blur-md border border-white/60 shadow-sm rounded-xl p-6"
    >
      <div className="flex flex-col gap-1">
        <p className="text-4xl font-bold text-slate-800">
          <motion.span>{value}</motion.span>
        </p>
        <p className="text-sm text-slate-500">
          {title}
        </p>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon className={`h-3.5 w-3.5 ${trendColor}`} />
            <span className={`text-sm font-medium ${trendColor}`}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-sm text-slate-500">
              vs минулий місяць
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
