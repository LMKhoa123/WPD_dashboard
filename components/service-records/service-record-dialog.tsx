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
import { toast } from "sonner"
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
          toast.error(e?.message || "Failed to load data")
        } finally {
          setLoadingLists(false)
        }
      }
      run()
    }
  }, [open, api])

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
        if (startTime) {
          payload.start_time = new Date(startTime).toISOString()
        }
        if (endTime) {
          payload.end_time = new Date(endTime).toISOString()
        }
        const updated = await api.updateServiceRecord(record._id, payload)
        toast.success("Service record updated successfully")
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
        toast.success("Service record created successfully")
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEditMode ? "update" : "create"} service record`)
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
              {isEditMode ? "Update service record information" : "Create a new service record"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{isEditMode ? "Appointment (Read-only)" : "Appointment (Optional)"}</Label>
              <Select value={appointmentId} onValueChange={setAppointmentId} disabled={isEditMode}>
                <SelectTrigger disabled={isEditMode}>
                  <SelectValue placeholder={loadingLists ? "Loading appointments..." : (isEditMode ? "Appointment" : "Select appointment (optional)")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {appointments.map(a => {
                    const vehicleName = typeof a.vehicle_id === 'string' ? a.vehicle_id : a.vehicle_id?.vehicleName || ""
                    const centerName = typeof a.center_id === 'string' ? a.center_id : a.center_id?.name || ""
                    const appointmentDate = a.startTime ? new Date(a.startTime).toLocaleDateString() : ""
                    return (
                      <SelectItem key={a._id} value={a._id}>
                        {vehicleName} • {centerName}{appointmentDate ? ` • ${appointmentDate}` : ""}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              {isEditMode && appointmentId && appointmentId !== 'none' && (
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const a = appointments.find(x => x._id === appointmentId)
                    if (!a) return null
                    const vehicleName = typeof a.vehicle_id === 'string' ? a.vehicle_id : a.vehicle_id?.vehicleName || ""
                    const centerName = typeof a.center_id === 'string' ? a.center_id : a.center_id?.name || ""
                    const appointmentDate = a.startTime ? new Date(a.startTime).toLocaleString() : ""
                    return `${vehicleName} • ${centerName}${appointmentDate ? ` • ${appointmentDate}` : ""}`
                  })()}
                </p>
              )}
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
