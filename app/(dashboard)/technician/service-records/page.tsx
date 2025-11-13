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
import { Search, Pencil, Trash2, Clock, CheckCircle2, XCircle, AlertCircle, ListTree } from "lucide-react"
import { ServiceDetailsDialog } from "@/components/service-records/service-details-dialog"
import { useAuth } from "@/components/auth-provider"

const statusColors: Record<ServiceRecordStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
  "in-progress": "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

const statusIcons: Record<ServiceRecordStatus, any> = {
  pending: Clock,
  "in-progress": AlertCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
}

export default function TechnicianServiceRecordsPage() {
  const [records, setRecords] = useState<ServiceRecordRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ServiceRecordStatus | "all">("all")
  const { toast } = useToast()
  const { user } = useAuth()

  const api = useMemo(() => getApiClient(), [])

  // Get technician ID from profile
  const [technicianId, setTechnicianId] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getProfile()
        setTechnicianId(profile.data._id)
      } catch (e: any) {
        toast({ 
          title: "Không tải được profile", 
          description: e?.message || "Failed to load profile", 
          variant: "destructive" 
        })
      }
    }
    loadProfile()
  }, [api, toast])

  const load = useCallback(async () => {
    if (!technicianId) return
    
    try {
      setLoading(true)
      const res = await api.getServiceRecords({ limit: 500 })
      // Filter records for this technician only
      const myRecords = res.data.records.filter(r => {
        const tid = typeof r.technician_id === 'string' ? r.technician_id : r.technician_id?._id
        return tid === technicianId
      })
      setRecords(myRecords)
    } catch (e: any) {
      toast({ 
        title: "Failed to load service records", 
        description: e?.message || "Failed to load service records", 
        variant: "destructive" 
      })
    } finally {
      setLoading(false)
    }
  }, [api, toast, technicianId])

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
      toast({ title: "Service record deleted" })
    } catch (e: any) {
      toast({ 
        title: "Failed to delete", 
        description: e?.message || "Failed to delete", 
        variant: "destructive" 
      })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredRecords = records.filter((rec) => {
    const matchesSearch = rec.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getAppointmentInfo = (record: ServiceRecordRecord) => {
    if (!record.appointment_id || typeof record.appointment_id === 'string') {
      return { vehicle: "N/A", customer: "N/A", center: "N/A" }
    }
    const apt = record.appointment_id
    const vehicle = typeof apt.vehicle_id === 'string' ? "N/A" : apt.vehicle_id?.vehicleName || "N/A"
    const customer = typeof apt.customer_id === 'string' ? "N/A" : apt.customer_id?.customerName || "N/A"
    const center = typeof apt.center_id === 'string' ? "N/A" : apt.center_id?.name || "N/A"
    return { vehicle, customer, center }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Service Records</h1>
          <p className="text-muted-foreground">Manage your service records</p>
        </div>
        <ServiceRecordDialog onCreated={handleCreated} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.status === "in-progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {records.filter(r => r.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Records</CardTitle>
          <CardDescription>View and manage your service records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || statusFilter !== "all" ? "No matching records found" : "No service records yet"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Center</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((rec) => {
                    const { vehicle, customer, center } = getAppointmentInfo(rec)
                    const StatusIcon = statusIcons[rec.status] || Clock
                    return (
                      <TableRow key={rec._id}>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[rec.status]}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {rec.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{vehicle}</TableCell>
                        <TableCell>{customer}</TableCell>
                        <TableCell>{center}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{rec.description || "—"}</TableCell>
                        <TableCell>{rec.start_time && rec.start_time !== "" ? new Date(rec.start_time).toLocaleString() : "---"}</TableCell>
                        <TableCell>{rec.end_time && rec.end_time !== "" ? new Date(rec.end_time).toLocaleString() : "---"}</TableCell>
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={deletingId === rec._id}>
                                  {deletingId === rec._id ? (
                                    <Spinner className="h-4 w-4" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirm deletion?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this service record? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(rec._id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
