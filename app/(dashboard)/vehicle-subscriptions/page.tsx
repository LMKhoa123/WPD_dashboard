"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type VehicleSubscriptionRecord } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VehicleSubscriptionDialog } from "@/components/subscriptions/vehicle-subscription-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"

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

  return (
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
            {items.map((it) => (
              <TableRow key={it._id}>
                <TableCell className="font-medium">
                  {typeof it.vehicleId === 'string' ? it.vehicleId : `${it.vehicleId?.vehicleName} • ${it.vehicleId?.model} • ${it.vehicleId?.VIN}`}
                </TableCell>
                <TableCell>
                  {typeof it.package_id === 'string' ? it.package_id : `${it.package_id?.name}`}
                </TableCell>
                <TableCell>{new Date(it.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{it.end_date ? new Date(it.end_date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{it.status}</TableCell>
                <TableCell>{new Date(it.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-2">
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
