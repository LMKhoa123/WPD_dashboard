"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getApiClient, type CenterAutoPartRecord, type ServiceDetailRecord, type CreateServiceDetailRequest, type UpdateServiceDetailRequest } from "@/lib/api"
import { toast } from "sonner"
import { Pencil, Trash2, Plus } from "lucide-react"
import { useAuth, useIsAdmin, useIsStaff, useRole } from "@/components/auth-provider"

export interface ServiceDetailsDialogProps {
  recordId: string
  trigger?: React.ReactNode
}

export function ServiceDetailsDialog({ recordId, trigger }: ServiceDetailsDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [details, setDetails] = useState<ServiceDetailRecord[]>([])
  const [centerParts, setCenterParts] = useState<CenterAutoPartRecord[]>([])

  const [editing, setEditing] = useState<ServiceDetailRecord | null>(null)

  const [centerPartId, setCenterPartId] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("")
  const [unitPrice, setUnitPrice] = useState("")

  const api = useMemo(() => getApiClient(), [])
  
  const { user } = useAuth()
  const isAdmin = useIsAdmin()
  const isStaff = useIsStaff()
  const role = useRole()
  const canCreate = isStaff

  const resetForm = () => {
    setEditing(null)
    setCenterPartId("")
    setDescription("")
    setQuantity("")
    setUnitPrice("")
  }

  const loadData = async () => {
    if (!recordId) return
    try {
      setLoading(true)
      const centerPartsParams: any = { page: 1, limit: 500 }
      
      if (user?.centerId) {
        centerPartsParams.center_id = user.centerId
      }
      
      const [list, centerPartsRes] = await Promise.all([
        api.getServiceDetails({ page: 1, limit: 200, record_id: recordId }),
        api.getCenterAutoParts(centerPartsParams),
      ])
      setDetails(list.data.details)
      setCenterParts(centerPartsRes.data.items)
    } catch (e: any) {
      toast.error("Failed to load data", { description: e?.message || "Failed to load data" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadData()
    else resetForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!centerPartId || editing) return 
    
    const selectedCenterPart = centerParts.find(cp => cp._id === centerPartId)
    if (selectedCenterPart) {
      const part = typeof selectedCenterPart.part_id === 'string' 
        ? null 
        : selectedCenterPart.part_id
      
      if (part && part.selling_price) {
        setUnitPrice(String(part.selling_price))
      }
    }
  }, [centerPartId, centerParts, editing])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      if (!centerPartId || !quantity || !unitPrice) {
        toast.error("Missing data", { description: "Please select Center-Part and enter Quantity/Unit Price" })
        return
      }
      if (editing) {
        const payload: UpdateServiceDetailRequest = {
          description,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
        }
        const updated = await api.updateServiceDetail(editing._id, payload)
        setDetails(prev => prev.map(d => d._id === updated._id ? updated : d))
  toast.success("Updated")
      } else {
        const payload: CreateServiceDetailRequest = {
          record_id: recordId,
          centerpart_id: centerPartId,
          description,
          quantity: Number(quantity),
          unit_price: Number(unitPrice),
        }
        const created = await api.createServiceDetail(payload)
        setDetails(prev => [created, ...prev])
  toast.success("Created")
      }
      resetForm()
    } catch (e: any) {
      toast.error("Save failed", { description: e?.message || "Save failed" })
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (item: ServiceDetailRecord) => {
    setEditing(item)
    setCenterPartId(typeof item.centerpart_id === 'string' ? item.centerpart_id : item.centerpart_id._id)
    setDescription(item.description || "")
    setQuantity(String(item.quantity || 0))
    setUnitPrice(String(item.unit_price || 0))
  }

  const onDelete = async (id: string) => {
    try {
      await api.deleteServiceDetail(id)
      setDetails(prev => prev.filter(d => d._id !== id))
  toast.success("Deleted")
    } catch (e: any) {
      toast.error("Delete failed", { description: e?.message || "Delete failed" })
    }
  }

  const getLabelForCenterPart = (cp: CenterAutoPartRecord) => {
    const centerName = typeof cp.center_id === 'string' ? cp.center_id : (cp.center_id.name || "")
    const partName = typeof cp.part_id === 'string' ? cp.part_id : (cp.part_id.name || "")
    return `${centerName} • ${partName}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline"><Plus className="h-4 w-4 mr-2" />Details</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Service Details (Staff finalizing order)</DialogTitle>
        </DialogHeader>

        {(canCreate || !!editing) && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Center-Part</Label>
                <Select value={centerPartId} onValueChange={setCenterPartId} disabled={!!editing}>
                  <SelectTrigger>
                    <SelectValue placeholder={loading ? "Loading..." : "Select center-part"} />
                  </SelectTrigger>
                  <SelectContent>
                    {centerParts.map(cp => (
                      <SelectItem key={cp._id} value={cp._id}>{getLabelForCenterPart(cp)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What was done..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Unit Price (from Auto Part)</Label>
                <Input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={unitPrice} 
                  onChange={(e) => setUnitPrice(e.target.value)} 
                  disabled={!editing}
                  className="bg-muted"
                  placeholder="Auto-filled from part selling price"
                  required 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editing && (
                <Button type="button" variant="outline" onClick={resetForm}>Cancel edit</Button>
              )}
              <Button type="submit" disabled={saving}>{editing ? "Update" : "Add Detail"}</Button>
            </div>
          </form>
        )}

        <div className="mt-6 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Center</TableHead>
                <TableHead>Part</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {details.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">No details yet</TableCell>
                </TableRow>
              ) : details.map(item => {
                const cp = centerParts.find(x => x._id === (typeof item.centerpart_id === 'string' ? item.centerpart_id : item.centerpart_id._id))
                const center = cp ? (typeof cp.center_id === 'string' ? cp.center_id : cp.center_id.name) : '-'
                const part = cp ? (typeof cp.part_id === 'string' ? cp.part_id : cp.part_id.name) : '-'
                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">{center || '-'}</TableCell>
                    <TableCell>{part || '-'}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{item.unit_price}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(item._id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
