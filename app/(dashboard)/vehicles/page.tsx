"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Search, Pencil, Trash2, Plus, Car, Eye, UserPlus } from "lucide-react"
import { useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { AdminOrStaffOnly } from "@/components/role-guards"
import { getApiClient, type VehicleRecord } from "@/lib/api"
import { toast } from "sonner"
import { VehicleDialog } from "@/components/vehicles/vehicle-dialog"
import { AssignVehicleDialog } from "@/components/vehicles/assign-vehicle-dialog"
import { formatVND, formatNumber } from "@/lib/utils"
import { DataPagination } from "@/components/ui/data-pagination"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<VehicleRecord | null>(null)
  const [deleting, setDeleting] = useState(false)
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()

  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const limit = 20

  const loadVehicles = async (page: number) => {
    try {
      setLoading(true)
      const api = getApiClient()
      const res = await api.getVehicles({ page, limit })
      const list = Array.isArray(res) ? res : (res as any).data?.vehicles || []
      setVehicles(list)
      const total = Array.isArray(res) ? list.length : (res as any).data?.total || list.length
      setTotalItems(total)
      setTotalPages(Math.ceil(total / limit))
    } catch (e: any) {
      toast.error(e?.message || "Failed to load vehicles")
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles(currentPage)
  }, [currentPage])

  const filteredVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return []
    const q = searchQuery.toLowerCase()
    return vehicles.filter((v) => {
      const owner = typeof v.customerId === "object" && v.customerId ? (v.customerId.customerName || "") : ""
      const vin = (v.VIN || "").toLowerCase()
      const plate = (v.plateNumber || "").toLowerCase()
      return (
        v.vehicleName.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
        vin.includes(q) ||
        plate.includes(q)
      )
    })
  }, [vehicles, searchQuery])

  const formatPrice = (price?: number) => {
    if (!price) return "—"
    return formatVND(price)
  }

  const formatMileage = (mileage?: number) => {
    if (mileage === undefined || mileage === null) return "—"
    return `${formatNumber(mileage)} km`
  }

  const handleDeleteClick = (vehicle: VehicleRecord) => {
    setVehicleToDelete(vehicle)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return

    try {
      setDeleting(true)
      const api = getApiClient()
      await api.deleteVehicle(vehicleToDelete._id)
      
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleToDelete._id))
      toast.success("Vehicle deleted")
      setDeleteDialogOpen(false)
      setVehicleToDelete(null)
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete vehicle")
    } finally {
      setDeleting(false)
    }
  }

  const handleVehicleUpdated = (updated: VehicleRecord) => {
    setVehicles((prev) => prev.map((v) => (v._id === updated._id ? updated : v)))
  }

  return (
    <AdminOrStaffOnly>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">Manage vehicle registrations and information</p>
        </div>
        {(isAdmin || isStaff) && (
          <VehicleDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle
              </Button>
            }
            onCreated={(v) => {
              setVehicles((prev) => [v, ...prev])
            }}
          />
        )}
      </div>

      {/* Stats Cards */}
      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPrice(vehicles.reduce((sum, v) => sum + (v.price || 0), 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Mileage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicles.length > 0
                ? formatMileage(
                    Math.round(vehicles.reduce((sum, v) => sum + (v.mileage || 0), 0) / vehicles.length)
                  )
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div> */}

      <Card>
        <CardHeader>
          <CardTitle>All Vehicles</CardTitle>
          <CardDescription>View and manage registered vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading vehicles...</div>
          ) : (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by vehicle name, owner, VIN, or plate number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Model & Year</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>VIN</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((v) => (
                      <TableRow key={v._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={v.image} alt={v.vehicleName} />
                              <AvatarFallback>
                                <Car className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{v.vehicleName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary">{v.model}</Badge>
                            {v.year && <span className="text-xs text-muted-foreground">{v.year}</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeof v.customerId === "object" && v.customerId
                            ? v.customerId.customerName || "—"
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{v.plateNumber || "—"}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{v.VIN}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link href={`/vehicles/${v._id}`}>
                              <Button variant="ghost" size="icon" title="View details">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {(isAdmin || isStaff) && (
                              <AssignVehicleDialog
                                vehicleId={v._id}
                                vehicleName={v.vehicleName}
                                trigger={
                                  <Button variant="ghost" size="icon" title="Assign vehicle to customer">
                                    <UserPlus className="h-4 w-4 text-blue-600" />
                                  </Button>
                                }
                              />
                            )}
                            {(isAdmin || isStaff) && (
                              <>
                                <VehicleDialog
                                  vehicle={v}
                                  trigger={
                                    <Button variant="ghost" size="icon" title="Edit vehicle">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  }
                                  onUpdated={handleVehicleUpdated}
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteClick(v)}
                                  title="Delete vehicle"
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vehicle "{vehicleToDelete?.vehicleName}".
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
      
      <div className="mt-4">
        <DataPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
    </AdminOrStaffOnly>
  )
}
