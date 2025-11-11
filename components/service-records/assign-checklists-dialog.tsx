"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type ServiceChecklistRecord } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

interface AssignChecklistsDialogProps {
  recordId: string
  trigger: React.ReactNode
  onAssigned?: () => void
}

export function AssignChecklistsDialog({ recordId, trigger, onAssigned }: AssignChecklistsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [templates, setTemplates] = useState<ServiceChecklistRecord[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [note, setNote] = useState("")
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getServiceChecklists(1, 200)
        setTemplates(res.data.checklists)
      } catch (e: any) {
        toast({ title: "Không tải được checklist", description: e?.message || "Failed to load checklists", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, toast])

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ids = Object.keys(selected).filter((k) => selected[k])
    if (ids.length === 0) return
    try {
      setSubmitting(true)
      // When first creating, suggest should be empty array
      await api.createRecordChecklists({ record_id: recordId, checklist_ids: ids, status: "pending", note, suggest: [] })
      toast({ title: "Đã gán checklist" })
      setOpen(false)
      setSelected({})
      setNote("")
      onAssigned?.()
    } catch (e: any) {
      toast({ title: "Gán thất bại", description: e?.message || "Failed to assign", variant: "destructive" })
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
            <DialogTitle>Gán checklist cho hồ sơ</DialogTitle>
            <DialogDescription>Chọn một hoặc nhiều mẫu checklist để áp dụng cho hồ sơ dịch vụ này.</DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-auto space-y-3 py-3">
            {loading ? (
              <div className="text-muted-foreground">Đang tải...</div>
            ) : templates.length === 0 ? (
              <div className="text-muted-foreground">Chưa có template checklist nào.</div>
            ) : (
              templates.sort((a,b)=>a.order-b.order).map((tpl) => (
                <label key={tpl._id} className="flex items-center gap-3">
                  <Checkbox checked={!!selected[tpl._id]} onCheckedChange={() => toggle(tpl._id)} />
                  <span className="font-medium">{tpl.name}</span>
                </label>
              ))
            )}
          </div>
          <div className="pt-2">
            <div className="text-sm text-muted-foreground mb-1">Ghi chú (tùy chọn)</div>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú cho các hạng mục..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Đang gán..." : "Gán"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
