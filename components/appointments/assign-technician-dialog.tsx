"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { getApiClient } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

interface AssignTechnicianDialogProps {
  appointmentId: string
  slotId?: string
  trigger: React.ReactNode
  onAssigned?: () => void
}

type TechOption = { id: string; label: string; assigned?: boolean; shiftTime?: string }

export function AssignTechnicianDialog({ appointmentId, slotId, trigger, onAssigned }: AssignTechnicianDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [technicianId, setTechnicianId] = useState("")
  const [techList, setTechList] = useState<TechOption[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [slotMeta, setSlotMeta] = useState<{ date: string; startTime: string; endTime: string; capacity: number; totalAppointments: number } | null>(null)
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])
  const { user } = useAuth()

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
          const opts: TechOption[] = (res.data.technician || []).map(t => ({
            id: t.id,
            label: t.name || t.email || t.phone || t.id,
            assigned: !!t.assigned,
            shiftTime: t.shiftTime,
          }))
          setTechList(opts)
        } else {
          const res = await api.getSystemUsers({ limit: 200, centerId: user?.centerId ?? undefined, role: 'TECHNICIAN' })
          const list = res.data.systemUsers
          const opts: TechOption[] = list.map(s => ({
            id: s._id,
            label: s.name || (typeof s.userId === 'object' ? (s.userId.email || s.userId.phone || s._id) : s._id),
            assigned: false,
          }))
          setTechList(opts)
        }
      } catch (e: any) {
        toast({ title: "Không tải được danh sách kỹ thuật viên", description: e?.message || "Failed to load technicians", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, toast, slotId, user?.centerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!technicianId) return
    try {
      setSubmitting(true)
      const res = await api.assignAppointmentTechnician(appointmentId, technicianId)
      console.log(res)
      if (!res?.success) throw new Error(res?.message || 'Failed')
      toast({ title: "Đã gán kỹ thuật viên" })
      setOpen(false)
      setTechnicianId("")
      onAssigned?.()
    } catch (e: any) {
      toast({ title: "Gán thất bại", description: e?.message || "Failed to assign technician", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[560px] w-[calc(100%-2rem)] p-4">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gán kỹ thuật viên</DialogTitle>
            <DialogDescription>Chọn kỹ thuật viên để lập lịch. Khi gán sẽ tạo Service Record tự động.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-3">
            {slotMeta && (
              <div className="rounded border p-2 bg-muted/40 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{slotMeta.date}</div>
                  <div className="text-muted-foreground">{slotMeta.startTime} - {slotMeta.endTime}</div>
                </div>
                <Badge variant="outline">{slotMeta.totalAppointments}/{slotMeta.capacity} đặt</Badge>
              </div>
            )}
            <Input placeholder={loading ? "Đang tải..." : "Tìm theo tên / email / phone"} value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="max-h-60 overflow-auto rounded border divide-y">
              {techList
                .filter(s => !search || s.label.toLowerCase().includes(search.toLowerCase()))
                .map(s => {
                  const selected = technicianId === s.id
                  return (
                    <button
                      type="button"
                      key={s.id}
                      disabled={s.assigned}
                      onClick={() => setTechnicianId(s.id)}
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
                          {s.assigned && <Badge variant="secondary">đã đc assigned</Badge>}
                          {selected && <Badge>Đã chọn</Badge>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              {(!loading && techList.length === 0) && (
                <div className="p-3 text-sm text-muted-foreground">Không có kỹ thuật viên phù hợp.</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
            <Button type="submit" disabled={submitting || !technicianId}>{submitting ? "Đang gán..." : "Gán"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
