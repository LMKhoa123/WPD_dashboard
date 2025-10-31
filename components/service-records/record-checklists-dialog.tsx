"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getApiClient, type RecordChecklistItem, type RecordChecklistStatus } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, ClipboardCheck } from "lucide-react"
import { useIsAdmin, useIsStaff, useRole } from "@/components/auth-provider"
import { AssignChecklistsDialog } from "./assign-checklists-dialog"

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
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const role = useRole()
  const isTechnician = role === "Technician"
  const canAssign = role === "Staff" || role === "Technician"

  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await api.getRecordChecklistsByRecord(recordId)
        setItems(res.data)
      } catch (e: any) {
        toast({ title: "Không tải được checklist", description: e?.message || "Failed to load", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, api, recordId, toast])

  const setLocal = (id: string, patch: Partial<RecordChecklistItem>) => {
    setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...patch } : it)))
  }

  const handleSave = async (id: string) => {
    const current = items.find((i) => i._id === id)
    if (!current) return
    try {
      setSavingId(id)
      await api.updateRecordChecklist(id, { status: current.status, note: current.note })
      toast({ title: "Đã lưu" })
    } catch (e: any) {
      toast({ title: "Lưu thất bại", description: e?.message || "Failed to save", variant: "destructive" })
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await api.deleteRecordChecklist(id)
      setItems((prev) => prev.filter((i) => i._id !== id))
      toast({ title: "Đã xóa hạng mục" })
    } catch (e: any) {
      toast({ title: "Xóa thất bại", description: e?.message || "Failed to delete", variant: "destructive" })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Checklist của phiếu dịch vụ</DialogTitle>
          <DialogDescription>Quản lý các hạng mục kiểm tra cho lần dịch vụ này.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-2">
          {(canAssign || !isAdmin) && (
            <AssignChecklistsDialog
              recordId={recordId}
              onAssigned={() => {
                // reload
                api.getRecordChecklistsByRecord(recordId).then((res) => setItems(res.data)).catch(()=>{})
              }}
              trigger={
                <Button size="sm" variant="secondary">
                  <ClipboardCheck className="h-4 w-4 mr-2" /> Thêm checklist
                </Button>
              }
            />
          )}
        </div>
        <ScrollArea className="max-h-[420px] pr-2">
          {loading ? (
            <div className="text-muted-foreground">Đang tải...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground">Chưa có hạng mục checklist.</div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it._id} className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center border rounded-md p-3">
                  <div className="sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Checklist</div>
                    <div className="font-medium">
                      {typeof it.checklist_id === 'string' ? it.checklist_id : it.checklist_id?.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Trạng thái</div>
                    <Select value={it.status} onValueChange={(v) => setLocal(it._id, { status: v as RecordChecklistStatus })}>
                      <SelectTrigger disabled={!isTechnician}>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace("-"," ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-sm text-muted-foreground">Ghi chú</div>
                    <Input value={it.note || ""} onChange={(e) => setLocal(it._id, { note: e.target.value })} placeholder="Ghi chú..." disabled={!isTechnician} />
                  </div>
                  <div className="flex gap-2 justify-end">
                    {isTechnician && (
                      <Button size="sm" variant="outline" onClick={() => handleSave(it._id)} disabled={savingId === it._id}>Lưu</Button>
                    )}
                    {(isAdmin || isStaff || role === "Technician") && (
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(it._id)} disabled={deletingId === it._id}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
