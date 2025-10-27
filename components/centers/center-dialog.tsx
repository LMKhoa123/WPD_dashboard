"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"
import { getApiClient, type CenterRecord, type CreateCenterRequest, type UpdateCenterRequest } from "@/lib/api"

export interface CenterDialogProps {
  center?: CenterRecord
  trigger?: React.ReactNode
  onCreated?: (c: CenterRecord) => void
  onUpdated?: (c: CenterRecord) => void
}

export function CenterDialog({ center, trigger, onCreated, onUpdated }: CenterDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!center

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")

  const { toast } = useToast()

  useEffect(() => {
    if (open && isEditMode && center) {
      setName(center.name)
      setAddress(center.address)
      setPhone(center.phone)
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, center])

  const resetForm = () => {
    setName("")
    setAddress("")
    setPhone("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const api = getApiClient()

      if (isEditMode && center) {
        const payload: UpdateCenterRequest = { name, address, phone }
        const updated = await api.updateCenter(center._id, payload)
        toast({ title: "Cập nhật trung tâm dịch vụ thành công" })
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        const payload: CreateCenterRequest = { name, address, phone }
        const created = await api.createCenter(payload)
        toast({ title: "Tạo trung tâm dịch vụ thành công" })
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast({
        title: isEditMode ? "Cập nhật thất bại" : "Tạo thất bại",
        description: e?.message || `Failed to ${isEditMode ? "update" : "create"} center`,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Service Center
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Service Center" : "New Service Center"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Cập nhật thông tin trung tâm dịch vụ" : "Tạo trung tâm dịch vụ mới"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Center" : "Create Center")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
