"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type ServicePackageRecord } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ServicePackageDialog } from "@/components/service-packages/service-package-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"

export default function ServicePackagesPage() {
  const [packages, setPackages] = useState<ServicePackageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const list = await api.getServicePackages()
      setPackages(list)
    } catch (e: any) {
      toast({ title: "Không tải được gói dịch vụ", description: e?.message || "Failed to load service packages", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

  const formatCurrency = (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)

  const handleCreated = (sp: ServicePackageRecord) => {
    setPackages((prev) => [sp, ...prev])
  }

  const handleUpdated = (sp: ServicePackageRecord) => {
    setPackages((prev) => prev.map((p) => (p._id === sp._id ? sp : p)))
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteServicePackage(id)
      setPackages((prev) => prev.filter((p) => p._id !== id))
      toast({ title: "Đã xóa gói dịch vụ" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Packages</h1>
        <ServicePackageDialog onCreated={handleCreated} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
      ) : packages.length === 0 ? (
        <div className="text-muted-foreground">Chưa có gói dịch vụ nào.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>KM Interval</TableHead>
              <TableHead>Service Interval (days)</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((sp) => (
              <TableRow key={sp._id}>
                <TableCell className="font-medium">{sp.name}</TableCell>
                <TableCell className="max-w-[420px] truncate" title={sp.description}>{sp.description}</TableCell>
                <TableCell>{formatCurrency(sp.price)}</TableCell>
                <TableCell>{sp.duration} days</TableCell>
                <TableCell>{sp.km_interval.toLocaleString()} km</TableCell>
                <TableCell>{sp.service_interval_days} days</TableCell>
                <TableCell>{new Date(sp.createdAt).toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <ServicePackageDialog servicePackage={sp} onUpdated={handleUpdated} trigger={<Button size="sm" variant="outline">Edit</Button>} />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={deletingId === sp._id}>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xóa gói dịch vụ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Hành động này không thể hoàn tác. Gói dịch vụ "{sp.name}" sẽ bị xóa vĩnh viễn.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(sp._id)} disabled={deletingId === sp._id}>
                          {deletingId === sp._id ? "Deleting..." : "Delete"}
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
