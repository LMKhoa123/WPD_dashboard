"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type ServiceRecordRecord, type ServiceRecordStatus } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ServiceRecordDialog } from "@/components/service-records/service-record-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"
import { useIsAdmin } from "@/components/auth-provider"
import { Search, Pencil, Trash2, ListTree } from "lucide-react"
import { ServiceDetailsDialog } from "@/components/service-records/service-details-dialog"

const statusColors: Record<ServiceRecordStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  "in-progress": "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

export default function ServiceRecordsPage() {
  const [records, setRecords] = useState<ServiceRecordRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ServiceRecordStatus | "all">("all")
  const isAdmin = useIsAdmin()
  const { toast } = useToast()

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getServiceRecords({ limit: 500 })
      setRecords(res.data.records)
    } catch (e: any) {
      toast({ title: "Không tải được danh sách hồ sơ dịch vụ", description: e?.message || "Failed to load service records", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreated = (r: ServiceRecordRecord) => {
    setRecords((prev) => [r, ...prev])
  }

  const handleUpdated = (r: ServiceRecordRecord) => {
    setRecords((prev) => prev.map((rec) => (rec._id === r._id ? r : rec)))
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteServiceRecord(id)
      setRecords((prev) => prev.filter((rec) => rec._id !== id))
      toast({ title: "Đã xóa hồ sơ dịch vụ" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredRecords = records.filter((rec) => {
    const techName = typeof rec.technician_id === 'string' ? rec.technician_id : rec.technician_id?.name || rec.technician_id?.email || ""
    const matchesSearch = techName.toLowerCase().includes(searchQuery.toLowerCase()) || rec.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Records</h1>
          <p className="text-muted-foreground">Track and manage service work records</p>
        </div>
        <ServiceRecordDialog onCreated={handleCreated} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Service Records</CardTitle>
          <CardDescription>View and manage all service work records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by technician or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ServiceRecordStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-muted-foreground">Chưa có hồ sơ dịch vụ nào.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Appointment</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((rec) => {
                    const apt = typeof rec.appointment_id === 'object' && rec.appointment_id ? rec.appointment_id : null
                    const vehicleName = apt && typeof apt.vehicle_id === 'object' ? apt.vehicle_id?.vehicleName : ""
                    return (
                      <TableRow key={rec._id}>
                        <TableCell className="font-medium">
                          {apt ? `${vehicleName || "N/A"}` : "None"}
                        </TableCell>
                        <TableCell>
                          {typeof rec.technician_id === 'string' ? rec.technician_id : rec.technician_id?.name || rec.technician_id?.email}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rec.start_time && rec.start_time !== "" ? new Date(rec.start_time).toLocaleString() : "---"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {rec.end_time && rec.end_time !== "" ? new Date(rec.end_time).toLocaleString() : "---"}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate" title={rec.description}>
                          {rec.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[rec.status as ServiceRecordStatus] || statusColors.pending}
                          >
                            {rec.status.replace("-", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <ServiceDetailsDialog
                              recordId={rec._id}
                              trigger={
                                <Button variant="ghost" size="icon" title="Details">
                                  <ListTree className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <ServiceRecordDialog
                              record={rec}
                              onUpdated={handleUpdated}
                              trigger={
                                <Button variant="ghost" size="icon">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" disabled={deletingId === rec._id}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xóa hồ sơ dịch vụ?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Hành động này không thể hoàn tác. Hồ sơ sẽ bị xóa vĩnh viễn.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(rec._id)} disabled={deletingId === rec._id}>
                                      {deletingId === rec._id ? "Deleting..." : "Delete"}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
