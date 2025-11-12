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
import { getApiClient, type VehicleRecord } from "@/lib/api"
import type { CustomersListResponse } from "@/lib/api"
import { Plus } from "lucide-react"

export interface VehicleDialogProps {
  vehicle?: VehicleRecord // If provided, dialog is in edit mode
  trigger?: React.ReactNode
  onCreated?: (vehicle: VehicleRecord) => void
  onUpdated?: (vehicle: VehicleRecord) => void
}

export function VehicleDialog({ vehicle, trigger, onCreated, onUpdated }: VehicleDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const isEditMode = !!vehicle

  const [vehicleName, setVehicleName] = useState("")
  const [model, setModel] = useState("")
  const [year, setYear] = useState<string>("")
  const [mileage, setMileage] = useState<string>("")
  const [plateNumber, setPlateNumber] = useState("")
  const [lastServiceDate, setLastServiceDate] = useState("")
  const [VIN, setVIN] = useState("")
  const [price, setPrice] = useState<string>("")
  const [customerId, setCustomerId] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)

  

  const [customers, setCustomers] = useState<CustomersListResponse["data"]["customers"]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Load customers when dialog opens
  useEffect(() => {
    if (!open) return
    const run = async () => {
      try {
        setLoadingCustomers(true)
        const api = getApiClient()
        const res = await api.getCustomers({ limit: 200 })
        setCustomers(res.data.customers)
      } catch (e: any) {
        toast.error("Không tải được khách hàng", { description: e?.message || "Failed to load customers" })
      } finally {
        setLoadingCustomers(false)
      }
    }
    run()
  }, [open, toast])

  // Populate form with vehicle data in edit mode
  useEffect(() => {
    if (open && isEditMode && vehicle) {
      setVehicleName(vehicle.vehicleName || "")
      setModel(vehicle.model || "")
      setYear(vehicle.year ? String(vehicle.year) : "")
      setMileage(vehicle.mileage ? String(vehicle.mileage) : "")
      setPlateNumber(vehicle.plateNumber || "")
      setLastServiceDate(vehicle.last_service_date || "")
      setVIN(vehicle.VIN || "")
      setPrice(vehicle.price ? String(vehicle.price) : "")
      setCustomerId(typeof vehicle.customerId === 'string' ? vehicle.customerId : vehicle.customerId?._id || "")
    } else if (!open) {
      resetForm()
    }
  }, [open, isEditMode, vehicle])

  const resetForm = () => {
    setVehicleName("")
    setModel("")
    setYear("")
    setMileage("")
    setPlateNumber("")
    setLastServiceDate("")
    setVIN("")
    setPrice("")
    setCustomerId("")
    setImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const form = new FormData()
      form.append("vehicleName", vehicleName)
      form.append("model", model)
      if (year) form.append("year", String(Number(year)))
      if (mileage) form.append("mileage", String(Number(mileage)))
      if (plateNumber) form.append("plateNumber", plateNumber)
      if (lastServiceDate) form.append("last_service_date", lastServiceDate)
      form.append("VIN", VIN)
      if (price) form.append("price", String(Number(price)))
      if (customerId) form.append("customerId", customerId)
      if (imageFile) form.append("image", imageFile)

      const api = getApiClient()
      
      if (isEditMode && vehicle) {
        // Update existing vehicle
        const updated = await api.updateVehicle(vehicle._id, form)
  toast.success("Cập nhật xe thành công")
        setOpen(false)
        resetForm()
        onUpdated?.(updated)
      } else {
        // Create new vehicle
        const created = await api.createVehicle(form)
  toast.success("Tạo xe thành công")
        setOpen(false)
        resetForm()
        onCreated?.(created)
      }
    } catch (e: any) {
      toast.error(isEditMode ? "Cập nhật xe thất bại" : "Tạo xe thất bại", { 
        description: e?.message || `Failed to ${isEditMode ? 'update' : 'create'} vehicle`
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
            Add Vehicle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Vehicle" : "New Vehicle"}</DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update vehicle information" : "Enter vehicle information and upload an image"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vehicleName">Vehicle Name</Label>
              <Input id="vehicleName" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" min={1900} max={3000} value={year} onChange={(e) => setYear(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price (VND)</Label>
                <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mileage">Mileage (km)</Label>
                <Input id="mileage" type="number" min={0} value={mileage} onChange={(e) => setMileage(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="plateNumber">Plate Number</Label>
                <Input id="plateNumber" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastServiceDate">Last Service Date</Label>
                <Input id="lastServiceDate" type="date" value={lastServiceDate} onChange={(e) => setLastServiceDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="VIN">VIN</Label>
                <Input id="VIN" value={VIN} onChange={(e) => setVIN(e.target.value)} required />
              </div>
              <div className="grid gap-2">
                <Label>Owner</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCustomers ? "Loading customers..." : "Select owner (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c._id} value={c._id}>{c.customerName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="image">Image {isEditMode && "(optional - leave empty to keep current)"}</Label>
              <Input 
                id="image" 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                required={!isEditMode}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update Vehicle" : "Create Vehicle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
