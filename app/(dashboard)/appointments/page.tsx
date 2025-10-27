"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Pencil, Trash2 } from "lucide-react"
import { AppointmentDialog } from "@/components/appointments/appointment-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/components/ui/use-toast"
import { useIsAdmin } from "@/components/auth-provider"
import { getApiClient, type AppointmentRecord, type AppointmentStatus } from "@/lib/api"

const statusColors: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  confirmed: "bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20",
  "in-progress": "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  completed: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all")
  const isAdmin = useIsAdmin()
  const { toast } = useToast()

  const api = useMemo(() => getApiClient(), [])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getAppointments({ limit: 500 })
      setAppointments(res.data.appointments)
    } catch (e: any) {
      toast({ title: "Không tải được danh sách lịch hẹn", description: e?.message || "Failed to load appointments", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [api, toast])

  useEffect(() => {
    load()
  }, [load])

  const handleCreated = (apt: AppointmentRecord) => {
    setAppointments((prev) => [apt, ...prev])
  }

  const handleUpdated = (apt: AppointmentRecord) => {
    setAppointments((prev) => prev.map((a) => (a._id === apt._id ? apt : a)))
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteAppointment(id)
      setAppointments((prev) => prev.filter((a) => a._id !== id))
      toast({ title: "Đã xóa lịch hẹn" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    const vehicleName = typeof apt.vehicle_id === 'string' ? apt.vehicle_id : apt.vehicle_id?.vehicleName || ""
    const centerName = typeof apt.center_id === 'string' ? apt.center_id : apt.center_id?.name || ""
    const matchesSearch =
      vehicleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      centerName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage service appointments and schedules</p>
        </div>
        <AppointmentDialog onCreated={handleCreated} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Appointments</CardTitle>
          <CardDescription>View and manage all service appointments</CardDescription>
        </CardHeader>
        <CardContent>
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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Spinner /> Loading...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-muted-foreground">Chưa có lịch hẹn nào.</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service Center</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => (
                    <TableRow key={apt._id}>
                      <TableCell className="font-medium">
                        {typeof apt.vehicle_id === 'string' ? apt.vehicle_id : `${apt.vehicle_id?.vehicleName} • ${apt.vehicle_id?.plateNumber}`}
                      </TableCell>
                      <TableCell>
                        {typeof apt.center_id === 'string' ? apt.center_id : apt.center_id?.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {typeof apt.staffId === 'string' ? apt.staffId : apt.staffId?.name || apt.staffId?.email}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(apt.startTime).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(apt.endTime).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusColors[apt.status as AppointmentStatus] || statusColors.scheduled}
                        >
                          {apt.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <AppointmentDialog
                            appointment={apt}
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
                                <Button variant="ghost" size="icon" disabled={deletingId === apt._id}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa lịch hẹn?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Hành động này không thể hoàn tác. Lịch hẹn sẽ bị xóa vĩnh viễn.
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
