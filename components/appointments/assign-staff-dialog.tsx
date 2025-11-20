"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { getApiClient } from "@/lib/api"

interface AssignStaffDialogProps {
  appointmentId: string
  centerId?: string | { _id: string; name?: string; address?: string; phone?: string }
  slotId?: string
  trigger: React.ReactNode
  onAssigned?: () => void
}

type StaffOption = { id: string; label: string; assigned?: boolean; shiftTime?: string }

export function AssignStaffDialog({ appointmentId, centerId, slotId, trigger, onAssigned }: AssignStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [staffId, setStaffId] = useState("")
  const [staffList, setStaffList] = useState<StaffOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [slotMeta, setSlotMeta] = useState<{ date: string; startTime: string; endTime: string; capacity: number; totalAppointments: number } | null>(null)
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        if (slotId) {
          const res = await api.getSlotStaffAndTechnician(slotId)
          setSlotMeta({
            date: res.data.slot.date,
            startTime: res.data.slot.startTime,
            endTime: res.data.slot.endTime,
            capacity: res.data.slot.capacity,
            totalAppointments: res.data.slot.totalAppointments,
          })
          const opts: StaffOption[] = (res.data.staff || []).map(s => ({
            id: s.id,
            label: s.name || s.email || s.phone || s.id,
            assigned: !!s.assigned,
            shiftTime: s.shiftTime,
          }))
          setStaffList(opts)
        } else {
          const centerIdStr = typeof centerId === 'string' ? centerId : centerId?._id
          const res = await api.getSystemUsers({ limit: 200, centerId: centerIdStr, role: 'STAFF' })
          const opts: StaffOption[] = res.data.systemUsers.map(s => ({
            id: s._id,
            label: s.name || (typeof s.userId === 'object' ? (s.userId.email || s.userId.phone || s._id) : s._id),
            assigned: false,
          }))
          setStaffList(opts)
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to load staff")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, centerId, slotId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId) return
    try {
      setSubmitting(true)
      const res = await api.assignAppointmentStaff(appointmentId, staffId)
      console.log(res)
      toast.success("Staff assigned successfully")
      setOpen(false)
      setStaffId("")
      onAssigned?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign staff")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[420px] w-[calc(100%-2rem)] p-4">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Staff</DialogTitle>
            <DialogDescription>Select a staff member to be responsible for this appointment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            {slotMeta && (
              <div className="rounded border p-2 bg-muted/40 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{slotMeta.date}</div>
                  <div className="text-muted-foreground">{slotMeta.startTime} - {slotMeta.endTime}</div>
                </div>
                <Badge variant="outline">{slotMeta.totalAppointments}/{slotMeta.capacity} booked</Badge>
              </div>
            )}
            <Input placeholder={loading ? "Loading..." : "Search by name / email / phone"} value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-60 overflow-auto rounded border divide-y">
              {staffList
                .filter(s => !search || s.label.toLowerCase().includes(search.toLowerCase()))
                .map(s => {
                  const selected = staffId === s.id
                  return (
                    <button
                      type="button"
                      key={s.id}
                      disabled={s.assigned}
                      onClick={() => setStaffId(s.id)}
                      className={`w-full text-left p-2 hover:bg-muted/60 focus:outline-none ${s.assigned ? 'opacity-60' : ''} ${selected ? 'ring-2 ring-primary' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{s.label}</div>
                          {s.shiftTime && (
                            <div className="text-xs text-muted-foreground">Ca: {s.shiftTime}</div>
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
              {(!loading && staffList.length === 0) && (
                <div className="p-3 text-sm text-muted-foreground">No suitable staff found.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting || !staffId}>{submitting ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
