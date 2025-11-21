"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, DollarSign, Gauge, Hash, MapPin, User, Car as CarIcon, AlertCircle, Pencil, Trash2 } from "lucide-react"
import { getApiClient, type VehicleRecord } from "@/lib/api"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { AdminOrStaffOnly } from "@/components/role-guards"
import { VehicleDialog } from "@/components/vehicles/vehicle-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function VehicleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const vehicleId = params.id as string

  const [vehicle, setVehicle] = useState<VehicleRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        const data = await api.getVehicleById(vehicleId)
        setVehicle(data)
      } catch (e: any) {
        toast.error(e?.message || "Failed to load vehicle")
        
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [vehicleId])

  const formatPrice = (price?: number) => {
    if (!price) return "—"
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
  }

  const formatMileage = (mileage?: number) => {
    if (mileage === undefined || mileage === null) return "—"
    return `${mileage.toLocaleString("vi-VN")} km`
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!vehicle) return

    try {
      setDeleting(true)
      const api = getApiClient()
      await api.deleteVehicle(vehicle._id)
      
      toast.success("Vehicle deleted successfully")
      router.push("/vehicles")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete vehicle")
      setDeleting(false)
    }
  }

  const handleVehicleUpdated = (updated: VehicleRecord) => {
    setVehicle(updated)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-1" />
          <Skeleton className="h-96 md:col-span-2" />
        </div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vehicle not found</h2>
        <Button onClick={() => router.push("/vehicles")}>Back to Vehicles</Button>
      </div>
    )
  }

  return (
    <AdminOrStaffOnly>
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/vehicles")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{vehicle.vehicleName}</h1>
            <p className="text-muted-foreground">Vehicle Details & Information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-base px-4 py-2">
            {vehicle.model}
          </Badge>
          {(isAdmin || isStaff) && (
            <>
              <VehicleDialog
                vehicle={vehicle}
                trigger={
                  <Button variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                }
                onUpdated={handleVehicleUpdated}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square w-full">
              {vehicle.image ? (
                <img
                  src={vehicle.image}
                  alt={vehicle.vehicleName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <CarIcon className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-2xl font-bold">{formatPrice(vehicle.price)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Year</span>
                <span className="text-lg font-semibold">{vehicle.year || "—"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Vehicle identification and ownership details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">VIN</p>
                    <p className="font-mono text-sm">{vehicle.VIN}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Plate Number</p>
                    <p className="text-sm">
                      <Badge variant="outline">{vehicle.plateNumber || "Not registered"}</Badge>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Owner</p>
                    <p className="text-sm">
                      {typeof vehicle.customerId === "object" && vehicle.customerId
                        ? vehicle.customerId.customerName
                        : "No owner assigned"}
                    </p>
                    {typeof vehicle.customerId === "object" && vehicle.customerId?.address && (
                      <p className="text-xs text-muted-foreground">{vehicle.customerId.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Model</p>
                    <p className="text-sm">{vehicle.model}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service & Maintenance</CardTitle>
              <CardDescription>Mileage and service history</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <Gauge className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Mileage</p>
                    <p className="text-lg font-semibold">{formatMileage(vehicle.mileage)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Last Service</p>
                    <p className="text-sm">{formatDate(vehicle.last_service_date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Last Alert Mileage</p>
                    <p className="text-sm">{formatMileage(vehicle.last_alert_mileage)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDate(vehicle.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span>{formatDate(vehicle.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle ID</span>
                <span className="font-mono text-xs">{vehicle._id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vehicle "{vehicle.vehicleName}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </AdminOrStaffOnly>
  )
}
