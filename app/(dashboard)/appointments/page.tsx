"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2, Eye, ChevronDown } from "lucide-react"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useAuth, useIsAdmin, useIsStaff } from "@/components/auth-provider"
import { getApiClient, type AppointmentRecord, type AppointmentStatus } from "@/lib/api"
import { AdminStaffTechnicianOnly } from "@/components/role-guards"
import { AssignStaffDialog } from "@/components/appointments/assign-staff-dialog"
import { AssignTechnicianDialog } from "@/components/appointments/assign-technician-dialog"
import { formatDateTime, formatDate } from "@/lib/utils"
import { toast } from "sonner"
import { DataPagination } from "@/components/ui/data-pagination"

const statusColors: Record<AppointmentStatus, string> = {
  pending: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  "in-progress": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<AppointmentStatus>("pending")
  const [confirmingStatus, setConfirmingStatus] = useState<{
    id: string
    newStatus: AppointmentStatus
    currentStatus: AppointmentStatus
  } | null>(null)
  const [assigningAppointment, setAssigningAppointment] = useState<string | null>(null)
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("")
  const [techList, setTechList] = useState<Array<{ id: string; label: string; assigned?: boolean; shiftTime?: string }>>([])
  const [loadingTechs, setLoadingTechs] = useState(false)
  const [techSearch, setTechSearch] = useState("")
  const router = useRouter()
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
  const limit = 10

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async (page: number, status?: AppointmentStatus) => {
    try {
      setLoading(true)
      const params: { page: number; limit: number; technician_id?: string; center_id?: string; status?: string } = { page, limit }
      
      // Filter by status if provided
      if (status) {
        params.status = status
      }
      
      // Filter by center_id for non-admin users (staff and technician)
      if (!isAdmin && user?.centerId) {
        params.center_id = user.centerId
      }
      
      // For technicians, also filter by their technician_id
      if (!isAdmin && !isStaff) {
        try {
          const su = await api.getSystemUsers({ limit: 1000 })
          const me = su.data.systemUsers.find((u) => {
            const email = typeof u.userId === 'string' ? undefined : u.userId?.email
            return email && user?.email && email.toLowerCase() === user.email.toLowerCase()
          })
          if (me?._id) params.technician_id = me._id
        } catch { }
      }
      
      const res = await api.getAppointments(params)
      setAppointments(res.data.appointments)
      setTotalItems(res.data.total || res.data.appointments.length)
      setTotalPages(Math.ceil((res.data.total || res.data.appointments.length) / limit))
      
      // Update count for current tab
      if (status) {
        setStatusCounts(prev => ({
          ...prev,
          [status]: res.data.total || res.data.appointments.length
        }))
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to load appointments")
    } finally {
      setLoading(false)
    }
  }, [api, isAdmin, isStaff, user?.email, user?.centerId, toast])

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
      if (!isAdmin && !isStaff) {
        try {
          const su = await api.getSystemUsers({ limit: 1000 })
          const me = su.data.systemUsers.find((u) => {
            const email = typeof u.userId === 'string' ? undefined : u.userId?.email
            return email && user?.email && email.toLowerCase() === user.email.toLowerCase()
          })
          if (me?._id) {
            baseParams.technician_id = me._id
          }
        } catch { }
      }

      try {
        const statuses: AppointmentStatus[] = ["pending", "in-progress", "completed", "cancelled"]
        const countPromises = statuses.map(async (status) => {
          const params = { ...baseParams, page: 1, limit: 1, status }
          try {
            const res = await api.getAppointments(params)
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

  useEffect(() => {
    if (!confirmingStatus || confirmingStatus.newStatus !== "in-progress") return
    
    const loadTechnicians = async () => {
      try {
        setLoadingTechs(true)
        const apt = appointments.find(a => a._id === confirmingStatus.id)
        const slotId = apt && typeof apt.slot_id === 'object' ? apt.slot_id._id : undefined
        
        if (slotId) {
          const res = await api.getSlotStaffAndTechnician(slotId)
          const opts = (res.data.technician || []).map(t => ({
            id: t.id,
            label: t.name || t.email || t.phone || t.id,
            assigned: !!t.assigned,
            shiftTime: t.shiftTime,
          }))
          setTechList(opts)
        } else {
          const res = await api.getSystemUsers({ limit: 200, centerId: user?.centerId ?? undefined, role: 'TECHNICIAN' })
          const list = res.data.systemUsers
          const opts = list.map(s => ({
            id: s._id,
            label: s.name || (typeof s.userId === 'object' ? (s.userId.email || s.userId.phone || s._id) : s._id),
            assigned: false,
          }))
          setTechList(opts)
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to load technicians")
      } finally {
        setLoadingTechs(false)
      }
    }
    
    loadTechnicians()
  }, [confirmingStatus, api, appointments, user?.centerId])

  const handleCreated = (apt: AppointmentRecord) => {
    setAppointments((prev) => [apt, ...prev])
    load(currentPage) 
  }

  const handleUpdated = (apt: AppointmentRecord) => {
    setAppointments((prev) => prev.map((a) => (a._id === apt._id ? apt : a)))
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteAppointment(id)
      setAppointments((prev) => prev.filter((a) => a._id !== id))
      toast.success("Appointment deleted")
      load(currentPage)
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete")
    } finally {
      setDeletingId(null)
    }
  }
  
  const handleReload = () => {
    load(currentPage, activeTab)
  }

  const handleStatusChange = async (id: string, newStatus: AppointmentStatus, currentStatus: AppointmentStatus) => {
    setConfirmingStatus({ id, newStatus, currentStatus })
  }

  const confirmStatusChange = async () => {
    if (!confirmingStatus) return

    const { id, newStatus } = confirmingStatus
    const statusLabels: Record<AppointmentStatus, string> = {
      pending: "Pending",
      "in-progress": "In Progress",
      completed: "Completed",
      cancelled: "Cancelled",
    }

    // If in-progress and no technician selected, show error
    if (newStatus === "in-progress" && !selectedTechnicianId) {
      toast.error("Please select a technician")
      return
    }

    try {
      await api.updateAppointment(id, { status: newStatus })
      
      if (newStatus === "in-progress" && selectedTechnicianId) {
        await api.assignAppointmentTechnician(id, selectedTechnicianId)
        toast.success("Status changed, technician assigned, and service record created automatically")
      } else {
        toast.success(`Status changed to ${statusLabels[newStatus]}`)
      }
      
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: newStatus } : a))
      handleReload()
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status")
    } finally {
      setConfirmingStatus(null)
      setSelectedTechnicianId("")
      setTechList([])
      setTechSearch("")
    }
  }

  const getStatusMessage = (currentStatus: AppointmentStatus, newStatus: AppointmentStatus) => {
    if (newStatus === "in-progress") {
      return "This will mark the appointment as active and notify the team to begin work."
    }
    if (newStatus === "completed") {
      return "This will mark the service as completed and close the appointment."
    }
    if (newStatus === "cancelled") {
      return "This will cancel the appointment and notify the customer. This action cannot be undone."
    }
    return "This will update the appointment status."
  }

  const getAvailableStatuses = (currentStatus: AppointmentStatus): AppointmentStatus[] => {
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

  const filteredAppointments = appointments.filter((apt) => {
    const vehicleName = typeof apt.vehicle_id === 'string' ? apt.vehicle_id : apt.vehicle_id?.vehicleName || ""
    const centerName = typeof apt.center_id === 'string' ? apt.center_id : apt.center_id?.name || ""
    const matchesSearch =
      vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centerName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusCount = (status: AppointmentStatus) => {
    return statusCounts[status] || 0
  }

  return (
    <AdminStaffTechnicianOnly>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
            <p className="text-muted-foreground">Manage service appointments and schedules</p>
          </div>
          {isStaff && <AppointmentDialog onCreated={handleCreated} />}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Appointments</CardTitle>
            <CardDescription>View and manage all service appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AppointmentStatus)} className="space-y-6">
              <div className="border-b pb-4">
                <TabsList className="inline-flex h-10 items-center justify-start gap-1 rounded-lg bg-muted/50 p-1">
                  <TabsTrigger value="pending" className="gap-2 data-[state=active]:shadow-sm">
                    <span className="font-medium">Pending</span>
                    <Badge className="ml-1 h-5 min-w-[1.25rem] px-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200/50">{getStatusCount("pending")}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="in-progress" className="gap-2 data-[state=active]:shadow-sm">
                    <span className="font-medium">In Progress</span>
                    <Badge className="ml-1 h-5 min-w-[1.25rem] px-1.5 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-200/50">{getStatusCount("in-progress")}</Badge>
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
                  placeholder="Search by vehicle or center..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-muted-foreground">No appointments.</div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Service Center</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Status</TableHead>
                        {isStaff && <TableHead>Change Status</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {filteredAppointments.map((apt) => {
                      const slotInfo = apt.slot_id && typeof apt.slot_id === 'object'
                        ? apt.slot_id
                        : null
                      const startDisplay = slotInfo
                        ? `${formatDate(slotInfo.slot_date)} ${slotInfo.start_time}`
                        : apt.startTime ? formatDateTime(apt.startTime) : "—"
                      const endDisplay = slotInfo
                        ? `${formatDate(slotInfo.slot_date)} ${slotInfo.end_time}`
                        : apt.endTime ? formatDateTime(apt.endTime) : "—"

                      return (
                        <TableRow key={apt._id}>
                          <TableCell className="text-muted-foreground">
                            {typeof apt.customer_id === 'string'
                              ? apt.customer_id
                              : apt.customer_id?.customerName || (apt.customer_id as any)?.email || "—"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {typeof apt.vehicle_id === 'string' ? apt.vehicle_id : `${apt.vehicle_id?.vehicleName} • ${apt.vehicle_id?.plateNumber}`}
                          </TableCell>
                          <TableCell>
                            {typeof apt.center_id === 'string' ? apt.center_id : apt.center_id?.name}
                          </TableCell>

                          <TableCell className="text-muted-foreground">
                            {startDisplay}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {endDisplay}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${statusColors[apt.status as AppointmentStatus] || statusColors.pending} font-medium px-3 py-1 capitalize border`}
                            >
                              {apt.status.replace("-", " ")}
                            </Badge>
                          </TableCell>
                          {isStaff && (
                            <TableCell>
                              {(() => {
                                const availableStatuses = getAvailableStatuses(apt.status as AppointmentStatus)
                                const isTerminalState = availableStatuses.length === 0
                                
                                if (isTerminalState) {
                                  return <span className="text-muted-foreground text-sm">-</span>
                                }
                                
                                return (
                                  <div className="flex gap-2">
                                    {availableStatuses.map((status) => {
                                      const statusInfo: Record<AppointmentStatus, { label: string; color: string }> = {
                                        pending: { label: "Pending", color: "bg-blue-500" },
                                        "in-progress": { label: "Start Work", color: "bg-amber-500" },
                                        completed: { label: "Complete", color: "bg-green-500" },
                                        cancelled: { label: "Cancel", color: "bg-gray-500" },
                                      }
                                      const info = statusInfo[status]
                                      return (
                                        <Button
                                          key={status}
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleStatusChange(apt._id, status, apt.status as AppointmentStatus)}
                                          className="h-7 px-3 text-xs font-medium hover:scale-105 transition-transform"
                                        >
                                          <div className={`w-2 h-2 rounded-full ${info.color} mr-2`}></div>
                                          {info.label}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                )
                              })()}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="View details"
                                onClick={() => router.push(`/appointments/${apt._id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {(isAdmin || isStaff) && (
                                <AppointmentDialog
                                  appointment={apt}
                                  onUpdated={handleUpdated}
                                  trigger={
                                    <Button variant="ghost" size="icon" title="Edit appointment">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  }
                                />
                              )}
                              {isAdmin && (
                                <AssignStaffDialog
                                  appointmentId={apt._id}
                                  slotId={typeof apt.slot_id === 'string' ? apt.slot_id : (apt.slot_id?._id as string | undefined)}
                                  centerId={apt.center_id}
                                  onAssigned={handleReload}
                                  trigger={
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      disabled={
                                        apt.status === "in-progress" || 
                                        apt.status === "completed" || 
                                        apt.status === "cancelled" ||
                                        !!(apt.staffId && apt.staffId !== "")
                                      }
                                    >
                                      Assign Staff
                                    </Button>
                                  }
                                />
                              )}
                              {(isAdmin || isStaff) && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" disabled={deletingId === apt._id}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. The appointment will be permanently deleted.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(apt._id)} disabled={deletingId === apt._id}>
                                        {deletingId === apt._id ? "Deleting..." : "Delete"}
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
        <AlertDialog open={!!confirmingStatus} onOpenChange={(open) => {
          if (!open) {
            setConfirmingStatus(null)
            setSelectedTechnicianId("")
            setTechList([])
            setTechSearch("")
          }
        }}>
          <AlertDialogContent className="max-w-[500px]">
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
            
            {/* Technician Selection for In-Progress */}
            {confirmingStatus?.newStatus === "in-progress" && (
              <div className="space-y-3 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assign Technician <span className="text-red-500">*</span></label>
                  <Input 
                    placeholder={loadingTechs ? "Loading..." : "Search by name / email / phone"} 
                    value={techSearch} 
                    onChange={(e) => setTechSearch(e.target.value)}
                    disabled={loadingTechs}
                  />
                </div>
                <div className="max-h-60 overflow-auto rounded border divide-y">
                  {loadingTechs ? (
                    <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                      <Spinner className="h-4 w-4" /> Loading technicians...
                    </div>
                  ) : techList
                    .filter(s => !techSearch || s.label.toLowerCase().includes(techSearch.toLowerCase()))
                    .map(s => {
                      const selected = selectedTechnicianId === s.id
                      return (
                        <button
                          type="button"
                          key={s.id}
                          disabled={s.assigned}
                          onClick={() => setSelectedTechnicianId(s.id)}
                          className={`w-full text-left p-3 hover:bg-muted/60 focus:outline-none transition-colors ${
                            s.assigned ? 'opacity-60 cursor-not-allowed' : ''
                          } ${
                            selected ? 'bg-primary/10 ring-2 ring-primary' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{s.label}</div>
                              {s.shiftTime && (
                                <div className="text-xs text-muted-foreground">Shift: {s.shiftTime}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {s.assigned && <Badge variant="secondary">Assigned</Badge>}
                              {selected && <Badge>Selected</Badge>}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  {(!loadingTechs && techList.length === 0) && (
                    <div className="p-3 text-sm text-muted-foreground">No technicians available.</div>
                  )}
                </div>
              </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmStatusChange}
                disabled={confirmingStatus?.newStatus === "in-progress" && !selectedTechnicianId}
              >
                Confirm Change
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AdminStaffTechnicianOnly>
  )
}
