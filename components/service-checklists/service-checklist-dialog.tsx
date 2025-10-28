"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()
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
      toast({
        title: "Lỗi",
        description: "Order phải là số nguyên dương",
        variant: "destructive",
      })
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
        toast({
          title: "Cập nhật thành công",
          description: "Checklist đã được cập nhật",
        })
      } else {
        await apiClient.createServiceChecklist({
          name,
          order: orderNum,
        })
        toast({
          title: "Tạo thành công",
          description: "Checklist mới đã được tạo",
        })
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.message || "Đã có lỗi xảy ra",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Chỉnh sửa Checklist" : "Tạo Checklist mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên Checklist *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Checklist bảo dưỡng 10,000 km"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order">Thứ tự *</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              placeholder="VD: 1, 2, 3..."
              required
            />
            <p className="text-xs text-muted-foreground">
              Thứ tự hiển thị của checklist (số càng nhỏ càng ưu tiên)
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : isEditMode ? "Cập nhật" : "Tạo mới"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
