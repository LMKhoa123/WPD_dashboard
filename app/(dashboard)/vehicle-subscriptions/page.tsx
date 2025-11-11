"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type VehicleSubscriptionRecord } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VehicleSubscriptionDialog } from "@/components/subscriptions/vehicle-subscription-dialog"
import { VehicleSubscriptionDetailDialog } from "@/components/subscriptions/vehicle-subscription-detail-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"
import { Eye } from "lucide-react"
import { AdminOrStaffOnly } from "@/components/role-guards"
import { formatVND, formatDate } from "@/lib/utils"

export default function VehicleSubscriptionsPage() {
  const [items, setItems] = useState<VehicleSubscriptionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const list = await api.getVehicleSubscriptions()
      setItems(list)
    } catch (e: any) {
      toast({ title: "Không tải được danh sách đăng ký", description: e?.message || "Failed to load vehicle subscriptions", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreated = (s: VehicleSubscriptionRecord) => {
    setItems((prev) => [s, ...prev])
  }

  const handleUpdated = (s: VehicleSubscriptionRecord) => {
    setItems((prev) => prev.map((it) => (it._id === s._id ? s : it)))
  }

  const handleRenew = async (id: string) => {
    try {
      setDeletingId(id)
      const renewed = await api.renewVehicleSubscription(id)
      setItems((prev) => prev.map((it) => (it._id === renewed._id ? renewed : it)))
      toast({ title: "Gia hạn thành công", description: "Đã gia hạn đăng ký gói bảo hành" })
    } catch (e: any) {
      toast({ title: "Gia hạn thất bại", description: e?.message || "Failed to renew subscription", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteVehicleSubscription(id)
      setItems((prev) => prev.filter((it) => it._id !== id))
      toast({ title: "Đã xóa đăng ký" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ACTIVE: "default",
      EXPIRED: "destructive",
      CANCELLED: "secondary"
    }
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>
  }

  return (
    <AdminOrStaffOnly>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Vehicle Subscriptions</h1>
          <VehicleSubscriptionDialog onCreated={handleCreated} />
        </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-muted-foreground">Chưa có đăng ký nào.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => {
              const vehicle = typeof it.vehicleId === 'object' ? it.vehicleId : null
              const packageInfo = typeof it.package_id === 'object' ? it.package_id : null
              
              return (
                <TableRow key={it._id}>
                  <TableCell className="font-medium">
                    {vehicle ? (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={(vehicle as any).image} alt={vehicle.vehicleName || "Vehicle"} />
                          <AvatarFallback>
                            {(vehicle.vehicleName || "?").slice(0,1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold">{vehicle.vehicleName}</span>
                          <span className="text-xs text-muted-foreground">{vehicle.model} • {vehicle.VIN}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {packageInfo ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{packageInfo.name}</span>
                        {packageInfo.price && (
                          <span className="text-xs text-muted-foreground">
                            {formatVND(packageInfo.price)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(it.start_date)}</TableCell>
                  <TableCell>{it.end_date ? formatDate(it.end_date) : '—'}</TableCell>
                  <TableCell>{getStatusBadge(it.status)}</TableCell>
                  <TableCell>{formatDate(it.createdAt)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <VehicleSubscriptionDetailDialog 
                      subscription={it} 
                      trigger={
                        <Button size="sm" variant="ghost" title="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <VehicleSubscriptionDialog subscription={it} onUpdated={handleUpdated} trigger={<Button size="sm" variant="outline">Edit</Button>} />

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={deletingId === it._id}>Delete</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Xóa đăng ký?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Bản ghi sẽ bị xóa vĩnh viễn.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(it._id)} disabled={deletingId === it._id}>
                            {deletingId === it._id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  
                     <Button size="sm" variant="default" onClick={() => handleRenew(it._id)} disabled={deletingId === it._id}>
                      Renew
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
      </div>
    </AdminOrStaffOnly>
  )
}
