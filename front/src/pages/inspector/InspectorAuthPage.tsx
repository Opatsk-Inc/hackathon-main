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
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-rose-200/80 bg-white/85 p-8 text-center shadow-[0_30px_80px_rgba(11,28,54,0.18)] backdrop-blur-3xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100/80 ring-1 ring-rose-200/70">
            <AlertCircle className="h-7 w-7 text-rose-600" />
          </div>
          <h2 className="font-heading mb-2 text-lg font-semibold tracking-[-0.01em] text-rose-700">
            Помилка входу
          </h2>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-white/80 p-8 text-center shadow-[0_30px_80px_rgba(11,28,54,0.18)] backdrop-blur-3xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/80 ring-1 ring-amber-200/70">
          <ShieldCheck className="h-7 w-7 animate-pulse text-amber-700" />
        </div>
        <p className="font-heading mb-2 text-base font-semibold tracking-[-0.01em] text-slate-900">
          Авторизація
        </p>
        <p className="text-sm text-slate-500">Перевіряємо ваш токен...</p>
        <Loader2 className="mx-auto mt-4 h-5 w-5 animate-spin text-amber-600" />
      </div>
    </div>
  )
}
