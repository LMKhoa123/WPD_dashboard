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
import { getApiClient, type ServicePackageRecord, type CreateServicePackageRequest, type UpdateServicePackageRequest } from "@/lib/api"

export interface ServicePackageDialogProps {
  servicePackage?: ServicePackageRecord
  trigger?: React.ReactNode
  onCreated?: (sp: ServicePackageRecord) => void
  onUpdated?: (sp: ServicePackageRecord) => void
}

export function ServicePackageDialog({ servicePackage, trigger, onCreated, onUpdated }: ServicePackageDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!servicePackage

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<string>("")
  const [duration, setDuration] = useState<string>("")
  const [kmInterval, setKmInterval] = useState<string>("")
  const [serviceIntervalDays, setServiceIntervalDays] = useState<string>("")

  

  useEffect(() => {
    if (open && isEditMode && servicePackage) {
      setName(servicePackage.name)
      setDescription(servicePackage.description)
      setPrice(String(servicePackage.price))
      setDuration(String(servicePackage.duration))
      setKmInterval(String(servicePackage.km_interval))
      setServiceIntervalDays(String(servicePackage.service_interval_days))
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, servicePackage])

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setDuration("")
    setKmInterval("")
    setServiceIntervalDays("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const api = getApiClient()

      if (isEditMode && servicePackage) {
        const payload: UpdateServicePackageRequest = {
          name,
          description,
          price: Number(price),
          duration: Number(duration),
          km_interval: Number(kmInterval),
          service_interval_days: Number(serviceIntervalDays),
        }
        const updated = await api.updateServicePackage(servicePackage._id, payload)
  toast.success("Updated service package successfully")
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        const payload: CreateServicePackageRequest = {
          name,
          description,
          price: Number(price),
          duration: Number(duration),
          km_interval: Number(kmInterval),
          service_interval_days: Number(serviceIntervalDays),
        }
        const created = await api.createServicePackage(payload)
  toast.success("Created service package successfully")
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast.error(isEditMode ? "Failed to update service package" : "Failed to create service package", {
        description: e?.message || `Failed to ${isEditMode ? "update" : "create"} service package`,
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
            Add Service Package
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Service Package" : "New Service Package"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update service package information" : "Create a new service package"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (VND)</Label>
                <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input id="duration" type="number" min={0} value={duration} onChange={(e) => setDuration(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="km_interval">KM Interval</Label>
                <Input id="km_interval" type="number" min={0} value={kmInterval} onChange={(e) => setKmInterval(e.target.value)} required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="service_interval_days">Service Interval (days)</Label>
              <Input id="service_interval_days" type="number" min={0} value={serviceIntervalDays} onChange={(e) => setServiceIntervalDays(e.target.value)} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Package" : "Create Package")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
