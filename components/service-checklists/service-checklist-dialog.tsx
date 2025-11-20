"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getApiClient } from "@/lib/api"
import type { ServiceChecklistRecord } from "@/lib/api"

interface ServiceChecklistDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  checklist: ServiceChecklistRecord | null
  onSuccess: () => void
}

export function ServiceChecklistDialog({
  open,
  onOpenChange,
  checklist,
  onSuccess,
}: ServiceChecklistDialogProps) {
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [order, setOrder] = useState("")

  const isEditMode = !!checklist

  useEffect(() => {
    if (open && isEditMode && checklist) {
      setName(checklist.name || "")
      setOrder(checklist.order.toString() || "")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, checklist])

  const resetForm = () => {
    setName("")
    setOrder("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const orderNum = parseInt(order, 10)
    if (isNaN(orderNum) || orderNum < 0) {
      toast.error("Order must be a positive integer")
      setLoading(false)
      return
    }

    try {
      const apiClient = getApiClient()
      if (isEditMode && checklist) {
        await apiClient.updateServiceChecklist(checklist._id, {
          name,
          order: orderNum,
        })
        toast.success("Checklist has been updated")
      } else {
        await apiClient.createServiceChecklist({
          name,
          order: orderNum,
        })
        toast.success("Checklist has been created")
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Checklist" : "Create New Checklist"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Checklist Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., 10,000 km Maintenance Checklist"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Order *</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="E.g., 1, 2, 3..."
              required
            />
            <p className="text-xs text-muted-foreground">
              The display order of the checklist (lower numbers have higher priority)
            </p>
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
