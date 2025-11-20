"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { getApiClient, type ServiceRecordRecord, type ServiceRecordStatus } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ServiceRecordDialog } from "@/components/service-records/service-record-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "sonner"
import { useAuth, useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { Search, Pencil, Trash2, ListTree, CreditCard, ClipboardCheck } from "lucide-react"
import { ServiceDetailsDialog } from "@/components/service-records/service-details-dialog"
import { CreatePaymentDialog } from "@/components/payments/create-payment-dialog"
import { RecordChecklistsDialog } from "@/components/service-records/record-checklists-dialog"
import { AdminStaffTechnicianOnly } from "@/components/role-guards"
import { DataPagination } from "@/components/ui/data-pagination"
import { formatDateTime } from "@/lib/utils"

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
  const [activeTab, setActiveTab] = useState<ServiceRecordStatus>("pending")
  const [confirmingStatus, setConfirmingStatus] = useState<{
    id: string
    newStatus: ServiceRecordStatus
    currentStatus: ServiceRecordStatus
  } | null>(null)
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const { user } = useAuth()

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    pending: 0,
    "in-progress": 0,
    completed: 0,
    cancelled: 0,
  })
  const limit = 20

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async (page: number, status?: ServiceRecordStatus) => {
    try {
      setLoading(true)
      const params: any = { page, limit }
      
      // Filter by center_id for non-admin users
      if (!isAdmin && user?.centerId) {
        params.center_id = user.centerId
      }
      
      // Filter by status
      if (status) {
        params.status = status
      }
      
      // Filter by technician_id for technician role
      if (!isAdmin && !isStaff && user?.email) {
        try {
          const su = await api.getSystemUsers({ limit: 1000 })
          const me = su.data.systemUsers.find((u) => {
            const email = typeof u.userId === 'string' ? undefined : u.userId?.email
            return email && email.toLowerCase() === user.email!.toLowerCase()
          })
          if (me?._id) {
            params.technician_id = me._id
          }
        } catch { }
      }
      
      const res = await api.getServiceRecords(params)
      const data = res.data.records
      const total = res.data.total || data.length
      
      setRecords(data)
      setTotalItems(total)
      setTotalPages(Math.ceil(total / limit))
      
      // Update count for current tab
      if (status) {
        setStatusCounts(prev => ({
          ...prev,
          [status]: total
        }))
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load service records")
    } finally {
      setLoading(false)
    }
  }, [api, isAdmin, isStaff, user?.email, user?.centerId, limit])

  useEffect(() => {
    load(currentPage, activeTab)
  }, [load, currentPage, activeTab])

  // Reset to page 1 when changing tabs
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab])

  // Load all status counts on mount
  useEffect(() => {
    const loadCounts = async () => {
      const baseParams: any = {}
      if (!isAdmin && user?.centerId) {
        baseParams.center_id = user.centerId
      }
      
      // Add technician filter for technician role
      if (!isAdmin && !isStaff && user?.email) {
        try {
          const su = await api.getSystemUsers({ limit: 1000 })
          const me = su.data.systemUsers.find((u) => {
            const email = typeof u.userId === 'string' ? undefined : u.userId?.email
            return email && email.toLowerCase() === user.email!.toLowerCase()
          })
          if (me?._id) {
            baseParams.technician_id = me._id
          }
        } catch { }
      }

      try {
        const statuses: ServiceRecordStatus[] = ["pending", "in-progress", "completed", "cancelled"]
        const countPromises = statuses.map(async (status) => {
          const params = { ...baseParams, page: 1, limit: 1, status }
          try {
            const res = await api.getServiceRecords(params)
            return { status, count: res.data.total || 0 }
          } catch {
            return { status, count: 0 }
          }
        })
        
        const results = await Promise.all(countPromises)
        const counts: Record<string, number> = {}
        results.forEach(({ status, count }) => {
          counts[status] = count
        })
        setStatusCounts(counts)
      } catch (e) {
        // Ignore count loading errors
      }
    }
    
    if (user) {
      loadCounts()
    }
  }, [api, isAdmin, isStaff, user?.centerId, user?.email, user])

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
      toast.success("Service record deleted successfully")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete service record")
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: ServiceRecordStatus, currentStatus: ServiceRecordStatus) => {
    setConfirmingStatus({ id, newStatus, currentStatus })
  }

  const confirmStatusChange = async () => {
    if (!confirmingStatus) return

    const { id, newStatus } = confirmingStatus
    const statusLabels: Record<ServiceRecordStatus, string> = {
      pending: "Pending",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    }

    try {
      const currentTime = new Date().toISOString()
      const updatePayload: any = { status: newStatus }
      
      // Update timestamps based on status change
      if (newStatus === "in-progress") {
        // Set start time when work begins
        updatePayload.start_time = currentTime
      } else if (newStatus === "completed" || newStatus === "cancelled") {
        // Set end time when work is finished or cancelled
        updatePayload.end_time = currentTime
      }
      
      await api.updateServiceRecord(id, updatePayload)
      setRecords(prev => prev.map(r => r._id === id ? { ...r, status: newStatus, ...updatePayload } : r))
      toast.success(`Status changed to ${statusLabels[newStatus as keyof typeof statusLabels] || newStatus}`)
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status")
    } finally {
      setConfirmingStatus(null)
    }
  }

  const getStatusMessage = (currentStatus: ServiceRecordStatus, newStatus: ServiceRecordStatus) => {
    if (newStatus === "in-progress") {
      return "This will mark the service as active and notify assigned technicians to begin work."
    }
    if (newStatus === "completed") {
      return "This will mark the service as completed and make it ready for payment processing."
    }
    if (newStatus === "cancelled") {
      return "This will cancel the service record and notify relevant parties. This action cannot be undone."
    }
    return "This will update the service record status."
  }

  const getAvailableStatuses = (currentStatus: ServiceRecordStatus): ServiceRecordStatus[] => {
    switch (currentStatus) {
      case "pending":
        return ["in-progress", "cancelled"]
      case "in-progress":
        return ["completed", "cancelled"]
      case "completed":
      case "cancelled":
        return [] // Final states - no further changes
      default:
        return []
    }
  }

  const filteredRecords = records.filter((rec) => {
    const techName = typeof rec.technician_id === 'string' ? rec.technician_id : rec.technician_id?.name || rec.technician_id?.email || ""
    const matchesSearch = techName.toLowerCase().includes(searchQuery.toLowerCase()) || rec.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusCount = (status: ServiceRecordStatus) => {
    return statusCounts[status] || 0
  }

  return (
    <AdminStaffTechnicianOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Records</h1>
            <p className="text-muted-foreground">Track and manage service work records</p>
          </div>
          {(isAdmin || isStaff) && <ServiceRecordDialog onCreated={handleCreated} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Service Records</CardTitle>
            <CardDescription>View and manage all service work records</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ServiceRecordStatus)} className="space-y-6">
              <div className="border-b pb-4">
                <TabsList className="inline-flex h-10 items-center justify-start gap-1 rounded-lg bg-muted/50 p-1">
                  <TabsTrigger value="pending" className="gap-2 data-[state=active]:shadow-sm">
                    <span className="font-medium">Pending</span>
                    <Badge className="ml-1 h-5 min-w-[1.25rem] px-1.5 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200/50">{getStatusCount("pending")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="in-progress" className="gap-2 data-[state=active]:shadow-sm">
                    <span className="font-medium">In Progress</span>
                    <Badge className="ml-1 h-5 min-w-[1.25rem] px-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200/50">{getStatusCount("in-progress")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="gap-2 data-[state=active]:shadow-sm">
                    <span className="font-medium">Completed</span>
                    <Badge className="ml-1 h-5 min-w-[1.25rem] px-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200/50">{getStatusCount("completed")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="gap-2 data-[state=active]:shadow-sm">
                    <span className="font-medium">Cancelled</span>
                    <Badge className="ml-1 h-5 min-w-[1.25rem] px-1.5 bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-200/50">{getStatusCount("cancelled")}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

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
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-muted-foreground">No service records found.</div>
            ) : (
              <>
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
                      {(isAdmin || isStaff) && <TableHead>Change Status</TableHead>}
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
                            {rec.start_time && rec.start_time !== "" ? formatDateTime(rec.start_time) : "---"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {rec.end_time && rec.end_time !== "" ? formatDateTime(rec.end_time) : "---"}
                          </TableCell>
                          <TableCell className="max-w-[300px] truncate" title={rec.description}>
                            {rec.description}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${statusColors[rec.status as ServiceRecordStatus] || statusColors.pending} font-medium px-3 py-1 capitalize border`}
                            >
                              {rec.status.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          {(isAdmin || isStaff) && (
                            <TableCell>
                              {(() => {
                                const availableStatuses = getAvailableStatuses(rec.status as ServiceRecordStatus)
                                const isTerminalState = availableStatuses.length === 0
                                
                                if (isTerminalState) {
                                  return <span className="text-muted-foreground text-sm">-</span>
                                }
                                
                                return (
                                  <div className="flex gap-2">
                                    {availableStatuses.map((status) => {
                                      const statusInfo: Record<ServiceRecordStatus, { label: string; color: string }> = {
                                        pending: { label: "Pending", color: "bg-yellow-500" },
                                        "in-progress": { label: "Start Work", color: "bg-blue-500" },
                                        completed: { label: "Complete", color: "bg-green-500" },
                                        cancelled: { label: "Cancel", color: "bg-gray-500" },
                                      }
                                      const info = statusInfo[status]
                                      return (
                                        <Button
                                          key={status}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleStatusChange(rec._id, status, rec.status as ServiceRecordStatus)}
                                          className="h-7 px-3 text-xs font-medium hover:scale-105 transition-transform"
                                        >
                                          <div className={`w-2 h-2 rounded-full ${info.color} mr-2`}></div>
                                          {info.label}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                )
                              })()
                            }
                            </TableCell>
                          )}
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
                              <RecordChecklistsDialog
                                recordId={rec._id}
                                trigger={
                                  <Button variant="ghost" size="icon" title="Checklists">
                                    <ClipboardCheck className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <ServiceRecordDialog
                                record={rec}
                                onUpdated={handleUpdated}
                                trigger={
                                  <Button variant="ghost" size="icon" title="Edit">
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
                                      <AlertDialogTitle>Delete Service Record?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. The record will be permanently deleted.
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
              
              <div className="mt-4">
                <DataPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Status Change Confirmation Dialog */}
        <AlertDialog open={!!confirmingStatus} onOpenChange={(open) => !open && setConfirmingStatus(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                {confirmingStatus && (
                  <>
                    <p className="text-foreground">
                      {getStatusMessage(confirmingStatus.currentStatus, confirmingStatus.newStatus)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Status will change from{" "}
                      <span className="font-semibold text-foreground capitalize">
                        {confirmingStatus.currentStatus.replace("-", " ")}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-foreground capitalize">
                        {confirmingStatus.newStatus.replace("-", " ")}
                      </span>
                    </p>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmStatusChange}>
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminStaffTechnicianOnly>
  )
}
