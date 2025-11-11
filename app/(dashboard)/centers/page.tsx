"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type CenterRecord } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CenterDialog } from "@/components/centers/center-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { AdminStaffTechnicianOnly } from "@/components/role-guards"
import { useIsAdmin } from "@/components/auth-provider"
import { formatDateTime } from "@/lib/utils"

export default function ServiceCentersPage() {
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const isAdmin = useIsAdmin()

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getCenters({ limit: 100 })
      setCenters(res.data.centers)
    } catch (e: any) {
      toast({ title: "Không tải được danh sách trung tâm", description: e?.message || "Failed to load centers", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreated = (c: CenterRecord) => {
    setCenters((prev) => [c, ...prev])
  }

  const handleUpdated = (c: CenterRecord) => {
    setCenters((prev) => prev.map((ct) => (ct._id === c._id ? c : ct)))
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteCenter(id)
      setCenters((prev) => prev.filter((ct) => ct._id !== id))
      toast({ title: "Đã xóa trung tâm dịch vụ" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AdminStaffTechnicianOnly>
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Centers</h1>
        {isAdmin && <CenterDialog onCreated={handleCreated} />}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
      ) : centers.length === 0 ? (
        <div className="text-muted-foreground">Chưa có trung tâm dịch vụ nào.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {centers.map((ct) => (
              <TableRow key={ct._id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={ct.image} alt={ct.name} />
                      <AvatarFallback>{(ct.name || "?").slice(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{ct.name}</span>
                  </div>
                </TableCell>
                <TableCell>{ct.address}</TableCell>
                <TableCell>{ct.phone}</TableCell>
                <TableCell>{formatDateTime(ct.createdAt)}</TableCell>
                <TableCell className="text-right space-x-2">
                  {isAdmin && (
                    <>
                      <CenterDialog center={ct} onUpdated={handleUpdated} trigger={<Button size="sm" variant="outline">Edit</Button>} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={deletingId === ct._id}>Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xóa trung tâm dịch vụ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này không thể hoàn tác. Trung tâm "{ct.name}" sẽ bị xóa vĩnh viễn.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(ct._id)} disabled={deletingId === ct._id}>
                              {deletingId === ct._id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
    </AdminStaffTechnicianOnly>
  )
}
