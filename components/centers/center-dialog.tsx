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
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { getApiClient, type CenterRecord } from "@/lib/api"

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    if (open && isEditMode && center) {
      setName(center.name)
      setAddress(center.address)
      setPhone(center.phone)
      setImagePreview(center.image ?? null)
      setImageFile(null)
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, center])

  const resetForm = () => {
    setName("")
    setAddress("")
    setPhone("")
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const api = getApiClient()

      const form = new FormData()
      form.append("name", name)
      form.append("address", address)
      form.append("phone", phone)
      if (imageFile) {
        form.append("image", imageFile)
      }

      if (isEditMode && center) {
        const updated = await api.updateCenter(center._id, form)
        toast.success("Updated service center successfully")
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        const created = await api.createCenter(form)
        toast.success("Created service center successfully")
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast.error(e?.message || `Failed to ${isEditMode ? "update" : "create"} center`)
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
              {isEditMode ? "Update service center information" : "Create a new service center"}
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

            <div className="grid gap-2">
              <Label htmlFor="image">Image</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  setImageFile(file)
                  if (file) {
                    const url = URL.createObjectURL(file)
                    setImagePreview(url)
                  } else {
                    setImagePreview(null)
                  }
                }}
                disabled={submitting}
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="h-28 w-28 rounded object-cover border" />
                </div>
              )}
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
