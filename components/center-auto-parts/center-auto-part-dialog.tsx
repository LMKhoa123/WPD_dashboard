"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getApiClient, type CenterAutoPartRecord, type CreateCenterAutoPartRequest, type UpdateCenterAutoPartRequest, type CenterRecord, type AutoPartRecord } from "@/lib/api"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: CenterAutoPartRecord | null
  onSuccess: () => void
}

export function CenterAutoPartDialog({ open, onOpenChange, record, onSuccess }: Props) {
  const isEdit = !!record
  const { toast } = useToast()
  const api = useMemo(() => getApiClient(), [])

  const [centers, setCenters] = useState<CenterRecord[]>([])
  const [parts, setParts] = useState<AutoPartRecord[]>([])
  const [loadingLists, setLoadingLists] = useState(false)

  const [centerId, setCenterId] = useState("")
  const [partId, setPartId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [minStock, setMinStock] = useState("")
  const [recommendedMinStock, setRecommendedMinStock] = useState("")
  const [lastForecastDate, setLastForecastDate] = useState("")

  useEffect(() => {
    if (open) {
      const loadLists = async () => {
        try {
          setLoadingLists(true)
          const [centersRes, partsRes] = await Promise.all([
            api.getCenters({ limit: 200 }).then(r => r.data.centers),
            api.getAutoParts(1, 200).then(r => r.data.parts),
          ])
          setCenters(centersRes)
          setParts(partsRes)
        } catch (e: any) {
          toast({ title: "Không tải được dữ liệu", description: e?.message || "Failed to load lists", variant: "destructive" })
        } finally {
          setLoadingLists(false)
        }
      }
      loadLists()
    }
  }, [open, api, toast])

  useEffect(() => {
    if (open && record) {
      setCenterId(typeof record.center_id === 'string' ? record.center_id : record.center_id._id)
      setPartId(typeof record.part_id === 'string' ? record.part_id : record.part_id._id)
      setQuantity(String(record.quantity))
      setMinStock(String(record.min_stock))
      setRecommendedMinStock(String(record.recommended_min_stock))
      setLastForecastDate(record.last_forecast_date ? record.last_forecast_date.slice(0, 16) : "")
    } else if (!open) {
      resetForm()
    }
  }, [open, record])

  const resetForm = () => {
    setCenterId("")
    setPartId("")
    setQuantity("")
    setMinStock("")
    setRecommendedMinStock("")
    setLastForecastDate("")
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!centerId || !partId) {
        toast({ title: "Thiếu dữ liệu", description: "Vui lòng chọn Center và Part" })
        return
      }
      if (isEdit && record) {
        const payload: UpdateCenterAutoPartRequest = {
          center_id: centerId,
          part_id: partId,
          quantity: Number(quantity),
          min_stock: Number(minStock),
          recommended_min_stock: Number(recommendedMinStock),
          last_forecast_date: lastForecastDate ? new Date(lastForecastDate).toISOString() : null,
        }
        const updated = await api.updateCenterAutoPart(record._id, payload)
        toast({ title: "Cập nhật thành công" })
      } else {
        const payload: CreateCenterAutoPartRequest = {
          center_id: centerId,
          part_id: partId,
          quantity: Number(quantity),
          min_stock: Number(minStock),
          recommended_min_stock: Number(recommendedMinStock),
          last_forecast_date: lastForecastDate ? new Date(lastForecastDate).toISOString() : undefined,
        }
        const created = await api.createCenterAutoPart(payload)
        toast({ title: "Tạo mới thành công" })
      }
      onSuccess()
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Thao tác thất bại", description: e?.message || "Operation failed", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit Center Inventory" : "Add Center Inventory"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Service Center</Label>
              <Select value={centerId} onValueChange={setCenterId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading centers..." : "Select center"} />
                </SelectTrigger>
                <SelectContent>
                  {centers.map(c => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Auto Part</Label>
              <Select value={partId} onValueChange={setPartId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingLists ? "Loading parts..." : "Select part"} />
                </SelectTrigger>
                <SelectContent>
                  {parts.map(p => (
                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input id="qty" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="min">Min Stock</Label>
                <Input id="min" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} required />
              </div>
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
