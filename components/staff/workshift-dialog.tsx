"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getApiClient, type CenterRecord, type CreateWorkshiftRequest, type UpdateWorkshiftRequest, type WorkshiftRecord } from "@/lib/api"

interface WorkshiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workshift?: WorkshiftRecord | null
  onSuccess: () => void
  initial?: {
    shiftId?: string
    date?: string // YYYY-MM-DD
    start?: string // HH:mm
    end?: string   // HH:mm
    centerId?: string
    status?: string
  }
}

export function WorkshiftDialog({ open, onOpenChange, workshift, onSuccess, initial }: WorkshiftDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [shiftId, setShiftId] = useState("")
  const [shiftDate, setShiftDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [status, setStatus] = useState("active")
  const [centerId, setCenterId] = useState("")

  const isEdit = !!workshift

  useEffect(() => {
    if (!open) return
    const loadCenters = async () => {
      try {
        const api = getApiClient()
        const res = await api.getCenters({ page: 1, limit: 200 })
        setCenters(res.data.centers)
      } catch (e: any) {
        toast({ title: "Lỗi tải trung tâm", description: e?.message || "Failed to load centers", variant: "destructive" })
      }
    }
    loadCenters()
  }, [open, toast])

  useEffect(() => {
    if (open && isEdit && workshift) {
      setShiftId(workshift.shift_id)
      // convert ISO date to YYYY-MM-DD
      const d = new Date(workshift.shift_date)
      const yyyyMMdd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      setShiftDate(yyyyMMdd)
      setStartTime(workshift.start_time)
      setEndTime(workshift.end_time)
      setStatus(workshift.status)
      setCenterId(typeof workshift.center_id === "string" ? workshift.center_id : (workshift.center_id as any)?._id || "")
    }
    if (open && !isEdit) {
      setShiftId(initial?.shiftId ?? "")
      setShiftDate(initial?.date ?? "")
      setStartTime(initial?.start ?? "")
      setEndTime(initial?.end ?? "")
      setStatus((initial?.status as any) ?? "active")
      setCenterId(initial?.centerId ?? "")
    }
  }, [open, isEdit, workshift, initial])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng chọn trung tâm", variant: "destructive" })
      return
    }
    if (!shiftId || !shiftDate || !startTime || !endTime) {
      toast({ title: "Thiếu thông tin", description: "Vui lòng điền đủ các trường bắt buộc", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const api = getApiClient()
      if (isEdit && workshift) {
        const payload: UpdateWorkshiftRequest = {
          shift_id: shiftId,
          shift_date: shiftDate,
          start_time: startTime,
          end_time: endTime,
          status,
          center_id: centerId,
        }
        await api.updateWorkshift(workshift._id, payload)
        toast({ title: "Cập nhật thành công" })
      } else {
        const payload: CreateWorkshiftRequest = {
          shift_id: shiftId,
          shift_date: shiftDate,
          start_time: startTime,
          end_time: endTime,
          status,
          center_id: centerId,
        }
        await api.createWorkshift(payload)
        toast({ title: "Tạo ca làm việc thành công" })
      }
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Thao tác thất bại", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa ca làm việc" : "Tạo ca làm việc"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shift_id">Mã ca *</Label>
            <Input id="shift_id" value={shiftId} onChange={(e) => setShiftId(e.target.value)} placeholder="shift-2025-10-27-1" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="shift_date">Ngày *</Label>
              <Input id="shift_date" type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">Bắt đầu *</Label>
              <Input id="start_time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Kết thúc *</Label>
              <Input id="end_time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Trung tâm *</Label>
            <Select value={centerId} onValueChange={setCenterId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trung tâm" />
              </SelectTrigger>
              <SelectContent>
                {centers.map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="submit" disabled={loading}>{loading ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default WorkshiftDialog
