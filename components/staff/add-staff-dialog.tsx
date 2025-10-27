"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getApiClient, type CenterRecord } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Plus } from "lucide-react"

interface AddStaffDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddStaffDialog({ trigger, onSuccess }: AddStaffDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"STAFF" | "TECHNICIAN">("STAFF")
  const [centerId, setCenterId] = useState<string>("__none__")
  const [centers, setCenters] = useState<CenterRecord[]>([])

  useEffect(() => {
    if (open) {
      loadCenters()
    }
  }, [open])

  const loadCenters = async () => {
    try {
      setLoadingCenters(true)
      const api = getApiClient()
      const response = await api.getCenters({ limit: 100 })
      setCenters(response.data.centers)
    } catch (error: any) {
      toast({
        title: "Error loading centers",
        description: error.response?.data?.message || "Failed to load service centers",
        variant: "destructive",
      })
    } finally {
      setLoadingCenters(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const api = getApiClient()
      
      await api.register({
        email,
        password,
        role,
        centerId: centerId === "__none__" ? undefined : centerId,
      })

      toast({
        title: "Success",
        description: "Staff member created successfully",
      })
      
      // Reset form
      setEmail("")
      setPassword("")
      setRole("STAFF")
  setCenterId("__none__")
      setOpen(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create staff member",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Create a new staff account. An email and password will be used for login.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@example.com"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                minLength={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Minimum 6 characters
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={(value: "STAFF" | "TECHNICIAN") => setRole(value)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAFF">Staff</SelectItem>
                  <SelectItem value="TECHNICIAN">Technician</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="center">Service Center</Label>
              <Select value={centerId} onValueChange={setCenterId} disabled={loadingCenters}>
                <SelectTrigger id="center">
                  <SelectValue placeholder={loadingCenters ? "Loading centers..." : "Select a center (optional)"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {centers.map((center) => (
                    <SelectItem key={center._id} value={center._id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Optional: Assign staff to a specific service center
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
