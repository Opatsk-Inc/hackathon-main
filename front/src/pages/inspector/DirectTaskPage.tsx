import { useEffect, useRef, useState } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { AuthService } from "@/lib/api/auth.service"
import { AdminService } from "@/lib/api/admin.service"
import { useInspectorStore } from "@/features/auth/store/inspector.store"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import {
  Navigation,
  AlertCircle,
  MapPin,
  Scale,
  ClipboardList,
  Coins,
} from "lucide-react"
import { AiRecommendation } from "@/components/AiRecommendation"

interface Task {
  id: string
  address: string
  cadastralNumber?: string
  taxId?: string
  description: string
  discrepancy?: string
  lat: number | null
  lng: number | null
  suspectName?: string
  potentialFine?: number
  enrichment?: {
    riskLevel: string
    criminalArticle: string
    legalBasis: string
    inspectorAction: string
  }
}

const RISK_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  CRITICAL: {
    label: "Критичний",
    cls: "bg-rose-50/90 text-rose-700 ring-1 ring-rose-200/80",
    dot: "bg-rose-500",
  },
  HIGH: {
    label: "Високий",
    cls: "bg-amber-50/90 text-amber-800 ring-1 ring-amber-200/80",
    dot: "bg-amber-500",
  },
  MEDIUM: {
    label: "Середній",
    cls: "bg-yellow-50/90 text-yellow-800 ring-1 ring-yellow-200/80",
    dot: "bg-yellow-500",
  },
  LOW: {
    label: "Низький",
    cls: "bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200/80",
    dot: "bg-emerald-500",
  },
}

export function DirectTaskPage() {
  const { id: anomalyId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useInspectorStore()
  const didRun = useRef(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    // Guard against React 18 StrictMode double-fire
    if (didRun.current) return
    didRun.current = true

    const token = searchParams.get("token")
    if (!token) {
      setError("Відсутній токен авторизації")
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        // Authenticate via magic link using the shared ApiClient (correct base URL)
        const { accessToken, inspector } = await AuthService.inspectorMagicLink(token)
        // Store session so InspectorRoute and ApiClient both see the token
        setSession(accessToken, inspector)

        const tasks = await AdminService.getMyTasks()
        const targetTask = tasks.find((t: any) => t.id === anomalyId)
        if (!targetTask) throw new Error("Завдання не знайдено або не призначено вам")

        setTask({
          id: targetTask.id,
          address: targetTask.address,
          taxId: targetTask.taxId,
          description: targetTask.description,
          lat: targetTask.lat,
          lng: targetTask.lng,
          suspectName: targetTask.suspectName,
          potentialFine: targetTask.potentialFine,
          enrichment: targetTask.enrichment,
        })
      } catch (err: any) {
        setError(err.message || "Помилка завантаження завдання")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [anomalyId, searchParams])

  const handleNavigate = () => {
    if (!task?.lat || !task?.lng) {
      alert("Координати завдання недоступні")
      return
    }
    navigate(`/inspector/tasks?taskId=${task.id}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <LoadingOverlay isLoading={true}>
          <div className="h-24 w-24" />
        </LoadingOverlay>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-rose-200/80 bg-white/85 p-8 text-center shadow-[0_30px_80px_rgba(11,28,54,0.18)] backdrop-blur-3xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100/80 ring-1 ring-rose-200/70">
            <AlertCircle className="h-7 w-7 text-rose-600" />
          </div>
          <h2 className="font-heading mb-2 text-lg font-semibold tracking-[-0.01em] text-rose-700">
            Помилка доступу
          </h2>
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return null
  }

  const risk = task.enrichment?.riskLevel ? RISK_CONFIG[task.enrichment.riskLevel] : null

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-5 pt-4">
        <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/75 p-6 shadow-[0_30px_80px_rgba(11,28,54,0.14)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />

          <div className="relative space-y-5">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 ring-1 ring-amber-200/70">
                <MapPin className="h-6 w-6 text-amber-700" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-heading text-xl font-semibold leading-tight tracking-[-0.02em] text-slate-900 md:text-2xl">
                  {task.address}
                </h1>
                {task.suspectName && (
                  <p className="mt-1 text-sm text-slate-600">{task.suspectName}</p>
                )}
                {task.taxId && (
                  <p className="mt-0.5 font-mono text-xs text-slate-500">ІПН: {task.taxId}</p>
                )}
              </div>
            </div>

            {risk && (
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${risk.cls}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} />
                {risk.label} ризик
              </span>
            )}

            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 ring-1 ring-amber-200/50 backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                Виявлена розбіжність
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{task.description}</p>
            </div>

            {task.enrichment && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 shrink-0 text-rose-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-rose-700">
                      Кримінальна відповідальність
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-rose-800">
                    {task.enrichment.criminalArticle}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-rose-700/90">
                    {task.enrichment.legalBasis}
                  </p>
                </div>

                <div className="rounded-2xl border border-sky-200/80 bg-sky-50/70 p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 shrink-0 text-sky-600" />
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sky-700">
                      Рекомендовані дії
                    </p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-sky-900">
                    {task.enrichment.inspectorAction}
                  </p>
                </div>
              </div>
            )}

            <AiRecommendation anomalyId={task.id} />

            {task.potentialFine && (
              <div className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 backdrop-blur-xl">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100/90 ring-1 ring-amber-200/70">
                    <Coins className="h-4 w-4 text-amber-700" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-amber-700">
                    Потенційний штраф
                  </p>
                </div>
                <p className="font-heading text-xl font-semibold tracking-[-0.02em] tabular-nums text-amber-800">
                  {task.potentialFine.toLocaleString("uk-UA")} ₴
                </p>
              </div>
            )}

            <Button
              size="lg"
              className="w-full gap-2 text-base"
              onClick={handleNavigate}
              disabled={!task.lat || !task.lng}
            >
              <Navigation className="h-5 w-5" />
              Прокласти маршрут
            </Button>

            {(!task.lat || !task.lng) && (
              <p className="text-center text-xs text-slate-500">
                Координати завдання ще не визначені
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
