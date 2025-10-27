"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { getApiClient, type AppointmentRecord, type CreateAppointmentRequest, type UpdateAppointmentRequest, type VehicleRecord, type CenterRecord, type SystemUserRecord } from "@/lib/api"

interface AppointmentDialogProps {
  appointment?: AppointmentRecord
  trigger?: React.ReactNode
  onCreated?: (apt: AppointmentRecord) => void
  onUpdated?: (apt: AppointmentRecord) => void
}

export function AppointmentDialog({ appointment, trigger, onCreated, onUpdated }: AppointmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!appointment

  const [staffId, setStaffId] = useState("")
  const [vehicleId, setVehicleId] = useState("")
  const [centerId, setCenterId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [status, setStatus] = useState<string>("scheduled")

  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [staff, setStaff] = useState<SystemUserRecord[]>([])
  const [loadingLists, setLoadingLists] = useState(false)

  useEffect(() => {
    if (open) {
      const run = async () => {
        try {
          setLoadingLists(true)
          const [vs, cs, ss] = await Promise.all([
            api.getVehicles({ limit: 500 }).catch(() => [] as VehicleRecord[]),
            api.getCenters({ limit: 100 }).then(r => r.data.centers).catch(() => [] as CenterRecord[]),
            api.getSystemUsers({ limit: 100 }).then(r => r.data.systemUsers).catch(() => [] as SystemUserRecord[]),
          ])
          setVehicles(vs)
          setCenters(cs)
          setStaff(ss)
        } catch (e: any) {
          toast({ title: "Không tải được dữ liệu", description: e?.message || "Failed to load data", variant: "destructive" })
        } finally {
          setLoadingLists(false)
        }
      }
      run()
    }
  }, [open, api, toast])

  useEffect(() => {
    if (open && isEditMode && appointment) {
      setStaffId(typeof appointment.staffId === 'string' ? appointment.staffId : appointment.staffId?._id || "")
      setVehicleId(typeof appointment.vehicle_id === 'string' ? appointment.vehicle_id : appointment.vehicle_id?._id || "")
      setCenterId(typeof appointment.center_id === 'string' ? appointment.center_id : appointment.center_id?._id || "")
      setStartTime(appointment.startTime?.slice(0, 16) || "")
      setEndTime(appointment.endTime?.slice(0, 16) || "")
      setStatus(appointment.status || "scheduled")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, appointment])

  const resetForm = () => {
    setStaffId("")
    setVehicleId("")
    setCenterId("")
    setStartTime("")
    setEndTime("")
    setStatus("scheduled")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)

      if (isEditMode && appointment) {
        const payload: UpdateAppointmentRequest = {
          staffId,
          vehicle_id: vehicleId,
          center_id: centerId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          status: status as any,
        }
        const updated = await api.updateAppointment(appointment._id, payload)
        toast({ title: "Cập nhật lịch hẹn thành công" })
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        const payload: CreateAppointmentRequest = {
          staffId,
          vehicle_id: vehicleId,
          center_id: centerId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          status: status as any,
        }
        const created = await api.createAppointment(payload)
        toast({ title: "Tạo lịch hẹn thành công" })
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast({
        title: isEditMode ? "Cập nhật thất bại" : "Tạo thất bại",
        description: e?.message || `Failed to ${isEditMode ? "update" : "create"} appointment`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Appointment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Appointment" : "New Appointment"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Cập nhật thông tin lịch hẹn" : "Tạo lịch hẹn dịch vụ mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading vehicles..." : "Select vehicle"} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v._id} value={v._id}>{v.vehicleName} • {v.model} • {v.plateNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Staff/Technician</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading staff..." : "Select staff"} />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Service Center</Label>
              <Select value={centerId} onValueChange={setCenterId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading centers..." : "Select center"} />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name} • {c.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
