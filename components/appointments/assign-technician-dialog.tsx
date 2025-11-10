"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getApiClient, type SystemUserRecord } from "@/lib/api"
import { useAuth } from "@/components/auth-provider"

interface AssignTechnicianDialogProps {
  appointmentId: string
  trigger: React.ReactNode
  onAssigned?: () => void
}

export function AssignTechnicianDialog({ appointmentId, trigger, onAssigned }: AssignTechnicianDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [technicianId, setTechnicianId] = useState("")
  const [techList, setTechList] = useState<SystemUserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])
  const { user } = useAuth()

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getSystemUsers({ limit: 200, centerId: user?.centerId ?? undefined, role: 'TECHNICIAN' })
        const list = res.data.systemUsers
        setTechList(list)
      } catch (e: any) {
        toast({ title: "Không tải được danh sách kỹ thuật viên", description: e?.message || "Failed to load technicians", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!technicianId) return
    try {
      setSubmitting(true)
      const res = await api.assignAppointmentTechnician(appointmentId, technicianId)
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
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Gán kỹ thuật viên</DialogTitle>
            <DialogDescription>Chọn kỹ thuật viên để lập lịch. Khi gán sẽ tạo Service Record tự động.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={technicianId} onValueChange={setTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading technicians..." : "Chọn kỹ thuật viên"} />
              </SelectTrigger>
              <SelectContent>
                {techList.map(s => {
                  const label = s.name || (typeof s.userId === 'object' ? (s.userId.email || s.userId?.phone) : s._id)
                  return (
                    <SelectItem key={s._id} value={s._id}>{label}</SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
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
