"use client"

import React, { useEffect, useMemo, useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { getApiClient, type ServiceRecordRecord, type CreateServiceRecordRequest, type UpdateServiceRecordRequest, type AppointmentRecord, type SystemUserRecord } from "@/lib/api"

export interface ServiceRecordDialogProps {
  record?: ServiceRecordRecord
  trigger?: React.ReactNode
  onCreated?: (r: ServiceRecordRecord) => void
  onUpdated?: (r: ServiceRecordRecord) => void
}

export function ServiceRecordDialog({ record, trigger, onCreated, onUpdated }: ServiceRecordDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!record

  const [appointmentId, setAppointmentId] = useState<string>("")
  const [technicianId, setTechnicianId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<string>("pending")

  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([])
  const [technicians, setTechnicians] = useState<SystemUserRecord[]>([])
  const [loadingLists, setLoadingLists] = useState(false)

  useEffect(() => {
    if (open) {
      const run = async () => {
        try {
          setLoadingLists(true)
          const [apts, techs] = await Promise.all([
            api.getAppointments({ limit: 500 }).then(r => r.data.appointments).catch(() => [] as AppointmentRecord[]),
            api.getSystemUsers({ limit: 100 }).then(r => r.data.systemUsers).catch(() => [] as SystemUserRecord[]),
          ])
          setAppointments(apts)
          setTechnicians(techs)
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
    if (open && isEditMode && record) {
      setAppointmentId(typeof record.appointment_id === 'object' && record.appointment_id ? record.appointment_id._id : (record.appointment_id as string) || "none")
      setTechnicianId(typeof record.technician_id === 'string' ? record.technician_id : record.technician_id?._id || "")
      setStartTime(record.start_time?.slice(0, 16) || "")
      setEndTime(record.end_time?.slice(0, 16) || "")
      setDescription(record.description || "")
      setStatus(record.status || "pending")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, record])

  const resetForm = () => {
    setAppointmentId("none")
    setTechnicianId("")
    setStartTime("")
    setEndTime("")
    setDescription("")
    setStatus("pending")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)

      if (isEditMode && record) {
        const payload: UpdateServiceRecordRequest = {
          appointment_id: appointmentId && appointmentId !== "none" ? appointmentId : null,
          technician_id: technicianId,
          description,
          status: status as any,
        }
        // Only include times if they are provided
        if (startTime) {
          payload.start_time = new Date(startTime).toISOString()
        }
        if (endTime) {
          payload.end_time = new Date(endTime).toISOString()
        }
        const updated = await api.updateServiceRecord(record._id, payload)
        toast({ title: "Cập nhật hồ sơ dịch vụ thành công" })
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        const payload: CreateServiceRecordRequest = {
          appointment_id: appointmentId && appointmentId !== "none" ? appointmentId : null,
          technician_id: technicianId,
          start_time: startTime ? new Date(startTime).toISOString() : "",
          end_time: endTime ? new Date(endTime).toISOString() : "",
          description,
          status: status as any,
        }
        const created = await api.createServiceRecord(payload)
        toast({ title: "Tạo hồ sơ dịch vụ thành công" })
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast({
        title: isEditMode ? "Cập nhật thất bại" : "Tạo thất bại",
        description: e?.message || `Failed to ${isEditMode ? "update" : "create"} service record`,
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
            Add Service Record
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Service Record" : "New Service Record"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Cập nhật thông tin hồ sơ dịch vụ" : "Tạo hồ sơ dịch vụ mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Appointment (Optional)</Label>
              <Select value={appointmentId} onValueChange={setAppointmentId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading appointments..." : "Select appointment (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {appointments.map(a => {
                    const vehicleName = typeof a.vehicle_id === 'string' ? a.vehicle_id : a.vehicle_id?.vehicleName || ""
                    const centerName = typeof a.center_id === 'string' ? a.center_id : a.center_id?.name || ""
                    return (
                      <SelectItem key={a._id} value={a._id}>
                        {vehicleName} • {centerName} • {new Date(a.startTime).toLocaleDateString()}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Technician</Label>
              <Select value={technicianId} onValueChange={setTechnicianId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading technicians..." : "Select technician"} />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map(t => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time (Optional)</Label>
                <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time (Optional)</Label>
                <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Service details..." />
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
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
