"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getApiClient, type SystemUserRecord } from "@/lib/api"

interface AssignStaffDialogProps {
  appointmentId: string
  trigger: React.ReactNode
  onAssigned?: () => void
}

export function AssignStaffDialog({ appointmentId, trigger, onAssigned }: AssignStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [staffId, setStaffId] = useState("")
  const [staffList, setStaffList] = useState<SystemUserRecord[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getSystemUsers({ limit: 200 })
        // Filter to STAFF role if available in userId
        const list = res.data.systemUsers.filter(s => {
          const u: any = s.userId
          return typeof u === 'object' ? (u.role === 'STAFF' || u.role === 'ADMIN') : true
        })
        setStaffList(list)
      } catch (e: any) {
        toast({ title: "Không tải được danh sách nhân viên", description: e?.message || "Failed to load staff", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId) return
    try {
      setSubmitting(true)
      await api.assignAppointmentStaff(appointmentId, staffId)
      toast({ title: "Đã gán nhân viên phụ trách" })
      setOpen(false)
      setStaffId("")
      onAssigned?.()
    } catch (e: any) {
      toast({ title: "Gán thất bại", description: e?.message || "Failed to assign staff", variant: "destructive" })
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
            <DialogTitle>Gán nhân viên phụ trách</DialogTitle>
            <DialogDescription>Chọn một nhân viên (Staff) để phụ trách lịch hẹn này.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading staff..." : "Chọn nhân viên"} />
              </SelectTrigger>
              <SelectContent>
                {staffList.map(s => (
                  <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
            <Button type="submit" disabled={submitting || !staffId}>{submitting ? "Đang gán..." : "Gán"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
