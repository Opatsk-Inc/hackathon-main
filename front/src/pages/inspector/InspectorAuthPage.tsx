import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthService } from "@/lib/api/auth.service"
import { useInspectorStore } from "@/features/auth/store/inspector.store"
import { ShieldCheck, AlertCircle, Loader2 } from "lucide-react"

export function InspectorAuthPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useInspectorStore()
  const [error, setError] = useState<string | null>(null)
  const didRun = useRef(false)

  useEffect(() => {
    // Guard against React 18 StrictMode double-fire
    if (didRun.current) return
    didRun.current = true

    const token = searchParams.get("token")
    if (!token) {
      setError("Посилання недійсне — відсутній токен.")
      return
    }

    AuthService.inspectorMagicLink(token)
      .then(({ accessToken, inspector }) => {
        setSession(accessToken, inspector)
        navigate("/inspector/tasks", { replace: true })
      })
      .catch(() => {
        setError("Посилання недійсне або застаріле. Зверніться до адміністратора.")
      })
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold text-destructive">Помилка входу</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary animate-pulse" />
        <p className="text-sm text-muted-foreground">Авторизація...</p>
        <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  )
}
