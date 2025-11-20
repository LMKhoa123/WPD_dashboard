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
import {toast} from "sonner"
import { getApiClient, type AppointmentRecord, type CreateAppointmentRequest, type CreateAppointmentRequestV2, type UpdateAppointmentRequest, type VehicleRecord, type CenterRecord, type SystemUserRecord, type CustomerRecord, type SlotRecord } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

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
  const [customerId, setCustomerId] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [slotId, setSlotId] = useState("")
  const [status, setStatus] = useState<string>("pending")

  const api = useMemo(() => getApiClient(), [])

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [staff, setStaff] = useState<SystemUserRecord[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loadingLists, setLoadingLists] = useState(false)
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const { user } = useAuth()

  useEffect(() => {
    if (open) {
      const run = async () => {
        try {
          setLoadingLists(true)
          const [allVehicles, cs, cus] = await Promise.all([
            api.getVehicles({ limit: 500 }).catch(() => [] as VehicleRecord[]),
            api.getCenters({ limit: 100 }).then(r => r.data.centers).catch(() => [] as CenterRecord[]),
            api.getCustomers({ limit: 200 }).then(r => r.data.customers).catch(() => [] as CustomerRecord[]),
          ])
          setVehicles(Array.isArray(allVehicles) ? allVehicles : [])
          setCenters(cs)
          setCustomers(cus)
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
    if (open && user?.centerId && !centerId) setCenterId(user.centerId)
  }, [open, user?.centerId, centerId])

  useEffect(() => {
    const run = async () => {
      if (!open || !centerId) return
      try {
        const s = await api.getSlots(centerId)
        setSlots(s)
      } catch { }
    }
    run()
  }, [open, centerId, api])

  useEffect(() => {
    const run = async () => {
      if (!open || !centerId) {
        setStaff([])
        if (!isEditMode) setStaffId("")
        return
      }
      
      if (!isEditMode) setStaffId("")
      try {
        const result = await api.getSystemUsers({ limit: 100, centerId, role: "STAFF" })
        setStaff(result.data.systemUsers)
      } catch {
        setStaff([])
      }
    }
    run()
  }, [open, centerId, api, isEditMode])

  useEffect(() => {
    const run = async () => {
      if (!open) return
      if (!customerId) {
        try {
          const all = await api.getVehicles({ limit: 500 })
          setVehicles(all)
        } catch { }
        return
      }
      try {
        const vs = await api.getVehiclesByCustomerId(customerId)
        setVehicles(vs)
      } catch { }
    }
    run()
  }, [open, customerId, api])

  useEffect(() => {
    if (open && isEditMode && appointment) {
      setStaffId(typeof appointment.staffId === 'string' ? appointment.staffId : appointment.staffId?._id || "")
      setVehicleId(typeof appointment.vehicle_id === 'string' ? appointment.vehicle_id : appointment.vehicle_id?._id || "")
      setCenterId(typeof appointment.center_id === 'string' ? appointment.center_id : appointment.center_id?._id || "")
      setCustomerId(typeof appointment.customer_id === 'string' ? appointment.customer_id : (appointment.customer_id as any)?._id || "")
      const slotIdValue = appointment.slot_id
        ? (typeof appointment.slot_id === 'string' ? appointment.slot_id : appointment.slot_id._id)
        : ""
      setSlotId(slotIdValue)
      setStartTime(appointment.startTime?.slice(0, 16) || "")
      setEndTime(appointment.endTime?.slice(0, 16) || "")
      setStatus(appointment.status || "pending")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, appointment])

  const resetForm = () => {
    setStaffId("")
    setVehicleId("")
    setCenterId("")
    setCustomerId("")
    setStartTime("")
    setEndTime("")
    setSlotId("")
    setStatus("pending")
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
          customer_id: customerId || null,
          status: status as any,
        }
        if (slotId) {
          payload.slot_id = slotId
        } else {
          payload.startTime = startTime ? new Date(startTime).toISOString() : undefined
          payload.endTime = endTime ? new Date(endTime).toISOString() : undefined
        }
        const updated = await api.updateAppointment(appointment._id, payload)
        toast.success("Updated appointment successfully")
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        let payload: CreateAppointmentRequest | CreateAppointmentRequestV2
        if (slotId) {
          payload = {
            staffId,
            vehicle_id: vehicleId,
            center_id: centerId,
            customer_id: customerId || null,
            slot_id: slotId,
            status: status as any,
          }
        } else {
          payload = {
            staffId,
            vehicle_id: vehicleId,
            center_id: centerId,
            customer_id: customerId || null,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            status: status as any,
          }
        }
        const created = await api.createAppointment(payload)
        toast.success("Created appointment successfully")
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEditMode ? "update" : "create"} appointment`)
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
              {isEditMode ? "Update appointment information" : "Create a new service appointment"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Customer (optional)</Label>
              <Select value={customerId} onValueChange={setCustomerId} disabled={!!appointment}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading customers..." : "Select customer (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.customerName} • {c.userId?.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading vehicles..." : (customerId ? "Select vehicle" : "Select customer first")} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(v => (
                    <SelectItem key={v._id} value={v._id}>{v.vehicleName} • {v.model} • {v.plateNumber}</SelectItem>
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

            <div className="grid gap-2">
              <Label>Slot {slotId && <span className="text-xs text-muted-foreground">(slot-based scheduling)</span>}</Label>
              <Select value={slotId} onValueChange={setSlotId}>
                <SelectTrigger>
                  <SelectValue placeholder={slots.length ? "Select slot or use manual times below" : (centerId ? "No slots available" : "Select center first")} />
                </SelectTrigger>
                <SelectContent>
                  {slots.map(s => {
                    const slotDate = new Date(s.slot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                      <SelectItem key={s._id} value={s._id}>
                        {slotDate} • {s.start_time} - {s.end_time} • {s.booked_count}/{s.capacity}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            {!slotId && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time <span className="text-xs text-muted-foreground">(manual mode)</span></Label>
                  <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required={!slotId} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required={!slotId} />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus} disabled>
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
