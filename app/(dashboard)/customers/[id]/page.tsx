"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
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
import { getApiClient, type CustomerRecord, type VehicleRecord } from "@/lib/api"
import { toast } from "sonner"
import { Mail, Phone, MapPin, Calendar, Car, ArrowLeft, Eye, AlertCircle, Pencil, Trash2 } from "lucide-react"
import { CustomerDialog } from "@/components/customers/customer-dialog"
import { useIsAdmin } from "@/components/auth-provider"

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string
  const isAdmin = useIsAdmin()

  const [customer, setCustomer] = useState<CustomerRecord | null>(null)
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const api = getApiClient()
        
        const [customerData, vehiclesData] = await Promise.all([
          api.getCustomerById(customerId),
          api.getVehiclesByCustomerId(customerId),
        ])

        setCustomer(customerData)
        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : [])
      } catch (e: any) {
        toast.error(e?.message || "Failed to load customer data")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [customerId])

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customer) return

    try {
      setDeleting(true)
      const api = getApiClient()
      await api.deleteCustomer(customer._id)
      
      toast.success("Customer deleted successfully")
      router.push("/customers")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete customer")
      setDeleting(false)
    }
  }

  const handleUpdateSuccess = (updated: CustomerRecord) => {
    setCustomer(updated)
  }

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
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
        <Button onClick={() => router.push("/customers")}>Back to Customers</Button>
      </div>
    )
  }

  const safeVehicles = Array.isArray(vehicles) ? vehicles : []
  const vehicleCount = safeVehicles.length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/customers")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{customer.customerName}</h1>
            <p className="text-muted-foreground">Customer details and registered vehicles</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <CustomerDialog
              customer={customer}
              trigger={
                <Button variant="outline">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              }
              onSuccess={handleUpdateSuccess}
            />
            <Button variant="destructive" onClick={handleDeleteClick}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>Customer contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{customer.userId?.phone || "No phone provided"}</span>
            </div>
            {customer.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Date of Birth: {formatDate(customer.dateOfBirth)}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{customer.address || "No address provided"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Registered: {formatDate(customer.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{vehicleCount} vehicle{vehicleCount !== 1 ? "s" : ""} registered</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
            <CardDescription>Vehicle ownership summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Vehicles</span>
              <span className="text-2xl font-bold">{vehicleCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="text-lg font-semibold">
                {formatPrice(safeVehicles.reduce((sum, v) => sum + (v.price || 0), 0))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Mileage</span>
              <span className="text-lg font-semibold">
                {vehicleCount > 0
                  ? formatMileage(Math.round(safeVehicles.reduce((sum, v) => sum + (v.mileage || 0), 0) / vehicleCount))
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Vehicles ({vehicleCount})</CardTitle>
          <CardDescription>All vehicles owned by this customer</CardDescription>
        </CardHeader>
        <CardContent>
          {vehicleCount === 0 ? (
            <div className="py-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No vehicles registered yet</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {safeVehicles.map((vehicle) => (
                <Card key={vehicle._id} className="overflow-hidden">
                  <div className="relative aspect-video w-full bg-muted">
                    {vehicle.image ? (
                      <img
                        src={vehicle.image}
                        alt={vehicle.vehicleName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Car className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{vehicle.vehicleName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{vehicle.model}</Badge>
                        {vehicle.year && (
                          <span className="text-xs text-muted-foreground">{vehicle.year}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold">{formatPrice(vehicle.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mileage</span>
                        <span>{formatMileage(vehicle.mileage)}</span>
                      </div>
                      {vehicle.plateNumber && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plate</span>
                          <Badge variant="outline" className="text-xs">{vehicle.plateNumber}</Badge>
                        </div>
                      )}
                    </div>

                    <Link href={`/vehicles/${vehicle._id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer ID</span>
            <span className="font-mono text-xs">{customer._id}</span>
          </div>
          {customer.userId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">User ID</span>
              <span className="font-mono text-xs">{customer.userId._id}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created</span>
            <span>{formatDate(customer.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span>{formatDate(customer.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
