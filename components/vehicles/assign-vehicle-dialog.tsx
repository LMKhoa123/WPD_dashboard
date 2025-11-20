"use client"

import { useState } from "react"
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
import { toast } from "sonner"
import { getApiClient } from "@/lib/api"
import { UserPlus } from "lucide-react"

interface AssignVehicleDialogProps {
  vehicleId: string
  vehicleName: string
  trigger?: React.ReactNode
}

export function AssignVehicleDialog({ vehicleId, vehicleName, trigger }: AssignVehicleDialogProps) {
  const [open, setOpen] = useState(false)
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phone.trim()) {
      toast.error("please enter a phone number")
      return
    }

    // Validate phone number format (Vietnamese phone number)
    const phoneRegex = /^(0|\+84)[1-9][0-9]{8,9}$/
    if (!phoneRegex.test(phone.trim())) {
      toast.error("Invalid phone number")
      return
    }

    try {
      setLoading(true)
      const api = getApiClient()
      const result = await api.assignVehicle(vehicleId, phone.trim())
      
      if (result.success) {
        toast.success("Vehicle assigned successfully")
        setOpen(false)
        setPhone("")
      } else {
        toast.error(result.message || "Failed to assign vehicle")
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to assign vehicle")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Assign Vehicle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Vehicle to Customer</DialogTitle>
            <DialogDescription>
              Enter the customer's phone number to assign the vehicle <strong>{vehicleName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the customer's phone number (10-11 digits)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Assign Vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
