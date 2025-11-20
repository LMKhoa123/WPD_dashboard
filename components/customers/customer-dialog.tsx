"use client"

import React, { useState, useEffect } from "react"
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
import { Plus } from "lucide-react"
import { getApiClient, type CustomerRecord } from "@/lib/api"
import { toast } from "sonner"

interface CustomerDialogProps {
  customer?: CustomerRecord
  trigger?: React.ReactNode
  onSuccess?: (customer: CustomerRecord) => void
}

export function CustomerDialog({ customer, trigger, onSuccess }: CustomerDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [address, setAddress] = useState("")

  useEffect(() => {
    if (open && customer) {
      setCustomerName(customer.customerName)
      setDateOfBirth(customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : "")
      setAddress(customer.address)
    } else if (!open) {
      resetForm()
    }
  }, [open, customer])

  const resetForm = () => {
    setCustomerName("")
    setDateOfBirth("")
    setAddress("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer) return 

    try {
      setSubmitting(true)
      const api = getApiClient()
      const updated = await api.updateCustomer(customer._id, {
        customerName,
        dateOfBirth: dateOfBirth || null,
        address,
      })

      toast.success("Customer updated successfully")
      setOpen(false)
      onSuccess?.(updated)
    } catch (e: any) {
      toast.error(e?.message || "Failed to update customer")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{customer ? "Edit Customer" : "New Customer"}</DialogTitle>
            <DialogDescription>
              {customer ? "Update customer information" : "Add a new customer to the system"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="1990-01-15"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : customer ? "Update Customer" : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
