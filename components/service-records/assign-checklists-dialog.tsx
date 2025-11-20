"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type ServiceChecklistRecord } from "@/lib/api"
import { toast } from "sonner"
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
  const api = useMemo(() => getApiClient(), [])

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getServiceChecklists(1, 200)
        setTemplates(res.data.checklists)
      } catch (e: any) {
        toast.error(e?.message || "Failed to load checklists" )
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api])

  const toggle = (id: string) => setSelected((prev) => ({ ...prev, [id]: !prev[id] }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const ids = Object.keys(selected).filter((k) => selected[k])
    if (ids.length === 0) return
    try {
      setSubmitting(true)
      await api.createRecordChecklists({ record_id: recordId, checklist_ids: ids, status: "pending", note, suggest: [] })
      toast.success("Assigned checklist")
      setOpen(false)
      setSelected({})
      setNote("")
      onAssigned?.()
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign checklist")
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
            <DialogTitle>Assign checklist to service record</DialogTitle>
            <DialogDescription>Select one or more checklist templates to apply to this service record.</DialogDescription>
          </DialogHeader>
          <div className="max-h-72 overflow-auto space-y-3 py-3">
            {loading ? (
              <div className="text-muted-foreground">Loading...</div>
            ) : templates.length === 0 ? (
              <div className="text-muted-foreground">No checklist templates available.</div>
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
            <div className="text-sm text-muted-foreground mb-1">Note (optional)</div>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the items..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>{submitting ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
