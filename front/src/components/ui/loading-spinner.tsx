import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
  label?: string
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12"
}

export function LoadingSpinner({
  className,
  size = "md",
  fullScreen = false,
  label
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn(
        "animate-spin text-amber-600 drop-shadow-[0_4px_12px_rgba(217,119,6,0.35)]",
        sizeClasses[size],
        className
      )}
    />
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/55 backdrop-blur-2xl">
        {spinner}
        {label ? (
          <span className="text-sm font-medium text-slate-600">{label}</span>
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-4">
      {spinner}
      {label ? (
        <span className="text-xs font-medium text-slate-500">{label}</span>
      ) : null}
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  blur?: boolean
  label?: string
}

export function LoadingOverlay({
  isLoading,
  children,
  blur = true,
  label
}: LoadingOverlayProps) {
  return (
    <>
      {children}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-[inherit]",
            blur ? "bg-white/55 backdrop-blur-xl" : "bg-white/75"
          )}
        >
          <Loader2 className="h-10 w-10 animate-spin text-amber-600 drop-shadow-[0_4px_12px_rgba(217,119,6,0.3)]" />
          {label ? (
            <span className="text-sm font-medium text-slate-600">{label}</span>
          ) : null}
        </div>
      )}
    </>
  )
}
