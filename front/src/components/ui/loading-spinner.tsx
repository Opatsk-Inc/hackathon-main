import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  className?: string
  size?: "sm" | "md" | "lg"
  fullScreen?: boolean
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12"
}

export function LoadingSpinner({
  className,
  size = "md",
  fullScreen = false
}: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size], className)} />
    </div>
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  blur?: boolean
}

export function LoadingOverlay({ isLoading, children, blur = false }: LoadingOverlayProps) {
  return (
    <>
      {children}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 z-50 flex items-center justify-center",
          blur ? "bg-background/60 backdrop-blur-sm" : "bg-background/80"
        )}>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}
    </>
  )
}
