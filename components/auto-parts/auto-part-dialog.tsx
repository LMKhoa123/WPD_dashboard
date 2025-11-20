"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getApiClient } from "@/lib/api"
import type { AutoPartRecord } from "@/lib/api"

interface AutoPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  autoPart: AutoPartRecord | null
  onSuccess: () => void
}

export function AutoPartDialog({
  open,
  onOpenChange,
  autoPart,
  onSuccess,
}: AutoPartDialogProps) {
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [costPrice, setCostPrice] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [warrantyTime, setWarrantyTime] = useState("")

  const isEditMode = !!autoPart

  useEffect(() => {
    if (open && isEditMode && autoPart) {
      setName(autoPart.name || "")
      setCostPrice(String(autoPart.cost_price || 0))
      setSellingPrice(String(autoPart.selling_price || 0))
      setWarrantyTime(String(autoPart.warranty_time || 0))
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, autoPart])

  const resetForm = () => {
    setName("")
    setCostPrice("")
    setSellingPrice("")
    setWarrantyTime("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const apiClient = getApiClient()
      const data = {
        name,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        warranty_time: Number(warrantyTime),
      }

      if (isEditMode && autoPart) {
        await apiClient.updateAutoPart(autoPart._id, data)
        toast.success("Auto part updated successfully")
      } else {
        await apiClient.createAutoPart(data)
        toast.success("Auto part created successfully")
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error?.message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Auto Part" : "Create Auto Part"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Part Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Brake Pad, Oil Filter"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Cost Price ($) *</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price ($) *</Label>
              <Input
                id="sellingPrice"
                type="number"
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warrantyTime">Warranty Time (days) *</Label>
            <Input
              id="warrantyTime"
              type="number"
              min="0"
              value={warrantyTime}
              onChange={(e) => setWarrantyTime(e.target.value)}
              placeholder="e.g., 365 for 1 year"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditMode ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
