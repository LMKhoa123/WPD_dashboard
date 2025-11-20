"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type RecordChecklistItem, type RecordChecklistStatus } from "@/lib/api"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, ClipboardCheck, Wrench, Package } from "lucide-react"
import { useIsAdmin, useIsStaff, useRole } from "@/components/auth-provider"
import { AssignChecklistsDialog } from "./assign-checklists-dialog"
import { SuggestPartsDialog } from "./suggest-parts-dialog"
import { AllSuggestedPartsDialog } from "./all-suggested-parts-dialog"
import { Badge } from "@/components/ui/badge"

interface RecordChecklistsDialogProps {
  recordId: string
  trigger: React.ReactNode
}

const statusOptions: RecordChecklistStatus[] = ["pending", "checked", "ok", "needs-replacement"]

export function RecordChecklistsDialog({ recordId, trigger }: RecordChecklistsDialogProps) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<RecordChecklistItem[]>([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [centerId, setCenterId] = useState<string>("")
  const api = useMemo(() => getApiClient(), [])
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const role = useRole()
  const isTechnician = role === "Technician"
  const canAssign = isStaff || isTechnician  

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getRecordChecklistsByRecord(recordId)
        setItems(res.data)

        try {
          const recordRes = await api.getServiceRecordById(recordId)
          if (recordRes?.appointment_id) {
            const apptId = typeof recordRes.appointment_id === 'string'
              ? recordRes.appointment_id
              : recordRes.appointment_id?._id

            if (apptId) {
              const appt = await api.getAppointmentById(apptId)
              const cid = typeof appt.center_id === 'string' ? appt.center_id : appt.center_id?._id
              if (cid) setCenterId(cid)
            }
          }
        } catch {
        }
      } catch (e: any) {
        toast.error(e?.message || "Failed to load checklists")
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, recordId])

  const setLocal = (id: string, patch: Partial<RecordChecklistItem>) => {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...patch } : it)))
  }

  const handleSave = async (id: string) => {
    const current = items.find((i) => i._id === id)
    if (!current) return
    try {
      setSavingId(id)
      await api.updateRecordChecklist(id, { status: current.status, note: current.note })
      toast.success("Saved")
    } catch (e: any) {
      toast.error(e?.message || "Failed to save")
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteRecordChecklist(id)
      setItems((prev) => prev.filter((i) => i._id !== id))
      toast.success("Deleted checklist item")
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete checklist item")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Maintenance Checklist (Technician)</DialogTitle>
          <DialogDescription>
            Technician checks the items and suggests parts to be replaced.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-2 gap-2">
          <div className="flex gap-2">
            {(canAssign || !isAdmin) && (
              <AssignChecklistsDialog
                recordId={recordId}
                onAssigned={() => {
                  api.getRecordChecklistsByRecord(recordId).then((res) => setItems(res.data)).catch(() => { })
                }}
                trigger={
                  <Button size="sm" variant="secondary">
                    <ClipboardCheck className="h-4 w-4 mr-2" /> Add checklist
                  </Button>
                }
              />
            )}
          </div>

          {isStaff && items.length > 0 && (
            <AllSuggestedPartsDialog
              recordId={recordId}
              trigger={
                <Button size="sm" variant="outline">
                  <Package className="h-4 w-4 mr-2" /> View all suggested parts to create Detail
                </Button>
              }
            />
          )}
        </div>
        <ScrollArea className="max-h-[420px] pr-2">
          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">No checklist items.</div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it._id} className="border rounded-md p-3 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <div className="text-sm text-muted-foreground">Checklist</div>
                      <div className="font-medium">
                        {typeof it.checklist_id === 'string' ? it.checklist_id : it.checklist_id?.name}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <Select value={it.status} onValueChange={(v) => setLocal(it._id, { status: v as RecordChecklistStatus })}>
                        <SelectTrigger disabled={!isTechnician}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace("-", " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-sm text-muted-foreground">Note</div>
                      <Input value={it.note || ""} onChange={(e) => setLocal(it._id, { note: e.target.value })} placeholder="Note..." disabled={!isTechnician} />
                    </div>
                    <div className="flex gap-2 justify-end">
                      {isTechnician && (
                        <Button size="sm" variant="outline" onClick={() => handleSave(it._id)} disabled={savingId === it._id}>Save</Button>
                      )}
                      {(isAdmin || isStaff || role === "Technician") && (
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(it._id)} disabled={deletingId === it._id}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Suggested Parts Section - CHỈ TECHNICIAN được đề xuất */}
                  {isTechnician && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Suggested Parts:</span>
                          {it.suggest && it.suggest.length > 0 ? (
                            <Badge variant="secondary">{it.suggest.length} parts</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">None</span>
                          )}
                        </div>
                        <SuggestPartsDialog
                          checklistItemId={it._id}
                          currentSuggested={it.suggest || []}
                          centerId={centerId}
                          onSaved={() => {
                            api.getRecordChecklistsByRecord(recordId).then((res) => setItems(res.data)).catch(() => { })
                          }}
                          trigger={
                            <Button size="sm" variant="outline">
                              <Wrench className="h-4 w-4 mr-1" />
                              {it.suggest && it.suggest.length > 0 ? "Edit Suggestions" : "Add Suggestions"}
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
