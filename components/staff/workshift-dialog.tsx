"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getApiClient, type CenterRecord, type CreateWorkshiftsBulkRequest, type UpdateWorkshiftRequest, type WorkshiftRecord } from "@/lib/api"

interface WorkshiftDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workshift?: WorkshiftRecord | null
  onSuccess: () => void
  centers?: CenterRecord[]
}

export function WorkshiftDialog({ open, onOpenChange, workshift, onSuccess, centers: centersProp }: WorkshiftDialogProps) {
  const [loading, setLoading] = useState(false)

  const [centers, setCenters] = useState<CenterRecord[]>(centersProp ?? [])
  const [mode, setMode] = useState<"create" | "edit">(workshift ? "edit" : "create")
  const [rangeStart, setRangeStart] = useState("") 
  const [rangeEnd, setRangeEnd] = useState("")   
  const [shiftType, setShiftType] = useState<"morning" | "afternoon">("morning")
  const [shiftDate, setShiftDate] = useState("") 
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [status, setStatus] = useState("active")
  const [centerId, setCenterId] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const isEdit = !!workshift

  useEffect(() => {
    if (!open) return
    setMode(workshift ? "edit" : "create")
    const loadCenters = async () => {
      try {
        if (centersProp && centersProp.length > 0) {
          setCenters(centersProp)
        } else {
          const api = getApiClient()
          const res = await api.getCenters({ page: 1, limit: 200 })
          setCenters(res.data.centers)
        }
      } catch (e: any) {
  toast.error("Failed to load centers. Please try again.")
      }
    }
    loadCenters()
  }, [open, workshift, centersProp])
  useEffect(() => {
    if (open && isEdit && workshift) {
      
      const d = new Date(workshift.shift_date)
      const yyyyMMdd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      setShiftDate(yyyyMMdd)
      setStartTime(workshift.start_time)
      setEndTime(workshift.end_time)
      setStatus(workshift.status)
      setCenterId(typeof workshift.center_id === "string" ? workshift.center_id : (workshift.center_id as any)?._id || "")
      
      if (workshift.start_time === "07:00" && workshift.end_time === "11:00") setShiftType("morning")
      else if (workshift.start_time === "13:00" && workshift.end_time === "17:00") setShiftType("afternoon")
    }
    if (open && !isEdit) {
      setRangeStart("")
      setRangeEnd("")
      setShiftType("morning")
      setStatus("active")
      setCenterId("")
      
      setStartTime("07:00"); setEndTime("11:00")
    }
  }, [open, isEdit, workshift])

  useEffect(() => {
    if (!open) return
    if (shiftType === "morning") { setStartTime("07:00"); setEndTime("11:00") }
    else { setStartTime("13:00"); setEndTime("17:00") }
  }, [shiftType, open])

  const previewDates = useMemo(() => {
    if (isEdit) return []
    if (!rangeStart || !rangeEnd) return []
    const start = new Date(rangeStart)
    const end = new Date(rangeEnd)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return []
    const out: string[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const yyyy = cursor.getFullYear()
      const mm = String(cursor.getMonth() + 1).padStart(2, '0')
      const dd = String(cursor.getDate()).padStart(2, '0')
      out.push(`${yyyy}-${mm}-${dd}`)
      cursor.setDate(cursor.getDate() + 1)
    }
    return out
  }, [rangeStart, rangeEnd, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!centerId) {
  toast.error("Please select a center")
      return
    }
    
    if (isEdit) {
      if (!shiftDate) {
  toast.error("Please select a date")
        return
      }
    } else {
      if (!rangeStart || !rangeEnd) {
  toast.error("Please select a date range")
        return
      }
      
      const today = new Date(); today.setHours(0,0,0,0)
      const start = new Date(rangeStart); const end = new Date(rangeEnd)
      if (start < today) {
  toast.error("Cannot create shifts in the past")
        return
      }
      const diffMs = end.getTime() - start.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
      if (diffDays > 60) {
  toast.error("Please select up to 60 days")
        return
      }
    }

    setLoading(true)
    try {
      const api = getApiClient()
      if (isEdit && workshift) {
        const payload: UpdateWorkshiftRequest = {
          shift_date: shiftDate,
          start_time: startTime,
          end_time: endTime,
          status,
          center_id: centerId,
        }
        await api.updateWorkshift(workshift._id, payload)
  toast.success("Update successful")
      } else {
        
        const dates: string[] = previewDates
  if (!dates.length) { toast.error("Invalid date range"); setLoading(false); return }
        const payload: CreateWorkshiftsBulkRequest = {
          shift_dates: dates,
          start_time: startTime,
          end_time: endTime,
          status,
          center_id: centerId,
        }
        
        try {
          const existing = await api.getWorkshifts({ center_id: centerId, page: 1, limit: 1000 })
          const existingKey = new Set(existing.map(e => `${e.shift_date.substring(0,10)}|${e.start_time}|${e.end_time}`))
          const newDates = dates.filter(d => !existingKey.has(`${d}|${startTime}|${endTime}`))
          if (newDates.length === 0) {
            toast.error("No new shifts. All dates in range already have this time slot")
            setLoading(false)
            return
          }
          payload.shift_dates = newDates
          await api.createWorkshiftsBulk(payload)
          const skipped = dates.length - newDates.length
          toast.success(`Created ${newDates.length} work shifts successfully${skipped > 0 ? `, ${skipped} days skipped due to duplicates` : ""}`)
        } catch (err) {
          
          await api.createWorkshiftsBulk(payload)
          toast.success(`Created ${dates.length} work shifts (no duplicate check)`)
        }
      }
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
  toast.error(e?.message || "Operation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Work Shift" : "Create Work Shifts"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit ? (
            <div className="grid gap-2">
              <Label>Date range *</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} required />
                <Input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} required />
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{previewDates.length > 0 ? `${previewDates.length} days will be created` : "Select range to preview"}</p>
                {previewDates.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPreview(p => !p)}>
                    {showPreview ? "Hide list" : "Show list"}
                  </Button>
                )}
              </div>
              {showPreview && previewDates.length > 0 && (
                <div className="border rounded p-2 max-h-40 overflow-auto text-xs space-y-1 bg-muted/30">
                  {previewDates.map(d => <div key={d}>{d}</div>)}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="shift_date">Date *</Label>
              <Input id="shift_date" type="date" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} required />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Work shift *</Label>
              <Select value={shiftType} onValueChange={(v: any) => setShiftType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning (07:00 - 11:00)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (13:00 - 17:00)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input type="time" value={startTime} disabled readOnly />
                <Input type="time" value={endTime} disabled readOnly />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status *</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Center *</Label>
            <Select value={centerId} onValueChange={setCenterId}>
              <SelectTrigger>
                <SelectValue placeholder={centers.length > 0 ? "Select center" : "Loading..."} />
              </SelectTrigger>
              <SelectContent>
                {centers.length === 0 ? (
                  <SelectItem value="" disabled>No centers</SelectItem>
                ) : (
                  centers.map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEdit ? "Update" : "Create shifts for range"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default WorkshiftDialog
