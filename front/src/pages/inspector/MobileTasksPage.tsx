import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { AdminService } from "@/lib/api/admin.service"
import { ApiClient } from "@/lib/api/client"
import { InspectorMobileLayout } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Map as MapComponent,
  MapMarker,
  MarkerContent,
  MapControls,
  MapRoute,
} from "@/components/ui/map"
import { LoadingOverlay } from "@/components/ui/loading-spinner"
import {
  Map,
  List,
  Navigation,
  Camera,
  MapPin,
  X,
  Check,
  Layers,
  Loader2,
} from "lucide-react"
import type { MapRef } from "@/components/ui/map"
import maplibregl from "maplibre-gl"

interface Task {
  id: string
  address: string
  cadastralNumber: string
  discrepancy: string
  lat: number
  lng: number
  distance: string
}

export function MobileTasksPage() {
  const [searchParams] = useSearchParams()
  const autoTaskId = searchParams.get("taskId")

  const { data: apiTasks = [] } = useQuery({
    queryKey: ["myTasks"],
    queryFn: AdminService.getMyTasks,
  })

  const tasks: Task[] = apiTasks
    .filter((t: any) => t.lat != null && t.lng != null)
    .map((t: any) => ({
      id: t.id,
      address: t.address,
      cadastralNumber: t.taxId ?? "",
      discrepancy: t.description ?? "",
      lat: t.lat,
      lng: t.lng,
      distance: "",
    }))

  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  )
  const [isNavigating, setIsNavigating] = useState(false)
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  )
  const [showRoutePreview, setShowRoutePreview] = useState(false)
  const [previewTask, setPreviewTask] = useState<Task | null>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)
  const [userHeading, setUserHeading] = useState<number>(0)
  const mapRef = useRef<MapRef>(null)
  const queryClient = useQueryClient()
  const resolveMutation = useMutation({
    mutationFn: async ({
      taskId,
      confirmed,
    }: {
      taskId: string
      confirmed: boolean
    }) => {
      return ApiClient.patch(`/api/mobile/tasks/${taskId}/resolve`, {
        status: confirmed ? "RESOLVED" : "CANCELLED",
        comment: "",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myTasks"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] })
      queryClient.invalidateQueries({ queryKey: ["discrepancies"] })
      setSelectedTask(null)
    },
  })

  const handleResolve = (confirmed: boolean) => {
    if (!selectedTask) return
    resolveMutation.mutate({ taskId: selectedTask.id, confirmed })
  }

  const previousLocationRef = useRef<[number, number] | null>(null)

  type ViewMode = "map" | "list"

  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ]

        if (previousLocationRef.current && isNavigating) {
          const [prevLng, prevLat] = previousLocationRef.current
          const [newLng, newLat] = coords

          const dLng = newLng - prevLng
          const dLat = newLat - prevLat
          const bearing = Math.atan2(dLng, dLat) * (180 / Math.PI)

          setUserHeading(bearing)

          if (mapRef.current) {
            mapRef.current.easeTo({
              center: coords,
              bearing: bearing,
              duration: 1000,
            })
          }
        }

        previousLocationRef.current = coords
        setUserLocation(coords)
      },
      (error) => {
        console.error("Geolocation error:", error)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000,
      }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [isNavigating])

  const handleNavigate = useCallback(
    async (task: Task) => {
      if (!userLocation) {
        alert("Не вдалося визначити ваше місцезнаходження")
        return
      }

      setSelectedTask(null)
      setViewMode("map")
      setIsLoadingRoute(true)
      setPreviewTask(task)

      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${userLocation[0]},${userLocation[1]};${task.lng},${task.lat}?overview=full&geometries=geojson`
        )
        const data = await response.json()

        if (data.routes && data.routes[0]) {
          const coordinates = data.routes[0].geometry.coordinates as [
            number,
            number,
          ][]
          setRouteCoordinates(coordinates)

          setTimeout(() => {
            if (mapRef.current) {
              const bounds = coordinates.reduce(
                (bounds, coord) => bounds.extend(coord as [number, number]),
                new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
              )
              mapRef.current.fitBounds(bounds, {
                padding: { top: 100, bottom: 200, left: 50, right: 50 },
                duration: 1500,
              })
            }
          }, 100)
        } else {
          setRouteCoordinates([userLocation, [task.lng, task.lat]])
        }

        setShowRoutePreview(true)
      } catch (error) {
        console.error("Route error:", error)
        setRouteCoordinates([userLocation, [task.lng, task.lat]])
        setShowRoutePreview(true)
      } finally {
        setIsLoadingRoute(false)
      }
    },
    [userLocation]
  )

  const confirmRoute = () => {
    setShowRoutePreview(false)
    setIsNavigating(true)

    setTimeout(() => {
      if (mapRef.current && userLocation) {
        mapRef.current.easeTo({
          center: userLocation,
          zoom: 21,
          pitch: 75,
          bearing: userHeading || 0,
          duration: 1500,
        })
      }
    }, 100)
  }

  const cancelRoute = () => {
    setShowRoutePreview(false)
    setRouteCoordinates([])
    setPreviewTask(null)
  }

  const stopNavigation = () => {
    setIsNavigating(false)
    setRouteCoordinates([])
  }

  useEffect(() => {
    if (autoTaskId && tasks.length > 0 && userLocation) {
      const targetTask = tasks.find((t) => t.id === autoTaskId)
      if (targetTask) {
        setTimeout(() => handleNavigate(targetTask), 0)
      }
    }
  }, [autoTaskId, tasks, userLocation, handleNavigate])

  const ViewToggle = ({ className = "" }: { className?: string }) => (
    <div
      className={`flex gap-1 rounded-full border border-white/70 bg-white/80 p-1 shadow-[0_10px_30px_rgba(11,28,54,0.10)] backdrop-blur-2xl ${className}`}
    >
      <Button
        variant={(viewMode as ViewMode) === "map" ? "default" : "ghost"}
        size="sm"
        className="h-8 rounded-full px-3"
        onClick={() => setViewMode("map")}
      >
        <Map className="h-4 w-4" />
      </Button>
      <Button
        variant={(viewMode as ViewMode) === "list" ? "default" : "ghost"}
        size="sm"
        className="h-8 rounded-full px-3"
        onClick={() => setViewMode("list")}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )

  return (
    <InspectorMobileLayout title="Мої завдання" subtitle="Маршрутна карта">
      <div className="relative h-[calc(100vh-3.5rem)]">
        {viewMode === "map" && (
          <LoadingOverlay isLoading={isLoadingRoute} blur>
            <div className="absolute inset-0">
              <MapComponent
                ref={mapRef}
                center={userLocation || [30.5234, 50.4501]}
                zoom={isNavigating ? 15 : 12}
                className="h-full w-full"
              >
                {tasks.map((task) => (
                  <MapMarker
                    key={task.id}
                    longitude={task.lng}
                    latitude={task.lat}
                    onClick={() => setSelectedTask(task)}
                  >
                    <MarkerContent>
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-amber-600 shadow-[0_12px_28px_rgba(217,119,6,0.4)] transition-transform hover:scale-110">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-amber-500/60 blur-sm" />
                      </div>
                    </MarkerContent>
                  </MapMarker>
                ))}

                {userLocation && (
                  <MapMarker
                    longitude={userLocation[0]}
                    latitude={userLocation[1]}
                  >
                    <MarkerContent>
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-sky-500 shadow-[0_10px_24px_rgba(37,99,235,0.45)]">
                          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />
                        </div>
                        <div className="absolute inset-0 animate-ping rounded-full bg-sky-400/40" />
                      </div>
                    </MarkerContent>
                  </MapMarker>
                )}

                {(showRoutePreview || isNavigating) &&
                  routeCoordinates.length > 0 && (
                    <MapRoute
                      coordinates={routeCoordinates}
                      color="#d97706"
                      width={5}
                      opacity={0.9}
                    />
                  )}

                <MapControls showZoom showLocate position="bottom-right" />
              </MapComponent>
            </div>

            <div className="absolute top-4 left-4 z-10">
              <ViewToggle />
            </div>

            {!isNavigating && !showRoutePreview && (
              <div className="absolute top-4 right-4 z-10">
                <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3.5 py-1.5 text-sm font-semibold text-slate-800 shadow-[0_10px_30px_rgba(11,28,54,0.10)] backdrop-blur-2xl">
                  <Layers className="h-4 w-4 text-amber-600" />
                  <span className="tabular-nums">{tasks.length}</span>
                  <span className="text-slate-500">завдань</span>
                </div>
              </div>
            )}

            {showRoutePreview && previewTask && (
              <div className="absolute right-4 bottom-6 left-4 z-10">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_30px_80px_rgba(11,28,54,0.18)] backdrop-blur-3xl">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100/80 ring-1 ring-amber-200/70">
                      <Navigation className="h-5 w-5 text-amber-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-heading text-base leading-tight font-semibold tracking-[-0.01em] text-slate-900">
                        {previewTask.address}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {previewTask.discrepancy}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="flex-1"
                      onClick={cancelRoute}
                    >
                      Скасувати
                    </Button>
                    <Button
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={confirmRoute}
                    >
                      <Navigation className="h-5 w-5" />
                      Почати
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isNavigating && (
              <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
                <div className="flex items-center gap-3 rounded-full border border-white/60 bg-rose-500/90 px-5 py-2.5 text-white shadow-[0_18px_40px_rgba(225,29,72,0.35)] backdrop-blur-2xl">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  <span className="text-sm font-semibold">
                    Навігація активна
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 rounded-full p-0 text-white hover:bg-white/20 hover:text-white"
                    onClick={stopNavigation}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </LoadingOverlay>
        )}

        {viewMode === "list" && (
          <div className="h-full overflow-y-auto p-4">
            <div className="fixed top-[4.5rem] left-4 z-10">
              <ViewToggle />
            </div>

            <div className="space-y-3 pt-12">
              {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/70 bg-white/75 p-10 text-center text-sm text-slate-500 shadow-[0_14px_36px_rgba(11,28,54,0.06)] backdrop-blur-2xl">
                  Немає призначених завдань
                </div>
              ) : (
                tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="group cursor-pointer rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_1px_2px_rgba(11,28,54,0.04),0_10px_24px_rgba(11,28,54,0.05)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(11,28,54,0.06),0_18px_38px_rgba(11,28,54,0.10)]"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100/80 font-heading text-sm font-semibold text-amber-700 tabular-nums ring-1 ring-amber-200/70">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-heading text-base leading-tight font-semibold tracking-[-0.01em] text-slate-900">
                          {task.address}
                        </h3>
                        {task.cadastralNumber && (
                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {task.cadastralNumber}
                          </p>
                        )}
                        <p className="mt-2 line-clamp-2 text-sm text-slate-700">
                          {task.discrepancy}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {task.distance || "—"}
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50/90 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Очікує
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <Drawer
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
        >
          <DrawerContent>
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle className="font-heading text-xl font-semibold tracking-[-0.02em] text-slate-900">
                  {selectedTask?.address}
                </DrawerTitle>
                {selectedTask?.cadastralNumber && (
                  <p className="font-mono text-sm text-slate-500">
                    {selectedTask.cadastralNumber}
                  </p>
                )}
              </DrawerHeader>

              <div className="space-y-4 p-6">
                <div className="rounded-2xl border border-white/70 bg-amber-50/70 p-4 ring-1 ring-amber-200/60 backdrop-blur-xl">
                  <h4 className="text-[11px] font-semibold tracking-[0.1em] text-amber-700 uppercase">
                    Виявлена розбіжність
                  </h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-800">
                    {selectedTask?.discrepancy}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 text-base"
                  onClick={() => selectedTask && handleNavigate(selectedTask)}
                >
                  <Navigation className="h-5 w-5" />
                  Прокласти маршрут
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="min-h-[56px] w-full gap-2 text-base"
                >
                  <Camera className="h-5 w-5" />
                  Додати фото з місця
                </Button>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="min-h-[56px] flex-1 gap-2 border-rose-200/80 bg-white/80 text-base text-rose-700 hover:bg-rose-50/80 hover:text-rose-800"
                    disabled={resolveMutation.isPending}
                    onClick={() => handleResolve(false)}
                  >
                    {resolveMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                    Хибне
                  </Button>
                  <Button
                    size="lg"
                    className="min-h-[56px] flex-1 gap-2 bg-emerald-600 text-base text-white shadow-[0_12px_30px_rgba(5,150,105,0.28)] hover:bg-emerald-500 hover:shadow-[0_16px_38px_rgba(5,150,105,0.34)]"
                    disabled={resolveMutation.isPending}
                    onClick={() => handleResolve(true)}
                  >
                    {resolveMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="h-5 w-5" />
                    )}
                    Підтвердити
                  </Button>
                </div>
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </InspectorMobileLayout>
  )
}
