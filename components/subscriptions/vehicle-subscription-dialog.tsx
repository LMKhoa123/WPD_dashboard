"use client"

import React, { useEffect, useMemo, useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { getApiClient, type VehicleRecord, type ServicePackageRecord, type VehicleSubscriptionRecord, type CreateVehicleSubscriptionRequest, type UpdateVehicleSubscriptionRequest } from "@/lib/api"

export interface VehicleSubscriptionDialogProps {
  subscription?: VehicleSubscriptionRecord
  trigger?: React.ReactNode
  onCreated?: (s: VehicleSubscriptionRecord) => void
  onUpdated?: (s: VehicleSubscriptionRecord) => void
}

export function VehicleSubscriptionDialog({ subscription, trigger, onCreated, onUpdated }: VehicleSubscriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!subscription

  const [vehicleId, setVehicleId] = useState("")
  const [packageId, setPackageId] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<string>("ACTIVE")
  const api = useMemo(() => getApiClient(), [])

  const [vehicles, setVehicles] = useState<VehicleRecord[]>([])
  const [packages, setPackages] = useState<ServicePackageRecord[]>([])
  const [loadingLists, setLoadingLists] = useState(false)

  useEffect(() => {
    if (open) {
      const run = async () => {
        try {
          setLoadingLists(true)
          const [vs, ps] = await Promise.all([
            api.getVehicles({ limit: 500 }).catch(() => [] as VehicleRecord[]),
            api.getServicePackages().catch(() => [] as ServicePackageRecord[]),
          ])
          setVehicles(Array.isArray(vs) ? vs : [])
          setPackages(ps)
        } catch (e: any) {
          toast.error("Failed to load data. Please try again.")
        } finally {
          setLoadingLists(false)
        }
      }
      run()
    }
  }, [open, api])

  useEffect(() => {
    if (open && isEditMode && subscription) {
      setVehicleId(typeof subscription.vehicleId === 'string' ? subscription.vehicleId : subscription.vehicleId?._id || "")
      setPackageId(typeof subscription.package_id === 'string' ? subscription.package_id : subscription.package_id?._id || "")
      setStartDate(subscription.start_date?.slice(0, 10) || "")
      setEndDate(subscription.end_date?.slice(0, 10) || "")
      setStatus(subscription.status || "ACTIVE")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, subscription])

  const resetForm = () => {
    setVehicleId("")
    setPackageId("")
    setStartDate("")
    setEndDate("")
    setStatus("ACTIVE")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)

      if (isEditMode && subscription) {
        const payload: UpdateVehicleSubscriptionRequest = {
          vehicleId,
          package_id: packageId,
          start_date: startDate,
          end_date: endDate || null,
          status: status as any,
        }
        const updated = await api.updateVehicleSubscription(subscription._id, payload)
        toast.success("Updated vehicle subscription successfully")
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        const payload: CreateVehicleSubscriptionRequest = {
          vehicleId,
          package_id: packageId,
          start_date: startDate,
          status: status as any,
        }
        const created = await api.createVehicleSubscription(payload)
        toast.success("Created vehicle subscription successfully")
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast.error(isEditMode ? "Failed to update subscription" : "Failed to create subscription")
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
            Add Subscription
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Subscription" : "New Subscription"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update vehicle subscription information" : "Create a new vehicle subscription package"}
            </DialogDescription>
          </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Vehicle</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingLists ? "Loading vehicles..." : "Select vehicle"} />
              </SelectTrigger>
              <SelectContent>
                {vehicles.map(v => (
                  <SelectItem key={v._id} value={v._id}>{v.vehicleName} • {v.model} • {v.VIN}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Service Package</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingLists ? "Loading packages..." : "Select package"} />
              </SelectTrigger>
              <SelectContent>
                {packages.map(p => (
                  <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Subscription" : "Create Subscription")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
