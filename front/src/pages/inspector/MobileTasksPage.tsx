import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { AdminService } from "@/lib/api/admin.service"
import { InspectorMobileLayout } from "@/components/layouts"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    queryKey: ['myTasks'],
    queryFn: AdminService.getMyTasks,
  })

  const tasks: Task[] = apiTasks
    .filter((t: any) => t.lat != null && t.lng != null)
    .map((t: any) => ({
      id: t.id,
      address: t.address,
      cadastralNumber: t.taxId ?? '',
      discrepancy: t.description ?? '',
      lat: t.lat,
      lng: t.lng,
      distance: '',
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
  const previousLocationRef = useRef<[number, number] | null>(null)

  type ViewMode = "map" | "list";

  // Відстеження геолокації користувача
  useEffect(() => {
    if (!navigator.geolocation) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ]

        // Обчислюємо напрямок руху
        if (previousLocationRef.current && isNavigating) {
          const [prevLng, prevLat] = previousLocationRef.current
          const [newLng, newLat] = coords

          // Обчислюємо bearing (кут напрямку)
          const dLng = newLng - prevLng
          const dLat = newLat - prevLat
          const bearing = Math.atan2(dLng, dLat) * (180 / Math.PI)

          setUserHeading(bearing)

          // Оновлюємо камеру в режимі навігації
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

  const handleNavigate = async (task: Task) => {
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
  }

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

  // Автоматичне прокладання маршруту при переході з DirectTaskPage
  useEffect(() => {
    if (autoTaskId && tasks.length > 0 && userLocation) {
      const targetTask = tasks.find((t) => t.id === autoTaskId)
      if (targetTask) {
        handleNavigate(targetTask)
      }
    }
  }, [autoTaskId, tasks.length, userLocation])

  return (
    <InspectorMobileLayout title="Мої завдання">
      <div className="relative h-[calc(100vh-3.5rem)]">
        {/* Map View */}
        {viewMode === "map" && (
          <LoadingOverlay isLoading={isLoadingRoute} blur>
            <div className="absolute inset-0">
              <MapComponent
                ref={mapRef}
                center={userLocation || [30.5234, 50.4501]}
                zoom={isNavigating ? 15 : 12}
                className="h-full w-full"
              >
                {/* Маркери завдань */}
                {tasks.map((task) => (
                  <MapMarker
                    key={task.id}
                    longitude={task.lng}
                    latitude={task.lat}
                    onClick={() => setSelectedTask(task)}
                  >
                    <MarkerContent>
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 shadow-xl transition-transform hover:scale-110 border-2 border-white">
                          <MapPin className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-red-500/50 blur-sm" />
                      </div>
                    </MarkerContent>
                  </MapMarker>
                ))}

                {/* Позиція користувача */}
                {userLocation && (
                  <MapMarker
                    longitude={userLocation[0]}
                    latitude={userLocation[1]}
                  >
                    <MarkerContent>
                      <div className="relative">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 border-4 border-white shadow-xl">
                          <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping" />
                      </div>
                    </MarkerContent>
                  </MapMarker>
                )}

                {/* Маршрут */}
                {(showRoutePreview || isNavigating) && routeCoordinates.length > 0 && (
                  <MapRoute
                    coordinates={routeCoordinates}
                    color="#3B82F6"
                    width={5}
                    opacity={0.9}
                  />
                )}

                <MapControls showZoom showLocate position="bottom-right" />
              </MapComponent>
            </div>

            {/* Floating View Toggle */}
            <div className="absolute top-4 left-4 z-10">
              <div className="flex gap-2 bg-background/95 backdrop-blur-sm rounded-full p-1 shadow-xl border">
                <Button
                  variant={(viewMode as ViewMode) === "map" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4" />
                </Button>
                <Button
                  variant={(viewMode as ViewMode) === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Task Counter Badge */}
            {!isNavigating && !showRoutePreview && (
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-xl font-semibold text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {tasks.length} завдань
                </div>
              </div>
            )}

            {/* Route Preview Card */}
            {showRoutePreview && previewTask && (
              <div className="absolute bottom-6 left-4 right-4 z-10">
                <Card className="p-5 shadow-2xl border-2">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Navigation className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{previewTask.address}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{previewTask.discrepancy}</p>
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
                      className="flex-1 gap-2 shadow-lg"
                      onClick={confirmRoute}
                    >
                      <Navigation className="h-5 w-5" />
                      Почати
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Navigation Active Bar */}
            {isNavigating && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-destructive text-destructive-foreground rounded-full px-6 py-3 shadow-2xl flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="font-semibold">Навігація активна</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full hover:bg-white/20"
                    onClick={stopNavigation}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </LoadingOverlay>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <div className="h-full overflow-y-auto bg-muted/30 p-4">
            {/* Floating View Toggle */}
            <div className="fixed top-[4.5rem] left-4 z-10">
              <div className="flex gap-2 bg-background/95 backdrop-blur-sm rounded-full p-1 shadow-xl border">
                <Button
                  variant={(viewMode as ViewMode) === "map" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setViewMode("map")}
                >
                  <Map className="h-4 w-4" />
                </Button>
                <Button
                  variant={(viewMode as ViewMode) === "list" ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3 pt-12">
              {tasks.map((task, index) => (
                <Card
                  key={task.id}
                  className="cursor-pointer p-4 transition-all hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-primary"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{task.address}</h3>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {task.cadastralNumber}
                      </p>
                      <p className="text-sm mt-2">{task.discrepancy}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {task.distance}
                        </span>
                        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                          Очікує
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Task Detail Drawer */}
        <Drawer open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <DrawerContent>
            <div className="mx-auto w-full max-w-md">
              <DrawerHeader>
                <DrawerTitle className="text-xl">
                  {selectedTask?.address}
                </DrawerTitle>
                <p className="font-mono text-sm text-muted-foreground">
                  {selectedTask?.cadastralNumber}
                </p>
              </DrawerHeader>

              <div className="space-y-4 p-6">
                <Card className="bg-muted/50 p-4 border-l-4 border-l-primary">
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Виявлена розбіжність
                  </h4>
                  <p className="text-base">{selectedTask?.discrepancy}</p>
                </Card>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 text-base hover:bg-primary/10 hover:text-primary"
                  onClick={() => selectedTask && handleNavigate(selectedTask)}
                >
                  <Navigation className="h-5 w-5" />
                  Прокласти маршрут
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full gap-2 text-base min-h-[56px]"
                >
                  <Camera className="h-6 w-6" />
                  Додати фото з місця
                </Button>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="flex-1 gap-2 text-base min-h-[56px]"
                    onClick={() => setSelectedTask(null)}
                  >
                    <X className="h-5 w-5" />
                    Хибне
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 gap-2 text-base min-h-[56px] shadow-lg"
                    onClick={() => setSelectedTask(null)}
                  >
                    <Check className="h-5 w-5" />
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
