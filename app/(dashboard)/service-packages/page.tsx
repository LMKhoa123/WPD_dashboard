"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type ServicePackageRecord } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ServicePackageDialog } from "@/components/service-packages/service-package-dialog"
import { ServicePackageDetailDialog } from "@/components/service-packages/service-package-detail-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { Eye } from "lucide-react"
import { AdminOrStaffOnly } from "@/components/role-guards"
import { formatVND, formatDateTime, formatNumber } from "@/lib/utils"

export default function ServicePackagesPage() {
  const [packages, setPackages] = useState<ServicePackageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const list = await api.getServicePackages()
      setPackages(list)
    } catch (e: any) {
      toast.error(e?.message || "Failed to load service packages")
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

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
      toast.success("Service package deleted successfully")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete service package")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminOrStaffOnly>
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Packages</h1>
        <ServicePackageDialog onCreated={handleCreated} />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
      ) : packages.length === 0 ? (
        <div className="text-muted-foreground">No service packages yet.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
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
                <TableCell>{formatVND(sp.price)}</TableCell>
                <TableCell>{sp.duration} days</TableCell>
                <TableCell>{formatNumber(sp.km_interval)} km</TableCell>
                <TableCell>{sp.service_interval_days} days</TableCell>
                <TableCell>{formatDateTime(sp.createdAt)}</TableCell>
                <TableCell className="text-right space-x-2">
                  <ServicePackageDetailDialog 
                    servicePackage={sp} 
                    trigger={
                      <Button size="sm" variant="ghost" title="View details">
                        <Eye className="h-4 w-4" />
                      </Button>
                    }
                  />
                  <ServicePackageDialog servicePackage={sp} onUpdated={handleUpdated} trigger={<Button size="sm" variant="outline">Edit</Button>} />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive" disabled={deletingId === sp._id}>Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete service package?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The service package "{sp.name}" will be permanently deleted.
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
    </AdminOrStaffOnly>
  )
}
