import { useEffect, useState } from "react"
import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { ApiClient } from "@/lib/api/client"
import { AdminService } from "@/lib/api/admin.service"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Navigation, AlertCircle, MapPin } from "lucide-react"

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

export function DirectTaskPage() {
  const { id: anomalyId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [task, setTask] = useState<Task | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")

    if (!token) {
      setError("Відсутній токен авторизації")
      setLoading(false)
      return
    }

    const authenticate = async () => {
      try {
        // Автологін через magic link
        const authResponse = await fetch(
          `${import.meta.env.VITE_API_URL || ""}/auth/inspector/magic?token=${token}`
        )

        if (!authResponse.ok) {
          throw new Error("Невірне або прострочене посилання")
        }

        const { accessToken } = await authResponse.json()
        localStorage.setItem("token", accessToken)

        // Завантажуємо всі завдання інспектора
        const tasks = await AdminService.getMyTasks()

        // Знаходимо конкретне завдання
        const targetTask = tasks.find((t: any) => t.id === anomalyId)

        if (!targetTask) {
          throw new Error("Завдання не знайдено або не призначено вам")
        }

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

    authenticate()
  }, [anomalyId, searchParams])

  const handleNavigate = () => {
    if (!task?.lat || !task?.lng) {
      alert("Координати завдання недоступні")
      return
    }

    // Перенаправляємо на основну сторінку з завданнями, де буде автоматично прокладено маршрут
    navigate(`/inspector/tasks?taskId=${task.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <LoadingOverlay isLoading={true} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Помилка доступу</h2>
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    )
  }

  if (!task) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="max-w-2xl mx-auto pt-8 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{task.address}</h1>
              {task.suspectName && (
                <p className="text-sm text-muted-foreground mt-1">{task.suspectName}</p>
              )}
              {task.taxId && (
                <p className="font-mono text-xs text-muted-foreground mt-1">ІПН: {task.taxId}</p>
              )}
            </div>
          </div>

          <Card className="bg-muted/50 p-4 border-l-4 border-l-destructive">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              Виявлена розбіжність
            </h3>
            <p className="text-base">{task.description}</p>
          </Card>

          {task.enrichment && (
            <>
              <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 p-4">
                <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">
                  ⚖ Кримінальна відповідальність
                </p>
                <p className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">
                  {task.enrichment.criminalArticle}
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  {task.enrichment.legalBasis}
                </p>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 p-4">
                <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mb-2">
                  📋 Рекомендовані дії
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  {task.enrichment.inspectorAction}
                </p>
              </Card>
            </>
          )}

          {task.potentialFine && (
            <Card className="bg-amber-50 dark:bg-amber-950/20 p-4">
              <p className="text-xs text-muted-foreground">Потенційний штраф</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">
                {task.potentialFine.toLocaleString("uk-UA")} ₴
              </p>
            </Card>
          )}

          <Button
            size="lg"
            className="w-full gap-2 text-base shadow-lg"
            onClick={handleNavigate}
            disabled={!task.lat || !task.lng}
          >
            <Navigation className="h-5 w-5" />
            Прокласти маршрут
          </Button>

          {(!task.lat || !task.lng) && (
            <p className="text-xs text-center text-muted-foreground">
              Координати завдання ще не визначені
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
